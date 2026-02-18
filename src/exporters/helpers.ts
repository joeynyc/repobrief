import type { RepoBriefContext, DependencyItem } from "../types.js";

const DEP_DESCRIPTIONS: Record<string, string> = {
  react: "UI library for building component-based web interfaces.",
  "react-dom": "DOM renderer for React applications.",
  next: "Full-stack React framework with routing and SSR/SSG.",
  express: "Minimal web framework for Node.js APIs and services.",
  vite: "Fast frontend build tool and dev server.",
  vitest: "Vite-native unit test framework.",
  jest: "JavaScript testing framework with snapshots and mocks.",
  typescript: "Static type checker and compiler for JavaScript.",
  commander: "CLI argument parser and command framework.",
  chalk: "Terminal string styling and colors.",
  "simple-git": "Promise-friendly wrapper around the Git CLI.",
  glob: "File path pattern matching utility.",
  handlebars: "Template engine for text generation.",
  ora: "Terminal spinner utility for progress feedback."
};

export function formatProjectOverview(context: RepoBriefContext): string {
  const type = context.structure.projectType;
  const framework = context.structure.detection.framework ?? "Unknown framework";
  const build = context.structure.detection.buildSystem ?? "unknown build system";
  return `${type} ${framework} project using ${build}`;
}

export function topDependencies(context: RepoBriefContext, limit = 10): DependencyItem[] {
  return context.dependencies.runtime.slice(0, limit);
}

export function describeDependency(dep: DependencyItem): string {
  return DEP_DESCRIPTIONS[dep.name] ?? `Dependency from ${dep.source}.`;
}

export function frameworkGuidelines(framework: string | null): string[] {
  if (!framework) return [];

  const map: Record<string, string[]> = {
    "Next.js": ["Prefer app/router conventions already used in this repository."],
    React: ["Keep components small and co-locate tests when existing patterns do so."],
    Express: ["Follow existing middleware and route organization patterns."],
    "Nest.js": ["Maintain module/provider/controller structure for new features."],
    FastAPI: ["Use Pydantic models and typed route handlers consistently."],
    Django: ["Follow app-level boundaries and use migrations for schema changes."],
    Tauri: ["Keep Rust backend commands and frontend invocations in sync."],
    Gin: ["Follow existing route grouping and middleware conventions."]
  };

  return map[framework] ?? [`Follow established ${framework} project conventions in this repository.`];
}
