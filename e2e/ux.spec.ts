import { test, expect } from "@playwright/test";
import { seedPlan } from "./_helpers";

test.describe("Unifies UX surfaces", () => {
  test("shows the Focus (Today) view and Insights dashboard", async ({ page }) => {
    await page.goto("/");
    await seedPlan(page);
    await expect(page.getByText(/mission start/i)).toBeVisible();
    await expect(page.getByText(/What's in your plan/i)).toBeVisible();
    await expect(page.getByText("level", { exact: true })).toBeVisible();
  });

  test("opens keyboard shortcuts with Ctrl+?", async ({ page }) => {
    await page.goto("/");
    await seedPlan(page);
    await page.keyboard.press("Control+/");
    const dlg = page.getByRole("dialog", { name: /keyboard shortcuts/i });
    await expect(dlg).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dlg).toHaveCount(0);
  });

  test("has an installable PWA manifest", async ({ page }) => {
    await page.goto("/");
    const res = await page.goto("/manifest.webmanifest");
    expect(res?.status()).toBe(200);
  });

  test("celebrates a phase completion with a toast", async ({ page }) => {
    await page.goto("/");
    await seedPlan(page, "# Demo\n- Learn Git\n- Write a loop");
    // check every item in phase "Demo" (phase id p1)
    const items = page.locator('[data-phase-id="p1"] [data-testid^="check-"]');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      await items.nth(i).click();
    }
    await expect(page.getByRole("status").getByText(/Demo complete/i)).toBeVisible({ timeout: 4000 });
  });
});
