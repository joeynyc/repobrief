import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext } from "../types.js";

function listOrFallback(items: string[], fallback: string): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : `- ${fallback}`;
}

function renderArchitecture(context: RepoBriefContext): string {
  return `# Architecture

- Project type: **${context.structure.projectType}**
- Languages: ${context.structure.detection.languages.join(", ") || "Unknown"}
- Framework: ${context.structure.detection.framework ?? "Unknown"}
- Build system: ${context.structure.detection.buildSystem ?? "Unknown"}

## Detection Sources
- Languages are inferred from known manifest files.
- Framework is inferred from package/dependency metadata when available.
- Entry points are inferred from package metadata and common runtime file names.

## Key Directories
${listOrFallback(context.structure.keyDirectories, "None detected")}

## Entry Points
${listOrFallback(context.structure.entryPoints, "None detected")}
`;
}

function renderDependencies(context: RepoBriefContext): string {
  const runtime = context.dependencies.runtime.map((dep) => `- ${dep.name}@${dep.version} (${dep.source})`);
  const dev = context.dependencies.dev.map((dep) => `- ${dep.name}@${dep.version} (${dep.source})`);

  return `# Dependencies

## Runtime
${runtime.join("\n") || "- None detected"}

## Dev
${dev.join("\n") || "- None detected"}
`;
}

function renderPatterns(context: RepoBriefContext): string {
  return `# Patterns

- Naming convention: **${context.patterns.namingConvention}**
- Import style: **${context.patterns.importStyle}**

## Detection Notes
- Naming convention is inferred from source file names.
- Import style is inferred from sampled source contents.
- Tooling is inferred from package metadata and config files.

## Error Handling
${listOrFallback(context.patterns.errorHandling, "None detected")}

## Development Environment
- Testing framework: ${context.patterns.testingFramework ?? "None detected"}
- Test command: ${context.patterns.testCommand}
- Linter/formatter: ${context.patterns.lintersFormatters.join(", ") || "None detected"}
- CI/CD: ${context.patterns.ciCd.join(", ") || "None detected"}
- Monorepo tooling: ${context.patterns.monorepoTooling.join(", ") || "None detected"}
- Docker: ${context.patterns.docker.join(", ") || "None detected"}
`;
}

function renderHotfiles(context: RepoBriefContext): string {
  const hotfiles = context.gitHistory.hotFiles.map((file) => `- ${file.path} (${file.commits} commits)`);
  const recentCommits = context.gitHistory.recentCommits
    .slice(0, 10)
    .map((commit) => `- ${commit.hash.slice(0, 7)} ${commit.message} (${commit.author}, ${commit.date})`);

  return `# Hot Files

These files have the most git churn in recent history. Review recent changes before editing them.

## High-Churn Files
${hotfiles.join("\n") || "- No git history available"}

## Recent Commits
${recentCommits.join("\n") || "- No git history available"}
`;
}

export async function writeRepoBriefFiles(context: RepoBriefContext, repobriefDir: string): Promise<void> {
  await Promise.all([
    writeFile(path.join(repobriefDir, "architecture.md"), renderArchitecture(context), "utf8"),
    writeFile(path.join(repobriefDir, "dependencies.md"), renderDependencies(context), "utf8"),
    writeFile(path.join(repobriefDir, "patterns.md"), renderPatterns(context), "utf8"),
    writeFile(path.join(repobriefDir, "hotfiles.md"), renderHotfiles(context), "utf8")
  ]);
}
