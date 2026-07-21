import { test, expect } from "@playwright/test"
import {
  waitForExportedEvent,
  writeStrokes,
  passModalKey
} from "../helper"
import h from "../__dataset__/h"

test.describe("Ink Canvas Text Styling", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/canvas/canvas_v1_text_styling.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Ink Canvas Text Styling")
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
    await page.locator("#penenabled").setChecked(true)

    const [exportedDatas] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    await expect(page.locator("#result")).toHaveText(exportedDatas["text/plain"])
    expect(exportedDatas["text/plain"]).toStrictEqual(h.exports["text/plain"].at(-1))
  })

  test("should draw stroke with different color and width of ink", async ({ page }) => {
    await page.locator("#penenabled").setChecked(true)
    await page.locator("#pencolor").fill("#1a5fb4")
    await page.locator("#penwidth").fill("5")
    const [exportedDatas] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])
    const style = await page.evaluate("rootEl.iink.styleManager.penStyle")
    expect(style).toEqual({ color: "#1a5fb4", "-myscript-pen-width": "5" })

    await expect(page.locator("#result")).toHaveText(exportedDatas["text/plain"])
    expect(exportedDatas["text/plain"]).toStrictEqual(h.exports["text/plain"].at(-1))
  })

  test("should draw stroke with default penStyle", async ({ page }) => {
    await expect(page.locator("#pencolor")).toBeDisabled()
    await expect(page.locator("#penwidth")).toBeDisabled()
    await page.locator("#penenabled").setChecked(true)
    await expect(page.locator("#pencolor")).toBeEnabled()
    await expect(page.locator("#penwidth")).toBeEnabled()

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    await page.locator("#penenabled").setChecked(false)
    await expect(page.locator("#pencolor")).toBeDisabled()
    await expect(page.locator("#penwidth")).toBeDisabled()
  })
})
