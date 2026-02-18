import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, Exporter } from "../types.js";
import { describeDependency, formatProjectOverview, frameworkGuidelines, topDependencies } from "./helpers.js";

export class CodexExporter implements Exporter {
  public readonly format = "codex";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, "AGENTS.md");

    const content = `# AGENTS.md

## Project Overview
- ${formatProjectOverview(context)}

## Architecture
- Entry points:
${context.structure.entryPoints.map((entry) => `  - ${entry}`).join("\n") || "  - None"}
- Key directories:
${context.structure.keyDirectories.map((dir) => `  - ${dir}`).join("\n") || "  - None"}

## Code Conventions
- Naming convention: ${context.patterns.namingConvention}
- Import style: ${context.patterns.importStyle}
- Testing framework: ${context.patterns.testingFramework ?? "unknown"}
- Linting/formatting: ${context.patterns.lintersFormatters.join(", ") || "not configured"}

## Key Dependencies
${topDependencies(context, 10).map((dep) => `- ${dep.name}@${dep.version} — ${describeDependency(dep)}`).join("\n") || "- None"}

## Hot Spots
${context.gitHistory.hotFiles.slice(0, 10).map((file) => `- ${file.path} (${file.commits} commits)`).join("\n") || "- None"}

## Guidelines
- Run ${context.patterns.testCommand} before committing
- Follow established patterns in ${context.structure.keyDirectories.slice(0, 3).join(", ") || "core directories"}
${frameworkGuidelines(context.structure.detection.framework).map((line) => `- ${line}`).join("\n")}
`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
