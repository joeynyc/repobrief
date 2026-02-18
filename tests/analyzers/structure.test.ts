import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { StructureAnalyzer } from "../../src/analyzers/structure.js";

const tempDirs: string[] = [];

async function makeTempProject(packageJson: Record<string, unknown>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "repobrief-structure-"));
  tempDirs.push(dir);
  await writeFile(path.join(dir, "package.json"), JSON.stringify(packageJson, null, 2));
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("StructureAnalyzer", () => {
  it("detects JavaScript/TypeScript projects from package.json", async () => {
    const root = await makeTempProject({
      name: "tmp",
      version: "1.0.0",
      main: "src/index.ts",
      dependencies: { express: "^4.0.0" }
    });

    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src", "index.ts"), "export const ok = true;");

    const result = await new StructureAnalyzer().analyze(root);

    expect(result.data.detection.languages).toContain("JavaScript/TypeScript");
    expect(result.data.entryPoints).toContain("src/index.ts");
    expect(result.data.projectType).toBe("single");
  });
});
