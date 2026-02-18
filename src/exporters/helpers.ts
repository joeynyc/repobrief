import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import type { RepoBriefContext, DependencyItem } from "../types.js";

const DEP_DESCRIPTIONS: Record<string, string> = {
  react: "drives the component-based UI layer",
  "react-dom": "renders React components into the browser DOM",
  next: "provides the app framework, routing, and server rendering",
  express: "powers the HTTP server and route handling",
  vite: "handles fast local development and production bundling",
  vitest: "runs unit/integration tests in the JS/TS toolchain",
  jest: "runs tests and snapshot assertions",
  typescript: "provides static typing and TS transpilation",
  commander: "powers the CLI command interface",
  chalk: "adds terminal colors for clearer CLI output",
  "simple-git": "collects git history and churn insights",
  glob: "scans and filters files by patterns",
  handlebars: "renders text templates for generated outputs",
  ora: "shows spinner/progress states in CLI flows",
  fastify: "powers high-performance HTTP routes and plugins",
  flask: "provides the Python web app and route layer",
  fastapi: "powers typed Python APIs with OpenAPI support",
  pydantic: "defines validated request/response schemas",
  uvicorn: "runs the ASGI app in development/production",
  django: "provides batteries-included web framework structure"
};

const TREE_SKIP = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
  ".repobrief",
  "test-results"
]);

const IMPORTANT_ROOT_FILES = [
  "README.md",
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "Gemfile",
  "Dockerfile"
];

export function formatProjectOverview(context: RepoBriefContext): string {
  const type = context.structure.projectType;
  const framework = context.structure.detection.framework ?? "Unknown framework";
  const build = context.structure.detection.buildSystem ?? "unknown build system";
  return `${type} ${framework} project using ${build}`;
}

function inferProjectType(context: RepoBriefContext): string {
  const entries = context.structure.entryPoints.map((entry) => entry.toLowerCase());
  const deps = new Set(context.dependencies.runtime.map((dep) => dep.name.toLowerCase()));

  if (entries.some((entry) => entry.includes("cli")) || deps.has("commander")) return "CLI";
  if (deps.has("next") || deps.has("react") || deps.has("vue") || deps.has("svelte")) return "web application";
  if (deps.has("express") || deps.has("fastify") || deps.has("fastapi") || deps.has("flask")) return "backend service";
  if (context.structure.projectType === "monorepo") return "monorepo";
  return "software";
}

export function projectOneLiner(context: RepoBriefContext): string {
  const framework = context.structure.detection.framework ?? "general-purpose";
  const projectType = inferProjectType(context);
  const keyTech = [
    context.structure.detection.buildSystem,
    context.patterns.testingFramework,
    ...context.dependencies.runtime.slice(0, 2).map((dep) => dep.name)
  ].filter((part): part is string => Boolean(part));

  const techSummary = keyTech.length > 0 ? keyTech.join(", ") : "its existing toolchain";
  return `This is a ${framework} ${projectType} project built with ${techSummary}.`;
}

export function topDependencies(context: RepoBriefContext, limit = 10): DependencyItem[] {
  return context.dependencies.runtime.slice(0, limit);
}

export function describeDependency(dep: DependencyItem): string {
  return DEP_DESCRIPTIONS[dep.name] ?? `used by this project via ${dep.source}`;
}

export function describeEntryPoint(entry: string, context: RepoBriefContext): string {
  const lower = entry.toLowerCase();
  const framework = context.structure.detection.framework;

  if (lower.includes("cli")) return "CLI bootstrap — parses commands/options and dispatches command handlers.";
  if (lower.endsWith("main.py") || lower.endsWith("__main__.py")) return "Python runtime entry — starts the app/service process.";
  if (lower.endsWith("main.swift")) return "Swift app entry — initializes the app runtime and routes.";
  if (lower.endsWith("main.go")) return "Go service entry — wires server setup and startup.";
  if (framework === "Next.js") return "Framework entry surface for routing/render lifecycle.";
  if (framework === "Express" || framework === "Fastify") return "Server entry — configures middleware/plugins and mounts routes.";
  if (framework === "FastAPI" || framework === "Flask") return "API entry — registers routes and request handling.";
  return "Primary application entry point for runtime startup.";
}

function namingRule(name: RepoBriefContext["patterns"]["namingConvention"]): string {
  if (name === "kebab-case") return "Use kebab-case file names to match the dominant project convention.";
  if (name === "snake_case") return "Use snake_case naming where applicable to match existing code style.";
  if (name === "camelCase") return "Use camelCase naming for new symbols/files where feasible.";
  return "Naming is mixed — follow the local convention in each folder before introducing new files.";
}

export function rulesToFollow(context: RepoBriefContext): string[] {
  const importRule =
    context.patterns.importStyle === "esm"
      ? "Use ESM imports/exports, not CommonJS require/module.exports."
      : context.patterns.importStyle === "commonjs"
        ? "Use CommonJS modules (require/module.exports) unless the folder already uses ESM."
        : "Module style is mixed — copy the import/export style used in the file you are editing.";

  return [
    importRule,
    namingRule(context.patterns.namingConvention),
    `Tests use ${context.patterns.testingFramework ?? "the detected test stack"} — run ${context.patterns.testCommand} before committing.`,
    context.patterns.lintersFormatters.length > 0
      ? `Respect lint/format tooling: ${context.patterns.lintersFormatters.join(", ")}.`
      : "No explicit linter detected — preserve existing formatting and style in touched files."
  ];
}

export function frameworkGuidelines(framework: string | null): string[] {
  if (!framework) return [];

  const map: Record<string, string[]> = {
    "Next.js": ["Follow app/pages router boundaries already used in this repository."],
    React: ["Keep components focused and colocate related UI logic when patterns do so."],
    Express: ["Follow existing middleware ordering and route/module organization."],
    "Nest.js": ["Keep module/provider/controller separation consistent."],
    FastAPI: ["Prefer typed route signatures and Pydantic models for request/response shapes."],
    Django: ["Respect app boundaries and migration workflow for schema changes."],
    Tauri: ["Keep Rust command definitions aligned with frontend invocations."],
    Gin: ["Follow established route grouping and middleware practices."],
    Flask: ["Match existing blueprint and app-factory patterns if present."]
  };

  return map[framework] ?? [`Follow established ${framework} conventions already present in this repo.`];
}

export async function buildShallowTree(rootDir: string, keyDirs: string[]): Promise<string> {
  const lines: string[] = ["."];
  let entries: Dirent[];
  try {
    entries = await readdir(rootDir, { withFileTypes: true });
  } catch {
    return ".\n└── (unable to read repository tree at export time)";
  }
  const dirs = entries
    .filter((entry) => entry.isDirectory() && !TREE_SKIP.has(entry.name))
    .map((entry) => entry.name)
    .filter((name) => keyDirs.includes(name) || ["src", "app", "apps", "packages", "lib", "tests", "test", "docs", "scripts"].includes(name))
    .sort();

  const files = entries
    .filter((entry) => entry.isFile() && IMPORTANT_ROOT_FILES.includes(entry.name))
    .map((entry) => entry.name)
    .sort();

  for (const file of files) lines.push(`├── ${file}`);

  for (let i = 0; i < dirs.length; i += 1) {
    const dir = dirs[i]!;
    const isLast = i === dirs.length - 1;
    const branch = isLast ? "└──" : "├──";
    const childPrefix = isLast ? "    " : "│   ";
    lines.push(`${branch} ${dir}/`);

    const children = await readdir(path.join(rootDir, dir), { withFileTypes: true });
    const childNames = children
      .filter((child) => !TREE_SKIP.has(child.name))
      .map((child) => (child.isDirectory() ? `${child.name}/` : child.name))
      .filter((name) => !name.startsWith("."))
      .sort()
      .slice(0, 8);

    for (let c = 0; c < childNames.length; c += 1) {
      const child = childNames[c]!;
      const childBranch = c === childNames.length - 1 ? "└──" : "├──";
      lines.push(`${childPrefix}${childBranch} ${child}`);
    }
  }

  return lines.join("\n");
}
