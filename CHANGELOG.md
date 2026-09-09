# Changelog

All notable changes to this project are documented in this file.

Changes are organized into the following categories:

- **Added:** New features or functionality introduced to the project.
- **Changed:** Modifications to existing functionality that do not add new features.
- **Fixed:** Bug fixes that resolve issues or correct unintended behavior.
- **Removed:** Features or components that have been removed from the project.

## [Unreleased]

- Changes for the next release are available in development branches.

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

This project reaches **v1.0.0** only once all eight curriculum modules are complete. Progress
towards that is tracked in
[issue #2](https://github.com/dileepadev/learn-python-ai/issues/2).

[Unreleased]: https://github.com/dileepadev/learn-python-ai/compare/v0.1.0...HEAD
[v0.1.0]: https://github.com/dileepadev/learn-python-ai/releases/tag/v0.1.0
