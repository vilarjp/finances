import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { App } from "@app/app";
import { server } from "@shared/testing/test-server";

beforeEach(() => {
  window.history.pushState({}, "", "/sign-up");
});

it("validates the sign-up form before submitting", async () => {
  const user = userEvent.setup();

  render(<App />);

  await screen.findByRole("heading", { name: "Sign up" });

  await user.click(screen.getByRole("button", { name: "Create account" }));

  expect(await screen.findByText("Enter your name.")).toBeInTheDocument();
  expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
  expect(screen.getByText("Use at least 12 characters.")).toBeInTheDocument();
});

it("creates an account and navigates to the protected home route", async () => {
  const user = userEvent.setup();

  server.use(
    http.post("*/api/auth/signup", () =>
      HttpResponse.json(
        {
          user: {
            id: "user-1",
            name: "Ada Lovelace",
            email: "ada@example.com",
          },
        },
        { status: 201 },
      ),
    ),
  );

  render(<App />);

  await screen.findByRole("heading", { name: "Sign up" });
  await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(screen.getByLabelText("Password"), "correct horse battery staple");
  await user.click(screen.getByRole("button", { name: "Create account" }));

  expect(await screen.findByRole("heading", { name: "Personal Finance" })).toBeInTheDocument();

  await waitFor(() => expect(window.location.pathname).toBe("/"));
  expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
});
