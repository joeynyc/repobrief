import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, Exporter } from "../types.js";

export class ClaudeExporter implements Exporter {
  public readonly format = "claude";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, "CLAUDE.md");

    const content = `# Project Instructions for Claude Code\n\n## Quick Context\n- Project type: ${context.structure.projectType}\n- Languages: ${context.structure.detection.languages.join(", ") || "Unknown"}\n- Framework: ${context.structure.detection.framework ?? "Unknown"}\n- Build system: ${context.structure.detection.buildSystem ?? "Unknown"}\n\n## Important Entry Points\n${context.structure.entryPoints.map((entry) => `- ${entry}`).join("\n") || "- None detected"}\n\n## Code Patterns to Follow\n- Naming convention: ${context.patterns.namingConvention}\n- Import style: ${context.patterns.importStyle}\n- Error handling patterns: ${context.patterns.errorHandling.join(", ") || "Not clearly established"}\n\n## Dependency Highlights\nRuntime:\n${context.dependencies.runtime.slice(0, 20).map((dep) => `- ${dep.name}@${dep.version}`).join("\n") || "- None"}\n\nDev:\n${context.dependencies.dev.slice(0, 20).map((dep) => `- ${dep.name}@${dep.version}`).join("\n") || "- None"}\n\n## High-Churn Files (review before major changes)\n${
      context.gitHistory.hotFiles.slice(0, 15).map((file) => `- ${file.path} (${file.commits} commits)`).join("\n") || "- No git history available"
    }\n`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
