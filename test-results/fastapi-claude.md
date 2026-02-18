# CLAUDE.md — Project Context for Claude Code

This is a FastAPI software project built with pip/pyproject, pytest, annotated-doc, pydantic.

## File Tree (key directories, depth=2)
```
.
├── README.md
├── pyproject.toml
├── docs/
│   ├── de/
│   ├── en/
│   ├── es/
│   ├── fr/
│   ├── ja/
│   ├── ko/
│   ├── language_names.yml
│   └── missing-translation.md
├── scripts/
│   ├── contributors.py
│   ├── coverage.sh
│   ├── deploy_docs_status.py
│   ├── doc_parsing_utils.py
│   ├── docs.py
│   ├── format.sh
│   ├── general-llm-prompt.md
│   └── label_approved.py
└── tests/
    ├── __init__.py
    ├── benchmarks/
    ├── forward_reference_type.py
    ├── main.py
    ├── test_additional_properties.py
    ├── test_additional_properties_bool.py
    ├── test_additional_response_extra.py
    └── test_additional_responses_bad.py
```

## Architecture at a Glance
- Project shape: **single**
- Framework: **FastAPI**
- Build system: **pip/pyproject**
- Primary languages: **Python**

## Entry Points and Responsibilities
- No explicit entry points were detected.

## Key Dependencies (what they do here)
- **annotated-doc@0.0.2** — used by this project via pyproject.toml.
- **pydantic@2.7.0** — defines validated request/response schemas.
- **starlette@0.40.0** — used by this project via pyproject.toml.
- **typing-extensions@4.8.0** — used by this project via pyproject.toml.
- **typing-inspection@0.4.2** — used by this project via pyproject.toml.

## Rules to Follow in This Repo
- Module style is mixed — copy the import/export style used in the file you are editing.
- Use snake_case naming where applicable to match existing code style.
- Tests use pytest — run pytest before committing.
- No explicit linter detected — preserve existing formatting and style in touched files.
- Prefer typed route signatures and Pydantic models for request/response shapes.

## Hot Spots (high git churn)
These files have the most git churn — they're actively evolving. Review recent changes before modifying.
- `.github/DISCUSSION_TEMPLATE/questions.yml` (1 commits)
- `.github/DISCUSSION_TEMPLATE/translations.yml` (1 commits)
- `.github/FUNDING.yml` (1 commits)
- `.github/ISSUE_TEMPLATE/config.yml` (1 commits)
- `.github/ISSUE_TEMPLATE/privileged.yml` (1 commits)
- `.github/dependabot.yml` (1 commits)
- `.github/labeler.yml` (1 commits)
- `.github/workflows/add-to-project.yml` (1 commits)
- `.github/workflows/build-docs.yml` (1 commits)
- `.github/workflows/contributors.yml` (1 commits)

## Quick Start for AI Agents
- To understand this project, start by reading **the main entry point under src/**.
- The core logic primarily lives in **tests**.
- Tests are in **tests**.
- Before proposing changes, scan the hot spots section and mirror local patterns in nearby files.
