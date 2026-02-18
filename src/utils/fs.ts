import { stat, readFile } from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import type { FileStatSummary } from "../types.js";

function normalizeIgnorePatterns(patterns: string[]): string[] {
  const base = ["**/.git/**", "**/node_modules/**", "**/dist/**", "**/.codemap/**"];
  return [...base, ...patterns.filter((line) => line.length > 0 && !line.startsWith("#"))];
}

async function loadGitignore(root: string): Promise<string[]> {
  try {
    const content = await readFile(path.join(root, ".gitignore"), "utf8");
    return content.split(/\r?\n/).map((line) => line.trim());
  } catch {
    return [];
  }
}

export async function walkDir(root: string, ignorePatterns: string[] = []): Promise<string[]> {
  const gitignorePatterns = await loadGitignore(root);
  const ignore = normalizeIgnorePatterns([...ignorePatterns, ...gitignorePatterns]);

  const files = await glob("**/*", {
    cwd: root,
    nodir: true,
    dot: false,
    ignore,
    absolute: false
  });

  return files.sort((a, b) => a.localeCompare(b));
}

export async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function getFileStats(filePath: string): Promise<FileStatSummary> {
  try {
    const fileStat = await stat(filePath);
    return {
      exists: true,
      size: fileStat.size,
      modifiedAt: fileStat.mtime.toISOString()
    };
  } catch {
    return {
      exists: false,
      size: 0,
      modifiedAt: null
    };
  }
}
