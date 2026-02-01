import { test, expect } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";

test.describe("Smoke Tests", () => {
  test("should load the welcome page with template selector", async ({
    page,
  }) => {
    await page.goto(baseURL);
    await page.waitForLoadState("networkidle");

    // Check page loaded with heading
    await expect(page.locator("h1")).toContainText("BPMN");

    // Check page content shows templates or join button
    const pageContent = await page.content();
    const hasTemplates =
      pageContent.includes("Blank Canvas") ||
      pageContent.includes("Simple Process");
    const hasJoinButton = pageContent.includes("Join Collaboration");

    expect(hasTemplates || hasJoinButton).toBe(true);
  });
});
