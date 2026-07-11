/**
 * Shared type definitions for USpotLeb dashboard components.
 * Prefer generating editable source via `@uspot-leb/dashboard-cli`.
 */

export type ThemeMode = "light" | "dark" | "system";

export type SidebarIcon =
  | "home"
  | "users"
  | "settings"
  | "chart"
  | "billing"
  | "help"
  | "file"
  | "bell";

export interface SidebarItem {
  title: string;
  href: string;
  icon: SidebarIcon;
  badge?: string;
}

export interface StatCardConfig {
  title: string;
  key: string;
  icon?: SidebarIcon;
}

export interface DashboardConfig {
  brand: {
    name: string;
    logo: string;
  };
  theme: {
    mode: ThemeMode;
    primary: string;
  };
  sidebar: SidebarItem[];
  cards: StatCardConfig[];
}

export interface ChartDatum {
  label: string;
  value: number;
  secondary?: number;
}

export type ChartType = "line" | "bar" | "area";
