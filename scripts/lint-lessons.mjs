#!/usr/bin/env node
/**
 * Checks every lesson against the content rules in AGENT.md, without booting
 * Python. Fast enough to run on every save; `npm run verify` is the slow,
 * thorough companion that actually executes the code.
 *
 *   npm run lint:lessons
 *
 * Rules enforced here:
 *   - frontmatter `module` matches a slug in src/lib/curriculum.ts
 *   - `order` is unique within a module and the sequence has no gaps
 *   - every lesson has at least one Exercise, one Quiz, an "ai" Callout
 *     and a "## Recap" section
 *   - every runnable block id is unique across the whole site
 *   - every quiz has exactly one correct choice and a `why` on all of them
 *   - any code calling input() supplies stdin
 */

import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { extractBlocks, parseFrontmatter, splitFrontmatter } from "./lib/mdx-blocks.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LESSONS = join(ROOT, "src/content/lessons");

const problems = [];
const fail = (where, message) => problems.push(`${where}: ${message}`);

/** Module slugs, read straight out of the curriculum so the two cannot drift. */
async function moduleSlugs() {
  const source = await readFile(join(ROOT, "src/lib/curriculum.ts"), "utf8");
  return new Set([...source.matchAll(/^\s{4}slug:\s*"([^"]+)"/gm)].map((m) => m[1]));
}

async function lessonFiles() {
  const files = [];
  for (const dir of await readdir(LESSONS, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of await readdir(join(LESSONS, dir.name))) {
      if (file.endsWith(".mdx") || file.endsWith(".md")) files.push(join(LESSONS, dir.name, file));
    }
  }
  return files.sort();
}

/** The only keys a quiz choice may carry; see src/components/Quiz.tsx. */
const CHOICE_KEYS = new Set(["text", "correct", "why"]);

const REQUIRED_FRONTMATTER = ["title", "description", "module", "order", "level", "minutes"];
const LEVELS = new Set(["beginner", "intermediate", "advanced", "expert"]);

async function main() {
  const slugs = await moduleSlugs();
  const files = await lessonFiles();

  if (files.length === 0) fail("src/content/lessons", "no lessons found");

  const ids = new Map();
  const orders = new Map();

  for (const path of files) {
    const where = relative(ROOT, path);
    const source = await readFile(path, "utf8");
    const { frontmatter, body } = splitFrontmatter(source);

    if (!frontmatter) {
      fail(where, "missing frontmatter");
      continue;
    }
    const data = parseFrontmatter(frontmatter);

    for (const key of REQUIRED_FRONTMATTER) {
      if (data[key] === undefined) fail(where, `frontmatter is missing "${key}"`);
    }
    if (data.module && !slugs.has(data.module)) {
      fail(where, `module "${data.module}" is not a slug in src/lib/curriculum.ts`);
    }
    if (data.level && !LEVELS.has(data.level)) {
      fail(where, `level "${data.level}" is not one of ${[...LEVELS].join(", ")}`);
    }
    if (!Array.isArray(data.objectives) || data.objectives.length === 0) {
      fail(where, "frontmatter needs at least one objective");
    }
    // The directory has to agree with the frontmatter, or the lesson sorts
    // into one module and files into another.
    const folder = relative(LESSONS, path).split("/")[0];
    if (data.module && folder !== data.module) {
      fail(where, `sits in ${folder}/ but declares module "${data.module}"`);
    }

    if (typeof data.order === "number") {
      const seen = orders.get(data.module) ?? new Map();
      if (seen.has(data.order)) {
        fail(where, `order ${data.order} is already used by ${seen.get(data.order)}`);
      }
      seen.set(data.order, where);
      orders.set(data.module, seen);
    }

    let blocks;
    try {
      blocks = extractBlocks(body, ["Run", "Exercise", "Quiz", "Callout"], where);
    } catch (error) {
      fail(where, error.message);
      continue;
    }

    const exercises = blocks.filter((b) => b.name === "Exercise");
    const quizzes = blocks.filter((b) => b.name === "Quiz");
    const callouts = blocks.filter((b) => b.name === "Callout");

    if (exercises.length === 0) fail(where, "has no <Exercise>");
    if (quizzes.length === 0) fail(where, "has no <Quiz>");
    if (!callouts.some((c) => c.props.type === "ai")) {
      fail(where, 'has no <Callout type="ai"> explaining why this matters for AI');
    }
    if (!/^##\s+Recap\s*$/m.test(body)) fail(where, 'does not end with a "## Recap" section');

    for (const block of blocks) {
      if (block.name === "Quiz") {
        checkQuiz(block, where);
        continue;
      }
      if (block.name === "Callout") continue;

      const { id, code, tests, solution, stdin } = block.props;
      const at = `${where}:${block.line} <${block.name}>`;

      if (!id) fail(at, "needs an id");
      else if (ids.has(id)) fail(at, `id "${id}" is already used by ${ids.get(id)}`);
      else ids.set(id, at);

      if (typeof code !== "string" || code.trim() === "") fail(at, "needs code");
      if (block.name === "Exercise") {
        if (typeof tests !== "string" || tests.trim() === "") fail(at, "needs tests");
        if (typeof solution !== "string" || solution.trim() === "") fail(at, "needs a solution");
        if (!block.props.brief) fail(at, "needs a brief");
      }

      for (const [label, text] of [["code", code], ["solution", solution]]) {
        if (typeof text === "string" && /(^|[^\w.])input\s*\(/.test(text) && !stdin) {
          fail(at, `${label} calls input() but the block supplies no stdin`);
        }
      }
    }
  }

  for (const [module, seen] of orders) {
    const numbers = [...seen.keys()].sort((a, b) => a - b);
    const expected = numbers.map((_, index) => index + 1);
    if (numbers.join(",") !== expected.join(",")) {
      fail(`module "${module}"`, `orders are ${numbers.join(", ")} — expected 1…${numbers.length}`);
    }
  }

  report(files.length, ids.size);
}

function checkQuiz(block, where) {
  const at = `${where}:${block.line} <Quiz>`;
  const { question, choices } = block.props;

  if (!question) fail(at, "needs a question");
  if (!Array.isArray(choices) || choices.length < 2) {
    fail(at, "needs at least two choices");
    return;
  }

  const correct = choices.filter((choice) => choice.correct === true);
  if (correct.length !== 1) fail(at, `has ${correct.length} correct choices — it needs exactly one`);
  for (const [index, choice] of choices.entries()) {
    if (!choice.text) fail(at, `choice ${index + 1} has no text`);
    if (!choice.why) fail(at, `choice ${index + 1} has no "why" — every choice needs one`);
    // A misspelt key is silently ignored by the component, so a typo like
    // `corect: true` would quietly turn a right answer into a wrong one.
    for (const key of Object.keys(choice)) {
      if (!CHOICE_KEYS.has(key)) {
        fail(at, `choice ${index + 1} has an unknown key "${key}" — expected ${[...CHOICE_KEYS].join(", ")}`);
      }
    }
  }
}

function report(lessons, blocks) {
  if (problems.length === 0) {
    console.log(`✓ ${lessons} lessons, ${blocks} runnable blocks — all content rules pass.`);
    return;
  }
  console.error(`✗ ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exitCode = 1;
}

await main();
