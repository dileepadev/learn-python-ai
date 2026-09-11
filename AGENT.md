# AGENT.md

Guidance for AI coding agents working in this repository.

**This file is the single source of truth.** Every other agent configuration file here
(`CLAUDE.md`, `AGENTS.md`, `.cursor/rules/`, `.github/copilot-instructions.md`,
`.agents/rules/`, `GEMINI.md`, `.windsurf/rules/`) is a pointer to this one. Read this before
making changes, and put any new guidance **here**, not in the pointers.

## What this project is

**Learn Python for AI** — a static website that teaches Python from complete beginner to expert,
aimed at AI engineering. Lessons are MDX documents whose code blocks run real CPython in the
reader's browser via Pyodide. There is no backend, no account and no server-side execution.

- Live site: <https://dileepadev.github.io/learn-python-ai>
- Roadmap, release criteria and open work: [issue #2](https://github.com/dileepadev/learn-python-ai/issues/2)
- Per [VERSIONING.md](VERSIONING.md), **`v1.0.0` ships only when all eight curriculum modules are
  complete.** Everything before that is `0.x`.

### Principles that decide arguments

1. **Runnable over readable.** Every concept ships with code the reader can edit and execute.
2. **Checked, not self-assessed.** Exercises run real assertions against the reader's program.
3. **AI-motivated throughout.** Every lesson says why the concept matters for AI work — from
   module 1, not only in the advanced modules.
4. **No account, no backend.** Progress lives in the browser. Do not propose a database, an auth
   flow or a server; they would break the deployment model.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at <http://localhost:4321/learn-python-ai> |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built site |
| `npm run check` | Astro + TypeScript + content-schema diagnostics |
| `npm run lint:lessons` | Check lessons against the content rules below, without booting Python |
| `npm run verify` | Execute every `Run` block and `Exercise` solution in Pyodide |
| `npm run og` | Render the Open Graph cards into `public/og/` (also runs at `prebuild`) |

`npm run lint:lessons`, `npm run check` and `npm run build` must all pass before you propose a
change, and `npm run verify` must pass whenever you touch lesson code. CI runs all four.

## Architecture

```markdown
src/
  content/lessons/<module>/*.mdx   Lesson content
  content.config.ts                Frontmatter schema (Zod, validated at build)
  lib/
    curriculum.ts                  Module definitions and the public roadmap
    lessons.ts                     Ordering, grouping, prev/next
    python-runtime.ts              Main-thread client for the Pyodide worker
    progress.ts                    localStorage progress
    paths.ts                       withBase(), lessonHref(), SITE constants
    search.ts                      Command-palette index over lesson metadata
  components/
    mdx/                           What lessons use: Run, Exercise, Quiz, Callout
    CodeRunner.tsx                 Editor + runner island
    editor.ts                      CodeMirror 6 setup
  layouts/                         BaseLayout, LessonLayout
  pages/                           Routes
public/pyodide-worker.js           The Python worker (loads Pyodide from the CDN)
public/sw.js                       Service worker; caches the Pyodide runtime and wheels
scripts/                           Lesson linter, exercise verifier, OG card generator
examples/                          Standalone .py files, a local-run companion
```

Key decisions, so you do not undo them by accident:

- **Astro, not a React framework.** Reading pages ship almost no JavaScript; only the editor,
  quizzes and progress hydrate as islands. Do not convert pages to client components.
- **Pyodide runs in a Web Worker**, not the main thread, so a runaway loop cannot freeze the page.
- **Colours are semantic CSS custom properties** in `src/styles/global.css`, not Tailwind colour
  utilities. That is what lets the CodeMirror editor share the page's palette and re-theme.
  Use `var(--text)`, `var(--bg-elevated)`, `var(--accent)` etc. — do not hardcode hex values.
- **Every internal link must go through `withBase()`** from `src/lib/paths.ts`. The site is
  served from `/learn-python-ai/`, so a bare `/curriculum` href is a broken link in production.

## Writing a lesson

Add an `.mdx` file under `src/content/lessons/<module>/`. `module` must match a slug in
`src/lib/curriculum.ts`. Frontmatter is validated at build time by `src/content.config.ts`:

```mdx
---
title: Working with text
description: One sentence on what the lesson delivers.
module: foundations
order: 3
level: beginner        # beginner | intermediate | advanced | expert
minutes: 14
objectives:
  - What the reader can do afterwards
---

Prose, in Markdown.

<Run id="unique-id" code={`print("editable and runnable")`} />

<Callout type="ai">Why this matters for AI engineering.</Callout>

<Exercise
  id="unique-id-ex1"
  brief="What to do, in one sentence."
  code={`# starter code`}
  hint="A nudge, not the answer."
  solution={`print("the answer")`}
  tests={`assert _lines == ["the answer"], f"Got: {_lines}"`}
/>

<Quiz
  question="..."
  choices={[
    { text: "...", correct: true, why: "Why this is right." },
    { text: "...", why: "Why this is wrong." },
  ]}
/>
```

`Run`, `Exercise`, `Quiz` and `Callout` reach MDX through the `components` prop in
`src/pages/learn/[...id].astro`, so **lessons need no imports**. `Callout` types are
`note`, `tip`, `warning`, `ai`.

### The exercise checking contract

`tests` is Python that runs **after** the reader's program, in the same namespace. It sees every
name they bound, plus two injected values:

| Name | Holds |
| --- | --- |
| `_stdout` | Everything printed, as one string |
| `_lines` | The same output split into lines, trailing blanks removed |

Raise `AssertionError` with a message that tells the reader what went wrong — it is shown to them
verbatim. Assert on **behaviour**, never on source text, so a different correct solution passes.

### Rules for lesson content

- Every lesson needs at least one `Exercise` and one `Quiz`, and ends with a `## Recap`.
- Every quiz choice needs a `why`, including the correct one.
- Every lesson needs a `<Callout type="ai">` explaining why the concept matters for AI work.
- **Verify every `solution` actually passes its own `tests`.** Do not ship an unverified exercise.
- Write British English, as the existing lessons do.

### MDX gotchas

- Inside `code={`...`}`, a Python `\n` must be written `\\n`, and avoid backticks and `${`.
- Braces in prose are JSX expressions. Write `` `f"{value = }"` `` in backticks, not
  `<code>f"{value = }"</code>`, or the build fails with a parse error.
- Do not pass a **string** `style` to a React component from an `.astro` file — React requires an
  object and the build will fail. Wrap it in a `<span style="...">` instead.

## Conventions

Follow the repository's own documents. They are binding, not suggestions:

| Topic | Document |
| --- | --- |
| Commit messages | [COMMIT_MESSAGE_GUIDELINES.md](COMMIT_MESSAGE_GUIDELINES.md) |
| Branch names | [BRANCH_NAMING_GUIDELINES.md](BRANCH_NAMING_GUIDELINES.md) |
| Pull requests | [PULL_REQUEST_GUIDELINES.md](PULL_REQUEST_GUIDELINES.md) + [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) |
| Issues | [.github/ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE) — use the matching template, keep its headings |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Versioning | [VERSIONING.md](VERSIONING.md) |
| Changes | [CHANGELOG.md](CHANGELOG.md) |

The three that agents most often get wrong:

- **Commits** are `<type>(<scope>): <Short message> (refs #N)`. `<type>` is one of
  `feat fix docs style refactor perf test chore` — **`ci` is not valid**, use `chore(config)`.
  Imperative mood, capitalised, no trailing period, short message under 50 characters, and the
  issue reference goes **in the subject line**, not the body.
- **Branches** are `feat/x`, `fix/x`, `docs/x`, `style/x`, `refactor/x`, `perf/x`, `test/x`,
  `chore/x`. Never commit directly to `main` or `dev`.
- **Issues and PRs** must keep the headings of their template, in order.

## Constraints that will bite you

- **`input()` cannot block.** WebAssembly needs `SharedArrayBuffer` for that, which GitHub Pages
  cannot enable (it requires COOP/COEP headers). Lessons supply stdin up front via the editor's
  Stdin panel.
- **Running code cannot be interrupted**, for the same reason. Stop terminates the worker and
  boots a fresh one.
- **No sockets, threads, subprocesses or real filesystem** in the browser sandbox. Lessons that
  need a live LLM API call must use a recorded-response fixture in the browser and ship the real
  script for the reader to run locally.
- **Never commit build output.** `dist/`, `node_modules/`, `.astro/` and the generated
  `public/og/` cards are ignored.
- **Never commit secrets.** There is no server, so the site has no legitimate use for a key.

## Definition of done

1. `npm run lint:lessons` — passes.
2. `npm run check` — no errors, warnings or hints.
3. `npm run build` — succeeds.
4. Touched lesson code: `npm run verify` — every block and solution still behaves.
5. Docs updated when behaviour changed (`README.md`, `TODO.md`, `CHANGELOG.md` as applicable).
6. Commit messages, branch name and PR body follow the guidelines above.

## Agent configuration files

All of these point here. **Add new guidance to `AGENT.md` only** — the pointers should stay thin
so they cannot drift.

| File | Read by |
| --- | --- |
| `AGENT.md` | **Canonical.** Zed, Amp, and anything told to read it |
| `CLAUDE.md` | Claude Code (imports this file with `@AGENT.md`) |
| `.github/copilot-instructions.md` | GitHub Copilot in VS Code and JetBrains |
| `.cursor/rules/project.mdc` | Cursor (always applied) |
| `.agents/rules/project.md` | Google Antigravity (workspace rules) |
| `GEMINI.md` | Gemini CLI, Antigravity |
| `.windsurf/rules/project.md` | Windsurf |

Antigravity caps each rules file at 12,000 characters, so keep this file under that.
