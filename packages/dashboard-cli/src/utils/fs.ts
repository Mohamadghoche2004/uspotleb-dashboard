import fs from "fs-extra";

/**
 * Thin wrappers around fs-extra for consistent async FS checks.
 */
export async function pathExists(target: string): Promise<boolean> {
  return fs.pathExists(target);
}

export async function ensureDir(target: string): Promise<void> {
  await fs.ensureDir(target);
}

export async function readJson<T>(target: string): Promise<T> {
  return fs.readJson(target) as Promise<T>;
}
