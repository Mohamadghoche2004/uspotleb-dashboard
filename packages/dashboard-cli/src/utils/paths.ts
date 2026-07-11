import path from "node:path";

/**
 * Resolve and normalize the working directory for CLI operations.
 */
export function resolveCwd(cwd?: string): string {
  if (!cwd) {
    return process.cwd();
  }
  return path.resolve(cwd);
}
