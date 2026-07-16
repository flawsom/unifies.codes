// E2E: command palette (⌘K) search + navigation.
// Verifies the palette opens with the keyboard shortcut, filters across the
// whole curriculum, navigates to the selected item's section, and closes on
// Escape. Runs against a production preview build (see playwright.config.js).
import { test, expect } from "@playwright/test";

test.describe("Command palette", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the app shell to render.
    await expect(page.getByTestId("command-palette-overlay")).toHaveCount(0);
  });

  test("opens with Ctrl+K and closes with Escape", async ({ page }) => {
    await page.keyboard.press("Control+k");
    const overlay = page.getByTestId("command-palette-overlay");
    await expect(overlay).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(overlay).toHaveCount(0);
  });

  test("filters items and navigates to the selected section", async ({ page }) => {
    await page.keyboard.press("Control+k");
    const input = page.getByTestId("command-palette-input");
    await expect(input).toBeVisible();

    // Search for the RAG milestone (Phase 4 — AI-Native Stack).
    await input.fill("RAG");
    const items = page.getByTestId("command-palette-item");
    await expect(items.first()).toBeVisible();
    await expect(items.first()).toContainText("RAG");

    // Selecting it should close the palette and jump to the AI-Native section.
    await items.first().click();
    await expect(page.getByTestId("command-palette-overlay")).toHaveCount(0);

    const aiSection = page.getByTestId("phase-section").filter({ hasText: "AI-Native Stack" });
    await expect(aiSection).toBeVisible();
  });

  test("shows no matches for gibberish", async ({ page }) => {
    await page.keyboard.press("Control+k");
    const input = page.getByTestId("command-palette-input");
    await input.fill("zzzqqq_nomatch");
    await expect(page.getByText("No matches")).toBeVisible();
  });
});
