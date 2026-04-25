import { act, render, screen, waitFor } from "@testing-library/react";

import { ThemeProvider } from "./theme-provider";
import { useTheme } from "./theme-context";

function mockThemeMedia(initialMatches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    matches: initialMatches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
      if (event === "change") {
        listeners.add(listener);
      }
    }),
    removeEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
      if (event === "change") {
        listeners.delete(listener);
      }
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => mediaQuery),
  });

  return {
    setMatches(matches: boolean) {
      mediaQuery.matches = matches;
      const event = { matches, media: mediaQuery.media } as MediaQueryListEvent;

      listeners.forEach((listener) => listener(event));
    },
  };
}

function ThemeProbe() {
  const { resolvedTheme, setTheme, theme } = useTheme();

  return (
    <div>
      <p>Selected: {theme}</p>
      <p>Resolved: {resolvedTheme}</p>
      <button onClick={() => setTheme("dark")} type="button">
        Dark
      </button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-theme-mode");
  document.documentElement.removeAttribute("style");
});

it("persists an explicit theme selection and applies the resolved theme to the document", async () => {
  mockThemeMedia(false);

  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );

  act(() => {
    screen.getByRole("button", { name: "Dark" }).click();
  });

  await waitFor(() => expect(document.documentElement).toHaveClass("dark"));

  expect(screen.getByText("Selected: dark")).toBeInTheDocument();
  expect(screen.getByText("Resolved: dark")).toBeInTheDocument();
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  expect(document.documentElement).toHaveAttribute("data-theme-mode", "dark");
  expect(window.localStorage.getItem("personal-finance-theme")).toBe("dark");
});

it("uses the system theme fallback and responds to system preference changes", async () => {
  const mediaQuery = mockThemeMedia(false);

  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );

  expect(screen.getByText("Selected: system")).toBeInTheDocument();
  expect(screen.getByText("Resolved: light")).toBeInTheDocument();
  expect(document.documentElement).not.toHaveClass("dark");

  act(() => {
    mediaQuery.setMatches(true);
  });

  await waitFor(() => expect(screen.getByText("Resolved: dark")).toBeInTheDocument());
  expect(document.documentElement).toHaveClass("dark");
  expect(document.documentElement).toHaveAttribute("data-theme-mode", "system");
});
