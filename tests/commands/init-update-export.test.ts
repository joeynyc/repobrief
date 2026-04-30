import { afterEach, describe, expect, it } from "vitest";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { runExport } from "../../src/commands/export.js";
import { runInit } from "../../src/commands/init.js";
import { runUpdate } from "../../src/commands/update.js";

const tempDirs: string[] = [];

async function makeTempProject(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "repobrief-command-"));
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
        scripts: { test: "vitest run", build: "tsc" }
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile(path.join(dir, "src", "index.ts"), "import express from \"express\";\nexport const app = express();\n");
  return dir;
}

async function expectFileExists(filePath: string): Promise<void> {
  await expect(access(filePath)).resolves.toBeUndefined();
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("command workflows", () => {
  it("init writes context JSON and the promised markdown files", async () => {
    const root = await makeTempProject();

    const result = await runInit(root);

    expect(result.filesAnalyzed).toBe(2);
    expect(result.context.structure.detection.framework).toBe("Express");

    for (const fileName of ["context.json", "architecture.md", "dependencies.md", "patterns.md", "hotfiles.md"]) {
      await expectFileExists(path.join(root, ".repobrief", fileName));
    }

    const dependencies = await readFile(path.join(root, ".repobrief", "dependencies.md"), "utf8");
    expect(dependencies).toContain("express@^4.21.0");
  });

  it("update refreshes generated context files and reports high-level diffs", async () => {
    const root = await makeTempProject();
    await runInit(root);

    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify(
        {
          name: "tmp-express",
          version: "1.0.0",
          dependencies: { express: "^4.21.0", zod: "^3.23.0" },
          devDependencies: { vitest: "^4.0.0" },
          scripts: { test: "vitest run" }
        },
        null,
        2
      ),
      "utf8"
    );

    const result = await runUpdate(root);

    expect(result.diff).toContain("Runtime dependency count changed: 1 -> 2");
    const dependencies = await readFile(path.join(root, ".repobrief", "dependencies.md"), "utf8");
    expect(dependencies).toContain("zod@^3.23.0");
  });

  it("exports every supported target format", async () => {
    const root = await makeTempProject();
    await runInit(root);

    const outputs = await Promise.all([
      runExport(root, "claude"),
      runExport(root, "cursor"),
      runExport(root, "codex"),
      runExport(root, "markdown")
    ]);

    expect(outputs.map((out) => path.basename(out)).sort()).toEqual([".cursorrules", "AGENTS.md", "CLAUDE.md", "CODEMAP.md"]);
  });

  it("returns helpful export errors for missing, invalid, and unsupported context", async () => {
    const root = await makeTempProject();

    await expect(runExport(root, "claude")).rejects.toThrow("Run `repobrief init` first");

    await mkdir(path.join(root, ".repobrief"), { recursive: true });
    await writeFile(path.join(root, ".repobrief", "context.json"), "{ invalid", "utf8");
    await expect(runExport(root, "claude")).rejects.toThrow("Re-run `repobrief init`");

    await runInit(root);
    await expect(runExport(root, "unknown")).rejects.toThrow("Unsupported export format");
  });
});
