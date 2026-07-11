import path from "node:path";
import fs from "fs-extra";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface ProjectInfo {
  isNextJs: boolean;
  hasTypeScript: boolean;
  hasTailwind: boolean;
  hasAppRouter: boolean;
  packageManager: PackageManager;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Inspect the target project for Next.js, TypeScript, Tailwind, and package manager.
 */
export async function detectProject(cwd: string): Promise<ProjectInfo> {
  const pkgPath = path.join(cwd, "package.json");

  if (!(await fs.pathExists(pkgPath))) {
    throw new Error(
      `No package.json found in ${cwd}. Run this command from your Next.js project root.`,
    );
  }

  const pkg = (await fs.readJson(pkgPath)) as PackageJson;
  const dependencies = pkg.dependencies ?? {};
  const devDependencies = pkg.devDependencies ?? {};
  const allDeps = { ...dependencies, ...devDependencies };

  const isNextJs = "next" in allDeps;
  const hasTypeScript =
    "typescript" in allDeps ||
    (await fs.pathExists(path.join(cwd, "tsconfig.json")));

  const hasTailwind =
    "tailwindcss" in allDeps ||
    (await fs.pathExists(path.join(cwd, "tailwind.config.ts"))) ||
    (await fs.pathExists(path.join(cwd, "tailwind.config.js"))) ||
    (await fs.pathExists(path.join(cwd, "tailwind.config.mjs")));

  const hasAppRouter =
    (await fs.pathExists(path.join(cwd, "app"))) ||
    (await fs.pathExists(path.join(cwd, "src", "app")));

  const packageManager = await detectPackageManager(cwd);

  return {
    isNextJs,
    hasTypeScript,
    hasTailwind,
    hasAppRouter,
    packageManager,
    dependencies,
    devDependencies,
  };
}

async function detectPackageManager(cwd: string): Promise<PackageManager> {
  if (await fs.pathExists(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (await fs.pathExists(path.join(cwd, "yarn.lock"))) return "yarn";
  if (await fs.pathExists(path.join(cwd, "bun.lockb"))) return "bun";
  if (await fs.pathExists(path.join(cwd, "package-lock.json"))) return "npm";
  return "npm";
}
