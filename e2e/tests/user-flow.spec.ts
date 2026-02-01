import { test, expect } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";

test.describe("Single User Flow", () => {
  test("user can create a blank diagram and add shapes", async ({ page }) => {
    // Navigate to the app
    await page.goto(baseURL);

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    // Verify we're on the welcome page and Blank Canvas template is visible
    const blankCanvasHeading = page.getByRole("heading", {
      name: "Blank Canvas",
    });
    await expect(blankCanvasHeading).toBeVisible({ timeout: 10000 });

    // Click on "Blank Canvas" template (click the parent div)
    await blankCanvasHeading.locator("..").click();

    // Verify we're in the editor - palette should be visible
    await expect(page.locator(".djs-palette-entries")).toBeVisible();

    // Click "Create start event" tool in palette
    await page.getByTitle("Create start event").click();

    // Click on canvas to place the start event (circle)
    await page.getByRole("img").click();

    // Verify the start event (circle/rect) is visible
    await expect(page.locator("rect")).toBeVisible();

    // Click "Append task" to add a task shape connected to the start event
    await page.getByTitle("Append task").click();

    // Fill in the task with text "test"
    await page.locator(".djs-direct-editing-content").fill("test");

    // Verify the text "test" is visible in the diagram
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^test$/ })
        .first(),
    ).toBeVisible();
    await expect(page.locator("#root")).toContainText("test");
  });

  test("user can open a template and edit its contents", async ({ page }) => {
    // Navigate to the app
    await page.goto(baseURL);

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    // Verify Cross-Functional template is visible and click it
    const crossFunctionalTemplate = page.getByText("Cross-FunctionalMultiple");
    await expect(crossFunctionalTemplate).toBeVisible({ timeout: 10000 });
    await crossFunctionalTemplate.click();

    // Verify the editor loaded with template content
    await expect(page.locator(".djs-palette-entries")).toBeVisible();

    // Verify template shapes are loaded (check for key text elements)
    await expect(page.locator("#root")).toContainText("Customer");
    await expect(page.locator("#root")).toContainText("Sales");
    await expect(page.locator("#root")).toContainText("Fulfillment");
    await expect(page.locator("#root")).toContainText("Place Order");

    // Wait a moment for the diagram to fully render
    await page.waitForTimeout(1000);

    // Select an existing shape by clicking on a task/shape visual element
    // Click on "Ship Product" shape by clicking on its visual container
    const shipProductShape = page
      .locator(".djs-element")
      .filter({ hasText: "Ship Product" })
      .first();
    await shipProductShape.click({ force: true });

    // Now append a task to the selected shape
    await page.getByTitle("Append task").click();

    // Fill in the new task with text
    await page.locator(".djs-direct-editing-content").fill("Track Shipment");

    // Verify the new task text is visible
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Track Shipment$/ })
        .first(),
    ).toBeVisible();
    await expect(page.locator("#root")).toContainText("Track Shipment");

    // Click on the Track Shipment text to select that shape
    const trackShipmentText = page.locator("text=Track Shipment").first();
    await trackShipmentText.click();

    // Delete the selected shape
    await page.getByTitle("Delete").click();

    // Verify "Track Shipment" is no longer in the diagram (element was deleted)
    await expect(page.locator("#root")).not.toContainText("Track Shipment");

    // Add a data store reference from palette
    await page.getByTitle("Create data store reference").click();
    await page.getByRole("img").click();

    // Connect shapes: click on a shape, use connect tool, click on another shape
    const processOrderShape = page
      .locator(".djs-element")
      .filter({ hasText: "Process Order" })
      .first();
    await processOrderShape.click({ force: true });
    await page.getByTitle("Connect to other element").click();

    const receiveOrderShape = page
      .locator(".djs-element")
      .filter({ hasText: "Receive Order" })
      .first();
    await receiveOrderShape.click({ force: true });

    // Verify the template still contains the original content
    await expect(page.locator("#root")).toContainText("Customer");
    await expect(page.locator("#root")).toContainText("Place Order");
    await expect(page.locator("#root")).toContainText("Ship Product");
  });

  test("two users can collaborate on the same diagram", async ({ browser }) => {
    // Create two separate browser contexts (two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1: Navigate to welcome page and select a template with content
      await page1.goto(baseURL);
      await page1.waitForLoadState("networkidle");

      // User 1 selects the Cross-Functional template (has pre-existing content)
      const crossFunctionalTemplate = page1.getByText(
        "Cross-FunctionalMultiple",
      );
      await expect(crossFunctionalTemplate).toBeVisible({ timeout: 10000 });
      await crossFunctionalTemplate.click();

      // Verify User 1 is in the editor
      await expect(page1.locator(".djs-palette-entries")).toBeVisible();

      // Verify User 1 sees the template content
      await expect(page1.locator("#root")).toContainText("Customer");
      await expect(page1.locator("#root")).toContainText("Sales");

      // User 2: Navigate to the base URL
      await page2.goto(baseURL);
      await page2.waitForLoadState("networkidle");

      // User 2 should see a different welcome screen - collaboration in progress
      // Look for the Join button instead of templates
      const joinButton = page2.getByRole("button", { name: /join/i });
      await expect(joinButton).toBeVisible({ timeout: 10000 });
      await joinButton.click();

      // Verify User 2 is now in the editor
      await expect(page2.locator(".djs-palette-entries")).toBeVisible({
        timeout: 10000,
      });

      // Wait for WebSocket connections to fully establish
      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // Verify both users see "Online Users (2)" in the user list
      await expect(page1.locator("text=/Online Users \\(2\\)/i")).toBeVisible({
        timeout: 5000,
      });
      await expect(page2.locator("text=/Online Users \\(2\\)/i")).toBeVisible({
        timeout: 5000,
      });

      // Verify both users can see the same template content
      await expect(page1.locator("#root")).toContainText("Customer");
      await expect(page1.locator("#root")).toContainText("Sales");
      await expect(page1.locator("#root")).toContainText("Place Order");

      await expect(page2.locator("#root")).toContainText("Customer");
      await expect(page2.locator("#root")).toContainText("Sales");
      await expect(page2.locator("#root")).toContainText("Place Order");
    } finally {
      // Clean up contexts
      await context1.close();
      await context2.close();
    }
  });

  test("two users can collaborate with real-time editing", async ({
    browser,
  }) => {
    // Create two separate browser contexts (two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1: Navigate to welcome page and select Simple Process template
      await page1.goto(baseURL);
      await page1.waitForLoadState("networkidle");

      const simpleProcessTemplate = page1.getByText("Simple ProcessLinear");
      await expect(simpleProcessTemplate).toBeVisible({ timeout: 10000 });
      await simpleProcessTemplate.click();

      // Verify User 1 is in the editor and sees the template
      await expect(page1.locator(".djs-palette-entries")).toBeVisible();
      await expect(page1.locator("#root")).toContainText("Start");

      // User 2: Join the session
      await page2.goto(baseURL);
      await page2.waitForLoadState("networkidle");

      const joinButton = page2.getByRole("button", { name: /join/i });
      await expect(joinButton).toBeVisible({ timeout: 10000 });
      await joinButton.click();

      // Verify User 2 is in the editor
      await expect(page2.locator(".djs-palette-entries")).toBeVisible({
        timeout: 10000,
      });

      // Wait for WebSocket connections to establish
      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // User 2: Edit the diagram - add a new task with text "Collaborative Task"
      const existingShape = page2
        .locator(".djs-element")
        .filter({ hasText: "Task" })
        .first();
      await existingShape.click({ force: true });
      await page2.getByTitle("Append task").click();
      await page2
        .locator(".djs-direct-editing-content")
        .fill("Collaborative Task");

      // Press Enter to commit the text edit
      await page2.keyboard.press("Enter");

      // Wait for the edit to propagate through WebSocket
      await page1.waitForTimeout(3000);
      await page2.waitForTimeout(3000);

      // Verify User 2 sees the new task
      await expect(page2.locator("#root")).toContainText("Collaborative Task");

      // Verify User 1 ALSO sees the new task (real-time collaboration!)
      await expect(page1.locator("#root")).toContainText("Collaborative Task", {
        timeout: 10000,
      });
    } finally {
      // Clean up contexts
      await context1.close();
      await context2.close();
    }
  });
});
