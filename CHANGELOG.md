# Changelog

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
