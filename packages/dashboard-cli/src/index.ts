#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { updateCommand } from "./commands/update.js";

const program = new Command();

program
  .name("uspot-dashboard")
  .description(
    "USpotLeb Dashboard CLI — generate a customizable SaaS dashboard into your Next.js project",
  )
  .version("1.0.2");

program
  .command("init")
  .description("Initialize the USpotLeb dashboard in your Next.js project")
  .option("-y, --yes", "Skip confirmation prompts", false)
  .option("-f, --force", "Overwrite existing dashboard files", false)
  .option("--cwd <path>", "Working directory (defaults to process.cwd())")
  .action(async (options: { yes: boolean; force: boolean; cwd?: string }) => {
    await initCommand(options);
  });

program
  .command("add <component>")
  .description("Add a dashboard component (sidebar | chart | table | header | stat)")
  .option("--cwd <path>", "Working directory (defaults to process.cwd())")
  .option("-f, --force", "Overwrite existing component files", false)
  .action(async (component: string, options: { cwd?: string; force: boolean }) => {
    await addCommand(component, options);
  });

program
  .command("update")
  .description("Update generated dashboard files to the latest template version")
  .option("--cwd <path>", "Working directory (defaults to process.cwd())")
  .option("-f, --force", "Overwrite all files without prompting", false)
  .action(async (options: { cwd?: string; force: boolean }) => {
    await updateCommand(options);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nFatal error: ${message}`);
  process.exit(1);
});
