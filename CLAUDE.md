# Project Instructions for Claude Code

## Quick Context
- Project type: single
- Languages: JavaScript/TypeScript
- Framework: Unknown
- Build system: npm scripts

## Important Entry Points
- ./bin/codemap.js
- src/cli.ts

## Code Patterns to Follow
- Naming convention: kebab-case
- Import style: esm
- Error handling patterns: Promise.catch, console.error logging, try/catch, throw new Error

## Dependency Highlights
Runtime:
- chalk@^5.4.1
- commander@^13.1.0
- glob@^11.0.1
- handlebars@^4.7.8
- ora@^8.2.0
- simple-git@^3.27.0

Dev:
- @types/node@^22.12.0
- eslint@^9.19.0
- tsx@^4.19.3
- typescript@^5.7.3
- vitest@^3.0.5

## High-Churn Files (review before major changes)
- .gitignore (1 commits)
- package-lock.json (1 commits)
- AGENTS.md (1 commits)
- README.md (1 commits)
- package.json (1 commits)
- tsconfig.json (1 commits)
