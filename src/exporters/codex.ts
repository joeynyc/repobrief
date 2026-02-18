import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, Exporter } from "../types.js";
import {
  buildShallowTree,
  describeDependency,
  describeEntryPoint,
  frameworkGuidelines,
  projectOneLiner,
  rulesToFollow,
  topDependencies
} from "./helpers.js";

export class CodexExporter implements Exporter {
  public readonly format = "codex";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, "AGENTS.md");
    const tree = await buildShallowTree(context.rootDir, context.structure.keyDirectories);

    const content = `# AGENTS.md

## Project Summary
${projectOneLiner(context)}

## Architecture
### File Tree (depth=2)
\`\`\`
${tree}
\`\`\`

### Entry Points
${context.structure.entryPoints.map((entry) => `- ${entry} — ${describeEntryPoint(entry, context)}`).join("\n") || "- None detected"}

### Key Directories
${context.structure.keyDirectories.map((dir) => `- ${dir}`).join("\n") || "- None detected"}

## Build and Validation Commands
- Build: npm run build
- Test: ${context.patterns.testCommand}
- Export context: repobrief export --format codex

## Dependencies That Matter
${topDependencies(context, 12).map((dep) => `- ${dep.name}@${dep.version} — ${describeDependency(dep)}`).join("\n") || "- None"}

## Conventions
${rulesToFollow(context).map((rule) => `- ${rule}`).join("\n")}
${frameworkGuidelines(context.structure.detection.framework).map((rule) => `- ${rule}`).join("\n")}

## High-Churn Areas
These files see frequent updates and may have evolving behavior:
${context.gitHistory.hotFiles.slice(0, 10).map((file) => `- ${file.path} (${file.commits} commits)`).join("\n") || "- No git history detected"}
`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
