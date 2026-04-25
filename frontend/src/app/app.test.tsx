import { render, screen, within } from "@testing-library/react";

import { App } from "@app/app";

it("renders the application shell with public navigation", async () => {
  render(<App />);

  expect(await screen.findByRole("heading", { name: "Personal Finance" })).toBeInTheDocument();

  const primaryNavigation = screen.getByRole("navigation", { name: "Primary" });

  expect(within(primaryNavigation).getByRole("link", { name: "Login" })).toHaveAttribute(
    "href",
    "/login",
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Sign up" })).toHaveAttribute(
    "href",
    "/sign-up",
  );
});
