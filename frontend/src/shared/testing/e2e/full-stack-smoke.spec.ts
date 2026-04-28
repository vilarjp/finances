import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function signUp(page: Page, name: string, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Personal Finance" })).toBeVisible();
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
}

async function login(page: Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: "Personal Finance" })).toBeVisible();
}

async function createRecord(page: Page, description: string) {
  const effectiveDate =
    (await page.locator("main time").first().getAttribute("datetime")) ?? "2026-04-26";

  await page.getByRole("button", { name: "New record" }).click();

  const editor = page.getByRole("dialog", { name: "Create record" });

  await editor.getByLabel("Record description").fill(description);
  await editor.getByLabel("Effective date").fill(effectiveDate);
  await editor.getByLabel("Income").check();
  await editor.getByLabel("Value 1 label").fill("Client work");
  await editor.getByLabel("Value 1 amount cents").fill("250000");
  await editor.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByText(`Saved ${description}.`)).toBeVisible();

  return effectiveDate;
}

function incomeRecordsForDate(page: Page, date: string): Locator {
  return page.getByLabel(`Income records for ${date}`);
}

test("runs a real browser-backend-Mongo smoke workflow", async ({ page }) => {
  const firstUserEmail = uniqueEmail("full-stack-a");
  const secondUserEmail = uniqueEmail("full-stack-b");
  const recordDescription = "Full-stack consulting";

  await signUp(page, "Full Stack A", firstUserEmail);
  const recordDate = await createRecord(page, recordDescription);

  await page.reload();
  await expect(incomeRecordsForDate(page, recordDate).getByText(recordDescription)).toBeVisible();

  await logout(page);
  await signUp(page, "Full Stack B", secondUserEmail);

  await expect(incomeRecordsForDate(page, recordDate).getByText(recordDescription)).toHaveCount(0);

  await logout(page);
  await login(page, firstUserEmail);

  await expect(incomeRecordsForDate(page, recordDate).getByText(recordDescription)).toBeVisible();
});
