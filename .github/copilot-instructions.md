## About this project

This repository is **Learn Python for AI** — an interactive website that teaches Python from
beginner to expert with an AI-engineering focus. Lessons are MDX files whose code blocks run
real Python in the browser via Pyodide.

- Stack: Astro + React islands + MDX content collections + Tailwind CSS v4.
- Python execution: Pyodide in a Web Worker (`public/pyodide-worker.js`).
- Deployment: static build to GitHub Pages via GitHub Actions on push to `main`.
- Lesson content lives in `src/content/lessons/<module>/*.mdx`; modules are declared in
  `src/lib/curriculum.ts`. See the "Writing a lesson" section of the README before adding one.
- `npm run check` must pass (Astro, TypeScript and content-schema diagnostics) before a PR.

## Guidelines

- Follow the project's code style.
- Update documentation if necessary.
- Refer to the following templates and guidelines before submitting your changes:
  - [learn-python-ai/](../) - Root directory of the repository
    - [.github/](./) - GitHub-specific files (workflows, templates, etc.)
      - [workflows/](./workflows) - Pages deployment and pull-request CI
      - [ISSUE_TEMPLATE/](./ISSUE_TEMPLATE) - Contains all issue templates
        - [bug_report.md](./ISSUE_TEMPLATE/bug_report.md) - Template for reporting bugs
        - [documentation_update.md](./ISSUE_TEMPLATE/documentation_update.md) - Template for documentation updates
        - [feature_request.md](./ISSUE_TEMPLATE/feature_request.md) - Template for suggesting new features
        - [feedback.md](./ISSUE_TEMPLATE/feedback.md) - Template for general feedback
        - [other.md](./ISSUE_TEMPLATE/other.md) - Template for other types of issues
      - [PULL_REQUEST_TEMPLATE.md](./PULL_REQUEST_TEMPLATE.md) - Template for pull request submissions
    - [BRANCH_NAMING_GUIDELINES.md](../BRANCH_NAMING_GUIDELINES.md) - Branch naming rules
    - [CHANGELOG.md](../CHANGELOG.md) - Record of project changes
    - [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) - Contributor behavior guidelines
    - [COMMIT_MESSAGE_GUIDELINES.md](../COMMIT_MESSAGE_GUIDELINES.md) - Rules for writing commit messages
    - [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute to the project
    - [LICENSE](../LICENSE) - Project license
    - [PULL_REQUEST_GUIDELINES.md](../PULL_REQUEST_GUIDELINES.md) - Pull request submission guidelines
    - [README.md](../README.md) - Project overview
    - [SECURITY.md](../SECURITY.md) - Security policy and reporting
    - [TODO.md](../TODO.md) - Tasks planned for future releases
    - [VERSIONING.md](../VERSIONING.md) - Versioning strategy for the project
    - [examples/](../examples) - Standalone .py scripts that mirror module 1, for running locally
    - [public/](../public) - Static assets, including the Pyodide worker
    - [src/](../src) - The Astro site: content, components, layouts, pages and libraries
