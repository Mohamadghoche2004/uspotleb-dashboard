import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { detectProject, type ProjectInfo } from "../generator/detectProject.js";
import { copyTemplates } from "../generator/copyTemplates.js";
import { installDependencies } from "../generator/installDependencies.js";
import { ensureClassDarkMode } from "../generator/ensureDarkMode.js";
import { logger } from "../utils/logger.js";
import { resolveCwd } from "../utils/paths.js";

export interface InitOptions {
  yes: boolean;
  force: boolean;
  cwd?: string;
}

/**
 * Scaffold a full USpotLeb dashboard into a Next.js project.
 */
export async function initCommand(options: InitOptions): Promise<void> {
  const cwd = resolveCwd(options.cwd);

  logger.banner();
  logger.info(`Working directory: ${chalk.cyan(cwd)}`);

  const spinner = ora("Detecting project…").start();
  let project: ProjectInfo;

  try {
    project = await detectProject(cwd);
    spinner.succeed("Project detected");
  } catch (error) {
    spinner.fail("Project detection failed");
    throw error;
  }

  printDetection(project);

  if (!project.isNextJs) {
    logger.error(
      "This does not look like a Next.js project. Create one first:\n" +
        `  ${chalk.cyan("npx create-next-app@latest")}`,
    );
    process.exit(1);
  }

  if (!project.hasTypeScript) {
    logger.warn("TypeScript was not detected. Templates are TypeScript — proceed with caution.");
  }

  if (!project.hasTailwind) {
    logger.warn(
      "Tailwind CSS was not detected. The dashboard requires Tailwind. It will be installed.",
    );
  }

  if (!options.yes) {
    const { confirmed } = await prompts({
      type: "confirm",
      name: "confirmed",
      message: "Generate the USpotLeb dashboard into this project?",
      initial: true,
    });

    if (!confirmed) {
      logger.info("Aborted.");
      process.exit(0);
    }
  }

  const copySpinner = ora("Generating dashboard files…").start();
  try {
    const result = await copyTemplates({
      cwd,
      force: options.force,
      components: "all",
    });
    copySpinner.succeed(
      `Generated ${result.written.length} file(s)${
        result.skipped.length > 0 ? ` (${result.skipped.length} skipped)` : ""
      }`,
    );

    if (result.skipped.length > 0) {
      logger.warn("Skipped existing files (use --force to overwrite):");
      for (const file of result.skipped) {
        logger.dim(`  • ${path.relative(cwd, file)}`);
      }
    }
  } catch (error) {
    copySpinner.fail("Failed to generate files");
    throw error;
  }

  const themeSpinner = ora("Configuring class-based dark mode…").start();
  try {
    const themeSetup = await ensureClassDarkMode(cwd, project);
    if (themeSetup.changes.length === 0) {
      themeSpinner.succeed("Dark mode already configured");
    } else {
      themeSpinner.succeed(
        `Dark mode ready (${themeSetup.changes.map((f) => path.relative(cwd, path.resolve(cwd, f))).join(", ")})`,
      );
    }
  } catch (error) {
    themeSpinner.warn("Could not auto-configure dark mode");
    if (error instanceof Error) logger.dim(error.message);
    logger.warn(
      "Add class-based dark mode manually so the theme button works:\n" +
        `  Tailwind v4 → ${chalk.cyan('@custom-variant dark (&:where(.dark, .dark *));')} in globals.css\n` +
        `  Tailwind v3 → ${chalk.cyan('darkMode: "class"')} in tailwind.config`,
    );
  }

  const depSpinner = ora("Installing dependencies…").start();
  try {
    const installed = await installDependencies(cwd, project);
    if (installed.length === 0) {
      depSpinner.succeed("All dependencies already present");
    } else {
      depSpinner.succeed(`Installed: ${installed.join(", ")}`);
    }
  } catch (error) {
    depSpinner.fail("Dependency installation failed");
    logger.warn(
      "You can install manually:\n" +
        `  ${chalk.cyan("npm install lucide-react recharts clsx tailwind-merge")}`,
    );
    if (error instanceof Error) {
      logger.dim(error.message);
    }
  }

  printSuccess(cwd);
}

function printDetection(project: ProjectInfo): void {
  logger.newline();
  logger.info("Detection results:");
  logger.dim(`  Next.js:     ${project.isNextJs ? chalk.green("yes") : chalk.red("no")}`);
  logger.dim(`  TypeScript:  ${project.hasTypeScript ? chalk.green("yes") : chalk.yellow("no")}`);
  logger.dim(`  Tailwind:    ${project.hasTailwind ? chalk.green("yes") : chalk.yellow("no")}`);
  logger.dim(`  App Router:  ${project.hasAppRouter ? chalk.green("yes") : chalk.yellow("no")}`);
  logger.dim(`  Package mgr: ${chalk.cyan(project.packageManager)}`);
  logger.newline();
}

function printSuccess(cwd: string): void {
  logger.newline();
  logger.success("USpotLeb dashboard is ready!");
  logger.newline();
  logger.info("Generated structure:");
  logger.dim(`  ${path.relative(cwd, path.join(cwd, "app/dashboard/"))}`);
  logger.dim(`  ${path.relative(cwd, path.join(cwd, "components/dashboard/"))}`);
  logger.dim(`  ${path.relative(cwd, path.join(cwd, "config/dashboard.config.ts"))}`);
  logger.dim(`  ${path.relative(cwd, path.join(cwd, "hooks/useDashboard.ts"))}`);
  logger.dim(`  ${path.relative(cwd, path.join(cwd, "lib/dashboard-utils.ts"))}`);
  logger.newline();
  logger.info("Next steps:");
  logger.dim(`  1. Open ${chalk.cyan("config/dashboard.config.ts")} and customize your brand`);
  logger.dim(`  2. Run ${chalk.cyan("npm run dev")} and visit ${chalk.cyan("/dashboard")}`);
  logger.dim(`  3. Add more components: ${chalk.cyan("npx @uspot-leb/dashboard-cli add chart")}`);
  logger.newline();
}
