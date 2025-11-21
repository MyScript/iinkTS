import { test, expect } from "@playwright/test"
import {
  waitForExportedEvent,
  passModalKey,
} from "../helper"
import TextNavActions from "../_partials/text-nav-actions"

test.describe("Websocket Text Import Content", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_import_content.html")
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Import content")
  })

  test("should import text hello", async ({ page }) => {
    await page.locator("#importContentField").fill("hello")
    await page.locator("#importContent").click()
    const prompterText = page.locator(".prompter-text")
    await expect(prompterText).toHaveText("hello")
  })

  test("should import text pony", async ({ page }) => {
    await Promise.all([
      page.locator("#importContentField").fill("pony"),
      page.locator("#importContent").click(),
      waitForExportedEvent(page),
    ])

    await expect(page.locator(".prompter-text")).toHaveText("pony")
  })

  TextNavActions.test({ skipClear: true, resultLocator: ".prompter-container" })
})
