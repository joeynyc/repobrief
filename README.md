# codemap

> Give any AI agent instant understanding of your codebase.

**codemap** auto-generates and maintains a living context map of your project that any AI coding tool can consume — Claude Code, Cursor, Codex, Cline, or anything else.

## The Problem

Every time you start an AI coding session, the agent re-discovers your project from scratch. You waste tokens, time, and get worse outputs because the AI is guessing at your architecture instead of knowing it.

## The Fix

```bash
npx codemap init
```

That's it. codemap scans your repo and generates a `.codemap/` directory with:

- **architecture.md** — project structure, entry points, build system
- **patterns.md** — coding conventions detected from your actual code
- **dependencies.md** — key deps, what they're used for
- **hotfiles.md** — most-edited files, where bugs cluster
- **context.json** — machine-readable version for tool integrations

## Export to Your AI Tool

```bash
codemap export --format claude    # → CLAUDE.md
codemap export --format cursor    # → .cursorrules
codemap export --format codex     # → AGENTS.md
codemap export --format markdown  # → universal summary
```

## Keep It Fresh

```bash
codemap update                    # incremental rescan
```

## Supported Projects

Node.js, Python, Swift/Xcode, Rust, Go — detected automatically by manifest files.

## Install

```bash
npm install -g codemap
```

## License

MIT
