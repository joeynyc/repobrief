import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, Exporter } from "../types.js";

export class CursorExporter implements Exporter {
  public readonly format = "cursor";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, ".cursorrules");

    const content = `You are working in a ${context.structure.projectType} repository.
Languages: ${context.structure.detection.languages.join(", ") || "Unknown"}.
Framework: ${context.structure.detection.framework ?? "Unknown"}. Build: ${context.structure.detection.buildSystem ?? "Unknown"}.

Conventions to follow:
- Naming: ${context.patterns.namingConvention}
- Module style: ${context.patterns.importStyle}
- Error handling: ${context.patterns.errorHandling.join(", ") || "not strongly established"}

Likely entry points:
${context.structure.entryPoints.map((entry) => `- ${entry}`).join("\n") || "- none"}

High-churn files (be careful when editing):
${context.gitHistory.hotFiles.slice(0, 10).map((file) => `- ${file.path}`).join("\n") || "- unavailable"}
`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
