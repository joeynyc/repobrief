import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { StructureAnalyzer } from "../analyzers/structure.js";
import { DependenciesAnalyzer } from "../analyzers/dependencies.js";
import { GitHistoryAnalyzer } from "../analyzers/git-history.js";
import { PatternsAnalyzer } from "../analyzers/patterns.js";
import { walkDir } from "../utils/fs.js";
import type { RepoBriefContext } from "../types.js";
import { writeRepoBriefFiles } from "./context-files.js";

export interface InitOptions {
  verbose?: boolean;
  onProgress?: (message: string) => void;
}

export interface InitResult {
  context: RepoBriefContext;
  filesAnalyzed: number;
  directoriesAnalyzed: number;
}

export async function runInit(rootDir: string, options: InitOptions = {}): Promise<InitResult> {
  const progress = options.onProgress;

  progress?.("Walking directory tree...");
  const allFiles = await walkDir(rootDir);

  progress?.("Running analyzers...");
  const [structure, dependencies, gitHistory, patterns] = await Promise.all([
    new StructureAnalyzer().analyze(rootDir, allFiles),
    new DependenciesAnalyzer().analyze(rootDir),
    new GitHistoryAnalyzer().analyze(rootDir),
    new PatternsAnalyzer().analyze(rootDir, allFiles)
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

  progress?.("Writing .repobrief/context.json...");
  await Promise.all([
    writeFile(path.join(repobriefDir, "context.json"), JSON.stringify(context, null, 2), "utf8"),
    writeRepoBriefFiles(context, repobriefDir)
  ]);

  const dirSet = new Set(allFiles.map((f) => path.dirname(f)).filter((d) => d !== "."));

  return {
    context,
    filesAnalyzed: allFiles.length,
    directoriesAnalyzed: dirSet.size
  };
}
