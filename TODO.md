# TODO

This file tracks tasks, improvements, and features planned for upcoming updates or releases of this repository.

>[!Note]
> This list is **not exhaustive** and may change over time. Items are not necessarily in priority order.

## Goal

Turn this repository into **Learn Python for AI** — a free, interactive website that teaches
Python from complete beginner to expert, aimed squarely at **AI engineering**.

Every lesson runs real Python in the browser, so a learner needs nothing but a tab. The
destination is not "you know Python syntax" but "you can build, evaluate and ship an AI system
in Python".

**Live at:** <https://dileepadev.github.io/learn-python-ai>

**Tracked in:** [#2 — Initial release: interactive Python for AI learning platform](https://github.com/dileepadev/learn-python-ai/issues/2)

### Releases

Per [VERSIONING.md](VERSIONING.md) this project follows SemVer, so **`v1.0.0` is the first
stable release — it ships only when every module below is complete.** Everything before that is
published as `0.x` as it lands: `v0.1.0` is the platform plus module 01, and each subsequent
module gets its own minor version.

### Principles

- **Runnable over readable.** Every concept ships with code the learner can edit and execute.
- **Checked, not self-assessed.** Exercises run real assertions against the learner's program.
- **AI-motivated throughout.** Each lesson says why the concept matters for AI work, from
  module 1 onward — not only in the advanced modules.
- **No account, no backend.** Progress lives in the browser; the site stays a static deploy.

## Upcoming Tasks

### Platform

- [x] Task 1: Rename the repository to `learn-python-ai` and reframe the goal around AI engineering.
- [x] Task 2: Build the site with Astro, React islands, MDX content collections and Tailwind CSS v4.
- [x] Task 3: Run Python in the browser with Pyodide, off the main thread in a Web Worker.
- [x] Task 4: Add an editable CodeMirror 6 editor with Run, Stop, Reset, Copy and stdin support.
- [x] Task 5: Add automatically checked exercises, quizzes and per-browser progress tracking.
- [x] Task 6: Deploy to GitHub Pages from `main` via GitHub Actions.
- [ ] Task 7: Add full-text lesson search (Pagefind), with a keyboard-driven command palette.
- [ ] Task 8: Render matplotlib figures inline in lesson output.
- [ ] Task 9: Add a mobile lesson-navigation drawer; the sidebar is desktop-only today.
- [ ] Task 10: Cache the Pyodide runtime in a service worker so return visits start instantly.
- [ ] Task 11: Add an Open Graph image generator so shared lesson links preview properly.
- [ ] Task 12: Run the exercise-solution browser suite in CI, not just locally.

### Curriculum

- [x] Task 13: Module 01 — Python Foundations (9 lessons).
- [ ] Task 14: Module 02 — Core Python: functions, comprehensions, modules, files, exceptions,
      classes, type hints, decorators, context managers.
- [ ] Task 15: Module 03 — Numerical Python: arrays, broadcasting, vectorisation, linear algebra.
- [ ] Task 16: Module 04 — Data Wrangling: pandas, cleaning, group-by, joins, plotting.
- [ ] Task 17: Module 05 — Machine Learning Foundations: scikit-learn, metrics, cross-validation,
      gradient descent and a neural network from scratch, then PyTorch.
- [ ] Task 18: Module 06 — LLM Engineering: the Messages API, streaming, structured output,
      tool use, agent loops, MCP, token accounting.
- [ ] Task 19: Module 07 — Retrieval and RAG: embeddings, chunking, vector indexes, hybrid
      search, re-ranking, groundedness evaluation.
- [ ] Task 20: Module 08 — Production AI Systems: asyncio, retries and rate limits, pytest for
      non-deterministic systems, evaluation harnesses, observability, FastAPI, packaging.

### Known constraints

- Lessons in modules 06–08 call live LLM APIs, which the browser sandbox cannot do (no sockets,
  and no place to put an API key safely). Those lessons will teach against a recorded-response
  fixture in the browser, and ship the real script for the reader to run locally.
- `input()` cannot block in WebAssembly without `SharedArrayBuffer`, which GitHub Pages cannot
  enable. Lessons that need input read from the editor's Stdin panel instead.
