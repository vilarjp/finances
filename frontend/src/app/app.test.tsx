import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { App } from "@app/app";
import type { FinanceRecord } from "@entities/record";
import { clearApiSession } from "@shared/api/http-client";
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

const userAFinanceRecord: FinanceRecord = {
  id: "record-user-a",
  effectiveAt: "2026-04-26T12:00:00.000Z",
  financeDate: "2026-04-26",
  financeMonth: "2026-04",
  type: "expense",
  expenseKind: "daily",
  description: "User A groceries",
  fontColor: "#111827",
  backgroundColor: "#DBEAFE",
  values: [
    {
      id: "record-user-a-value",
      label: "Groceries",
      amountCents: 4500,
      sortOrder: 0,
      createdAt: "2026-04-26T12:00:00.000Z",
      updatedAt: "2026-04-26T12:00:00.000Z",
    },
  ],
  totalAmountCents: 4500,
  createdAt: "2026-04-26T12:00:00.000Z",
  updatedAt: "2026-04-26T12:00:00.000Z",
};

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

it("does not render cached finance data after logging in as a different user", async () => {
  const user = userEvent.setup();
  const userA = {
    id: "user-a",
    name: "Ada Lovelace",
    email: "ada@example.com",
  };
  const userB = {
    id: "user-b",
    name: "Grace Hopper",
    email: "grace@example.com",
  };
  let currentUser: typeof userA | typeof userB | null = userA;
  let resolveUserBRecords: (() => void) | undefined;
  const userBRecordsReady = new Promise<void>((resolve) => {
    resolveUserBRecords = resolve;
  });

  server.use(
    http.get("*/api/auth/me", () => {
      if (!currentUser) {
        return HttpResponse.json({ message: "Unauthenticated" }, { status: 401 });
      }

      return HttpResponse.json({
        user: currentUser,
      });
    }),
    http.get("*/api/records", async () => {
      if (currentUser?.id === "user-b") {
        await userBRecordsReady;
      }

      return HttpResponse.json({
        records: currentUser?.id === "user-a" ? [userAFinanceRecord] : [],
      });
    }),
    http.post("*/api/auth/logout", () => {
      currentUser = null;

      return new HttpResponse(null, { status: 204 });
    }),
    http.post("*/api/auth/login", () => {
      currentUser = userB;

      return HttpResponse.json({
        user: userB,
      });
    }),
  );

  render(<App />);

  expect(await screen.findByText("User A groceries")).toBeInTheDocument();

  const sidebar = screen.getByRole("complementary", {
    name: "Authenticated navigation",
  });

  await user.click(within(sidebar).getByRole("button", { name: "Logout" }));

  expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();

  await user.type(screen.getByLabelText("Email"), "grace@example.com");
  await user.type(screen.getByLabelText("Password"), "correct horse battery staple");
  await user.click(screen.getByRole("button", { name: "Login" }));

  expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
  expect(screen.queryByText("User A groceries")).not.toBeInTheDocument();

  resolveUserBRecords?.();

  expect(await screen.findByText("No records for this month yet.")).toBeInTheDocument();
});

it("clears protected UI when the API session is cleared", async () => {
  mockSignedInUser();
  render(<App />);

  expect(await screen.findByRole("heading", { name: "Personal Finance" })).toBeInTheDocument();
  expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();

  act(() => {
    clearApiSession({ broadcast: false });
  });

  expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
  expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
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
