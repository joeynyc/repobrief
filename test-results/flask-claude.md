# CLAUDE.md — Project Context for Claude Code

This is a Flask software project built with pip/pyproject, pytest, blinker, click.

## File Tree (key directories, depth=2)
```
.
├── README.md
├── pyproject.toml
├── docs/
│   ├── Makefile
│   ├── _static/
│   ├── api.rst
│   ├── appcontext.rst
│   ├── async-await.rst
│   ├── blueprints.rst
│   ├── changes.rst
│   └── cli.rst
├── src/
│   └── flask/
└── tests/
    ├── conftest.py
    ├── static/
    ├── templates/
    ├── test_appctx.py
    ├── test_apps/
    ├── test_async.py
    ├── test_basic.py
    └── test_blueprints.py
```

## Architecture at a Glance
- Project shape: **single**
- Framework: **Flask**
- Build system: **pip/pyproject**
- Primary languages: **Python**

## Entry Points and Responsibilities
- No explicit entry points were detected.

## Key Dependencies (what they do here)
- **blinker@1.9.0** — used by this project via pyproject.toml.
- **click@8.1.3** — used by this project via pyproject.toml.
- **itsdangerous@2.2.0** — used by this project via pyproject.toml.
- **jinja2@3.1.2** — used by this project via pyproject.toml.
- **markupsafe@2.1.1** — used by this project via pyproject.toml.
- **werkzeug@3.1.0** — used by this project via pyproject.toml.

## Rules to Follow in This Repo
- Use ESM imports/exports, not CommonJS require/module.exports.
- Use snake_case naming where applicable to match existing code style.
- Tests use pytest — run pytest before committing.
- No explicit linter detected — preserve existing formatting and style in touched files.
- Match existing blueprint and app-factory patterns if present.

## Hot Spots (high git churn)
These files have the most git churn — they're actively evolving. Review recent changes before modifying.
- `.devcontainer/devcontainer.json` (1 commits)
- `.devcontainer/on-create-command.sh` (1 commits)
- `.editorconfig` (1 commits)
- `.github/ISSUE_TEMPLATE/bug-report.md` (1 commits)
- `.github/ISSUE_TEMPLATE/config.yml` (1 commits)
- `.github/ISSUE_TEMPLATE/feature-request.md` (1 commits)
- `.github/pull_request_template.md` (1 commits)
- `.github/workflows/lock.yaml` (1 commits)
- `.github/workflows/pre-commit.yaml` (1 commits)
- `.github/workflows/publish.yaml` (1 commits)

## Quick Start for AI Agents
- To understand this project, start by reading **the main entry point under src/**.
- The core logic primarily lives in **src**.
- Tests are in **tests**.
- Before proposing changes, scan the hot spots section and mirror local patterns in nearby files.
