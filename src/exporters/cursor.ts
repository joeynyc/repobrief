import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, Exporter } from "../types.js";
import { describeDependency, formatProjectOverview, frameworkGuidelines, topDependencies } from "./helpers.js";

export class CursorExporter implements Exporter {
  public readonly format = "cursor";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, ".cursorrules");

    const content = `Project Overview:
- ${formatProjectOverview(context)}

Architecture:
- Entry points: ${context.structure.entryPoints.join(", ") || "none detected"}
- Key directories: ${context.structure.keyDirectories.join(", ") || "none detected"}

Code Conventions:
- Naming: ${context.patterns.namingConvention}
- Imports: ${context.patterns.importStyle}
- Testing: ${context.patterns.testingFramework ?? "unknown"}
- Linting: ${context.patterns.lintersFormatters.join(", ") || "not configured"}

Important Dependencies:
${topDependencies(context, 10).map((dep) => `- ${dep.name}@${dep.version}: ${describeDependency(dep)}`).join("\n") || "- none"}

High-Churn Files:
${context.gitHistory.hotFiles.slice(0, 10).map((f) => `- ${f.path}`).join("\n") || "- unavailable"}

Execution Guidance:
- Validate changes with ${context.patterns.testCommand}
- Prefer existing patterns from ${context.structure.keyDirectories.slice(0, 3).join(", ") || "source folders"}
${frameworkGuidelines(context.structure.detection.framework).map((line) => `- ${line}`).join("\n")}
`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
