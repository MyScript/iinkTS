import { test, expect } from "@playwright/test"
import { writeStrokes, waitForExportedEvent, passModalKey } from "../helper"
import h from "../__dataset__/h"

function hexToRgbA(hex) {
  let c
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split("")
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }
    c = "0x" + c.join("")
    return (
      "rgba(" + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(", ") + ", 1)"
    )
  }
  throw new Error("Bad Hex")
}

test.describe("Websocket Text Customize Stroke Style", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_customize_stroke_style.html")
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Websocket Text Styling")
  })

  test("should draw stroke with DefaultTheme", async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])
    const defaultThemeColor = await page.evaluate("editorEl.editor.theme.ink.color")
    const path = page.locator(`path[fill="${hexToRgbA(defaultThemeColor)}"]`)
    expect(await path.count()).toEqual(1)
  })

  test("should draw stroke with penStyleClasses", async ({ page }) => {
    await page.locator("#penStyleClasses").check()

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    const editorTheme = await page.evaluate("editorEl.editor.theme")
    const editorPenStyleClasses = await page.evaluate("editorEl.editor.penStyleClasses")
    const penColorExpected = editorTheme[`.${editorPenStyleClasses}`].color
    expect(await page.locator(`path[fill="${hexToRgbA(penColorExpected)}"]`).count()).toEqual(1)
  })

  test("should draw stroke with theme", async ({ page }) => {
    await page.selectOption("#theme", "bold-red"),

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    const editorTheme = await page.evaluate("editorEl.editor.theme")
    const penColorExpected = editorTheme.ink.color
    const path = page.locator(`path[fill="${hexToRgbA(penColorExpected)}"]`)
    expect(await path.count()).toEqual(1)
  })

  test("should draw stroke with default penStyle", async ({ page }) => {
    const penColor = page.locator("#pencolor")
    const penWidth = page.locator("#penwidth")
    const enablePenStyle = page.locator("#penenabled")

    await expect(penColor).toBeDisabled()
    await expect(penWidth).toBeDisabled()
    await enablePenStyle.click()
    await expect(enablePenStyle).toBeChecked()

    await expect(penColor).toBeEnabled()
    await expect(penWidth).toBeEnabled()

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    const editorPenStyle = await page.evaluate("editorEl.editor.penStyle")
    const path = page.locator(`path[fill="${hexToRgbA(editorPenStyle.color)}"]`)
    expect(await path.count()).toEqual(1)

    await enablePenStyle.click()
    await expect(enablePenStyle).not.toBeChecked()
    await expect(penColor).toBeDisabled()
    await expect(penWidth).toBeDisabled()
  })

  test("should draw stroke with selected penStyle", async ({ page }) => {
    const penColorExpected = "#1a5fb4"
    await expect(page.locator("#pencolor")).toBeDisabled()
    await expect(page.locator("#penwidth")).toBeDisabled()

    await page.locator("#penenabled").click()
    await expect(page.locator("#pencolor")).toBeEnabled()
    await expect(page.locator("#penwidth")).toBeEnabled()

    await page.fill("#pencolor", penColorExpected)

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    const path = page.locator(`path[fill="${hexToRgbA(penColorExpected)}"]`)
    expect(await path.count()).toEqual(1)
  })
})
