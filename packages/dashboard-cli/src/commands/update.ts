import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { copyTemplates } from "../generator/copyTemplates.js";
import { logger } from "../utils/logger.js";
import { resolveCwd } from "../utils/paths.js";
import { pathExists } from "../utils/fs.js";

export interface UpdateOptions {
  cwd?: string;
  force: boolean;
}

/**
 * Refresh generated dashboard files from the latest templates.
 * Existing user customizations are preserved unless --force is passed.
 */
export async function updateCommand(options: UpdateOptions): Promise<void> {
  const cwd = resolveCwd(options.cwd);
  const configPath = path.join(cwd, "config", "dashboard.config.ts");

  logger.banner();

  const hasDashboard = await pathExists(configPath);
  if (!hasDashboard) {
    logger.error(
      "No dashboard found. Run init first:\n" +
        `  ${chalk.cyan("npx @uspot-leb/dashboard-cli init")}`,
    );
    process.exit(1);
  }

  if (!options.force) {
    const { confirmed } = await prompts({
      type: "confirm",
      name: "confirmed",
      message:
        "Update will overwrite component templates but preserve config/dashboard.config.ts. Continue?",
      initial: true,
    });

    if (!confirmed) {
      logger.info("Aborted.");
      process.exit(0);
    }
  }

  const spinner = ora("Updating dashboard templates…").start();

  try {
    const result = await copyTemplates({
      cwd,
      force: true,
      components: "all",
      /** Never overwrite user config on update */
      preserve: ["config/dashboard.config.ts"],
    });

    spinner.succeed(`Updated ${result.written.length} file(s)`);

    if (result.skipped.length > 0) {
      logger.info("Preserved:");
      for (const file of result.skipped) {
        logger.dim(`  • ${path.relative(cwd, file)}`);
      }
    }
  } catch (error) {
    spinner.fail("Update failed");
    throw error;
  }

  logger.newline();
  logger.success("Dashboard updated to the latest templates.");
  logger.dim("Review the diff and re-apply any local component customizations.");
}
