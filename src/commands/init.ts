import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { StructureAnalyzer } from "../analyzers/structure.js";
import { DependenciesAnalyzer } from "../analyzers/dependencies.js";
import { GitHistoryAnalyzer } from "../analyzers/git-history.js";
import { PatternsAnalyzer } from "../analyzers/patterns.js";
import type { RepoBriefContext } from "../types.js";

function renderArchitecture(context: RepoBriefContext): string {
  const { structure } = context;
  return `# Architecture\n\n- Project type: **${structure.projectType}**\n- Languages: ${structure.detection.languages.join(", ") || "Unknown"}\n- Framework: ${structure.detection.framework ?? "Unknown"}\n- Build system: ${structure.detection.buildSystem ?? "Unknown"}\n\n## Key directories\n${
    structure.keyDirectories.map((dir) => `- ${dir}`).join("\n") || "- None detected"
  }\n\n## Entry points\n${structure.entryPoints.map((entry) => `- ${entry}`).join("\n") || "- None detected"}\n`;
}

function renderDependencies(context: RepoBriefContext): string {
  return `# Dependencies\n\n## Runtime\n${
    context.dependencies.runtime.map((dep) => `- ${dep.name}@${dep.version} (${dep.source})`).join("\n") || "- None"
  }\n\n## Dev\n${context.dependencies.dev.map((dep) => `- ${dep.name}@${dep.version} (${dep.source})`).join("\n") || "- None"}\n`;
}

function renderPatterns(context: RepoBriefContext): string {
  return `# Patterns\n\n- Naming convention: **${context.patterns.namingConvention}**\n- Import style: **${context.patterns.importStyle}**\n\n## Error handling\n${
    context.patterns.errorHandling.map((pattern) => `- ${pattern}`).join("\n") || "- None detected"
  }\n`;
}

function renderHotfiles(context: RepoBriefContext): string {
  return `# Hot Files\n\n${
    context.gitHistory.hotFiles.map((file) => `- ${file.path} (${file.commits} commits)`).join("\n") || "- No history available"
  }\n`;
}

export async function runInit(rootDir: string): Promise<RepoBriefContext> {
  const [structure, dependencies, gitHistory, patterns] = await Promise.all([
    new StructureAnalyzer().analyze(rootDir),
    new DependenciesAnalyzer().analyze(rootDir),
    new GitHistoryAnalyzer().analyze(rootDir),
    new PatternsAnalyzer().analyze(rootDir)
  ]);

  const context: RepoBriefContext = {
    generatedAt: new Date().toISOString(),
    rootDir,
    structure: structure.data,
    dependencies: dependencies.data,
    gitHistory: gitHistory.data,
    patterns: patterns.data
  };

  const repobriefDir = path.join(rootDir, ".repobrief");
  await mkdir(repobriefDir, { recursive: true });

  await Promise.all([
    writeFile(path.join(repobriefDir, "architecture.md"), renderArchitecture(context), "utf8"),
    writeFile(path.join(repobriefDir, "dependencies.md"), renderDependencies(context), "utf8"),
    writeFile(path.join(repobriefDir, "patterns.md"), renderPatterns(context), "utf8"),
    writeFile(path.join(repobriefDir, "hotfiles.md"), renderHotfiles(context), "utf8"),
    writeFile(path.join(repobriefDir, "context.json"), JSON.stringify(context, null, 2), "utf8")
  ]);

  return context;
}
