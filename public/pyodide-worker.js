/**
 * Pyodide runner worker.
 *
 * Runs entirely off the main thread so a learner's infinite loop freezes only
 * this worker, never the page. The page recovers by terminating and respawning
 * it (see `stop()` in src/lib/python-runtime.ts).
 *
 * Protocol
 *   in : {type:"boot"} | {type:"run", id, code, stdin?, tests?}
 *   out: {type:"status"|"ready"|"out"|"done"|"fatal", ...}
 */

const PYODIDE_VERSION = "314.0.6";
const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodide = null;
let bootPromise = null;
let activeId = null;
/** Stdout of the run in progress, so exercise checks can assert on it. */
let captured = null;

const post = (msg) => self.postMessage(msg);
const status = (phase, detail = "") => post({ type: "status", phase, detail });

function emit(stream, text) {
  if (activeId === null) return;
  if (captured !== null && stream === "stdout") captured.push(text);
  post({ type: "out", id: activeId, stream, text });
}

async function boot() {
  status("downloading", "Fetching the Python runtime (~10 MB, cached after this)");
  const { loadPyodide } = await import(`${CDN}pyodide.mjs`);

  pyodide = await loadPyodide({
    indexURL: CDN,
    stdout: (line) => emit("stdout", line + "\n"),
    stderr: (line) => emit("stderr", line + "\n"),
  });

  status("starting", "Booting the interpreter");

  // Deep recursion in WASM costs real stack; cap it well below a crash.
  await pyodide.runPythonAsync("import sys; sys.setrecursionlimit(2000)");

  post({ type: "ready", version: pyodide.version });
  return pyodide;
}

function ensureBooted() {
  if (!bootPromise) bootPromise = boot().catch((err) => {
    bootPromise = null;
    post({ type: "fatal", error: String(err?.message ?? err) });
    throw err;
  });
  return bootPromise;
}

/** Wire a fixed list of stdin lines, or a helpful error when there are none. */
function wireStdin(raw) {
  const lines = (raw ?? "").length ? String(raw).split("\n") : [];
  let cursor = 0;
  if (lines.length === 0) {
    pyodide.setStdin({
      stdin: () => {
        throw new Error(
          "input() needs stdin. Add your input lines in the Stdin panel below the editor."
        );
      },
    });
    return;
  }
  pyodide.setStdin({
    stdin: () => (cursor < lines.length ? lines[cursor++] : null), // null == EOF
    autoEOF: true,
  });
}

/**
 * Strip the interpreter's own frames so a NameError points at line 3 of the
 * learner's file, not line 3 of Pyodide's internals.
 */
function cleanTraceback(message) {
  return String(message)
    .split("\n")
    .filter((line) => !/File "\/lib\/python3|pyodide\/_pyodide|importlib\._bootstrap/.test(line))
    .join("\n")
    .trim();
}

async function run({ id, code, stdin, tests }) {
  await ensureBooted();
  activeId = id;
  captured = tests ? [] : null;
  const started = performance.now();

  try {
    wireStdin(stdin);

    // Pull in numpy/pandas/scikit-learn/... on demand, straight from the CDN.
    try {
      await pyodide.loadPackagesFromImports(code, {
        messageCallback: (m) => status("installing", m),
        errorCallback: () => {},
      });
    } catch {
      // A missing third-party package should surface as a normal Python
      // ImportError below, not as a runner failure.
    }

    // Fresh namespace per run: no leakage between attempts.
    const globals = pyodide.globals.get("dict")();
    globals.set("__name__", "__main__");

    await pyodide.runPythonAsync(code, { globals, filename: "<your code>" });

    let testsPassed = null;
    if (tests) {
      // Checks see everything the learner printed, plus every name they bound.
      const text = captured.join("");
      const lines = text.split("\n").map((line) => line.trimEnd());
      while (lines.length && lines[lines.length - 1] === "") lines.pop();
      globals.set("_stdout", text);
      globals.set("_lines", pyodide.toPy(lines));
      try {
        await pyodide.runPythonAsync(tests, { globals, filename: "<checks>" });
        testsPassed = { ok: true };
      } catch (err) {
        testsPassed = { ok: false, error: cleanTraceback(err?.message ?? err) };
      }
    }

    globals.destroy();
    post({
      type: "done",
      id,
      ok: true,
      tests: testsPassed,
      elapsed: Math.round(performance.now() - started),
    });
  } catch (err) {
    post({
      type: "done",
      id,
      ok: false,
      error: cleanTraceback(err?.message ?? err),
      elapsed: Math.round(performance.now() - started),
    });
  } finally {
    activeId = null;
    captured = null;
  }
}

self.onmessage = (event) => {
  const msg = event.data;
  if (msg?.type === "boot") ensureBooted().catch(() => {});
  else if (msg?.type === "run") run(msg);
};
