import { createContext, useContext } from "react";

import type { ResolvedTheme, ThemeMode } from "./theme";

export type { ResolvedTheme, ThemeMode };

export interface ThemeContextValue {
  resolvedTheme: ResolvedTheme;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
