# codemap — Universal Codebase Context Engine

## What This Is
A CLI tool that auto-generates and maintains a living codebase context map that any AI coding tool can consume. Solves the #1 pain point in AI-assisted development: context loss.

## Architecture
```
src/
  cli.ts              — Commander-based CLI entry point
  commands/
    init.ts           — `codemap init` — scan repo, generate .codemap/
    update.ts         — `codemap update` — incremental rescan
    export.ts         — `codemap export --format <target>`
    query.ts          — `codemap query "question"` — search the index
  analyzers/
    structure.ts      — Project structure detection (monorepo, framework, build system)
    patterns.ts       — Code convention detection (naming, imports, error handling)
    dependencies.ts   — Dependency analysis (package.json, Podfile, requirements.txt, etc.)
    git-history.ts    — Git log analysis (hotfiles, churn, contributors)
  exporters/
    claude.ts         — Export to CLAUDE.md format
    cursor.ts         — Export to .cursorrules format
    codex.ts          — Export to AGENTS.md format
    markdown.ts       — Universal markdown export
  utils/
    fs.ts             — File system helpers
    detection.ts      — Language/framework detection
    templates.ts      — Handlebars template loading
templates/
  claude.hbs          — Claude export template
  cursor.hbs          — Cursor export template
  codex.hbs           — Codex export template
  markdown.hbs        — Generic markdown template
tests/
  analyzers/          — Unit tests for each analyzer
  exporters/          — Unit tests for each exporter
  commands/           — Integration tests for CLI commands
```

## Tech Decisions
- **TypeScript + Node.js** — npm distribution, `npx codemap init`
- **tree-sitter** — NOT in v0.1 (too heavy). Use regex + heuristics for pattern detection. Add tree-sitter in v0.2.
- **simple-git** — Git history analysis
- **Commander** — CLI framework
- **Handlebars** — Export templates
- **Storage** — JSON + Markdown files in `.codemap/` directory (no database)

## Coding Standards
- Strict TypeScript, no `any`
- Functional where possible, classes for analyzers
- All analyzers implement a common `Analyzer` interface: `analyze(rootDir: string): Promise<AnalysisResult>`
- All exporters implement `Exporter` interface: `export(context: CodemapContext, outputDir: string): Promise<void>`
- Error messages should be helpful — tell the user what went wrong AND what to do about it

## v0.1 Scope
1. `codemap init` — detect structure, deps, git history, basic patterns → write .codemap/
2. `codemap export --format claude|cursor|codex|markdown` — generate tool-specific context files
3. `codemap update` — re-run analysis, diff against previous
4. Support: Node.js, Python, Swift/Xcode, Rust, Go projects (detect by manifest files)

## Out of Scope (v0.1)
- `codemap query` (v0.2)
- tree-sitter AST parsing (v0.2)
- Cloud sync / team features (v0.3)
- CI/CD integration (v0.3)
