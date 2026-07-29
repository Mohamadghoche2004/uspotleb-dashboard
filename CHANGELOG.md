# Changelog

## 1.0.5

- Dashboard shell is full-viewport width (`w-full`) so it no longer sits in a centered column with side gutters
- On `init`, root `app/layout.tsx` is patched to drop common create-next-app centering / `max-width` wrappers on `<body>`
- On `init`, `globals.css` gets `html, body { width: 100%; max-width: 100%; }` so the page stays edge-to-edge

## 1.0.4

- Fix package `repository` / `homepage` / `bugs` URLs to https://github.com/Mohamadghoche2004/uspotleb-dashboard

## 1.0.3

- Route-group layout: `app/(dashboard)/layout.tsx` owns the theme provider + shell once
- Pages are now content-only — new routes under `app/(dashboard)/` inherit the chrome automatically (no per-page boilerplate)
- `DashboardShell` owns sidebar collapse + mobile state and resolves the header title from the active route, so state no longer remounts on navigation
- `useDashboard` simplified to data-only; added a `/users` example page

## 1.0.2

- Theme button works via class-based dark mode configured on `init` (Tailwind v3 + v4)
- `DashboardThemeProvider` toggles `.dark` on `<html>`; Header uses `toggleTheme`
- FOUC prevention script + `suppressHydrationWarning` applied to the target app root layout on init

## 1.0.1

- Fix swapped `Header.tsx` and `MobileSidebar.tsx` templates

## 1.0.0

- Initial release of `@uspot-leb/dashboard-cli`
- Commands: `init`, `add`, `update`
- Next.js App Router templates with Tailwind, dark mode, charts, and tables
- Companion package `@uspot-leb/dashboard-components`
