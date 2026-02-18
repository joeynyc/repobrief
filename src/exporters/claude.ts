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

export class ClaudeExporter implements Exporter {
  public readonly format = "claude";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, "CLAUDE.md");
    const tree = await buildShallowTree(context.rootDir, context.structure.keyDirectories);

    const content = `# CLAUDE.md — Project Context for Claude Code

${projectOneLiner(context)}

## File Tree (key directories, depth=2)
\`\`\`
${tree}
\`\`\`

## Architecture at a Glance
- Project shape: **${context.structure.projectType}**
- Framework: **${context.structure.detection.framework ?? "Unknown"}**
- Build system: **${context.structure.detection.buildSystem ?? "Unknown"}**
- Primary languages: **${context.structure.detection.languages.join(", ") || "Unknown"}**

## Entry Points and Responsibilities
${context.structure.entryPoints.map((entry) => `- \`${entry}\` — ${describeEntryPoint(entry, context)}`).join("\n") || "- No explicit entry points were detected."}

## Key Dependencies (what they do here)
${topDependencies(context, 12).map((dep) => `- **${dep.name}@${dep.version}** — ${describeDependency(dep)}.`).join("\n") || "- No runtime dependencies detected."}

## Rules to Follow in This Repo
${rulesToFollow(context).map((rule) => `- ${rule}`).join("\n")}
${frameworkGuidelines(context.structure.detection.framework).map((rule) => `- ${rule}`).join("\n")}

## Hot Spots (high git churn)
These files have the most git churn — they're actively evolving. Review recent changes before modifying.
${context.gitHistory.hotFiles.slice(0, 10).map((file) => `- \`${file.path}\` (${file.commits} commits)`).join("\n") || "- No git history available."}

## Quick Start for AI Agents
- To understand this project, start by reading **${context.structure.entryPoints[0] ?? "the main entry point under src/"}**.
- The core logic primarily lives in **${context.structure.keyDirectories[0] ?? "src/"}**.
- Tests are in **${context.structure.keyDirectories.find((dir) => dir === "tests" || dir === "test") ?? "the repository test directories"}**.
- Before proposing changes, scan the hot spots section and mirror local patterns in nearby files.
`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
