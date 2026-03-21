import path from "node:path";
import type { Analyzer, AnalysisResult, StructureData } from "../types.js";
import { detectProject, COMMON_ENTRY_POINTS } from "../utils/detection.js";
import { walkDir } from "../utils/fs.js";

const KEY_DIRS = ["src", "lib", "test", "tests", "apps", "packages", "services", "cmd", "Sources", "Tests", "api", "server"];

export class StructureAnalyzer implements Analyzer<StructureData> {
  public readonly name = "structure";

  async analyze(rootDir: string, prewalkedFiles?: string[]): Promise<AnalysisResult<StructureData>> {
    const detection = await detectProject(rootDir);
    const files = prewalkedFiles ?? await walkDir(rootDir);

    const presentDirs = KEY_DIRS.filter((dir) => files.some((file) => file.startsWith(`${dir}/`)));
    const hasPackagesDir = files.some((f) => f.startsWith("packages/"));
    const hasAppsDir = files.some((f) => f.startsWith("apps/"));
    const workspaceManifests = files.filter((f) => /(^|\/)package\.json$/.test(f)).length;

    const projectType: "single" | "monorepo" =
      hasPackagesDir || hasAppsDir || workspaceManifests > 1 ? "monorepo" : "single";

    const inferredEntries = files.filter((file) => COMMON_ENTRY_POINTS.has(file.toLowerCase()));

    const entryPoints = Array.from(new Set([...detection.entryPoints, ...inferredEntries]));

    const data: StructureData = {
      projectType,
      keyDirectories: presentDirs,
      entryPoints,
      detection
    };

    return {
      name: this.name,
      data,
      summary: `${projectType} ${detection.framework ?? "Unknown framework"} project with ${presentDirs.length} key directories and ${entryPoints.length} entry points`
    };
  }
}
