# CLAUDE.md — Project Context for Claude Code

This is a Fastify monorepo project built with JavaScript tests, @fastify/ajv-compiler, @fastify/error.

## File Tree (key directories, depth=2)
```
.
├── README.md
├── package.json
├── docs/
│   ├── Guides/
│   ├── Reference/
│   ├── index.md
│   └── resources/
├── lib/
│   ├── config-validator.js
│   ├── content-type-parser.js
│   ├── content-type.js
│   ├── context.js
│   ├── decorate.js
│   ├── error-handler.js
│   ├── error-serializer.js
│   └── error-status.js
└── test/
    ├── 404s.test.js
    ├── 500s.test.js
    ├── allow-unsafe-regex.test.js
    ├── als.test.js
    ├── async-await.test.js
    ├── async-dispose.test.js
    ├── async_hooks.test.js
    └── body-limit.test.js
```

## Architecture at a Glance
- Project shape: **monorepo**
- Framework: **Fastify**
- Build system: **Unknown**
- Primary languages: **JavaScript/TypeScript**

## Entry Points and Responsibilities
- `fastify.js` — Server entry — configures middleware/plugins and mounts routes.

## Key Dependencies (what they do here)
- **@fastify/ajv-compiler@^4.0.5** — used by this project via package.json.
- **@fastify/error@^4.0.0** — used by this project via package.json.
- **@fastify/fast-json-stringify-compiler@^5.0.0** — used by this project via package.json.
- **@fastify/proxy-addr@^5.0.0** — used by this project via package.json.
- **abstract-logging@^2.0.1** — used by this project via package.json.
- **avvio@^9.0.0** — used by this project via package.json.
- **fast-json-stringify@^6.0.0** — used by this project via package.json.
- **find-my-way@^9.0.0** — used by this project via package.json.
- **light-my-request@^6.0.0** — used by this project via package.json.
- **pino@^9.14.0 || ^10.1.0** — used by this project via package.json.
- **process-warning@^5.0.0** — used by this project via package.json.
- **rfdc@^1.3.1** — used by this project via package.json.

## Rules to Follow in This Repo
- Module style is mixed — copy the import/export style used in the file you are editing.
- Use kebab-case file names to match the dominant project convention.
- Tests use JavaScript tests — run npm run test before committing.
- Respect lint/format tooling: ESLint.
- Follow established Fastify conventions already present in this repo.

## Hot Spots (high git churn)
These files have the most git churn — they're actively evolving. Review recent changes before modifying.
- `.borp.yaml` (1 commits)
- `.editorconfig` (1 commits)
- `.gitattributes` (1 commits)
- `.github/dependabot.yml` (1 commits)
- `.github/labeler.yml` (1 commits)
- `.github/problem-matcher.json` (1 commits)
- `.github/scripts/lint-ecosystem.js` (1 commits)
- `.github/workflows/backport.yml` (1 commits)
- `.github/workflows/ci-alternative-runtime.yml` (1 commits)
- `.github/workflows/ci.yml` (1 commits)

## Quick Start for AI Agents
- To understand this project, start by reading **fastify.js**.
- The core logic primarily lives in **lib**.
- Tests are in **test**.
- Before proposing changes, scan the hot spots section and mirror local patterns in nearby files.
