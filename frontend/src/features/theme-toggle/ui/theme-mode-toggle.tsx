import { Moon, Monitor, Sun } from "lucide-react";
import type { ComponentProps } from "react";

import type { ThemeMode } from "@shared/config/theme";
import { useTheme } from "@shared/config/theme-context";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";

const themeOptions: Array<{
  icon: typeof Sun;
  label: string;
  theme: ThemeMode;
}> = [
  { icon: Sun, label: "Use light theme", theme: "light" },
  { icon: Moon, label: "Use dark theme", theme: "dark" },
  { icon: Monitor, label: "Use system theme", theme: "system" },
];

type ThemeModeToggleProps = ComponentProps<"div">;

export function ThemeModeToggle({ className, ...props }: ThemeModeToggleProps) {
  const { setTheme, theme } = useTheme();

  return (
    <div
      aria-label="Theme preference"
      className={cn("flex items-center rounded-md border bg-background p-1", className)}
      role="group"
      {...props}
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = theme === option.theme;

        return (
          <Button
            aria-label={option.label}
            aria-pressed={isSelected}
            className="size-8"
            key={option.theme}
            onClick={() => setTheme(option.theme)}
            size="icon"
            title={option.label}
            type="button"
            variant={isSelected ? "secondary" : "ghost"}
          >
            <Icon aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}
