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

      if (allDeps.react || allDeps.next) framework = allDeps.next ? "Next.js" : "React";
      else if (allDeps.vue || allDeps.nuxt) framework = allDeps.nuxt ? "Nuxt" : "Vue";
      else if (allDeps.svelte || allDeps["@sveltejs/kit"]) framework = "Svelte";
      else if (allDeps.express) framework = "Express";
      else if (allDeps.nestjs || allDeps["@nestjs/core"]) framework = "NestJS";

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

  if (await exists(path.join(rootDir, "Cargo.toml"))) {
    buildSystem ??= "Cargo";
    const candidates = ["src/main.rs", "src/lib.rs"];
    for (const candidate of candidates) {
      if (await exists(path.join(rootDir, candidate))) entryPoints.add(candidate);
    }
  }

  if (await exists(path.join(rootDir, "go.mod"))) {
    buildSystem ??= "Go modules";
    if (await exists(path.join(rootDir, "main.go"))) entryPoints.add("main.go");
  }

  if (await exists(path.join(rootDir, "Package.swift"))) {
    buildSystem ??= "Swift Package Manager";
    if (await exists(path.join(rootDir, "main.swift"))) {
      entryPoints.add("main.swift");
    }
    try {
      const swiftPkg = await readFile(path.join(rootDir, "Package.swift"), "utf8");
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
