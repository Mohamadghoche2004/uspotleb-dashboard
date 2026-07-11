import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import { copyTemplates, type ComponentKey } from "../generator/copyTemplates.js";
import { logger } from "../utils/logger.js";
import { resolveCwd } from "../utils/paths.js";

const VALID_COMPONENTS: readonly ComponentKey[] = [
  "sidebar",
  "chart",
  "table",
  "header",
  "stat",
  "shell",
] as const;

export interface AddOptions {
  cwd?: string;
  force: boolean;
}

/**
 * Add one or more dashboard components into the project.
 */
export async function addCommand(component: string, options: AddOptions): Promise<void> {
  const cwd = resolveCwd(options.cwd);
  const key = component.toLowerCase().trim() as ComponentKey;

  if (!VALID_COMPONENTS.includes(key)) {
    logger.error(
      `Unknown component "${component}". Valid options:\n` +
        VALID_COMPONENTS.map((c) => `  • ${c}`).join("\n"),
    );
    process.exit(1);
  }

  logger.banner();
  logger.info(`Adding component: ${chalk.cyan(key)}`);

  const spinner = ora(`Copying ${key}…`).start();

  try {
    const result = await copyTemplates({
      cwd,
      force: options.force,
      components: [key],
    });

    if (result.written.length === 0 && result.skipped.length > 0) {
      spinner.warn("Files already exist (use --force to overwrite)");
      for (const file of result.skipped) {
        logger.dim(`  • ${path.relative(cwd, file)}`);
      }
      return;
    }

    spinner.succeed(`Added ${key} (${result.written.length} file(s))`);
    for (const file of result.written) {
      logger.dim(`  + ${path.relative(cwd, file)}`);
    }
  } catch (error) {
    spinner.fail(`Failed to add ${key}`);
    throw error;
  }

  logger.newline();
  logger.success(`Component "${key}" is ready. Import it from components/dashboard/.`);
}
