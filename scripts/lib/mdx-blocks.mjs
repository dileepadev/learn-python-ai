/**
 * Pulls the JSX components out of a lesson's MDX source without running MDX.
 *
 * Lessons are first-party content, so the goal here is a precise reader rather
 * than a hardened parser: find `<Run …/>`, `<Exercise …/>` and `<Quiz …/>`,
 * and hand back their props with the same values MDX would pass at build time.
 *
 * The one subtlety is escaping. A lesson writes a Python newline inside a
 * template literal as `\\n`, which JavaScript collapses to the two characters
 * a backslash and an `n` — exactly what Python then reads as an escape. So the
 * attribute value has to be evaluated with JavaScript's own rules, not copied
 * verbatim. `evaluate()` below does that.
 */

/** Components whose props this module understands. */
export const RUNNABLE = ["Run", "Exercise"];

const NAME_START = /[A-Z]/;
const ATTR_NAME = /[A-Za-z_][A-Za-z0-9_-]*/y;

/**
 * Evaluates a JSX attribute expression — a template literal, an array, an
 * object — into the value MDX would produce.
 *
 * Lesson content is written by this repository and reviewed in pull requests,
 * so evaluating it in-process is the same trust level as importing it.
 */
function evaluate(expression, where) {
  try {
    return new Function(`"use strict"; return (${expression});`)();
  } catch (error) {
    throw new Error(`${where}: could not read the attribute value — ${error.message}`);
  }
}

/**
 * Scans forward from `start` to the character after the expression that began
 * with `{`, respecting nested braces, strings, template literals and comments.
 */
function endOfBracedExpression(source, start) {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const char = source[i];

    if (char === "{") {
      depth++;
      continue;
    }
    if (char === "}") {
      depth--;
      if (depth === 0) return i;
      continue;
    }

    if (char === '"' || char === "'") {
      i = endOfQuoted(source, i, char);
      continue;
    }
    if (char === "`") {
      i = endOfTemplate(source, i);
      continue;
    }
    if (char === "/" && source[i + 1] === "/") {
      i = source.indexOf("\n", i);
      if (i === -1) break;
      continue;
    }
    if (char === "/" && source[i + 1] === "*") {
      i = source.indexOf("*/", i + 2) + 1;
      if (i === 0) break;
      continue;
    }
  }
  throw new Error("unterminated { … } attribute");
}

/** Index of the closing quote that matches the one at `start`. */
function endOfQuoted(source, start, quote) {
  for (let i = start + 1; i < source.length; i++) {
    if (source[i] === "\\") {
      i++;
      continue;
    }
    if (source[i] === quote) return i;
  }
  throw new Error(`unterminated ${quote} string`);
}

/**
 * Index of the backtick closing the template literal at `start`. Nested
 * `${ … }` substitutions are stepped over so a backtick inside one does not
 * end the literal early.
 */
function endOfTemplate(source, start) {
  for (let i = start + 1; i < source.length; i++) {
    if (source[i] === "\\") {
      i++;
      continue;
    }
    if (source[i] === "$" && source[i + 1] === "{") {
      i = endOfBracedExpression(source, i + 1);
      continue;
    }
    if (source[i] === "`") return i;
  }
  throw new Error("unterminated template literal");
}

const lineAt = (source, index) => source.slice(0, index).split("\n").length;

/**
 * Reads the props of one element, starting just after its name.
 * Returns the props and the index of the character after the closing `>`.
 */
function readProps(source, start, where) {
  const props = {};
  let i = start;

  while (i < source.length) {
    while (i < source.length && /\s/.test(source[i])) i++;

    if (source[i] === "/" && source[i + 1] === ">") return { props, end: i + 2, selfClosing: true };
    if (source[i] === ">") return { props, end: i + 1, selfClosing: false };

    ATTR_NAME.lastIndex = i;
    const match = ATTR_NAME.exec(source);
    if (!match) throw new Error(`${where}: expected an attribute name at line ${lineAt(source, i)}`);
    const name = match[0];
    i = ATTR_NAME.lastIndex;

    if (source[i] !== "=") {
      // A bare attribute, as in `<Exercise exercise />`.
      props[name] = true;
      continue;
    }
    i++;

    if (source[i] === '"' || source[i] === "'") {
      const end = endOfQuoted(source, i, source[i]);
      props[name] = source.slice(i + 1, end);
      i = end + 1;
      continue;
    }

    if (source[i] !== "{") throw new Error(`${where}: attribute "${name}" has no value`);
    const end = endOfBracedExpression(source, i);
    props[name] = evaluate(source.slice(i + 1, end), `${where}: attribute "${name}"`);
    i = end + 1;
  }

  throw new Error(`${where}: element is never closed`);
}

/**
 * Every occurrence of the named components in `source`, in document order.
 *
 * @param {string} source  MDX source
 * @param {string[]} names Component names to collect
 * @param {string} file    Path used in error messages
 */
export function extractBlocks(source, names, file = "<mdx>") {
  const blocks = [];

  for (let i = 0; i < source.length; i++) {
    if (source[i] !== "<") continue;
    if (!NAME_START.test(source[i + 1] ?? "")) continue;

    ATTR_NAME.lastIndex = i + 1;
    const match = ATTR_NAME.exec(source);
    if (!match || !names.includes(match[0])) continue;

    // Guard against matching inside a fenced code block that shows JSX.
    const line = lineAt(source, i);
    const where = `${file}:${line} <${match[0]}>`;
    const { props, end } = readProps(source, ATTR_NAME.lastIndex, where);

    blocks.push({ name: match[0], props, line, file });
    i = end - 1;
  }

  return blocks;
}

/** The YAML frontmatter block, as raw text, plus the body after it. */
export function splitFrontmatter(source) {
  if (!source.startsWith("---\n")) return { frontmatter: "", body: source };
  const end = source.indexOf("\n---", 3);
  if (end === -1) return { frontmatter: "", body: source };
  return { frontmatter: source.slice(4, end), body: source.slice(end + 4) };
}

/**
 * Enough YAML for the shapes the lesson schema allows: `key: value` and
 * `key:` followed by a `-` list. Anything else is left as a raw string.
 */
export function parseFrontmatter(text) {
  const data = {};
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(lines[i]);
    if (!match) continue;
    const [, key, inline] = match;

    if (inline !== "") {
      const value = inline.replace(/^["'](.*)["']$/, "$1");
      if (value === "true" || value === "false") data[key] = value === "true";
      else if (/^-?\d+(\.\d+)?$/.test(value)) data[key] = Number(value);
      else data[key] = value;
      continue;
    }

    const items = [];
    while (i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) {
      items.push(lines[++i].replace(/^\s+-\s+/, "").replace(/^["'](.*)["']$/, "$1"));
    }
    data[key] = items;
  }

  return data;
}
