#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runExport } from "./commands/export.js";
import { runUpdate } from "./commands/update.js";

const program = new Command();

program
  .name("codemap")
  .description("Universal codebase context engine for AI coding agents")
  .version("0.1.0");

program
  .command("init")
  .description("Scan repository and generate .codemap context files")
  .action(async () => {
    const rootDir = process.cwd();
    try {
      await runInit(rootDir);
      console.log(`Codemap initialized at ${path.join(rootDir, ".codemap")}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to initialize codemap: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("export")
  .description("Export codemap context for a target AI coding tool")
  .requiredOption("-f, --format <target>", "Target format: claude|cursor|codex|markdown")
  .action(async (options: { format: string }) => {
    const rootDir = process.cwd();
    try {
      const outputPath = await runExport(rootDir, options.format);
      console.log(`Export completed: ${outputPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Export failed: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("update")
  .description("Re-run analysis and show a high-level diff")
  .action(async () => {
    const rootDir = process.cwd();
    try {
      const result = await runUpdate(rootDir);
      console.log("Codemap updated.");
      for (const line of result.diff) {
        console.log(`- ${line}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Update failed: ${message}`);
      process.exitCode = 1;
    }
  });

void program.parseAsync(process.argv);
