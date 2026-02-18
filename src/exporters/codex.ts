import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, Exporter } from "../types.js";

export class CodexExporter implements Exporter {
  public readonly format = "codex";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, "AGENTS.md");

    const content = `# AGENTS.md\n\n## Project Context\n- Type: ${context.structure.projectType}\n- Languages: ${context.structure.detection.languages.join(", ") || "Unknown"}\n- Framework: ${context.structure.detection.framework ?? "Unknown"}\n- Build system: ${context.structure.detection.buildSystem ?? "Unknown"}\n\n## Entry Points\n${context.structure.entryPoints.map((entry) => `- ${entry}`).join("\n") || "- None"}\n\n## Code Conventions\n- Naming style: ${context.patterns.namingConvention}\n- Imports: ${context.patterns.importStyle}\n- Error handling patterns: ${context.patterns.errorHandling.join(", ") || "None detected"}\n\n## Dependency Snapshot\n- Runtime deps: ${context.dependencies.runtime.length}\n- Dev deps: ${context.dependencies.dev.length}\n\n## Hot Files\n${
      context.gitHistory.hotFiles.slice(0, 20).map((file) => `- ${file.path} (${file.commits} commits)`).join("\n") || "- Not available"
    }\n`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
