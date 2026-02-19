# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build        # compile TypeScript → dist/
npm run dev          # run CLI via tsx (no build step)
npm run test         # run all tests with Vitest
npm run lint         # ESLint on src/
npx vitest run tests/exporters/claude.test.ts  # run a single test file
```

To test the CLI locally without installing: `node --import tsx/esm src/cli.ts <command>`

## Architecture

`repobrief` is a CLI tool that analyzes a Git repository and generates codebase context files for AI coding agents. It has three commands: `init`, `export`, and `update`.

### Data flow

```
repobrief init
  → 4 Analyzers run in sequence (structure → dependencies → git-history → patterns)
  → writes .repobrief/{architecture,dependencies,patterns,hotfiles}.md + context.json

repobrief export --format <claude|cursor|codex|markdown>
  → reads .repobrief/context.json
  → passes RepoBriefContext to the matching Exporter
  → writes the output file (e.g. CLAUDE.md, .cursorrules)

repobrief update
  → re-runs init and computes a text diff between old and new context.json
```

### Key interfaces (`src/types.ts`)

- `Analyzer<T>` — `analyze(rootDir): Promise<AnalysisResult<T>>`. Each analyzer is a class implementing this.
- `Exporter` — `export(context, outputDir): Promise<string>`. Each export format is a class implementing this.
- `RepoBriefContext` — the canonical data shape assembled by `runInit` and consumed by all exporters.

### Source layout

| Path | Responsibility |
|---|---|
| `src/cli.ts` | Commander.js wiring; three subcommands |
| `src/commands/` | `runInit`, `runExport`, `runUpdate` — orchestration logic |
| `src/analyzers/` | `StructureAnalyzer`, `DependenciesAnalyzer`, `GitHistoryAnalyzer`, `PatternsAnalyzer` |
| `src/exporters/` | One class per output format; `helpers.ts` has shared formatting utilities |
| `src/utils/detection.ts` | Heuristic project/language/framework detection |
| `src/utils/fs.ts` | `walkDir` — recursive file walker that respects common ignore patterns |

### Adding a new exporter

1. Create `src/exporters/<name>.ts` implementing `Exporter`.
2. Register it in the `formatToExporter` map in `src/commands/export.ts`.

### Adding a new analyzer

1. Create `src/analyzers/<name>.ts` implementing `Analyzer<YourDataType>`.
2. Add the corresponding field to `RepoBriefContext` in `src/types.ts`.
3. Call it in `runInit` (`src/commands/init.ts`) and include its data in the assembled context.

## Conventions

- ESM only (`"type": "module"`). Use `.js` extensions in imports even for `.ts` source files.
- Tests create real temp directories (`mkdtemp`) and clean up in `afterEach`. Mirror this pattern for new exporter/analyzer tests.
- `dist/` is the published artifact — never import from `dist/` in source; always import from `src/`.
