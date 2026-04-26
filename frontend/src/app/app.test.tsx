import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { App } from "@app/app";
import { server } from "@shared/testing/test-server";

beforeEach(() => {
  window.history.pushState({}, "", "/");
});

it("redirects signed-out users from the protected home route to login", async () => {
  render(<App />);

  expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
  expect(window.location.pathname).toBe("/login");

  const primaryNavigation = screen.getByRole("navigation", { name: "Primary" });

  expect(within(primaryNavigation).getByRole("link", { name: "Login" })).toHaveAttribute(
    "href",
    "/login",
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Sign up" })).toHaveAttribute(
    "href",
    "/sign-up",
  );
  expect(
    within(primaryNavigation).getByRole("group", { name: "Theme preference" }),
  ).toBeInTheDocument();
});

it("redirects signed-in users away from public auth routes", async () => {
  server.use(
    http.get("*/api/auth/me", () =>
      HttpResponse.json({
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      }),
    ),
  );
  window.history.pushState({}, "", "/login");

  render(<App />);

  expect(await screen.findByRole("heading", { name: "Personal Finance" })).toBeInTheDocument();
  expect(window.location.pathname).toBe("/");
  expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
});
