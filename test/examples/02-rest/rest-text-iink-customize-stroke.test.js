import { test, expect } from "@playwright/test"
import {
  waitForEditorInit,
  waitForExportedEvent,
  writeStrokes
} from "../helper"
import h from "../__dataset__/h"

test.describe("Rest Text Styling", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/rest/rest_text_iink_customize_stroke_style.html")
    await waitForEditorInit(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Rest Text Styling")
  })

  test("should display text/plain into result", async ({ page }) => {
    const [exportedDatas] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])
    await expect(page.locator("#result")).toHaveText(exportedDatas["text/plain"])
    expect(exportedDatas["text/plain"]).toStrictEqual(h.exports["text/plain"].at(-1))
  })

  test("should draw stroke with penStyleEnabled", async ({ page }) => {
    await page.click("#penenabled")

    const [exportedDatas] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    await expect(page.locator("#result")).toHaveText(exportedDatas["text/plain"])
    expect(exportedDatas["text/plain"]).toStrictEqual(h.exports["text/plain"].at(-1))
  })

  test("should draw stroke with different color and width of ink", async ({ page }) => {
    await page.click("#penenabled")
    await page.locator("#pencolor").fill("#1a5fb4")
    await page.locator("#penwidth").fill("5")
    const [exportedDatas] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])
    const style = await page.evaluate("editor.styleManager.penStyle")
    expect(style).toEqual({ color: "#1a5fb4", "-myscript-pen-width": "5" })

    await expect(page.locator("#result")).toHaveText(exportedDatas["text/plain"])
    expect(exportedDatas["text/plain"]).toStrictEqual(h.exports["text/plain"].at(-1))
  })

  test("should draw stroke with default penStyle", async ({ page }) => {
    await expect(page.locator("#pencolor")).toBeDisabled()
    await expect(page.locator("#penwidth")).toBeDisabled()
    await page.setChecked("#penenabled", true)
    await expect(page.locator("#pencolor")).toBeEnabled()
    await expect(page.locator("#penwidth")).toBeEnabled()

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    await page.setChecked("#penenabled", false)
    await expect(page.locator("#pencolor")).toBeDisabled()
    await expect(page.locator("#penwidth")).toBeDisabled()
  })
})
