import { expect, test } from "@playwright/test";

test("loads the frontend shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Personal Finance" })).toBeVisible();
  await expect(page.getByLabel("Primary").getByRole("link", { name: "Login" })).toBeVisible();
});
