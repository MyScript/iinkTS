import { test, expect } from "@playwright/test"
import { waitForEditorInit, passModalKey } from "../helper"
import TextNavActions from "../_partials/text-nav-actions"

test.describe("Websocket Text Search Without Smartguide", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_no_guides.html")
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("No guides")
  })

  test("should not see guides", async ({ page }) => {
    await expect(page.locator("line")).toHaveCount(0)
  })

  TextNavActions.test({ skipClear: true, resultLocator: ".prompter-container" })
})
