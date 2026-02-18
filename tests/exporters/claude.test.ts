import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { ClaudeExporter } from "../../src/exporters/claude.js";
import type { RepoBriefContext } from "../../src/types.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("ClaudeExporter", () => {
  it("writes rich markdown with architecture, rules, and quick-start sections", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "repobrief-claude-"));
    tempDirs.push(dir);

    await mkdir(path.join(dir, "src"), { recursive: true });
    await writeFile(path.join(dir, "package.json"), "{}", "utf8");
    await writeFile(path.join(dir, "src", "index.ts"), "export {}", "utf8");

    const context: RepoBriefContext = {
      generatedAt: new Date().toISOString(),
      rootDir: dir,
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
        contributors: [],
        totalCommits: 5
      },
      patterns: {
        namingConvention: "camelCase",
        importStyle: "esm",
        errorHandling: ["try/catch"],
        testingFramework: "Vitest",
        testCommand: "npm run test",
        lintersFormatters: ["ESLint"],
        ciCd: ["GitHub Actions"],
        monorepoTooling: [],
        docker: ["Dockerfile"]
      }
    };

    const outPath = await new ClaudeExporter().export(context, dir);
    const md = await readFile(outPath, "utf8");

    expect(md.startsWith("# CLAUDE.md — Project Context for Claude Code")).toBe(true);
    expect(md).toContain("This is a Express backend service project built with");
    expect(md).toContain("## File Tree (key directories, depth=2)");
    expect(md).toContain("## Entry Points and Responsibilities");
    expect(md).toContain("## Key Dependencies (what they do here)");
    expect(md).toContain("**express@^4.21.0**");
    expect(md).toContain("## Rules to Follow in This Repo");
    expect(md).toContain("## Quick Start for AI Agents");
    expect(path.basename(outPath)).toBe("CLAUDE.md");
  });
});
