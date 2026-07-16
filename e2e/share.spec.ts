// E2E: theme toggle + share read-only flow (live data only, no demo).
import { test, expect } from "@playwright/test";

test.describe("Theme + sharing", () => {
  test("toggles between dark and light", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    // Default is dark.
    await expect(html).toHaveClass(/dark/);

    await page.getByRole("button", { name: /toggle color theme/i }).click();
    await expect(html).toHaveClass(/light/);

    await page.getByRole("button", { name: /toggle color theme/i }).click();
    await expect(html).toHaveClass(/dark/);
  });

  test("opens a read-only shared profile via ?u= (guest, localStorage)", async ({ page }) => {
    // Publish a share from the app (guest mode writes to localStorage).
    await page.goto("/");
    await page.getByRole("button", { name: /share progress/i }).click();
    const input = page.getByPlaceholder(/pick a handle/i);
    await input.fill("demo-dev");
    await page.getByRole("button", { name: /create link/i }).click();

    const link = await page.getByTestId("command-palette-overlay").count(); // noop guard
    const urlInput = page.locator('input[readonly]');
    const href = await urlInput.inputValue();
    expect(href).toContain("?u=demo-dev");

    // Open the shared link in a fresh context (same origin => localStorage).
    await page.goto(href);
    await expect(page.getByText(/read-only shared progress/i)).toBeVisible();
  });
});
