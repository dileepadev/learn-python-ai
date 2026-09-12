#!/usr/bin/env node
/**
 * Executes every runnable block in the lesson content against the same
 * Pyodide release the site loads in the browser, and fails the build if any
 * of it is wrong.
 *
 *   npm run verify                 every lesson
 *   npm run verify -- foundations  only lessons whose path matches
 *
 * What it proves, per block:
 *
 *   <Run>       the code runs cleanly — or, when the block declares
 *               `raises="KeyError"`, that it fails in exactly that way, so a
 *               lesson demonstrating an error keeps demonstrating it. A block
 *               marked `endless` is skipped; it exists to be interrupted.
 *   <Exercise>  the published `solution` passes the block's own `tests`, and
 *               the starter `code` does not. The second half matters: an
 *               exercise the starter already satisfies is not an exercise.
 *
 * The execution contract below — a fresh namespace per run, `_stdout` and
 * `_lines` injected before the checks — mirrors public/pyodide-worker.js.
 * Change one and you must change the other; the exercises depend on it.
 */

import { readFile, readdir, mkdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPyodide } from "pyodide";
import { extractBlocks, splitFrontmatter, RUNNABLE } from "./lib/mdx-blocks.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LESSONS = join(ROOT, "src/content/lessons");
/** Wheels land here on first run so later runs are offline and instant. */
const CACHE = join(ROOT, "node_modules/.cache/pyodide-packages");

const filter = process.argv.slice(2).filter((arg) => !arg.startsWith("-"))[0] ?? "";

/** A lesson that prints more than this has a bug, and should not take the run down with it. */
const OUTPUT_LIMIT = 4_000_000;

const failures = [];

/** Collects a run's stdout, and stops collecting long before memory is a problem. */
function createRecorder() {
  let chunks = [];
  let size = 0;
  return {
    overflowed: false,
    push(line) {
      if (size > OUTPUT_LIMIT) {
        this.overflowed = true;
        return;
      }
      chunks.push(line + "\n");
      size += line.length + 1;
    },
    reset() {
      chunks = [];
      size = 0;
      this.overflowed = false;
    },
    text() {
      return chunks.join("");
    },
  };
}

async function lessonFiles() {
  const files = [];
  for (const dir of await readdir(LESSONS, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of await readdir(join(LESSONS, dir.name))) {
      if (file.endsWith(".mdx") || file.endsWith(".md")) files.push(join(LESSONS, dir.name, file));
    }
  }
  return files.filter((path) => path.includes(filter)).sort();
}

/**
 * Runs one program the way the worker does: a namespace of its own, stdout
 * captured, packages pulled from the imports it declares.
 *
 * @returns {Promise<{ok: boolean, error?: string, stdout: string, tests?: {ok: boolean, error?: string}}>}
 */
async function execute(pyodide, recorder, { code, stdin, tests }) {
  recorder.reset();
  wireStdin(pyodide, stdin);

  try {
    // messageCallback is not optional: without one, Pyodide reports "Loading
    // numpy" through the *stdout* handler, and those lines land in `_stdout`
    // and `_lines` where the exercise checks can see them. The worker diverts
    // them to its status line for the same reason.
    await pyodide.loadPackagesFromImports(code, {
      messageCallback: () => {},
      errorCallback: () => {},
    });
  } catch {
    // Let a genuinely missing package surface as a Python ImportError instead.
  }

  // The worker forces the AGG backend for the same reason: there is no display
  // to draw on. It also closes every figure after a run, so plots do not leak
  // from one block into the next — which would silently change what a later
  // lesson renders.
  if (!plotsReady && pyodide.loadedPackages?.matplotlib) {
    await pyodide.runPythonAsync('import matplotlib; matplotlib.use("AGG")');
    plotsReady = true;
  }

  const globals = pyodide.globals.get("dict")();
  globals.set("__name__", "__main__");

  try {
    await pyodide.runPythonAsync(code, { globals, filename: "<your code>" });
  } catch (error) {
    globals.destroy();
    await closeFigures(pyodide);
    return { ok: false, error: clean(error), stdout: recorder.text() };
  }
  await closeFigures(pyodide);

  const stdout = recorder.text();
  if (!tests) {
    globals.destroy();
    return { ok: true, stdout };
  }

  const lines = stdout.split("\n").map((line) => line.trimEnd());
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  globals.set("_stdout", stdout);
  globals.set("_lines", pyodide.toPy(lines));

  try {
    await pyodide.runPythonAsync(tests, { globals, filename: "<checks>" });
    globals.destroy();
    return { ok: true, stdout, tests: { ok: true } };
  } catch (error) {
    globals.destroy();
    return { ok: true, stdout, tests: { ok: false, error: clean(error) } };
  }
}

/** True once the AGG backend has been selected for this interpreter. */
let plotsReady = false;

async function closeFigures(pyodide) {
  if (!plotsReady) return;
  try {
    await pyodide.runPythonAsync('import matplotlib.pyplot as plt; plt.close("all")');
  } catch {
    // Nothing to close, or matplotlib is in no state to be asked.
  }
}

function wireStdin(pyodide, raw) {
  const lines = (raw ?? "").length ? String(raw).split("\n") : [];
  let cursor = 0;
  pyodide.setStdin(
    lines.length === 0
      ? {
          stdin: () => {
            throw new Error("input() needs stdin. Add lines in the Stdin panel below the editor.");
          },
        }
      : { stdin: () => (cursor < lines.length ? lines[cursor++] : null), autoEOF: true }
  );
}

const clean = (error) =>
  String(error?.message ?? error)
    .split("\n")
    .filter((line) => !/File "\/lib\/python3|pyodide\/_pyodide|importlib\._bootstrap/.test(line))
    .join("\n")
    .trim();

/**
 * The exception class a traceback ends with.
 *
 * Scanned from the bottom, because Python prints exception *notes* after the
 * `TypeError: …` line ("when serializing dict item 'tags'"), so the last line
 * is not reliably the type. A note never has the shape `Identifier:` or a bare
 * `Identifier`, which is what this matches.
 */
function errorName(message) {
  const lines = String(message).split("\n");
  // Only column 0 counts. Python puts the exception line flush left, while the
  // detail some libraries append to the message — pandas lists the duplicate
  // keys, one indented per line — would otherwise match first.
  for (let i = lines.length - 1; i >= 0; i--) {
    const match = /^([A-Za-z_][A-Za-z0-9_.]*)\s*(?::|$)/.exec(lines[i]);
    if (match) return match[1];
  }
  return "";
}

function record(where, problem, detail) {
  failures.push({ where, problem, detail });
  process.stdout.write("✗");
}

async function checkRun(pyodide, recorder, block, where) {
  if (block.props.endless) {
    process.stdout.write("∞");
    return;
  }

  const expected = block.props.raises;
  const result = await execute(pyodide, recorder, block.props);

  if (expected) {
    const actual = errorName(result.error);
    // A library exception arrives fully qualified — pandas.errors.MergeError —
    // so a lesson may name either that or just the class.
    const matches = actual === expected || actual.split(".").pop() === expected;

    if (result.ok) {
      record(where, `expected it to raise ${expected}, but it ran cleanly`, result.stdout);
    } else if (!matches) {
      record(where, `expected ${expected}, got ${actual || "an unrecognisable error"}`, result.error);
    } else {
      process.stdout.write("·");
    }
    return;
  }

  if (!result.ok) record(where, "raised an error", result.error);
  else process.stdout.write("·");
}

async function checkExercise(pyodide, recorder, block, where) {
  const { code, solution, tests, stdin } = block.props;

  const solved = await execute(pyodide, recorder, { code: solution, stdin, tests });
  if (!solved.ok) {
    record(where, "the solution raised an error", solved.error);
    return;
  }
  if (!solved.tests.ok) {
    record(where, "the solution does not pass its own tests", solved.tests.error);
    return;
  }

  const starter = await execute(pyodide, recorder, { code, stdin, tests });
  const starterPasses = starter.ok && starter.tests.ok;

  if (block.props.refactor) {
    // A refactoring task starts from working code: the checks are there to
    // prove the rewrite preserves behaviour, so the starter must pass.
    if (!starterPasses) {
      record(
        where,
        "marked refactor, but the starter code does not pass — the checks cannot prove behaviour was preserved",
        starter.ok ? starter.tests.error : starter.error
      );
      return;
    }
  } else if (starterPasses) {
    record(where, "the starter code already passes the tests — there is nothing to solve", "");
    return;
  }

  process.stdout.write("✓");
}

async function main() {
  const files = await lessonFiles();
  if (files.length === 0) {
    console.error(`No lessons matched ${filter ? `"${filter}"` : "the content directory"}.`);
    process.exitCode = 1;
    return;
  }

  await mkdir(CACHE, { recursive: true });
  process.stdout.write("Booting Pyodide… ");

  const recorder = createRecorder();
  const pyodide = await loadPyodide({
    packageCacheDir: CACHE,
    stdout: (line) => recorder.push(line),
    stderr: () => {},
  });
  await pyodide.runPythonAsync("import sys; sys.setrecursionlimit(2000)");
  console.log(`Python ${pyodide.version}\n`);

  let blockCount = 0;

  for (const path of files) {
    const name = relative(LESSONS, path);
    const { body } = splitFrontmatter(await readFile(path, "utf8"));
    const blocks = extractBlocks(body, RUNNABLE, relative(ROOT, path));

    process.stdout.write(`  ${name.padEnd(52)} `);
    for (const block of blocks) {
      const where = `${block.file}:${block.line} <${block.name} id="${block.props.id}">`;
      blockCount++;
      if (block.name === "Exercise") await checkExercise(pyodide, recorder, block, where);
      else await checkRun(pyodide, recorder, block, where);
    }
    console.log();
  }

  console.log();
  if (failures.length === 0) {
    console.log(`✓ ${blockCount} blocks across ${files.length} lessons all behave as published.`);
    return;
  }

  console.error(`✗ ${failures.length} of ${blockCount} blocks are wrong:\n`);
  for (const { where, problem, detail } of failures) {
    console.error(`  ${where}`);
    console.error(`    ${problem}`);
    if (detail) {
      for (const line of detail.split("\n").slice(-12)) console.error(`      ${line}`);
    }
    console.error();
  }
  process.exitCode = 1;
}

await main();
