# repobrief

> Give any AI agent instant understanding of your codebase.

**repobrief** auto-generates and maintains a living context map of your project that any AI coding tool can consume — Claude Code, Cursor, Codex, Cline, or anything else.

## The Problem

Every time you start an AI coding session, the agent re-discovers your project from scratch. You waste tokens, time, and get worse outputs because the AI is guessing at your architecture instead of knowing it.

## The Fix

```bash
npx repobrief init
```

That's it. repobrief scans your repo and generates a `.repobrief/` directory with:

- **architecture.md** — project structure, entry points, build system
- **patterns.md** — coding conventions detected from your actual code
- **dependencies.md** — key deps, what they're used for
- **hotfiles.md** — most-edited files, where bugs cluster
- **context.json** — machine-readable version for tool integrations

## Export to Your AI Tool

```bash
repobrief export --format claude    # → CLAUDE.md
repobrief export --format cursor    # → .cursorrules
repobrief export --format codex     # → AGENTS.md
repobrief export --format markdown  # → universal summary
```

## Keep It Fresh

```bash
repobrief update                    # incremental rescan
```

## Supported Projects

Node.js, Python, Swift/Xcode, Rust, Go — detected automatically by manifest files.

## Install

```bash
npm install -g repobrief
```

## License

MIT
