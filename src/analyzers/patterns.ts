import path from "node:path";
import type { Analyzer, AnalysisResult, PatternsData } from "../types.js";
import { readFileSafe, walkDir } from "../utils/fs.js";

function detectNamingConvention(files: string[]): PatternsData["namingConvention"] {
  let camel = 0;
  let snake = 0;
  let kebab = 0;

  for (const file of files) {
    const base = path.basename(file, path.extname(file));
    if (/^[a-z]+(?:[A-Z][a-z0-9]*)+$/.test(base)) camel += 1;
    else if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(base)) snake += 1;
    else if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(base)) kebab += 1;
  }

  const max = Math.max(camel, snake, kebab);
  if (max === 0) return "mixed";
  const winners = [camel, snake, kebab].filter((count) => count === max).length;
  if (winners > 1) return "mixed";
  if (max === camel) return "camelCase";
  if (max === snake) return "snake_case";
  return "kebab-case";
}

function detectImportStyle(contents: string[]): PatternsData["importStyle"] {
  let esm = 0;
  let commonjs = 0;
  for (const content of contents) {
    if (/^\s*import\s.+from\s+['"]/m.test(content) || /^\s*export\s/m.test(content)) esm += 1;
    if (/\brequire\(['"].+['"]\)/.test(content) || /module\.exports\s*=/.test(content)) commonjs += 1;
  }

  if (esm > 0 && commonjs === 0) return "esm";
  if (commonjs > 0 && esm === 0) return "commonjs";
  if (esm > 0 && commonjs > 0) return "mixed";
  return "unknown";
}

function detectErrorPatterns(contents: string[]): string[] {
  const found = new Set<string>();
  for (const content of contents) {
    if (/try\s*{[\s\S]*?}\s*catch\s*\(/m.test(content)) found.add("try/catch");
    if (/\.catch\s*\(/.test(content)) found.add("Promise.catch");
    if (/throw\s+new\s+Error\s*\(/.test(content)) found.add("throw new Error");
    if (/console\.error\s*\(/.test(content)) found.add("console.error logging");
  }
  return [...found];
}

function detectTestingFramework(
  packageDeps: Record<string, string>,
  files: string[],
  contentSamples: string[]
): { framework: string | null; testCommand: string } {
  if (Object.hasOwn(packageDeps, "vitest")) return { framework: "Vitest", testCommand: "npm run test" };
  if (Object.hasOwn(packageDeps, "jest")) return { framework: "Jest", testCommand: "npm run test" };
  if (Object.hasOwn(packageDeps, "mocha")) return { framework: "Mocha", testCommand: "npm run test" };
  if (Object.hasOwn(packageDeps, "@playwright/test")) return { framework: "Playwright Test", testCommand: "npx playwright test" };

  const hasPytest = contentSamples.some((s) => /\bpytest\b/i.test(s)) || files.some((f) => /(^|\/)test_.*\.py$/.test(f));
  if (hasPytest) return { framework: "pytest", testCommand: "pytest" };

  const hasXCTest = contentSamples.some((s) => /\bXCTest\b/.test(s)) || files.some((f) => /Tests?\.swift$/.test(f));
  if (hasXCTest) return { framework: "XCTest", testCommand: "xcodebuild test" };

  const hasNodeTests = files.some((f) => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f));
  if (hasNodeTests) return { framework: "JavaScript tests", testCommand: "npm run test" };

  return { framework: null, testCommand: "run project tests" };
}

export class PatternsAnalyzer implements Analyzer<PatternsData> {
  public readonly name = "patterns";

  async analyze(rootDir: string): Promise<AnalysisResult<PatternsData>> {
    const files = await walkDir(rootDir, ["**/*.min.js", "**/*.lock"]);
    const sourceFiles = files.filter((file) => /\.(ts|tsx|js|jsx|py|rs|go|swift)$/i.test(file)).slice(0, 300);

    const contents: string[] = [];
    for (const file of sourceFiles.slice(0, 80)) {
      const content = await readFileSafe(path.join(rootDir, file));
      if (content) contents.push(content.slice(0, 25_000));
    }

    const packageJsonRaw = await readFileSafe(path.join(rootDir, "package.json"));
    const pkg = packageJsonRaw
      ? (JSON.parse(packageJsonRaw) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
          scripts?: Record<string, string>;
        })
      : null;
    const deps = {
      ...(pkg?.dependencies ?? {}),
      ...(pkg?.devDependencies ?? {})
    };

    const requirements = (await readFileSafe(path.join(rootDir, "requirements.txt"))) ?? "";
    const pyproject = (await readFileSafe(path.join(rootDir, "pyproject.toml"))) ?? "";

    const testDetection = detectTestingFramework(deps, files, [...contents, requirements, pyproject]);

    const lintersFormatters = [
      [".eslintrc", "ESLint"],
      [".eslintrc.js", "ESLint"],
      [".eslintrc.cjs", "ESLint"],
      [".eslintrc.json", "ESLint"],
      ["eslint.config.js", "ESLint"],
      ["eslint.config.mjs", "ESLint"],
      [".prettierrc", "Prettier"],
      [".prettierrc.js", "Prettier"],
      [".prettierrc.json", "Prettier"],
      ["prettier.config.js", "Prettier"],
      ["biome.json", "Biome"],
      ["rustfmt.toml", "rustfmt"],
      ["swiftlint.yml", "SwiftLint"]
    ].flatMap(([config, name]) => (files.includes(config) ? [name] : []));

    const ciCd = [
      [".gitlab-ci.yml", "GitLab CI"],
      ["Jenkinsfile", "Jenkins"],
      [".circleci/config.yml", "CircleCI"]
    ].flatMap(([f, name]) => (files.includes(f) ? [name] : []));

    if (files.some((f) => f.startsWith(".github/workflows/"))) ciCd.push("GitHub Actions");

    const monorepoTooling = [
      ["lerna.json", "Lerna"],
      ["nx.json", "Nx"],
      ["turbo.json", "Turborepo"],
      ["pnpm-workspace.yaml", "pnpm workspaces"]
    ].flatMap(([f, name]) => (files.includes(f) ? [name] : []));

    const docker = ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"].filter((f) => files.includes(f));

    const data: PatternsData = {
      namingConvention: detectNamingConvention(sourceFiles),
      importStyle: detectImportStyle(contents),
      errorHandling: detectErrorPatterns(contents),
      testingFramework: testDetection.framework,
      testCommand: pkg?.scripts?.test ? "npm run test" : testDetection.testCommand,
      lintersFormatters: Array.from(new Set(lintersFormatters)),
      ciCd: Array.from(new Set(ciCd)),
      monorepoTooling: Array.from(new Set(monorepoTooling)),
      docker
    };

    return {
      name: this.name,
      data,
      summary: `Naming: ${data.namingConvention}, imports: ${data.importStyle}, tests: ${data.testingFramework ?? "unknown"}`
    };
  }
}
