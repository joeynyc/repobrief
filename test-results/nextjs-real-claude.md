# CLAUDE.md — Project Context for Claude Code

This is a Next.js monorepo project built with Webpack, Jest.

## File Tree (key directories, depth=2)
```
.
├── Cargo.toml
├── package.json
├── apps/
│   ├── bundle-analyzer/
│   └── docs/
├── docs/
│   ├── 01-app/
│   ├── 02-pages/
│   ├── 03-architecture/
│   ├── 04-community/
│   └── index.mdx
├── packages/
│   ├── create-next-app/
│   ├── eslint-config-next/
│   ├── eslint-plugin-internal/
│   ├── eslint-plugin-next/
│   ├── font/
│   ├── next-bundle-analyzer/
│   ├── next-codemod/
│   └── next-env/
├── scripts/
│   ├── LaunchAgents/
│   ├── analyze-dev-server-bundle.js
│   ├── analyze-profile.js
│   ├── automated-update-workflow.js
│   ├── benchmark-boot-time.sh
│   ├── benchmark-next-dev-boot.js
│   ├── build-native.ts
│   └── build-wasm.cjs
└── test/
    ├── babel.config.js
    ├── cache-components-tests-manifest.json
    ├── deploy-tests-manifest.json
    ├── development/
    ├── e2e/
    ├── examples/
    ├── get-test-filter.js
    └── integration/
```

## Architecture at a Glance
- Project shape: **monorepo**
- Framework: **Next.js**
- Build system: **Webpack**
- Primary languages: **JavaScript/TypeScript, Rust**

## Entry Points and Responsibilities
- No explicit entry points were detected.

## Key Dependencies (what they do here)
- No runtime dependencies detected.

## Rules to Follow in This Repo
- Module style is mixed — copy the import/export style used in the file you are editing.
- Use snake_case naming where applicable to match existing code style.
- Tests use Jest — run npm run test before committing.
- Respect lint/format tooling: ESLint.
- Follow app/pages router boundaries already used in this repository.

## Hot Spots (high git churn)
These files have the most git churn — they're actively evolving. Review recent changes before modifying.
- `.agents/skills/README.md` (1 commits)
- `.agents/skills/authoring-skills/SKILL.md` (1 commits)
- `.agents/skills/dce-edge/SKILL.md` (1 commits)
- `.agents/skills/flags/SKILL.md` (1 commits)
- `.agents/skills/pr-status-triage/SKILL.md` (1 commits)
- `.agents/skills/pr-status-triage/local-repro.md` (1 commits)
- `.agents/skills/pr-status-triage/workflow.md` (1 commits)
- `.agents/skills/react-vendoring/SKILL.md` (1 commits)
- `.agents/skills/runtime-debug/SKILL.md` (1 commits)
- `.alexignore` (1 commits)

## Quick Start for AI Agents
- To understand this project, start by reading **the main entry point under src/**.
- The core logic primarily lives in **test**.
- Tests are in **test**.
- Before proposing changes, scan the hot spots section and mirror local patterns in nearby files.
