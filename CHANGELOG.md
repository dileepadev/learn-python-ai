# Changelog

All notable changes to this project are documented in this file.

Changes are organized into the following categories:

- **Added:** New features or functionality introduced to the project.
- **Changed:** Modifications to existing functionality that do not add new features.
- **Fixed:** Bug fixes that resolve issues or correct unintended behavior.
- **Removed:** Features or components that have been removed from the project.

## [Unreleased]

- Changes for the next release are available in development branches.

## [v0.2.0] - 2026-09-12

All eight curriculum modules are now complete: **67 lessons and 718 runnable code blocks**, every
block and every exercise solution executed against its own assertions in CI. This is still a
`0.x` release — `v1.0.0` follows once the remaining pre-1.0 work is done.

### Added

- Module 02 — Core Python: ten lessons on functions, comprehensions, generators, modules and
  virtual environments, files and JSON, exceptions, classes and dataclasses, type hints,
  decorators and context managers, and a standard-library tour.
- Module 03 — Numerical Python: seven lessons on arrays, indexing, broadcasting, vectorisation,
  linear algebra, random numbers and seeding, and gradients.
- Module 04 — Data Wrangling: eight lessons on Series and DataFrames, selecting and filtering,
  missing data, group-by, joins and reshaping, time series, plotting, and exploratory analysis.
- Module 05 — Machine Learning Foundations: nine lessons on the estimator API, train/test splits,
  metrics, cross-validation, overfitting, pipelines, gradient descent, a neural network written
  from scratch, and PyTorch.
- Module 06 — LLM Engineering: eight lessons on how an API call works, tokens and cost,
  prompting, structured output, tool use, the agent loop, the Anthropic SDK, and MCP.
- Module 07 — Retrieval and RAG: seven lessons on chunking, embeddings, vector indexes, hybrid
  search, re-ranking, the RAG pipeline, and evaluating retrieval.
- Module 08 — Production AI Systems: nine lessons on asyncio, retries and rate limits, testing
  non-deterministic systems, evaluation harnesses, LLM-as-judge, observability, capacity
  planning, FastAPI, and packaging.
- Full-text search across every lesson, powered by Pagefind, behind a keyboard-driven command
  palette (`Ctrl`/`Cmd` + `K`, or `/`).
- Inline rendering of matplotlib figures in lesson output, drawn transparent so they sit on the
  page's own background in both themes.
- A lesson-navigation drawer for narrow screens, where the sidebar is hidden.
- A service worker that permanently caches the Pyodide runtime and its wheels, so a return visit
  boots Python without re-downloading it. Pages stay network-first, so a deploy still lands at
  once.
- Generated Open Graph cards, one per lesson plus a site-wide default, so a shared link previews
  with its title, module, level and length.
- `npm run lint:lessons`, which checks every lesson against the content rules in `AGENT.md`, and
  `npm run verify`, which executes every Run block and Exercise solution in Pyodide. Both run in
  CI on every pull request.

### Changed

- The curriculum page no longer advertises a roadmap once every module is published; its
  progress line reports lessons and total reading time instead.

## [v0.1.0] - 2026-09-09

### Added

- Interactive learning website built with Astro, React islands, MDX content collections and
  Tailwind CSS v4, deployed to GitHub Pages.
- In-browser Python execution via Pyodide, running in a Web Worker so a runaway loop cannot
  freeze the page.
- Editable CodeMirror 6 code blocks on every lesson, with Run, Stop, Reset, Copy and a stdin
  panel for `input()`.
- Automatically checked exercises: the learner's program runs, then Python assertions run
  against it and its captured output.
- Multiple-choice quizzes with per-choice explanations.
- Per-browser progress tracking, stored in `localStorage`.
- Playground page with NumPy, pandas and scikit-learn presets.
- Curriculum page publishing the full beginner-to-expert roadmap across eight modules.
- Module 01 — Python Foundations: nine lessons covering the first program, variables and types,
  text, operators, lists, dictionaries, sets and tuples, conditionals, and loops.
- GitHub Actions workflows for Pages deployment and pull-request CI.
- `AGENT.md` as the single source of truth for AI coding agents, with thin pointer files for
  Claude Code, Cursor, GitHub Copilot, Google Antigravity, Gemini CLI and Windsurf so every tool
  reads the same guidance.

### Changed

- Repository renamed from `learn-python` to `learn-python-ai`; the project is now framed as
  Python for AI engineering.
- Standalone `.py` scripts moved from `introduction/` and `playground/` to `examples/`, where
  they act as a local-run companion to the lessons.

<!-- e.g., -->
<!-- Unreleased -->
<!-- v1.0.0 -->
<!-- v0.2.0 -->
<!-- v0.1.0 -->

All eight curriculum modules are complete as of `v0.2.0`. This project reaches **v1.0.0** once
the remaining pre-1.0 work is done; progress is tracked in
[issue #2](https://github.com/dileepadev/learn-python-ai/issues/2).

[Unreleased]: https://github.com/dileepadev/learn-python-ai/compare/v0.2.0...HEAD
[v0.2.0]: https://github.com/dileepadev/learn-python-ai/compare/v0.1.0...v0.2.0
[v0.1.0]: https://github.com/dileepadev/learn-python-ai/releases/tag/v0.1.0
