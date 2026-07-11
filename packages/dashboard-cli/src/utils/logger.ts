import chalk from "chalk";

/**
 * Consistent CLI logging helpers.
 */
export const logger = {
  banner(): void {
    console.log();
    console.log(chalk.bold.blue("  USpotLeb Dashboard CLI"));
    console.log(chalk.dim("  Generate editable SaaS dashboards for Next.js"));
    console.log();
  },

  info(message: string): void {
    console.log(chalk.white(message));
  },

  success(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  },

  warn(message: string): void {
    console.log(chalk.yellow(`⚠ ${message}`));
  },

  error(message: string): void {
    console.error(chalk.red(`✗ ${message}`));
  },

  dim(message: string): void {
    console.log(chalk.dim(message));
  },

  newline(): void {
    console.log();
  },
};
