import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { DependenciesAnalyzer } from "../../src/analyzers/dependencies.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("DependenciesAnalyzer", () => {
  it("parses runtime and dev deps from package.json", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "repobrief-deps-"));
    tempDirs.push(dir);

    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          version: "1.0.0",
          dependencies: { express: "^4.21.0", zod: "^3.0.0" },
          devDependencies: { vitest: "^3.0.0" }
        },
        null,
        2
      )
    );

    const result = await new DependenciesAnalyzer().analyze(dir);

    expect(result.data.runtime.map((d) => d.name)).toEqual(["express", "zod"]);
    expect(result.data.dev.map((d) => d.name)).toEqual(["vitest"]);
  });
});
