import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { detectProject } from "../../src/utils/detection.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("detectProject", () => {
  it("detects languages from known manifests", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "repobrief-detect-"));
    tempDirs.push(dir);

    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp", version: "1.0.0" }));
    await writeFile(path.join(dir, "requirements.txt"), "flask==3.0.0\n");
    await writeFile(path.join(dir, "go.mod"), "module example.com/test\n");

    const result = await detectProject(dir);

    expect(result.languages).toContain("JavaScript/TypeScript");
    expect(result.languages).toContain("Python");
    expect(result.languages).toContain("Go");
  });
});
