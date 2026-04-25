import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";

import { ThemeContext, type ThemeMode } from "./theme-context";

const storageKey = "personal-finance-theme";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = window.localStorage.getItem(storageKey);

  if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
    return storedTheme;
  }

  return "system";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolvedTheme = theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme;

    root.classList.toggle("dark", resolvedTheme === "dark");
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
