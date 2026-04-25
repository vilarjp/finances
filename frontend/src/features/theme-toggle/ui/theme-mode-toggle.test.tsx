import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeProvider } from "@app/providers/theme-provider";

import { ThemeModeToggle } from "./theme-mode-toggle";

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.className = "";
});

it("lets users choose light, dark, or system theme modes", async () => {
  const user = userEvent.setup();

  render(
    <ThemeProvider>
      <ThemeModeToggle />
    </ThemeProvider>,
  );

  const lightButton = screen.getByRole("button", { name: "Use light theme" });
  const darkButton = screen.getByRole("button", { name: "Use dark theme" });
  const systemButton = screen.getByRole("button", { name: "Use system theme" });

  expect(systemButton).toHaveAttribute("aria-pressed", "true");

  await user.click(darkButton);

  expect(darkButton).toHaveAttribute("aria-pressed", "true");
  expect(document.documentElement).toHaveClass("dark");
  expect(window.localStorage.getItem("personal-finance-theme")).toBe("dark");

  await user.click(lightButton);

  expect(lightButton).toHaveAttribute("aria-pressed", "true");
  expect(document.documentElement).not.toHaveClass("dark");
  expect(window.localStorage.getItem("personal-finance-theme")).toBe("light");

  await user.click(systemButton);

  expect(systemButton).toHaveAttribute("aria-pressed", "true");
  expect(window.localStorage.getItem("personal-finance-theme")).toBe("system");
});
