#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import chalk from "chalk";
import { Command } from "commander";
import { runAudit } from "./commands/audit.js";
import { runInit } from "./commands/init.js";
import { runExport } from "./commands/export.js";
import { runUpdate } from "./commands/update.js";

interface PackageMetadata {
  version?: string;
}

const packageMetadata = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as PackageMetadata;

function parseThreshold(value: string): number {
  const threshold = Number(value);
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100) {
    throw new Error("Threshold must be an integer from 0 to 100.");
  }
  return threshold;
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("repobrief")
    .description("Universal codebase context engine for AI coding agents")
    .version(packageMetadata.version ?? "0.0.0");

  program
    .command("init")
    .description("Scan repository and generate .repobrief context files")
    .option("--verbose", "show analyzer progress")
    .option("--json", "print generated context JSON to stdout")
    .action(async (options: { verbose?: boolean; json?: boolean }) => {
      const rootDir = process.cwd();
      try {
        const result = await runInit(rootDir, {
          verbose: options.verbose,
          onProgress: options.verbose ? (message) => console.log(chalk.yellow(`→ ${message}`)) : undefined
        });

        const { context } = result;
        const runtimeDepCount = context.dependencies.runtime.length;
        const totalDeps = runtimeDepCount + context.dependencies.dev.length;
        const language = context.structure.detection.languages[0] ?? "Unknown";
        const framework = context.structure.detection.framework ?? "Unknown";
        const totalCommits = context.gitHistory.totalCommits;

        console.log(
          chalk.green(
            `✓ Analyzed ${result.filesAnalyzed} files across ${result.directoriesAnalyzed} directories. Found: ${language}/${framework} project with ${totalDeps} deps, ${totalCommits} git commits.`
          )
        );
        console.log(chalk.green(`✓ RepoBrief initialized at ${path.join(rootDir, ".repobrief")}`));

        if (options.json) {
          console.log(JSON.stringify(context, null, 2));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(chalk.yellow(`⚠ Failed to initialize repobrief: ${message}`));
        process.exitCode = 1;
      }
    });

  program
    .command("export")
    .description("Export repobrief context for a target AI coding tool")
    .requiredOption("-f, --format <target>", "Target format: claude|cursor|codex|markdown")
    .action(async (options: { format: string }) => {
      const rootDir = process.cwd();
      try {
        const outputPath = await runExport(rootDir, options.format);
        console.log(chalk.green(`✓ Export completed: ${outputPath}`));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(chalk.yellow(`⚠ Export failed: ${message}`));
        process.exitCode = 1;
      }
    });

  program
    .command("update")
    .description("Re-run analysis and show a high-level diff")
    .option("--verbose", "show analyzer progress")
    .action(async (options: { verbose?: boolean }) => {
      const rootDir = process.cwd();
      try {
        const result = await runUpdate(rootDir, {
          verbose: options.verbose,
          onProgress: options.verbose ? (message) => console.log(chalk.yellow(`→ ${message}`)) : undefined
        });
        console.log(chalk.green("✓ RepoBrief updated."));
        for (const line of result.diff) {
          console.log(`- ${line}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(chalk.yellow(`⚠ Update failed: ${message}`));
        process.exitCode = 1;
      }
    });

  program
    .command("audit")
    .description("Score generated context for freshness, brevity, evidence, actionability, and validation")
    .option("--json", "print audit JSON to stdout")
    .option("--strict", "exit non-zero when score is below threshold")
    .option("--threshold <number>", "minimum passing score from 0 to 100", parseThreshold, 80)
    .option("--no-write", "skip writing .repobrief/audit.json and .repobrief/audit.md")
    .action(async (options: { json?: boolean; strict?: boolean; threshold: number; write?: boolean }) => {
      const rootDir = process.cwd();
      try {
        const result = await runAudit(rootDir, {
          threshold: options.threshold,
          write: options.write !== false
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          const status = result.passed ? chalk.green("passed") : chalk.yellow("needs attention");
          console.log(chalk.green(`✓ RepoBrief audit: ${result.score}/100 (${result.grade}) - ${status}`));
          for (const finding of result.findings.slice(0, 5)) {
            console.log(`- [${finding.severity}] ${finding.message}`);
          }
          if (result.findings.length > 5) {
            console.log(`- ${result.findings.length - 5} more findings in .repobrief/audit.md`);
          }
        }

        if (options.strict && !result.passed) {
          process.exitCode = 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(chalk.yellow(`⚠ Audit failed: ${message}`));
        process.exitCode = 1;
      }
    });

  return program;
}

const entryPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entryPath) {
  void createProgram().parseAsync(process.argv);
}
