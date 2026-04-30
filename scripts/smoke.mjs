import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();
const cliPath = path.join(repoRoot, "bin", "repobrief.js");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "repobrief-smoke-"));

async function runCli(args) {
  return execFileAsync(process.execPath, [cliPath, ...args], { cwd: tempDir });
}

async function expectFile(filePath) {
  await access(filePath);
}

try {
  await mkdir(path.join(tempDir, "src"), { recursive: true });
  await writeFile(
    path.join(tempDir, "package.json"),
    JSON.stringify(
      {
        name: "repobrief-smoke-app",
        version: "1.0.0",
        type: "module",
        main: "src/index.ts",
        dependencies: { express: "^4.21.0" },
        devDependencies: { vitest: "^4.0.0" },
        scripts: { test: "vitest run", build: "tsc" }
      },
      null,
      2
    )
  );
  await writeFile(path.join(tempDir, "src", "index.ts"), "import express from \"express\";\nexport const app = express();\n");

  const version = await runCli(["--version"]);
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
  if (version.stdout.trim() !== packageJson.version) {
    throw new Error(`Expected CLI version ${packageJson.version}, got ${version.stdout.trim()}`);
  }

  await runCli(["init"]);
  for (const fileName of ["context.json", "architecture.md", "dependencies.md", "patterns.md", "hotfiles.md"]) {
    await expectFile(path.join(tempDir, ".repobrief", fileName));
  }

  await runCli(["export", "--format", "codex"]);
  await expectFile(path.join(tempDir, "AGENTS.md"));

  await runCli(["update"]);
  console.log("Smoke test passed");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
