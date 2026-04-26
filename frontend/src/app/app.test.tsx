import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function mockSignedInUser() {
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
}

it("renders authenticated sidebar navigation and supports collapse plus route changes", async () => {
  const user = userEvent.setup();

  mockSignedInUser();
  render(<App />);

  expect(await screen.findByRole("heading", { name: "Personal Finance" })).toBeInTheDocument();

  const sidebar = screen.getByRole("complementary", { name: "Authenticated navigation" });

  expect(within(sidebar).getByText("Ada Lovelace")).toBeInTheDocument();
  expect(within(sidebar).getByRole("link", { name: "Home" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(within(sidebar).getByRole("button", { name: "New record" })).toBeInTheDocument();

  await user.click(within(sidebar).getByRole("button", { name: "Collapse sidebar" }));

  expect(within(sidebar).getByRole("button", { name: "Expand sidebar" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  await user.click(within(sidebar).getByRole("link", { name: "Monthly" }));

  expect(await screen.findByRole("heading", { name: "Monthly view" })).toBeInTheDocument();
  expect(window.location.pathname).toBe("/monthly");
  expect(within(sidebar).getByRole("link", { name: "Monthly" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

it("logs out from the authenticated sidebar and returns to login", async () => {
  const user = userEvent.setup();
  let logoutRequestCount = 0;

  mockSignedInUser();
  server.use(
    http.post("*/api/auth/logout", () => {
      logoutRequestCount += 1;

      return new HttpResponse(null, { status: 204 });
    }),
  );
  render(<App />);

  const sidebar = await screen.findByRole("complementary", {
    name: "Authenticated navigation",
  });

  await user.click(within(sidebar).getByRole("button", { name: "Logout" }));

  expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
  expect(window.location.pathname).toBe("/login");
  await waitFor(() => expect(logoutRequestCount).toBe(1));
});

it("opens and closes the mobile navigation dialog and starts a record from the floating action", async () => {
  const user = userEvent.setup();

  mockSignedInUser();
  render(<App />);

  expect(await screen.findByRole("heading", { name: "Personal Finance" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Open navigation menu" }));

  const dialog = await screen.findByRole("dialog", { name: "Navigation menu" });
  const closeButton = within(dialog).getByRole("button", { name: "Close navigation menu" });

  expect(closeButton).toHaveFocus();

  await user.keyboard("{Escape}");

  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Navigation menu" })).not.toBeInTheDocument(),
  );

  await user.click(screen.getByRole("button", { name: "New record from mobile shortcut" }));

  expect(await screen.findByRole("dialog", { name: "Create record" })).toBeInTheDocument();
});
