# CLAUDE.md — Project Context for Claude Code

## Project Overview
single Unknown framework project using npm scripts

## Architecture
- Entry points:
  - dist/cli.js
  - ./bin/repobrief.js
  - src/cli.ts
- Key directories:
  - src
  - tests

## Code Conventions
- Follow kebab-case naming where applicable
- Use esm module style
- Tests use Vitest
- Linting: not clearly configured

## Key Dependencies
- chalk@^5.4.1 — Terminal string styling and colors.
- commander@^13.1.0 — CLI argument parser and command framework.
- glob@^11.0.1 — File path pattern matching utility.
- handlebars@^4.7.8 — Template engine for text generation.
- ora@^8.2.0 — Terminal spinner utility for progress feedback.
- simple-git@^3.27.0 — Promise-friendly wrapper around the Git CLI.

## Hot Spots
These files change most often — review carefully before modifying:
- README.md (4 commits)
- .gitignore (3 commits)
- package.json (3 commits)
- AGENTS.md (2 commits)
- src/analyzers/git-history.ts (2 commits)
- src/cli.ts (2 commits)
- src/commands/export.ts (2 commits)
- src/commands/init.ts (2 commits)
- src/commands/update.ts (2 commits)
- src/exporters/claude.ts (2 commits)

## Guidelines
- Check existing patterns in src, tests before adding new code
- Run npm run test before committing
- Follow repository conventions for framework-specific changes
