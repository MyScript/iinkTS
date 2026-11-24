import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes, waitForSynchronizedEvent } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"

test.describe("Interactive ink canvas LLM Export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_export_llm.html`)
    await passModalKey(page)
  })

  test("should start with an empty result", async ({ page }) => {
    await expect(page.locator("#llmResult")).toHaveText("")
  })

  test("should convert recognized text to LLM-ready JSON content blocks", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes),
    ])

    await page.locator("#exportLLM").click()

    await expect(page.locator("#llmResult")).toHaveText(JSON.stringify({ blocks: [{ type: "text", content: "hello" }] }, null, 2))
  })

  test("should refresh the blocks on the exported event without pressing anything", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes),
    ])

    await expect(page.locator("#llmResult")).toHaveText(JSON.stringify({ blocks: [{ type: "text", content: "hello" }] }, null, 2))
  })

  test("should download the blocks as a .json file", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes),
    ])

    const downloadPromise = page.waitForEvent("download")
    await page.locator("#downloadLLM").click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain(".json")
  })

  test("should clear the result", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes),
    ])
    await expect(page.locator("#llmResult")).not.toHaveText("")

    await page.locator("#clear").click()

    await expect(page.locator("#llmResult")).toHaveText("")
  })
})
