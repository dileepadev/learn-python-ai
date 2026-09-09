# Learn Python for AI

**A free, hands-on course that takes you from your first `print()` to shipping production AI
systems — with every example running real Python in your browser.**

🔗 **[dileepadev.github.io/learn-python-ai](https://dileepadev.github.io/learn-python-ai)**

There is no shortage of Python courses. This one has a specific destination: **AI
engineering**. Concepts are taught in the order and framing that gets you to embeddings,
evaluation harnesses and agent loops — arrays before tensors, dictionaries before JSON
payloads, generators before streaming responses.

## What makes it different

- **Nothing to install.** A real CPython interpreter, compiled to WebAssembly via
  [Pyodide](https://pyodide.org), runs inside your browser tab. No Anaconda, no PATH problems.
- **Every code block is editable and runnable.** Change any example and press Run — or
  `Ctrl`/`Cmd` + `Enter`.
- **Exercises are actually checked.** Your program runs, then real Python assertions run
  against it. There is no answer key to pattern-match.
- **NumPy, pandas, matplotlib and scikit-learn** are one `import` away, fetched on demand.
- **Your code never leaves your machine.** Nothing is uploaded; there is no backend.

## Curriculum

| # | Module | Level | Status |
| --- | --- | --- | --- |
| 01 | **Python Foundations** — the language, from `print` to control flow | Beginner | ✅ 9 lessons |
| 02 | **Core Python** — functions, objects, and the shape of real code | Intermediate | 📋 Planned |
| 03 | **Numerical Python** — NumPy, vectorisation, thinking in arrays | Intermediate | 📋 Planned |
| 04 | **Data Wrangling** — pandas, cleaning, honest exploration | Intermediate | 📋 Planned |
| 05 | **Machine Learning Foundations** — scikit-learn, and a neural net you write yourself | Advanced | 📋 Planned |
| 06 | **LLM Engineering** — prompts, structured output, tool-calling loops | Advanced | 📋 Planned |
| 07 | **Retrieval and RAG** — embeddings, vector search, grounded answers | Expert | 📋 Planned |
| 08 | **Production AI Systems** — async, testing, evals, and shipping it | Expert | 📋 Planned |

The full lesson-by-lesson roadmap, including every planned module, is at
[/curriculum](https://dileepadev.github.io/learn-python-ai/curriculum).

This is `v0.1.0`. Following [SemVer](VERSIONING.md), **`v1.0.0` ships only when all eight
modules are complete** — progress towards it is tracked in
[issue #2](https://github.com/dileepadev/learn-python-ai/issues/2).

## Running it locally

```bash
git clone https://github.com/dileepadev/learn-python-ai.git
cd learn-python-ai
npm install
npm run dev          # http://localhost:4321/learn-python-ai
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build the static site into `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm run check` | Type-check Astro, TypeScript and content frontmatter |

## How it is built

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | [Astro](https://astro.build) | Content-first, ships zero JavaScript on pages that don't need it |
| Content | MDX content collections | Lessons are Markdown with interactive components embedded |
| Interactivity | React islands | Only the editor, quizzes and progress hydrate |
| Python | [Pyodide](https://pyodide.org) in a Web Worker | Real CPython; a runaway loop can't freeze the page |
| Editor | [CodeMirror 6](https://codemirror.net) | Python syntax, autocomplete, bracket matching |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) | Token-driven light and dark themes |
| Hosting | GitHub Pages via GitHub Actions | Static output, deployed on every push to `main` |

### Repository layout

```
src/
  content/lessons/       Lesson MDX, one folder per module
  content.config.ts      Frontmatter schema for lessons
  components/            Astro components and React islands
    mdx/                 The components lessons use: Run, Exercise, Quiz, Callout
    CodeRunner.tsx       The editor + runner island
    editor.ts            CodeMirror 6 setup
  lib/
    curriculum.ts        Module definitions and the public roadmap
    python-runtime.ts    Main-thread client for the Pyodide worker
    progress.ts          Per-browser progress, stored in localStorage
  layouts/               Page and lesson shells
  pages/                 Routes
public/
  pyodide-worker.js      The Python worker (loads Pyodide from the CDN)
examples/                Standalone .py files you can run locally
```

### Writing a lesson

Add an `.mdx` file under `src/content/lessons/<module>/`. The frontmatter is validated at build
time against the schema in [src/content.config.ts](src/content.config.ts):

```mdx
---
title: Working with text
description: One sentence describing what the lesson delivers.
module: foundations      # must match a slug in src/lib/curriculum.ts
order: 3
level: beginner
minutes: 14
objectives:
  - What the reader will be able to do afterwards
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
```

Inside `tests`, two names are provided alongside everything the learner defined:

| Name | What it holds |
| --- | --- |
| `_stdout` | Everything the program printed, as one string |
| `_lines` | The same output split into lines, with trailing blanks removed |

Raise `AssertionError` with a message that tells the learner what went wrong — the message is
shown to them verbatim.

## Contributing

Corrections, new lessons and better explanations are all welcome. Please read
[CONTRIBUTING.md](CONTRIBUTING.md), and follow the
[branch naming](BRANCH_NAMING_GUIDELINES.md), [commit message](COMMIT_MESSAGE_GUIDELINES.md)
and [pull request](PULL_REQUEST_GUIDELINES.md) guidelines.

## Licence

[MIT](LICENSE).
