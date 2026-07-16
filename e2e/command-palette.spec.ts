import { test, expect } from "@playwright/test";
import { seedPlan } from "./_helpers";

test.describe("Command palette", () => {
  test("opens with Ctrl+K and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await seedPlan(page);
    await page.keyboard.press("Control+k");
    const palette = page.getByRole("dialog", { name: /command palette/i });
    await expect(palette).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(palette).toHaveCount(0);
  });

  test("filters items and navigates to the selected section", async ({ page }) => {
    await page.goto("/");
    await seedPlan(page);
    await page.keyboard.press("Control+k");
    const palette = page.getByRole("dialog", { name: /command palette/i });
    await expect(palette).toBeVisible();
    await palette.getByTestId("command-palette-input").fill("git");
    await palette.getByTestId("command-palette-item").first().click();
    await expect(page.getByText(/Learn Git/i)).toBeVisible();
  });

  test("shows no matches for gibberish", async ({ page }) => {
    await page.goto("/");
    await seedPlan(page);
    await page.keyboard.press("Control+k");
    const palette = page.getByRole("dialog", { name: /command palette/i });
    await expect(palette).toBeVisible();
    await palette.getByTestId("command-palette-input").fill("zzzzzzz");
    await expect(palette.getByText(/no matches/i)).toBeVisible();
  });
});
