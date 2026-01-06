import { test, expect } from "@playwright/test"
import {
  waitForExportedEvent,
  getEditorExports,
  writeStrokes,
  passModalKey
} from "../helper"
import h from '../__dataset__/h'

test.describe("Websocket Text Pointer Events", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/websocket/websocket_text_pointer_events.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Pointer events")
  })

  test("should export application/vnd.myscript.jiix", async ({ page }) => {
    await test.step("write strokes", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes),
      ])
    })
    await expect(page.locator("#result")).toHaveText(
      h.exports["text/plain"].at(-1)
    )
    const exports = await getEditorExports(page)
    const jiixExpected = h.exports["application/vnd.myscript.jiix"]
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived).toEqual(jiixExpected)
    expect(jiixReceived.label).toEqual(jiixExpected.label)
  })
})
