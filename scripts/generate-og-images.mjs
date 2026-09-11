#!/usr/bin/env node
/**
 * Renders the Open Graph preview cards that social clients show when someone
 * shares a link. Runs as `prebuild`, so the PNGs land in public/og/ and Astro
 * copies them into dist/ like any other static asset.
 *
 *   npm run og
 *
 * One card per lesson, plus the site-wide default used by every other page.
 * The cards
 * are drawn as SVG and rasterised with sharp, which Astro already depends on
 * for its image service — no extra toolchain, and it works offline in CI.
 *
 * Text is laid out here rather than by a browser, so line breaking uses an
 * estimated advance width per character (see `measure`). It only has to be
 * close: the card is generous with space and the type shrinks when a title is
 * long.
 */

import { mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { parseFrontmatter, splitFrontmatter } from "./lib/mdx-blocks.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LESSONS = join(ROOT, "src/content/lessons");
const OUT = join(ROOT, "public/og");

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * librsvg resolves fonts through fontconfig, so an embedded @font-face would
 * be ignored. These three cover Ubuntu (CI), most Linux desktops and macOS.
 */
const SANS = "DejaVu Sans, Liberation Sans, Helvetica, Arial, sans-serif";

/* ---------- palette, mirroring the dark theme in src/styles/global.css ---------- */

const BG = "#07070c";
const TEXT = "#e8eaf3";
const MUTED = "#9aa1bb";
const FAINT = "#6b7290";
const ACCENT = "#818cf8";
const CYAN = "#22d3ee";
const YELLOW = "#ffd43b";

/* ---------- text measurement ---------- */

/**
 * Advance widths as a fraction of the font size, calibrated against DejaVu
 * Sans Bold. Wide and narrow glyphs are called out; the rest take the default.
 */
const NARROW = new Set([..."ijlItfr.,:;'!|()[]{}-"]);
const WIDE = new Set([..."mwMW@%"]);

const measure = (text, size) => {
  let units = 0;
  for (const char of text) {
    if (NARROW.has(char)) units += 0.43;
    else if (WIDE.has(char)) units += 1.02;
    else if (char === " ") units += 0.35;
    else if (char >= "A" && char <= "Z") units += 0.75;
    else units += 0.68;
  }
  return units * size;
};

/** Greedy line breaking on spaces; a single over-long word gets its own line. */
function wrap(text, size, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Picks the largest size at which the title fits `maxLines`, then wraps it.
 * Long lesson titles shrink rather than overflow the card.
 */
function fitTitle(text, maxWidth, maxLines, sizes = [72, 64, 58, 52, 46]) {
  for (const size of sizes) {
    const lines = wrap(text, size, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  const size = sizes[sizes.length - 1];
  return { size, lines: wrap(text, size, maxWidth).slice(0, maxLines) };
}

/* ---------- drawing ---------- */

/** XML-escape, so an ampersand or angle bracket in a title cannot break the SVG. */
const esc = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * The card: a dark field with an indigo glow, the wordmark up top, the title
 * filling the middle, and an eyebrow of metadata along the bottom.
 */
function card({ eyebrow, title, meta }) {
  const PAD = 80;
  const maxWidth = WIDTH - PAD * 2;
  const { size, lines } = fitTitle(title, maxWidth, 3);
  const leading = Math.round(size * 1.22);

  // Centre the title block in the space between the wordmark and the footer.
  const blockTop = 250;
  const blockBottom = HEIGHT - 150;
  const blockHeight = lines.length * leading;
  let y = blockTop + (blockBottom - blockTop - blockHeight) / 2 + size;

  const titleLines = lines
    .map((line) => {
      const row = `<text x="${PAD}" y="${Math.round(y)}" font-family="${SANS}" font-size="${size}" font-weight="bold" fill="${TEXT}">${esc(line)}</text>`;
      y += leading;
      return row;
    })
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${ACCENT}"/>
      <stop offset="55%" stop-color="${CYAN}"/>
      <stop offset="100%" stop-color="${YELLOW}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
  <ellipse cx="${WIDTH - 120}" cy="-40" rx="560" ry="420" fill="url(#glow)"/>
  <rect width="${WIDTH}" height="10" fill="url(#rule)"/>

  <circle cx="88" cy="112" r="14" fill="${YELLOW}"/>
  <text x="116" y="121" font-family="${SANS}" font-size="28" font-weight="bold" fill="${TEXT}">Learn Python for AI</text>

  <text x="80" y="205" font-family="${SANS}" font-size="26" font-weight="bold" fill="${ACCENT}" letter-spacing="2">${esc(eyebrow.toUpperCase())}</text>

  ${titleLines}

  <rect x="80" y="${HEIGHT - 128}" width="72" height="4" rx="2" fill="${ACCENT}"/>
  <text x="80" y="${HEIGHT - 78}" font-family="${SANS}" font-size="24" fill="${MUTED}">${esc(meta)}</text>
  <text x="${WIDTH - 80}" y="${HEIGHT - 78}" text-anchor="end" font-family="${SANS}" font-size="24" fill="${FAINT}">dileepadev.github.io/learn-python-ai</text>
</svg>`;
}

/**
 * librsvg draws nothing at all when fontconfig has no matching font, and does
 * it silently — the build would still "succeed", shipping 68 blank cards. Probe
 * with white text on black: if the result has no variance, no glyphs were drawn.
 */
async function assertFontsAvailable() {
  const probe = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><rect width="200" height="60" fill="#000"/><text x="8" y="42" font-family="${SANS}" font-size="36" font-weight="bold" fill="#fff">Agy</text></svg>`;
  const { channels } = await sharp(Buffer.from(probe)).stats();
  const drewSomething = channels.some((channel) => channel.stdev > 1);
  if (!drewSomething) {
    throw new Error(
      `No usable font for "${SANS}". Install one (e.g. fonts-dejavu-core) — ` +
        "without it every Open Graph card renders blank.",
    );
  }
}

const render = async (name, svg) => {
  const file = join(OUT, `${name}.png`);
  await mkdir(join(file, ".."), { recursive: true });
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
  return file;
};

/* ---------- inputs ---------- */

/** Module slug -> title, read from the curriculum so the two cannot drift. */
async function modules() {
  const source = await readFile(join(ROOT, "src/lib/curriculum.ts"), "utf8");
  const found = new Map();
  for (const block of source.matchAll(/slug:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)"/g)) {
    found.set(block[1], block[2]);
  }
  return found;
}

async function lessons() {
  const out = [];
  for (const dir of await readdir(LESSONS, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of await readdir(join(LESSONS, dir.name))) {
      if (!file.endsWith(".mdx") && !file.endsWith(".md")) continue;
      const path = join(LESSONS, dir.name, file);
      const { frontmatter } = splitFrontmatter(await readFile(path, "utf8"));
      if (!frontmatter) continue;
      const data = parseFrontmatter(frontmatter);
      out.push({ id: `${dir.name}/${file.replace(/\.mdx?$/, "")}`, ...data });
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

const LEVEL_LABEL = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

async function main() {
  await assertFontsAvailable();
  await mkdir(OUT, { recursive: true });

  const moduleTitles = await modules();
  const all = await lessons();
  let count = 0;

  // The default, used by every page that has no card of its own.
  await render(
    "default",
    card({
      eyebrow: "Free · runs in your browser",
      title: "Python, from your first print() to production AI systems.",
      meta: `${moduleTitles.size} modules · ${all.length} runnable lessons`,
    }),
  );
  count++;

  for (const lesson of all) {
    const parts = [moduleTitles.get(lesson.module) ?? lesson.module];
    if (lesson.level) parts.push(LEVEL_LABEL[lesson.level] ?? lesson.level);
    if (lesson.minutes) parts.push(`${lesson.minutes} min`);
    await render(
      `lesson-${lesson.id.replace(/\//g, "--")}`,
      card({ eyebrow: "Lesson", title: lesson.title, meta: parts.join(" · ") }),
    );
    count++;
  }

  console.log(`og: rendered ${count} cards into public/og/`);
}

await main();
