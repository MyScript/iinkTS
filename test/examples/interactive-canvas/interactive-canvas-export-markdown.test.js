import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes, waitForSynchronizedEvent } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"

test.describe("Interactive ink canvas Markdown Export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_export_markdown.html`)
    await passModalKey(page)
  })

  test("should start with an empty result", async ({ page }) => {
    await expect(page.locator("#markdownResult")).toHaveText("")
  })

  test("should convert recognized text to Markdown", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes),
    ])

    await page.locator("#exportMarkdown").click()

    await expect(page.locator("#markdownResult")).toHaveText("hello")
  })

  test("should refresh the Markdown on the exported event without pressing anything", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes),
    ])

    await expect(page.locator("#markdownResult")).toHaveText("hello")
  })

  test("should download the Markdown as a .md file", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes),
    ])

    const downloadPromise = page.waitForEvent("download")
    await page.locator("#downloadMarkdown").click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain(".md")
  })

  test("should clear the result", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes),
    ])
    await expect(page.locator("#markdownResult")).toHaveText("hello")

    await page.locator("#clear").click()

    await expect(page.locator("#markdownResult")).toHaveText("")
  })
})
