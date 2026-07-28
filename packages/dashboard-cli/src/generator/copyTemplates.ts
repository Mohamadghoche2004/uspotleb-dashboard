import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

export type ComponentKey =
  | "sidebar"
  | "chart"
  | "table"
  | "header"
  | "stat"
  | "shell"
  | "all";

/** Template relative paths grouped by component key */
const COMPONENT_FILES: Record<Exclude<ComponentKey, "all">, string[]> = {
  sidebar: [
    "components/dashboard/Sidebar.tsx",
    "components/dashboard/MobileSidebar.tsx",
  ],
  chart: ["components/dashboard/ChartCard.tsx"],
  table: ["components/dashboard/DataTable.tsx"],
  header: ["components/dashboard/Header.tsx"],
  stat: ["components/dashboard/StatCard.tsx"],
  shell: [
    "components/dashboard/DashboardShell.tsx",
    "components/dashboard/ThemeProvider.tsx",
    "app/(dashboard)/layout.tsx",
    "app/(dashboard)/dashboard/page.tsx",
  ],
};

/** Always copied on full init / update */
const CORE_FILES: string[] = [
  "config/dashboard.config.ts",
  "hooks/useDashboard.ts",
  "lib/dashboard-utils.ts",
  "components/dashboard/Sidebar.tsx",
  "components/dashboard/MobileSidebar.tsx",
  "components/dashboard/Header.tsx",
  "components/dashboard/StatCard.tsx",
  "components/dashboard/ChartCard.tsx",
  "components/dashboard/DataTable.tsx",
  "components/dashboard/DashboardShell.tsx",
  "components/dashboard/ThemeProvider.tsx",
  "components/dashboard/EmptyState.tsx",
  "components/dashboard/ErrorState.tsx",
  "components/dashboard/LoadingState.tsx",
  "app/(dashboard)/layout.tsx",
  "app/(dashboard)/dashboard/page.tsx",
  "app/(dashboard)/users/page.tsx",
];

export interface CopyTemplatesOptions {
  cwd: string;
  force: boolean;
  components: ComponentKey | ComponentKey[];
  /** Relative paths that should never be overwritten */
  preserve?: string[];
}

export interface CopyResult {
  written: string[];
  skipped: string[];
}

/**
 * Resolve the absolute path to the bundled templates directory.
 * Works both from source (dev) and from dist (published package).
 */
export function getTemplatesRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // dist/generator -> ../templates  OR  src/generator -> ../templates
  const candidates = [
    path.resolve(here, "../../templates/next-dashboard"),
    path.resolve(here, "../../../templates/next-dashboard"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Could not locate templates/next-dashboard. Ensure the package was published with templates included.",
  );
}

/**
 * Copy selected template files into the target project.
 * Detects src/app layout and mirrors into src/ when present.
 */
export async function copyTemplates(options: CopyTemplatesOptions): Promise<CopyResult> {
  const { cwd, force, preserve = [] } = options;
  const templatesRoot = getTemplatesRoot();
  const files = resolveFileList(options.components);
  const useSrc = await fs.pathExists(path.join(cwd, "src", "app"));

  const written: string[] = [];
  const skipped: string[] = [];
  const preserveSet = new Set(preserve.map(normalizeRel));

  for (const rel of files) {
    const source = path.join(templatesRoot, rel);
    if (!(await fs.pathExists(source))) {
      throw new Error(`Template missing: ${rel}`);
    }

    const destRel = mapDestination(rel, useSrc);
    const dest = path.join(cwd, destRel);

    if (preserveSet.has(normalizeRel(rel)) || preserveSet.has(normalizeRel(destRel))) {
      skipped.push(dest);
      continue;
    }

    const exists = await fs.pathExists(dest);
    if (exists && !force) {
      skipped.push(dest);
      continue;
    }

    await fs.ensureDir(path.dirname(dest));
    await fs.copy(source, dest, { overwrite: true });
    written.push(dest);
  }

  return { written, skipped };
}

function resolveFileList(components: ComponentKey | ComponentKey[]): string[] {
  if (components === "all" || (Array.isArray(components) && components.includes("all"))) {
    return [...CORE_FILES];
  }

  const keys = Array.isArray(components) ? components : [components];
  const set = new Set<string>();

  for (const key of keys) {
    if (key === "all") continue;
    for (const file of COMPONENT_FILES[key]) {
      set.add(file);
    }
  }

  return [...set];
}

/**
 * When the project uses src/app, place app/ and components/ under src/.
 * Config, hooks, and lib stay at the project root (common Next.js convention).
 */
function mapDestination(rel: string, useSrc: boolean): string {
  if (!useSrc) return rel;

  if (rel.startsWith("app/") || rel.startsWith("components/")) {
    return path.join("src", rel);
  }

  return rel;
}

function normalizeRel(p: string): string {
  return p.replace(/\\/g, "/");
}
