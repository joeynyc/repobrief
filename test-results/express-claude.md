# CLAUDE.md — Project Context for Claude Code

This is a Express software project built with Mocha, accepts, body-parser.

## File Tree (key directories, depth=2)
```
.
├── package.json
├── lib/
│   ├── application.js
│   ├── express.js
│   ├── request.js
│   ├── response.js
│   ├── utils.js
│   └── view.js
└── test/
    ├── Route.js
    ├── Router.js
    ├── acceptance/
    ├── app.all.js
    ├── app.engine.js
    ├── app.head.js
    ├── app.js
    └── app.listen.js
```

## Architecture at a Glance
- Project shape: **single**
- Framework: **Express**
- Build system: **Unknown**
- Primary languages: **JavaScript/TypeScript**

## Entry Points and Responsibilities
- `index.js` — Server entry — configures middleware/plugins and mounts routes.

## Key Dependencies (what they do here)
- **accepts@^2.0.0** — used by this project via package.json.
- **body-parser@^2.2.1** — used by this project via package.json.
- **content-disposition@^1.0.0** — used by this project via package.json.
- **content-type@^1.0.5** — used by this project via package.json.
- **cookie@^0.7.1** — used by this project via package.json.
- **cookie-signature@^1.2.1** — used by this project via package.json.
- **debug@^4.4.0** — used by this project via package.json.
- **depd@^2.0.0** — used by this project via package.json.
- **encodeurl@^2.0.0** — used by this project via package.json.
- **escape-html@^1.0.3** — used by this project via package.json.
- **etag@^1.8.1** — used by this project via package.json.
- **finalhandler@^2.1.0** — used by this project via package.json.

## Rules to Follow in This Repo
- Use CommonJS modules (require/module.exports) unless the folder already uses ESM.
- Use kebab-case file names to match the dominant project convention.
- Tests use Mocha — run npm run test before committing.
- No explicit linter detected — preserve existing formatting and style in touched files.
- Follow existing middleware ordering and route/module organization.

## Hot Spots (high git churn)
These files have the most git churn — they're actively evolving. Review recent changes before modifying.
- `.editorconfig` (1 commits)
- `.eslintignore` (1 commits)
- `.eslintrc.yml` (1 commits)
- `.github/dependabot.yml` (1 commits)
- `.github/workflows/ci.yml` (1 commits)
- `.github/workflows/codeql.yml` (1 commits)
- `.github/workflows/legacy.yml` (1 commits)
- `.github/workflows/scorecard.yml` (1 commits)
- `.gitignore` (1 commits)
- `.npmrc` (1 commits)

## Quick Start for AI Agents
- To understand this project, start by reading **index.js**.
- The core logic primarily lives in **lib**.
- Tests are in **test**.
- Before proposing changes, scan the hot spots section and mirror local patterns in nearby files.
