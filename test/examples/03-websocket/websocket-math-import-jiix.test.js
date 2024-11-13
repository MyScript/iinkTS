import { test, expect } from "@playwright/test"
import {
  waitForEditorWebSocket,
  getEditorExportsType,
  haveSameLabels,
  waitForImportedEvent
} from "../helper"

test.describe("Websocket Math Import JIIX", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_math_import_jiix.html")
    await waitForEditorWebSocket(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Import math with JIIX")
  })

  test("should import JIIX", async ({ page }) => {
    await Promise.all([
      waitForImportedEvent(page),
      page.click("#import")
    ])

    const jiix = await getEditorExportsType(page, "application/vnd.myscript.jiix")
    const jiixTextToImport = await page.locator("#jiix").textContent()
    const jiixToImport = JSON.parse(jiixTextToImport)
    expect(haveSameLabels(jiix, jiixToImport)).toEqual(true)
  })

})
