import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, Exporter } from "../types.js";

export class MarkdownExporter implements Exporter {
  public readonly format = "markdown";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, "CODEMAP.md");

    const content = `# RepoBrief Context\n\nGenerated: ${context.generatedAt}\n\n## Structure\n- Type: ${context.structure.projectType}\n- Languages: ${context.structure.detection.languages.join(", ") || "Unknown"}\n- Framework: ${context.structure.detection.framework ?? "Unknown"}\n- Build: ${context.structure.detection.buildSystem ?? "Unknown"}\n\n## Entry Points\n${context.structure.entryPoints.map((entry) => `- ${entry}`).join("\n") || "- None"}\n\n## Dependencies\n### Runtime\n${
      context.dependencies.runtime.map((dep) => `- ${dep.name}@${dep.version}`).join("\n") || "- None"
    }\n\n### Dev\n${context.dependencies.dev.map((dep) => `- ${dep.name}@${dep.version}`).join("\n") || "- None"}\n\n## Patterns\n- Naming: ${context.patterns.namingConvention}\n- Imports: ${context.patterns.importStyle}\n- Error handling: ${context.patterns.errorHandling.join(", ") || "None detected"}\n\n## Git Hot Files\n${
      context.gitHistory.hotFiles.map((file) => `- ${file.path} (${file.commits})`).join("\n") || "- No git data"
    }\n`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
