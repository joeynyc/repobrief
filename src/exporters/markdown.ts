import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, Exporter } from "../types.js";
import { describeDependency, formatProjectOverview, frameworkGuidelines, topDependencies } from "./helpers.js";

export class MarkdownExporter implements Exporter {
  public readonly format = "markdown";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, "CODEMAP.md");

    const content = `# RepoBrief Context

Generated: ${context.generatedAt}

## Project Overview
${formatProjectOverview(context)}

## Architecture
### Entry Points
${context.structure.entryPoints.map((entry) => `- ${entry}`).join("\n") || "- None"}

### Key Directories
${context.structure.keyDirectories.map((dir) => `- ${dir}`).join("\n") || "- None"}

## Code Conventions
- Naming: ${context.patterns.namingConvention}
- Imports: ${context.patterns.importStyle}
- Tests: ${context.patterns.testingFramework ?? "Unknown"}
- Linting: ${context.patterns.lintersFormatters.join(", ") || "None detected"}

## Key Dependencies
${topDependencies(context, 10).map((dep) => `- ${dep.name}@${dep.version} — ${describeDependency(dep)}`).join("\n") || "- None"}

## Hot Spots
${context.gitHistory.hotFiles.slice(0, 10).map((file) => `- ${file.path} (${file.commits} commits)`).join("\n") || "- No git data"}

## Guidelines
- Run ${context.patterns.testCommand} before committing
- Check conventions in ${context.structure.keyDirectories.slice(0, 3).join(", ") || "source directories"}
${frameworkGuidelines(context.structure.detection.framework).map((line) => `- ${line}`).join("\n")}
`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
