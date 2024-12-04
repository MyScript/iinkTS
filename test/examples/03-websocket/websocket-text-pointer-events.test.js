import { test, expect } from "@playwright/test"
import { waitForEditorInit, waitForExportedEvent, callEditorIdle } from "../helper"

test.describe("Websocket Text Pointer Events", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_pointer_events.html")
    await waitForEditorInit(page)
    await callEditorIdle(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Pointer events")
  })

  test("should import points with button", async ({ page }) => {
    const [exports] = await Promise.all([
        waitForExportedEvent(page),
        page.locator("#pointerEvents").click(),
    ])
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).toStrictEqual("A")
  })
})
