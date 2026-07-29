import path from "node:path";
import fs from "fs-extra";
import type { ProjectInfo } from "./detectProject.js";

const CUSTOM_VARIANT = "@custom-variant dark (&:where(.dark, .dark *));";

const THEME_INIT_SCRIPT = `(function(){try{var k="uspotleb-dashboard-theme";var t=localStorage.getItem(k);var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export interface DarkModeSetupResult {
  changes: string[];
  tailwindMajor: number | null;
}

/**
 * Enable class-based dark mode so the dashboard theme button controls Tailwind `dark:` utilities.
 * Supports Tailwind v4 (CSS-first) and v3 (JS config).
 * Called by `init` against the target Next.js project only.
 */
export async function ensureClassDarkMode(
  cwd: string,
  project: ProjectInfo,
): Promise<DarkModeSetupResult> {
  const changes: string[] = [];
  const tailwindMajor = getTailwindMajor(project);

  if (tailwindMajor !== null && tailwindMajor >= 4) {
    const cssChange = await patchGlobalsCss(cwd);
    if (cssChange) changes.push(cssChange);
  } else {
    const configChange = await patchTailwindConfig(cwd);
    if (configChange) changes.push(configChange);
  }

  const layoutChange = await patchRootLayout(cwd);
  if (layoutChange) changes.push(layoutChange);

  const widthCssChange = await patchGlobalsCssFullWidth(cwd);
  if (widthCssChange) changes.push(widthCssChange);

  return { changes, tailwindMajor };
}

function getTailwindMajor(project: ProjectInfo): number | null {
  const raw =
    project.dependencies.tailwindcss ?? project.devDependencies.tailwindcss ?? null;
  if (!raw) return null;
  const match = raw.match(/(\d+)/);
  return match?.[1] ? Number(match[1]) : null;
}

async function findGlobalsCss(cwd: string): Promise<string | null> {
  const candidates = [
    path.join(cwd, "app", "globals.css"),
    path.join(cwd, "src", "app", "globals.css"),
  ];
  for (const file of candidates) {
    if (await fs.pathExists(file)) return file;
  }
  return null;
}

async function patchGlobalsCss(cwd: string): Promise<string | null> {
  const file = await findGlobalsCss(cwd);
  if (!file) return null;

  let css = await fs.readFile(file, "utf8");
  let changed = false;

  if (!css.includes("@custom-variant dark")) {
    if (css.includes('@import "tailwindcss"')) {
      css = css.replace(
        '@import "tailwindcss";',
        `@import "tailwindcss";\n${CUSTOM_VARIANT}`,
      );
    } else if (css.includes("@import 'tailwindcss'")) {
      css = css.replace(
        "@import 'tailwindcss';",
        `@import 'tailwindcss';\n${CUSTOM_VARIANT}`,
      );
    } else {
      css = `${CUSTOM_VARIANT}\n${css}`;
    }
    changed = true;
  }

  const mediaBlock =
    /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{\s*:root\s*\{([^}]*)\}\s*\}/m;
  if (mediaBlock.test(css) && !css.includes(".dark {") && !css.includes(".dark{")) {
    css = css.replace(mediaBlock, (_full, body: string) => {
      return `.dark {${body}}`;
    });
    changed = true;
  }

  if (!changed) return null;
  await fs.writeFile(file, css, "utf8");
  return path.relative(cwd, file);
}

async function patchTailwindConfig(cwd: string): Promise<string | null> {
  const candidates = [
    "tailwind.config.ts",
    "tailwind.config.js",
    "tailwind.config.mjs",
    "tailwind.config.cjs",
  ];

  for (const name of candidates) {
    const file = path.join(cwd, name);
    if (!(await fs.pathExists(file))) continue;

    let content = await fs.readFile(file, "utf8");
    if (/darkMode\s*:/.test(content)) {
      const next = content.replace(
        /darkMode\s*:\s*(["'`]media["'`]|\[[^\]]*\]|["'`]class["'`])/,
        'darkMode: "class"',
      );
      if (next === content) return null;
      await fs.writeFile(file, next, "utf8");
      return name;
    }

    if (content.includes("export default")) {
      content = content.replace(
        /export default\s+(\{)/,
        'export default $1\n  darkMode: "class",',
      );
    } else if (content.includes("module.exports")) {
      content = content.replace(
        /module\.exports\s*=\s*(\{)/,
        'module.exports = $1\n  darkMode: "class",',
      );
    } else {
      continue;
    }

    await fs.writeFile(file, content, "utf8");
    return name;
  }

  const created = path.join(cwd, "tailwind.config.js");
  await fs.writeFile(
    created,
    `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  darkMode: "class",\n  content: [\n    "./app/**/*.{js,ts,jsx,tsx,mdx}",\n    "./src/**/*.{js,ts,jsx,tsx,mdx}",\n    "./components/**/*.{js,ts,jsx,tsx,mdx}",\n  ],\n  theme: { extend: {} },\n  plugins: [],\n};\n`,
    "utf8",
  );
  return "tailwind.config.js";
}

async function findRootLayout(cwd: string): Promise<string | null> {
  const candidates = [
    path.join(cwd, "app", "layout.tsx"),
    path.join(cwd, "app", "layout.jsx"),
    path.join(cwd, "src", "app", "layout.tsx"),
    path.join(cwd, "src", "app", "layout.jsx"),
  ];
  for (const file of candidates) {
    if (await fs.pathExists(file)) return file;
  }
  return null;
}

async function patchRootLayout(cwd: string): Promise<string | null> {
  const file = await findRootLayout(cwd);
  if (!file) return null;

  let content = await fs.readFile(file, "utf8");
  let changed = false;

  if (!content.includes("suppressHydrationWarning")) {
    if (/<html([^>]*)>/.test(content)) {
      content = content.replace(/<html([^>]*)>/, (_m, attrs: string) => {
        if (attrs.includes("suppressHydrationWarning")) return `<html${attrs}>`;
        return `<html${attrs} suppressHydrationWarning>`;
      });
      changed = true;
    }
  }

  if (!content.includes("uspotleb-dashboard-theme") && !content.includes("themeInitScript")) {
    const scriptTag = `\n        <script\n          dangerouslySetInnerHTML={{\n            __html: ${JSON.stringify(THEME_INIT_SCRIPT)},\n          }}\n        />`;

    if (content.includes("</head>")) {
      content = content.replace("</head>", `${scriptTag}\n      </head>`);
      changed = true;
    } else if (/<html([^>]*)>/i.test(content)) {
      content = content.replace(
        /(<html[^>]*>)/i,
        `$1\n      <head>${scriptTag}\n      </head>`,
      );
      changed = true;
    }
  }

  // Ensure the dashboard can span the full viewport (create-next-app often centers / caps width).
  const fullWidthResult = ensureBodyFullWidth(content);
  if (fullWidthResult.changed) {
    content = fullWidthResult.content;
    changed = true;
  }

  if (!changed) return null;
  await fs.writeFile(file, content, "utf8");
  return path.relative(cwd, file);
}

/**
 * Make <body> full-bleed and strip common starter centering / max-width wrappers
 * that leave empty side gutters around the dashboard.
 */
function ensureBodyFullWidth(content: string): { content: string; changed: boolean } {
  let next = content;
  let changed = false;

  const bodyMatch = next.match(/<body([^>]*)>/);
  if (bodyMatch) {
    const attrs = bodyMatch[1] ?? "";
    const classMatch = attrs.match(/className=(["'`])([\s\S]*?)\1/);

    if (classMatch) {
      const quote = classMatch[1] ?? '"';
      let classes = classMatch[2] ?? "";
      const original = classes;

      // Drop layout-centering utilities that shrink the page into a column.
      classes = classes
        .replace(/\bitems-center\b/g, "")
        .replace(/\bjustify-center\b/g, "")
        .replace(/\bjustify-items-center\b/g, "")
        .replace(/\bplace-items-center\b/g, "")
        .replace(/\bplace-content-center\b/g, "")
        .replace(/\bmax-w-[^\s"'`]+/g, "")
        .replace(/\bcontainer\b/g, "")
        .replace(/\bmx-auto\b/g, "")
        .replace(/\bmin-h-full\b/g, "min-h-screen")
        .replace(/\s+/g, " ")
        .trim();

      if (!/\bw-full\b/.test(classes)) classes = `${classes} w-full`.trim();
      if (!/\bmin-h-screen\b/.test(classes) && !/\bmin-h-dvh\b/.test(classes)) {
        classes = `${classes} min-h-screen`.trim();
      }

      if (classes !== original) {
        next = next.replace(
          bodyMatch[0],
          `<body${attrs.replace(classMatch[0], `className=${quote}${classes}${quote}`)}>`,
        );
        changed = true;
      }
    } else {
      next = next.replace(bodyMatch[0], `<body${attrs} className="min-h-screen w-full">`);
      changed = true;
    }
  }

  // Unwrap a single centering / max-width div that only wraps {children}.
  const wrapperRe =
    /<div\s+className=(["'`])([^"'`]*?(?:items-center|justify-center|justify-items-center|max-w-|container|mx-auto)[^"'`]*?)\1\s*>\s*\{children\}\s*<\/div>/m;
  if (wrapperRe.test(next)) {
    next = next.replace(wrapperRe, "{children}");
    changed = true;
  }

  return { content: next, changed };
}

async function patchGlobalsCssFullWidth(cwd: string): Promise<string | null> {
  const file = await findGlobalsCss(cwd);
  if (!file) return null;

  let css = await fs.readFile(file, "utf8");
  if (css.includes("/* uspotleb-full-width */")) return null;

  css += `

/* uspotleb-full-width */
html,
body {
  width: 100%;
  max-width: 100%;
}
`;
  await fs.writeFile(file, css, "utf8");
  return path.relative(cwd, file);
}
