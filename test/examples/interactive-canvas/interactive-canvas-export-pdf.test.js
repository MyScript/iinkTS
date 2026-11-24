import { test, expect } from "@playwright/test"
import { boundsOf, callCanvasIdle, passModalKey, writePointers, writeStrokes, waitForSynchronizedEvent } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"
import equation from "../__dataset__/equation"
import diagramConnections from "../__dataset__/diagram_connections"

test.describe("Interactive ink canvas Live PDF Document", { tag: "@slow" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_export_pdf.html`)
    await passModalKey(page)
  })

  test("should start with a single page showing the placeholder", async ({ page }) => {
    await expect(page.locator(".doc-page")).toHaveCount(1)
    await expect(page.locator(".doc-placeholder")).toBeVisible()
    await expect(page.locator(".doc-block")).toHaveCount(0)
  })

  test("should write recognized text as a paragraph", async ({ page }) => {
    await writeStrokes(page, helloOneStroke.strokes)
    await callCanvasIdle(page)

    await expect(page.locator(".doc-block p")).toHaveText("hello")
    await expect(page.locator(".doc-placeholder")).toHaveCount(0)
  })

  test("should turn an underlined line into the document title", async ({ page }) => {
    await writeStrokes(page, helloOneStroke.strokes)
    await callCanvasIdle(page)
    await expect(page.locator(".doc-block p")).toHaveText("hello")

    const { minX, maxX, maxY } = boundsOf(helloOneStroke.strokes)
    const underline = Array.from({ length: 20 }, (_, i) => ({ x: minX + (i * (maxX - minX)) / 19, y: maxY + 4 + (i % 2) }))
    await writePointers(page, underline)

    await expect(page.locator(".doc-block h1")).toHaveText("hello")
  })

  test("should typeset an equation with KaTeX", async ({ page }) => {
    await writeStrokes(page, equation.strokes)
    await callCanvasIdle(page)

    await expect(page.locator('.doc-block[data-kind="math"] .katex')).toBeVisible({ timeout: 10000 })
  })

  test("should redraw a diagram as a numbered figure", async ({ page }) => {
    // About 55 s on a loaded tablet run, too close to the default minute
    test.setTimeout(120 * 1000)
    // Replaying the diagram takes longer than waitForEvent's 30 s: wait for the canvas to be idle
    // once it is written, not for a synchronization that has to land while it is being written
    await writeStrokes(page, diagramConnections.strokes)
    await callCanvasIdle(page)

    const figure = page.locator('.doc-block[data-kind="figure"]')
    await expect(figure.locator("figcaption")).toHaveText("Figure 1", { timeout: 10000 })
    await expect(figure.locator("svg rect")).toHaveCount(1)
    await expect(figure.locator("svg circle")).toHaveCount(2)
  })

  test("should take the canvas theme for the page background", async ({ page }) => {
    await page.evaluate(() => window.canvas.setCssVars({ "--ms-ink-canvas-bg": "#1a1a1a", "--ms-ink-color": "#e2e2e2" }))

    await expect(page.locator(".doc-page")).toHaveCSS("background-color", "rgb(26, 26, 26)")
    await expect(page.locator(".doc-page")).toHaveCSS("color", "rgb(226, 226, 226)")
  })

  test("should keep the color of the strokes", async ({ page }) => {
    await page.evaluate(() => { window.canvas.penStyle = { color: "#e53935" } })
    await writeStrokes(page, helloOneStroke.strokes)
    await callCanvasIdle(page)

    await expect(page.locator(".doc-block p span")).toHaveCSS("color", "rgb(229, 57, 53)")
  })

  test("should follow a color change on existing strokes", async ({ page }) => {
    await writeStrokes(page, helloOneStroke.strokes)
    await callCanvasIdle(page)
    await expect(page.locator(".doc-block p")).toHaveText("hello")

    await page.evaluate(() => window.canvas.updateSymbols(window.canvas.model.symbols.map((s) => s.id), { style: { color: "#1e88e5" } }))

    await expect(page.locator(".doc-block p span")).toHaveCSS("color", "rgb(30, 136, 229)")
  })

  test("should highlight the ink of a hovered block", async ({ page }) => {
    await writeStrokes(page, helloOneStroke.strokes)
    await callCanvasIdle(page)
    await expect(page.locator(".doc-block p")).toHaveText("hello")

    await page.locator(".doc-block").first().hover()
    await expect(page.locator('#rootEl [data-overlay="highlight"]')).not.toHaveCount(0)

    await page.locator("#printPdf").hover()
    await expect(page.locator('#rootEl [data-overlay="highlight"]')).toHaveCount(0)
  })

  test("should print only the pages", async ({ page }) => {
    await writeStrokes(page, helloOneStroke.strokes)
    await callCanvasIdle(page)
    await expect(page.locator(".doc-block p")).toHaveText("hello")

    await page.emulateMedia({ media: "print" })

    await expect(page.locator("#rootEl")).toBeHidden()
    await expect(page.locator("#printPdf")).toBeHidden()
    await expect(page.locator(".doc-page")).toBeVisible()
  })

  test("should go back to the placeholder on clear", async ({ page }) => {
    await writeStrokes(page, helloOneStroke.strokes)
    await callCanvasIdle(page)
    await expect(page.locator(".doc-block p")).toHaveText("hello")

    await page.locator("#clear").click()

    await expect(page.locator(".doc-block")).toHaveCount(0)
    await expect(page.locator(".doc-placeholder")).toBeVisible()
  })
})
