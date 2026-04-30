import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createProgram } from "../src/cli.js";

interface PackageMetadata {
  version: string;
}

describe("CLI metadata", () => {
  it("reports the package.json version", async () => {
    const packageJson = JSON.parse(await readFile(path.resolve("package.json"), "utf8")) as PackageMetadata;

    expect(createProgram().version()).toBe(packageJson.version);
  });
});
