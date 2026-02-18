#!/usr/bin/env node
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runExport } from "./commands/export.js";
import { runUpdate } from "./commands/update.js";

const program = new Command();

program
  .name("repobrief")
  .description("Universal codebase context engine for AI coding agents")
  .version("0.1.0");

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

void program.parseAsync(process.argv);
