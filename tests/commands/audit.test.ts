import { afterEach, describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { promisify } from "node:util";
import { runAudit } from "../../src/commands/audit.js";
import { runInit } from "../../src/commands/init.js";
import type { RepoBriefContext } from "../../src/types.js";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];

async function makeTempProject(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "repobrief-audit-"));
  tempDirs.push(dir);
  await mkdir(path.join(dir, "src"), { recursive: true });
  await writeFile(
    path.join(dir, "package.json"),
    JSON.stringify(
      {
        name: "tmp-express",
        version: "1.0.0",
        type: "module",
        main: "src/index.ts",
        dependencies: { express: "^4.21.0" },
        devDependencies: { vitest: "^4.0.0" },
        scripts: { test: "vitest run", build: "tsc", lint: "eslint src/" }
      },
      null,
      2
    )
  );
  await writeFile(path.join(dir, "src", "index.ts"), "import express from \"express\";\nexport const app = express();\n");
  return dir;
}

function makeContext(overrides: Partial<RepoBriefContext> = {}): RepoBriefContext {
  return {
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
      dev: [{ name: "vitest", version: "^4.0.0", type: "dev", source: "package.json" }]
    },
    gitHistory: {
      hotFiles: [],
      recentCommits: [],
      contributors: [],
      totalCommits: 0
    },
    patterns: {
      namingConvention: "kebab-case",
      importStyle: "esm",
      errorHandling: ["throw new Error"],
      testingFramework: "Vitest",
      testCommand: "npm run test",
      lintersFormatters: ["ESLint"],
      ciCd: [],
      monorepoTooling: [],
      docker: []
    },
    ...overrides
  };
}

async function writeContextProject(context: RepoBriefContext): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "repobrief-audit-context-"));
  tempDirs.push(dir);
  await mkdir(path.join(dir, ".repobrief"), { recursive: true });
  await writeFile(path.join(dir, ".repobrief", "context.json"), JSON.stringify(context, null, 2));
  await writeFile(
    path.join(dir, ".repobrief", "architecture.md"),
    "# Architecture\n\n## Detection Sources\n- Languages are inferred from known manifest files.\n"
  );
  await writeFile(
    path.join(dir, ".repobrief", "patterns.md"),
    "# Patterns\n\n## Detection Notes\n- Tooling is inferred from package metadata.\n- Test command: npm run test\n"
  );
  await writeFile(path.join(dir, ".repobrief", "dependencies.md"), "# Dependencies\n\n- express@^4.21.0 (package.json)\n");
  await writeFile(path.join(dir, ".repobrief", "hotfiles.md"), "# Hot Files\n\n- No git history available\n");
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("runAudit", () => {
  it("scores fresh minimal generated context highly", async () => {
    const root = await makeTempProject();
    await runInit(root);

    const result = await runAudit(root, { write: false });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.passed).toBe(true);
  });

  it("fails with a helpful error when context is missing", async () => {
    const root = await makeTempProject();

    await expect(runAudit(root, { write: false })).rejects.toThrow("Run `repobrief init` first");
  });

  it("reports stale context when generatedAt is older than the latest commit", async () => {
    const root = await writeContextProject(makeContext({ generatedAt: "2000-01-01T00:00:00.000Z" }));
    await execFileAsync("git", ["init"], { cwd: root });
    await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    await execFileAsync("git", ["config", "user.name", "Test User"], { cwd: root });
    await writeFile(path.join(root, "README.md"), "hello\n");
    await execFileAsync("git", ["add", "."], { cwd: root });
    await execFileAsync("git", ["commit", "-m", "initial"], { cwd: root });

    const result = await runAudit(root, { write: false });

    expect(result.findings.map((finding) => finding.id)).toContain("freshness-stale-context");
  });

  it("reports generated docs that are too long", async () => {
    const root = await writeContextProject(makeContext());
    await writeFile(path.join(root, ".repobrief", "architecture.md"), Array.from({ length: 151 }, (_, i) => `line ${i}`).join("\n"));

    const result = await runAudit(root, { write: false });

    expect(result.findings.some((finding) => finding.category === "brevity")).toBe(true);
  });

  it("reports missing validation commands", async () => {
    const root = await writeContextProject(
      makeContext({
        patterns: {
          ...makeContext().patterns,
          testingFramework: null,
          testCommand: "run project tests"
        }
      })
    );

    const result = await runAudit(root, { write: false });

    expect(result.findings.map((finding) => finding.id)).toContain("validation-no-command");
  });

  it("reports over-prescriptive agent files", async () => {
    const root = await writeContextProject(makeContext());
    await writeFile(path.join(root, "AGENTS.md"), Array.from({ length: 30 }, () => "You must always do this.").join("\n"));

    const result = await runAudit(root, { write: false });

    expect(result.findings.map((finding) => finding.id)).toContain("actionability-too-prescriptive");
  });

  it("writes audit JSON and markdown artifacts by default", async () => {
    const root = await makeTempProject();
    await runInit(root);

    await runAudit(root);

    const json = JSON.parse(await readFile(path.join(root, ".repobrief", "audit.json"), "utf8")) as { score: number };
    const markdown = await readFile(path.join(root, ".repobrief", "audit.md"), "utf8");
    expect(json.score).toBeGreaterThanOrEqual(0);
    expect(markdown).toContain("# RepoBrief Audit");
  });
});
