import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { PatternsAnalyzer } from "../../src/analyzers/patterns.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("PatternsAnalyzer", () => {
  it("detects dominant snake_case naming convention", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "repobrief-patterns-"));
    tempDirs.push(dir);

    await mkdir(path.join(dir, "src"), { recursive: true });
    await writeFile(path.join(dir, "src", "user_service.ts"), "export const user_service = true;");
    await writeFile(path.join(dir, "src", "order_processor.ts"), "export const order_processor = true;");
    await writeFile(path.join(dir, "src", "misc-file.ts"), "export const x = 1;");

    const result = await new PatternsAnalyzer().analyze(dir);

    expect(result.data.namingConvention).toBe("snake_case");
  });
});
