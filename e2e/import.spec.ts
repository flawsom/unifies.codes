import { test, expect } from "@playwright/test";

test.describe("Unifies — curriculum import & AI gap analysis", () => {
  test("import screen appears with no plan, analyzes offline, and shows gap analysis", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("curriculum-input");
    await expect(input).toBeVisible();

    await input.fill(
      "# Phase 1: Python\n- Variables and types\n- Functions\n\n# Phase 2: Web\n- HTTP and REST"
    );
    await page.getByTestId("analyze-btn").click();

    // Gap analysis preview should appear (offline planner when no /api/analyze).
    const preview = page.getByTestId("analysis-preview");
    await expect(preview).toBeVisible({ timeout: 10000 });

    // It should report what the user included and what Unifies added.
    await expect(preview.getByText(/Your curriculum included/i)).toBeVisible();
    await expect(preview.getByText(/Unifies added \d+ item/i)).toBeVisible();

    // Commit the plan.
    await page.getByTestId("use-plan-btn").click();
    await expect(page.getByText(/Your curriculum, intelligently tracked/i)).toBeVisible();
  });

  test("revision & skip is available after a plan is used", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/");
    await page.getByTestId("curriculum-input").fill("# A\n- Learn Git\n- Write a loop");
    await page.getByTestId("analyze-btn").click();
    await page.getByTestId("use-plan-btn").click();
    await page.getByTestId("revision-toggle").waitFor({ state: "visible" });
    await page.getByTestId("revision-toggle").click({ force: true });
    await page.waitForTimeout(800);
    if (errors.length) console.log("PAGE ERRORS:", errors);
    await expect(page.getByTestId("revision-view")).toBeVisible({ timeout: 5000 });
  });
});
