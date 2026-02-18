import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext } from "../types.js";
import { runInit } from "./init.js";

function summarizeDiff(previous: RepoBriefContext, next: RepoBriefContext): string[] {
  const changes: string[] = [];

  if (previous.structure.projectType !== next.structure.projectType) {
    changes.push(`Project type changed: ${previous.structure.projectType} -> ${next.structure.projectType}`);
  }

  if (previous.structure.entryPoints.join("|") !== next.structure.entryPoints.join("|")) {
    changes.push("Entry points changed");
  }

  if (previous.dependencies.runtime.length !== next.dependencies.runtime.length) {
    changes.push(
      `Runtime dependency count changed: ${previous.dependencies.runtime.length} -> ${next.dependencies.runtime.length}`
    );
  }

  if (previous.dependencies.dev.length !== next.dependencies.dev.length) {
    changes.push(`Dev dependency count changed: ${previous.dependencies.dev.length} -> ${next.dependencies.dev.length}`);
  }

  if (previous.patterns.importStyle !== next.patterns.importStyle) {
    changes.push(`Import style changed: ${previous.patterns.importStyle} -> ${next.patterns.importStyle}`);
  }

  return changes;
}

export async function runUpdate(rootDir: string): Promise<{ context: RepoBriefContext; diff: string[] }> {
  const contextPath = path.join(rootDir, ".repobrief", "context.json");
  let previous: RepoBriefContext | null = null;

  try {
    const raw = await readFile(contextPath, "utf8");
    previous = JSON.parse(raw) as RepoBriefContext;
  } catch {
    previous = null;
  }

  const context = await runInit(rootDir);
  const diff = previous ? summarizeDiff(previous, context) : ["No previous context found; created fresh context."];

  await writeFile(contextPath, JSON.stringify(context, null, 2), "utf8");
  return { context, diff };
}
