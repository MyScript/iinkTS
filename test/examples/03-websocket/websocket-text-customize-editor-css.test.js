import { test, expect } from "@playwright/test"
import { waitForEditorWebSocket, callEditorIdle } from "../helper"
import TextNavActions from "../_partials/text-nav-actions"

test.describe("Websocket Styling editor style", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_customize_editor_css.html")
    await waitForEditorWebSocket(page)
    await callEditorIdle(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Styling editor style")
  })

  TextNavActions.test({ skipClear: true, resultLocator: ".prompter-container" })
})
