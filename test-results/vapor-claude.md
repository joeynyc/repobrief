# CLAUDE.md — Project Context for Claude Code

This is a Vapor software project built with Swift Package Manager, XCTest.

## File Tree (key directories, depth=2)
```
.
├── README.md
├── Sources/
│   ├── CVaporBcrypt/
│   ├── Development/
│   ├── Vapor/
│   ├── VaporTestUtils/
│   ├── VaporTesting/
│   └── XCTVapor/
└── Tests/
    └── VaporTests/
```

## Architecture at a Glance
- Project shape: **single**
- Framework: **Vapor**
- Build system: **Swift Package Manager**
- Primary languages: **Swift**

## Entry Points and Responsibilities
- No explicit entry points were detected.

## Key Dependencies (what they do here)
- No runtime dependencies detected.

## Rules to Follow in This Repo
- Module style is mixed — copy the import/export style used in the file you are editing.
- Use camelCase naming for new symbols/files where feasible.
- Tests use XCTest — run xcodebuild test before committing.
- No explicit linter detected — preserve existing formatting and style in touched files.
- Follow established Vapor conventions already present in this repo.

## Hot Spots (high git churn)
These files have the most git churn — they're actively evolving. Review recent changes before modifying.
- `.github/CODEOWNERS` (1 commits)
- `.github/contributing.md` (1 commits)
- `.github/dependabot.yml` (1 commits)
- `.github/maintainers.md` (1 commits)
- `.github/workflows/api-docs.yml` (1 commits)
- `.github/workflows/sponsors.yml` (1 commits)
- `.github/workflows/test.yml` (1 commits)
- `.gitignore` (1 commits)
- `.spi.yml` (1 commits)
- `AGENTS.md` (1 commits)

## Quick Start for AI Agents
- To understand this project, start by reading **the main entry point under src/**.
- The core logic primarily lives in **Sources**.
- Tests are in **the repository test directories**.
- Before proposing changes, scan the hot spots section and mirror local patterns in nearby files.
