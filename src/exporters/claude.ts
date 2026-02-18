import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, Exporter } from "../types.js";
import { describeDependency, formatProjectOverview, frameworkGuidelines, topDependencies } from "./helpers.js";

export class ClaudeExporter implements Exporter {
  public readonly format = "claude";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, "CLAUDE.md");

    const content = `# CLAUDE.md — Project Context for Claude Code

## Project Overview
${formatProjectOverview(context)}

## Architecture
- Entry points:
${context.structure.entryPoints.map((entry) => `  - ${entry}`).join("\n") || "  - None detected"}
- Key directories:
${context.structure.keyDirectories.map((dir) => `  - ${dir}`).join("\n") || "  - None detected"}

## Code Conventions
- Follow ${context.patterns.namingConvention} naming where applicable
- Use ${context.patterns.importStyle} module style
- Tests use ${context.patterns.testingFramework ?? "unknown framework"}
- Linting: ${context.patterns.lintersFormatters.join(", ") || "not clearly configured"}

## Key Dependencies
${topDependencies(context, 10).map((dep) => `- ${dep.name}@${dep.version} — ${describeDependency(dep)}`).join("\n") || "- None"}

## Hot Spots
These files change most often — review carefully before modifying:
${
      context.gitHistory.hotFiles.slice(0, 10).map((file) => `- ${file.path} (${file.commits} commits)`).join("\n") || "- No git history available"
    }

## Guidelines
- Check existing patterns in ${context.structure.keyDirectories.slice(0, 3).join(", ") || "source directories"} before adding new code
- Run ${context.patterns.testCommand} before committing
${frameworkGuidelines(context.structure.detection.framework).map((line) => `- ${line}`).join("\n") || "- Follow repository conventions for framework-specific changes"}
`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
