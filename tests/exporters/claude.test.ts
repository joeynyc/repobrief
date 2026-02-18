import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { ClaudeExporter } from "../../src/exporters/claude.js";
import type { RepoBriefContext } from "../../src/types.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("ClaudeExporter", () => {
  it("writes valid markdown with expected sections", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "repobrief-claude-"));
    tempDirs.push(dir);

    const context: RepoBriefContext = {
      generatedAt: new Date().toISOString(),
      rootDir: "/tmp/project",
      structure: {
        projectType: "single",
        keyDirectories: ["src"],
        entryPoints: ["src/index.ts"],
        detection: {
          languages: ["JavaScript/TypeScript"],
          framework: "Express",
          buildSystem: "npm scripts",
          entryPoints: ["src/index.ts"]
        }
      },
      dependencies: {
        runtime: [{ name: "express", version: "^4.21.0", type: "runtime", source: "package.json" }],
        dev: [{ name: "vitest", version: "^3.0.0", type: "dev", source: "package.json" }]
      },
      gitHistory: {
        hotFiles: [{ path: "src/index.ts", commits: 5 }],
        recentCommits: [],
        contributors: []
      },
      patterns: {
        namingConvention: "camelCase",
        importStyle: "esm",
        errorHandling: ["try/catch"]
      }
    };

    const outPath = await new ClaudeExporter().export(context, dir);
    const md = await readFile(outPath, "utf8");

    expect(md.startsWith("# Project Instructions for Claude Code")).toBe(true);
    expect(md).toContain("## Quick Context");
    expect(md).toContain("## Dependency Highlights");
    expect(md).toContain("- express@^4.21.0");
    expect(path.basename(outPath)).toBe("CLAUDE.md");
  });
});
