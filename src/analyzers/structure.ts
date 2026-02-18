import path from "node:path";
import type { Analyzer, AnalysisResult, StructureData } from "../types.js";
import { detectProject } from "../utils/detection.js";
import { walkDir } from "../utils/fs.js";

const KEY_DIRS = ["src", "lib", "test", "tests", "apps", "packages", "services", "cmd", "Sources", "Tests", "api", "server"];

export class StructureAnalyzer implements Analyzer<StructureData> {
  public readonly name = "structure";

  async analyze(rootDir: string): Promise<AnalysisResult<StructureData>> {
    const detection = await detectProject(rootDir);
    const files = await walkDir(rootDir);

    const presentDirs = KEY_DIRS.filter((dir) => files.some((file) => file.startsWith(`${dir}/`)));
    const hasPackagesDir = files.some((f) => f.startsWith("packages/"));
    const hasAppsDir = files.some((f) => f.startsWith("apps/"));
    const workspaceManifests = files.filter((f) => /(^|\/)package\.json$/.test(f)).length;

    const projectType: "single" | "monorepo" =
      hasPackagesDir || hasAppsDir || workspaceManifests > 1 ? "monorepo" : "single";

    const inferredEntries = files.filter((file) => {
      const normalized = file.toLowerCase();
      return (
        normalized === "src/index.ts" ||
        normalized === "src/cli.ts" ||
        normalized === "src/main.ts" ||
        normalized === "index.ts" ||
        normalized === "index.js" ||
        normalized === "src/index.js" ||
        normalized === "src/app.ts" ||
        normalized === "src/app.js" ||
        normalized === "app.ts" ||
        normalized === "app.js" ||
        normalized === "main.swift" ||
        normalized === "__main__.py" ||
        normalized === "main.py" ||
        normalized === "main.go" ||
        normalized === "src/main.rs" ||
        normalized === "src/lib.rs" ||
        normalized === "sources/app/main.swift" ||
        normalized === "sources/run/main.swift" ||
        normalized === "sources/main.swift" ||
        normalized === "cmd/main.go"
      );
    });

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
