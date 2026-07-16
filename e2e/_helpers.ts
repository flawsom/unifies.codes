import { Page, expect } from "@playwright/test";

// Unifies opens the import screen when no plan exists. Most E2E specs exercise
// the tracker, so they need to seed a plan first. This helper pastes a tiny
// curriculum and commits it via the offline planner (no /api/analyze needed).
export async function seedPlan(page: Page, text = "# Demo\n- Learn Git\n- Write a loop") {
  const input = page.getByTestId("curriculum-input");
  await input.fill(text);
  await page.getByTestId("analyze-btn").click();
  await page.getByTestId("use-plan-btn").click({ timeout: 15000 });
  await expect(page.getByText(/Your curriculum, intelligently tracked/i)).toBeVisible();
}
