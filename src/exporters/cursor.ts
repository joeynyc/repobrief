import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, Exporter } from "../types.js";
import { describeDependency, frameworkGuidelines, projectOneLiner, rulesToFollow, topDependencies } from "./helpers.js";

export class CursorExporter implements Exporter {
  public readonly format = "cursor";

  async export(context: RepoBriefContext, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });
    const outPath = path.join(outputDir, ".cursorrules");

    const content = `# Project Intent
${projectOneLiner(context)}

# Architecture
- Entry points: ${context.structure.entryPoints.join(", ") || "none detected"}
- Core directories: ${context.structure.keyDirectories.join(", ") || "none detected"}
- Framework: ${context.structure.detection.framework ?? "unknown"}

# Rules
${rulesToFollow(context).map((rule) => `- ${rule}`).join("\n")}
${frameworkGuidelines(context.structure.detection.framework).map((rule) => `- ${rule}`).join("\n")}

# Dependencies
${topDependencies(context, 10).map((dep) => `- ${dep.name}: ${describeDependency(dep)}`).join("\n") || "- none"}

# Hot Files
These files change frequently; inspect recent commits before editing:
${context.gitHistory.hotFiles.slice(0, 8).map((f) => `- ${f.path} (${f.commits} commits)`).join("\n") || "- unavailable"}

# Validation
- Run ${context.patterns.testCommand}
- Keep changes scoped and consistent with local file conventions
`;

    await writeFile(outPath, content, "utf8");
    return outPath;
  }
}
