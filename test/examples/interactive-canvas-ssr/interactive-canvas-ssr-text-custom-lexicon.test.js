import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  getCanvasExports,
  callCanvasIdle,
  passModalKey
} from "../helper"
import TextNavAction from "../_partials/text-nav-actions"
import covfefe from "../__dataset__/covfefe"

test.describe("Interactive Canvas SSR Text Custom Lexicon", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_text_custom_lexicon.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Custom lexicon")
  })

  test("should not recognize 'covfefe'", async ({ page }) => {
    await writeStrokes(page, covfefe.strokes)
    await callCanvasIdle(page)
    const exports = await getCanvasExports(page)
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).not.toEqual(covfefe.exports["text/plain"].at(-1))
  })

  test("should recognize 'covfefe' after", async ({ page }) => {
    await page.locator("#lexicon").fill("covfefe")
    await page.locator("#reinit").click()
    await writeStrokes(page, covfefe.strokes)
    await callCanvasIdle(page)
    const exports = await getCanvasExports(page)
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).toEqual(covfefe.exports["text/plain"].at(-1))
  })
})
