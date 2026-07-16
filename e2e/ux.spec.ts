// E2E: new UX surfaces — Focus view, Insights, shortcuts help, PWA manifest.
import { test, expect } from "@playwright/test";

test.describe("UX surfaces", () => {
  test("shows the Focus (Today) view and Insights dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Day \d+ of 90|Set your/i).first()).toBeVisible();
    await expect(page.getByText("Insights")).toBeVisible();
  });

  test("opens keyboard shortcuts with Ctrl+?", async ({ page }) => {
    await page.goto("/");
    await page.locator("body").click();
    await page.keyboard.press("Control+/");
    await expect(page.getByRole("dialog", { name: /keyboard shortcuts/i }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /keyboard shortcuts/i })).toHaveCount(0);
  });

  test("has an installable PWA manifest", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    const manifest = await page.evaluate(async () => {
      const link = document.querySelector('link[rel="manifest"]');
      if (!link) return null;
      const res = await fetch(link.getAttribute("href"));
      return res.ok ? await res.json() : null;
    });
    expect(manifest).not.toBeNull();
    expect(manifest.name).toMatch(/FDE Tracker/);
    expect(manifest.display).toBe("standalone");
  });

  test("celebrates a phase completion with a toast", async ({ page }) => {
    await page.goto("/");
    // Check every item in the first phase so a phase hits 100% -> celebrate toast.
    const checkboxes = page.locator('section[data-phase-id="p1"] button[aria-pressed]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const btn = page.locator('section[data-phase-id="p1"] button[aria-pressed]').nth(i);
      const pressed = await btn.getAttribute("aria-pressed");
      if (pressed === "false") await btn.click();
    }
    await expect(page.getByRole("status").getByText(/Python Foundations complete/i)).toBeVisible({ timeout: 4000 });
  });
});
