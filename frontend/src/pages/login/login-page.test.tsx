import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { App } from "@app/app";
import { server } from "@shared/testing/test-server";

beforeEach(() => {
  window.history.pushState({}, "", "/login");
});

it("validates the login form before submitting", async () => {
  const user = userEvent.setup();

  render(<App />);

  await screen.findByRole("heading", { name: "Login" });

  await user.click(screen.getByRole("button", { name: "Login" }));

  expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  expect(screen.getByText("Enter your password.")).toBeInTheDocument();
});

it("shows the backend login error message", async () => {
  const user = userEvent.setup();

  server.use(
    http.post("*/api/auth/login", () =>
      HttpResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email or password is invalid.",
          },
        },
        { status: 401 },
      ),
    ),
  );

  render(<App />);

  await screen.findByRole("heading", { name: "Login" });
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(screen.getByLabelText("Password"), "wrong-password");
  await user.click(screen.getByRole("button", { name: "Login" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is invalid.");
});

it("logs in and navigates to the protected home route", async () => {
  const user = userEvent.setup();

  server.use(
    http.post("*/api/auth/login", () =>
      HttpResponse.json({
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      }),
    ),
  );

  render(<App />);

  await screen.findByRole("heading", { name: "Login" });
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(screen.getByLabelText("Password"), "correct horse battery staple");
  await user.click(screen.getByRole("button", { name: "Login" }));

  expect(await screen.findByRole("heading", { name: "Personal Finance" })).toBeInTheDocument();

  await waitFor(() => expect(window.location.pathname).toBe("/"));
  expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
});
