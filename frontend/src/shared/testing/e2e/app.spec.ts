import { expect, test } from "@playwright/test";

test("loads the frontend shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(page.getByLabel("Primary").getByRole("link", { name: "Login" })).toBeVisible();
});

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
]) {
  test(`keeps auth screens usable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);

    for (const path of ["/login", "/sign-up"]) {
      await page.goto(path);

      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.locator("form")).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(viewport.width);
    }
  });
}
