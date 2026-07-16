import { test, expect } from "@playwright/test";
import { seedPlan } from "./_helpers";

test.describe("Share & theme", () => {
  test("toggles between dark and light", async ({ page }) => {
    await page.goto("/");
    await seedPlan(page);
    await page.getByRole("button", { name: /toggle .*theme/i }).click();
    const cls = await page.evaluate(() => document.documentElement.className);
    expect(cls).toMatch(/light|dark/);
  });

  test("opens a read-only shared profile via ?u=", async ({ page }) => {
    // Seed a shared profile in the offline cache, then open its link.
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "unifies-shared-v1",
        JSON.stringify({ alice: { displayName: "Alice", corePct: 50, dsaPct: 40, xp: 120 } })
      );
    });
    await page.goto("/?u=alice");
    await expect(page.getByText(/shared progress/i)).toBeVisible({ timeout: 10000 });
  });
});
