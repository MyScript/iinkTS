import { test, expect } from "@playwright/test"
import { waitForEditorInit, callEditorIdle } from "../helper"
import TextNavActions from "../_partials/text-nav-actions"

test.describe("Websocket Styling editor style", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_customize_editor_css.html")
    await waitForEditorInit(page)
    await callEditorIdle(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Styling editor style")
  })

  TextNavActions.test({ skipClear: true, resultLocator: ".prompter-container" })
})
