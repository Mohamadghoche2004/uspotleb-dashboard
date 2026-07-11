import { execSync } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";
import type { PackageManager, ProjectInfo } from "./detectProject.js";

/** Runtime deps required by the generated dashboard */
const REQUIRED_DEPS = [
  "lucide-react",
  "recharts",
  "clsx",
  "tailwind-merge",
] as const;

const REQUIRED_DEV_DEPS = ["tailwindcss", "postcss", "autoprefixer"] as const;

/**
 * Install missing peer dependencies for the generated dashboard.
 * Returns the list of packages that were installed.
 */
export async function installDependencies(
  cwd: string,
  project: ProjectInfo,
): Promise<string[]> {
  const allDeps = { ...project.dependencies, ...project.devDependencies };
  const missingRuntime = REQUIRED_DEPS.filter((dep) => !(dep in allDeps));
  const missingDev =
    project.hasTailwind
      ? ([] as string[])
      : REQUIRED_DEV_DEPS.filter((dep) => !(dep in allDeps));

  const installed: string[] = [];

  if (missingRuntime.length > 0) {
    runInstall(cwd, project.packageManager, missingRuntime, false);
    installed.push(...missingRuntime);
  }

  if (missingDev.length > 0) {
    runInstall(cwd, project.packageManager, missingDev, true);
    installed.push(...missingDev);
  }

  // Refresh package.json awareness is caller responsibility
  if (!project.hasTailwind && missingDev.length > 0) {
    await ensureTailwindConfig(cwd);
  }

  return installed;
}

function runInstall(
  cwd: string,
  pm: PackageManager,
  packages: readonly string[],
  isDev: boolean,
): void {
  const pkgList = packages.join(" ");
  const commands: Record<PackageManager, string> = {
    npm: `npm install ${isDev ? "-D " : ""}${pkgList}`,
    pnpm: `pnpm add ${isDev ? "-D " : ""}${pkgList}`,
    yarn: `yarn add ${isDev ? "-D " : ""}${pkgList}`,
    bun: `bun add ${isDev ? "-d " : ""}${pkgList}`,
  };

  const env = { ...process.env, ADBLOCK: "1", DISABLE_OPENCOLLECTIVE: "1" };

  try {
    execSync(commands[pm], { cwd, stdio: "inherit", env });
  } catch (error) {
    // npm peer conflicts are common across Next major versions — retry once
    if (pm === "npm") {
      execSync(`npm install ${isDev ? "-D " : ""}${pkgList} --legacy-peer-deps`, {
        cwd,
        stdio: "inherit",
        env,
      });
      return;
    }
    throw error;
  }
}

async function ensureTailwindConfig(cwd: string): Promise<void> {
  const configTs = path.join(cwd, "tailwind.config.ts");
  const configJs = path.join(cwd, "tailwind.config.js");

  if ((await fs.pathExists(configTs)) || (await fs.pathExists(configJs))) {
    return;
  }

  const content = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--dashboard-primary, #2563eb)",
        },
      },
    },
  },
  plugins: [],
};
`;

  await fs.writeFile(configJs, content, "utf8");
}
