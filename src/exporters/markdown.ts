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

export class MarkdownExporter implements Exporter {
  public readonly format = "markdown";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, "CODEMAP.md");
    const tree = await buildShallowTree(context.rootDir, context.structure.keyDirectories);

    const content = `# RepoBrief Context

Generated: ${context.generatedAt}

## One-Line Summary
${projectOneLiner(context)}

## Repository Shape
- Project type: ${context.structure.projectType}
- Framework: ${context.structure.detection.framework ?? "Unknown"}
- Build: ${context.structure.detection.buildSystem ?? "Unknown"}
- Languages: ${context.structure.detection.languages.join(", ") || "Unknown"}

## File Tree (key directories only)
\`\`\`
${tree}
\`\`\`

## Entry Points
${context.structure.entryPoints.map((entry) => `- ${entry} — ${describeEntryPoint(entry, context)}`).join("\n") || "- None detected"}

## Key Dependencies
${topDependencies(context, 12).map((dep) => `- ${dep.name}@${dep.version} — ${describeDependency(dep)}`).join("\n") || "- None detected"}

## Coding Rules and Conventions
${rulesToFollow(context).map((rule) => `- ${rule}`).join("\n")}
${frameworkGuidelines(context.structure.detection.framework).map((rule) => `- ${rule}`).join("\n")}

## Hot Spots
These files have high git churn and are likely still evolving. Review recent changes before touching them.
${context.gitHistory.hotFiles.slice(0, 10).map((file) => `- ${file.path} (${file.commits} commits)`).join("\n") || "- No git data available"}

## Suggested Onboarding Path
1. Start with ${context.structure.entryPoints[0] ?? "the main app entry point"}.
2. Read core implementation files in ${context.structure.keyDirectories[0] ?? "src"}.
3. Review tests in ${context.structure.keyDirectories.find((dir) => dir === "tests" || dir === "test") ?? "test directories"}.
4. Run ${context.patterns.testCommand} before and after modifications.
`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
