import { test, expect } from "@playwright/test"
import {
  callEditorIdle,
  getEditorExports,
  writeStrokes,
  passModalKey,
} from "../helper"
import hello from "../__dataset__/helloOneStroke"

test.describe("Websocket on-demand export", function () {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_export_on_demand.html")
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Websocket on-demand export")
  })

  test("should only export on click", async ({ page }) => {
    await writeStrokes(page, hello.strokes)
    await callEditorIdle(page)
    const noExport = await getEditorExports(page)
    expect(noExport).toBeUndefined()
    await expect(page.locator("#result")).toBeEmpty()

    await page.click("#export")
    await callEditorIdle(page)
    const exports = await getEditorExports(page)
    const jiix = exports["application/vnd.myscript.jiix"]
    expect(jiix.label).toEqual(hello.exports["text/plain"].at(-1))
    await expect(page.locator("#result")).toHaveText(
      hello.exports["text/plain"].at(-1)
    )
  })
})
