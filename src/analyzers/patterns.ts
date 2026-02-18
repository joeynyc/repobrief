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

export class PatternsAnalyzer implements Analyzer<PatternsData> {
  public readonly name = "patterns";

  async analyze(rootDir: string): Promise<AnalysisResult<PatternsData>> {
    const files = await walkDir(rootDir, ["**/*.min.js", "**/*.lock"]);
    const sourceFiles = files.filter((file) => /\.(ts|tsx|js|jsx|py|rs|go)$/i.test(file)).slice(0, 300);

    const contents: string[] = [];
    for (const file of sourceFiles.slice(0, 80)) {
      const content = await readFileSafe(path.join(rootDir, file));
      if (content) contents.push(content.slice(0, 25_000));
    }

    const data: PatternsData = {
      namingConvention: detectNamingConvention(sourceFiles),
      importStyle: detectImportStyle(contents),
      errorHandling: detectErrorPatterns(contents)
    };

    return {
      name: this.name,
      data,
      summary: `Naming: ${data.namingConvention}, imports: ${data.importStyle}, error patterns: ${data.errorHandling.length}`
    };
  }
}
