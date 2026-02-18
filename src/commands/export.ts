import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, Exporter } from "../types.js";
import { ClaudeExporter } from "../exporters/claude.js";
import { CursorExporter } from "../exporters/cursor.js";
import { CodexExporter } from "../exporters/codex.js";
import { MarkdownExporter } from "../exporters/markdown.js";

function getExporter(format: string): Exporter {
  const formatToExporter: Record<string, Exporter> = {
    claude: new ClaudeExporter(),
    cursor: new CursorExporter(),
    codex: new CodexExporter(),
    markdown: new MarkdownExporter()
  };

  const exporter = formatToExporter[format];
  if (!exporter) {
    throw new Error(`Unsupported export format: ${format}. Use one of: claude, cursor, codex, markdown.`);
  }
  return exporter;
}

export async function runExport(rootDir: string, format: string): Promise<string> {
  const contextPath = path.join(rootDir, ".repobrief", "context.json");
  let contextRaw: string;

  try {
    contextRaw = await readFile(contextPath, "utf8");
  } catch {
    throw new Error("Missing .repobrief/context.json. Run `repobrief init` first.");
  }

  let context: RepoBriefContext;
  try {
    context = JSON.parse(contextRaw) as RepoBriefContext;
  } catch {
    throw new Error("Invalid .repobrief/context.json. Re-run `repobrief init` to regenerate it.");
  }

  const exporter = getExporter(format);
  return exporter.export(context, rootDir);
}
