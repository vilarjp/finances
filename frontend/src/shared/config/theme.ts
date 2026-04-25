export const THEME_STORAGE_KEY = "personal-finance-theme";
export const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";
export const DEFAULT_THEME_MODE = "system";

export const THEME_MODES = ["light", "dark", "system"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
export type ResolvedTheme = Exclude<ThemeMode, "system">;

export function isThemeMode(value: string | null): value is ThemeMode {
  return THEME_MODES.some((themeMode) => themeMode === value);
}
