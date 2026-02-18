import path from "node:path";
import type { Analyzer, AnalysisResult, DependenciesData, DependencyItem } from "../types.js";
import { readFileSafe } from "../utils/fs.js";

function parseRequirements(content: string, source: string, type: "runtime" | "dev"): DependencyItem[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const [name, version = "*"] = line.split(/==|>=|<=|~=|>|</);
      return { name: name.trim(), version: version.trim() || "*", type, source };
    });
}

function parseCargoToml(content: string, source: string): DependencyItem[] {
  const lines = content.split(/\r?\n/);
  const output: DependencyItem[] = [];
  let inDeps = false;
  let inDevDeps = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[dependencies]")) {
      inDeps = true;
      inDevDeps = false;
      continue;
    }
    if (trimmed.startsWith("[dev-dependencies]")) {
      inDeps = false;
      inDevDeps = true;
      continue;
    }
    if (trimmed.startsWith("[")) {
      inDeps = false;
      inDevDeps = false;
      continue;
    }

    if ((inDeps || inDevDeps) && trimmed.includes("=")) {
      const [name, rawVersion] = trimmed.split("=", 2);
      output.push({
        name: name.trim(),
        version: rawVersion.replaceAll('"', "").trim(),
        type: inDevDeps ? "dev" : "runtime",
        source
      });
    }
  }

  return output;
}

function parsePyprojectToml(content: string): { runtime: DependencyItem[]; dev: DependencyItem[] } {
  const runtime: DependencyItem[] = [];
  const dev: DependencyItem[] = [];
  const dependencyListRegex = /dependencies\s*=\s*\[([\s\S]*?)\]/m;
  const devListRegex = /\[project\.optional-dependencies\][\s\S]*?(?=\n\[|$)/m;

  const runtimeBlock = content.match(dependencyListRegex)?.[1] ?? "";
  for (const raw of runtimeBlock.split("\n")) {
    const cleaned = raw.replaceAll(/[",]/g, "").trim();
    if (!cleaned) continue;
    const [name, version = "*"] = cleaned.split(/==|>=|<=|~=|>|</);
    runtime.push({ name: name.trim(), version: version.trim() || "*", type: "runtime", source: "pyproject.toml" });
  }

  const devSection = content.match(devListRegex)?.[0] ?? "";
  const quoted = devSection.match(/"([^"]+)"/g) ?? [];
  for (const q of quoted) {
    const depSpec = q.replaceAll('"', "").trim();
    const [name, version = "*"] = depSpec.split(/==|>=|<=|~=|>|</);
    dev.push({ name: name.trim(), version: version.trim() || "*", type: "dev", source: "pyproject.toml" });
  }

  return { runtime, dev };
}

export class DependenciesAnalyzer implements Analyzer<DependenciesData> {
  public readonly name = "dependencies";

  async analyze(rootDir: string): Promise<AnalysisResult<DependenciesData>> {
    const runtime: DependencyItem[] = [];
    const dev: DependencyItem[] = [];

    const packageJson = await readFileSafe(path.join(rootDir, "package.json"));
    if (packageJson) {
      const pkg = JSON.parse(packageJson) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };

      for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
        runtime.push({ name, version, type: "runtime", source: "package.json" });
      }
      for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
        dev.push({ name, version, type: "dev", source: "package.json" });
      }
    }

    const cargoToml = await readFileSafe(path.join(rootDir, "Cargo.toml"));
    if (cargoToml) {
      const parsed = parseCargoToml(cargoToml, "Cargo.toml");
      for (const dep of parsed) {
        if (dep.type === "runtime") runtime.push(dep);
        else dev.push(dep);
      }
    }

    const requirements = await readFileSafe(path.join(rootDir, "requirements.txt"));
    if (requirements) {
      runtime.push(...parseRequirements(requirements, "requirements.txt", "runtime"));
    }

    const pyproject = await readFileSafe(path.join(rootDir, "pyproject.toml"));
    if (pyproject) {
      const parsed = parsePyprojectToml(pyproject);
      runtime.push(...parsed.runtime);
      dev.push(...parsed.dev);
    }

    const data: DependenciesData = {
      runtime: runtime.sort((a, b) => a.name.localeCompare(b.name)),
      dev: dev.sort((a, b) => a.name.localeCompare(b.name))
    };

    return {
      name: this.name,
      data,
      summary: `Found ${data.runtime.length} runtime and ${data.dev.length} dev dependencies`
    };
  }
}
