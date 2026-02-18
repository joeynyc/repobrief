import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { ProjectDetection } from "../types.js";

const manifestToLanguage: Array<{ file: string; language: string }> = [
  { file: "package.json", language: "JavaScript/TypeScript" },
  { file: "Cargo.toml", language: "Rust" },
  { file: "Package.swift", language: "Swift" },
  { file: "go.mod", language: "Go" },
  { file: "requirements.txt", language: "Python" },
  { file: "pyproject.toml", language: "Python" },
  { file: "Gemfile", language: "Ruby" },
  { file: "pom.xml", language: "Java" }
];

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function depExists(deps: Record<string, string>, ...names: string[]): boolean {
  return names.some((name) => Object.hasOwn(deps, name));
}

function detectJsFramework(deps: Record<string, string>): string | null {
  if (depExists(deps, "next")) return "Next.js";
  if (depExists(deps, "@nestjs/core", "@nestjs/common")) return "Nest.js";
  if (depExists(deps, "express")) return "Express";
  if (depExists(deps, "fastify")) return "Fastify";
  if (depExists(deps, "hono")) return "Hono";
  if (depExists(deps, "react", "react-dom")) return "React";
  if (depExists(deps, "vue", "@vue/runtime-core", "nuxt")) return "Vue";
  if (depExists(deps, "@angular/core")) return "Angular";
  if (depExists(deps, "svelte", "@sveltejs/kit")) return "Svelte";
  if (depExists(deps, "astro")) return "Astro";
  return null;
}

function detectByPackageName(name: string | undefined): string | null {
  const normalized = (name ?? "").toLowerCase();
  if (normalized === "express" || normalized.includes("express")) return "Express";
  if (normalized === "fastify" || normalized.includes("fastify")) return "Fastify";
  if (normalized.includes("flask")) return "Flask";
  if (normalized.includes("fastapi")) return "FastAPI";
  if (normalized.includes("next")) return "Next.js";
  return null;
}

function detectPythonFramework(content: string): string | null {
  const normalized = content.toLowerCase();
  if (normalized.includes("fastapi")) return "FastAPI";
  if (normalized.includes("starlette")) return "Starlette";
  if (normalized.includes("django")) return "Django";
  if (normalized.includes("flask")) return "Flask";
  return null;
}

function detectRustFramework(content: string): string | null {
  const lower = content.toLowerCase();
  if (lower.includes("tauri")) return "Tauri";
  if (lower.includes("axum")) return "Axum";
  if (lower.includes("actix-web") || lower.includes("actix")) return "Actix";
  if (lower.includes("rocket")) return "Rocket";
  return null;
}

function detectGoFramework(content: string): string | null {
  const lower = content.toLowerCase();
  if (lower.includes("github.com/gin-gonic/gin")) return "Gin";
  if (lower.includes("github.com/labstack/echo")) return "Echo";
  if (lower.includes("github.com/gofiber/fiber")) return "Fiber";
  if (lower.includes("github.com/go-chi/chi")) return "Chi";
  return null;
}

function detectSwiftFramework(content: string): string | null {
  const lower = content.toLowerCase();
  if (lower.includes("vapor")) return "Vapor";
  if (lower.includes("swiftui") || /import\s+swiftui/.test(content)) return "SwiftUI";
  return null;
}

export async function detectProject(rootDir: string): Promise<ProjectDetection> {
  const languages = new Set<string>();
  let framework: string | null = null;
  let buildSystem: string | null = null;
  const entryPoints = new Set<string>();

  await Promise.all(
    manifestToLanguage.map(async ({ file, language }) => {
      if (await exists(path.join(rootDir, file))) {
        languages.add(language);
      }
    })
  );

  const packageJsonPath = path.join(rootDir, "package.json");
  if (await exists(packageJsonPath)) {
    try {
      const raw = await readFile(packageJsonPath, "utf8");
      const pkg = JSON.parse(raw) as {
        name?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        scripts?: Record<string, string>;
        main?: string;
        module?: string;
        bin?: string | Record<string, string>;
      };
      const allDeps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {})
      };

      framework ??= detectJsFramework(allDeps);
      framework ??= detectByPackageName(pkg.name);

      if ((pkg.scripts?.build ?? "").includes("vite") || allDeps.vite) buildSystem = "Vite";
      else if (allDeps.webpack) buildSystem = "Webpack";
      else if (allDeps.turbo) buildSystem = "Turborepo";
      else if (pkg.scripts?.build) buildSystem = "npm scripts";

      if (pkg.main) entryPoints.add(pkg.main);
      if (pkg.module) entryPoints.add(pkg.module);
      if (typeof pkg.bin === "string") entryPoints.add(pkg.bin);
      else if (pkg.bin && typeof pkg.bin === "object") {
        Object.values(pkg.bin).forEach((binPath) => {
          if (typeof binPath === "string") entryPoints.add(binPath);
        });
      }
    } catch {
      // Keep detection resilient; malformed package.json should not crash init.
    }
  }

  if (await exists(path.join(rootDir, "requirements.txt"))) {
    const req = await readFile(path.join(rootDir, "requirements.txt"), "utf8").catch(() => "");
    framework ??= detectPythonFramework(req);
  }

  if (await exists(path.join(rootDir, "pyproject.toml"))) {
    const pyproject = await readFile(path.join(rootDir, "pyproject.toml"), "utf8").catch(() => "");
    framework ??= detectPythonFramework(pyproject);
  }

  if (await exists(path.join(rootDir, "Cargo.toml"))) {
    buildSystem ??= "Cargo";
    const cargoToml = await readFile(path.join(rootDir, "Cargo.toml"), "utf8").catch(() => "");
    framework ??= detectRustFramework(cargoToml);

    const candidates = ["src/main.rs", "src/lib.rs"];
    for (const candidate of candidates) {
      if (await exists(path.join(rootDir, candidate))) entryPoints.add(candidate);
    }
  }

  if (await exists(path.join(rootDir, "go.mod"))) {
    buildSystem ??= "Go modules";
    const goMod = await readFile(path.join(rootDir, "go.mod"), "utf8").catch(() => "");
    framework ??= detectGoFramework(goMod);
    if (await exists(path.join(rootDir, "main.go"))) entryPoints.add("main.go");
  }

  if (await exists(path.join(rootDir, "Package.swift"))) {
    buildSystem ??= "Swift Package Manager";
    try {
      const swiftPkg = await readFile(path.join(rootDir, "Package.swift"), "utf8");
      framework ??= detectSwiftFramework(swiftPkg);
      if (await exists(path.join(rootDir, "main.swift"))) {
        entryPoints.add("main.swift");
      }
      if (/\@main\b/.test(swiftPkg)) {
        entryPoints.add("Package.swift (@main)");
      }
    } catch {
      // Ignore read/parse issues and continue detection.
    }
  }

  if ((await exists(path.join(rootDir, "pyproject.toml"))) || (await exists(path.join(rootDir, "requirements.txt")))) {
    buildSystem ??= "pip/pyproject";
    const pyCandidates = ["__main__.py", "main.py", "app.py", "manage.py"];
    for (const candidate of pyCandidates) {
      if (await exists(path.join(rootDir, candidate))) entryPoints.add(candidate);
    }
  }

  const commonEntries = [
    "src/index.ts",
    "src/cli.ts",
    "src/main.ts",
    "index.ts",
    "index.js",
    "src/index.js",
    "src/app.ts",
    "src/app.js",
    "app.ts",
    "app.js"
  ];
  for (const candidate of commonEntries) {
    if (await exists(path.join(rootDir, candidate))) entryPoints.add(candidate);
  }

  return {
    languages: [...languages],
    framework,
    buildSystem,
    entryPoints: [...entryPoints]
  };
}
