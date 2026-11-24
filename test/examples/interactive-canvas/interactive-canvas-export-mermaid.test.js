import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes, waitForSynchronizedEvent } from "../helper"
import rectangle from "../__dataset__/rectangle"

test.describe("Interactive ink canvas Mermaid Export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_export_mermaid.html`)
    await passModalKey(page)
  })

  test("should start with an empty result", async ({ page }) => {
    await expect(page.locator("#mermaidResult")).toHaveText("")
  })

  test("should convert a recognized shape to a Mermaid flowchart node", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, rectangle.strokes),
    ])

    await page.locator("#exportMermaid").click()

    // Only the exported text is asserted, never the SVG the mermaid CDN library draws from it —
    // the assertions must not depend on a third-party CDN being reachable.
    // The node id comes from the server (e.g. "raw-content/12") and isn't stable across runs.
    await expect(page.locator("#mermaidResult")).toHaveText(/^flowchart TD\n {2}\S+\[rectangle\]$/)
  })

  test("should refresh the flowchart on the exported event without pressing anything", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, rectangle.strokes),
    ])

    await expect(page.locator("#mermaidResult")).toHaveText(/^flowchart TD\n {2}\S+\[rectangle\]$/)
  })

  test("should download the flowchart as a .mmd file", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, rectangle.strokes),
    ])

    const downloadPromise = page.waitForEvent("download")
    await page.locator("#downloadMermaid").click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain(".mmd")
  })

  test("should clear the result", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, rectangle.strokes),
    ])
    await expect(page.locator("#mermaidResult")).not.toHaveText("")

    await page.locator("#clear").click()

    await expect(page.locator("#mermaidResult")).toHaveText("")
  })
})
