import { test, expect } from "@playwright/test"
import {
  callCanvasIdle,
  getCanvasExports,
  writeStrokes,
  passModalKey,
} from "../helper"
import hello from "../__dataset__/helloOneStroke"

test.describe("Interactive Canvas SSR on-demand export", function () {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_export_on_demand.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Interactive Canvas SSR on-demand export")
  })

  test("should only export on click", async ({ page }) => {
    await writeStrokes(page, hello.strokes)
    await callCanvasIdle(page)
    const noExport = await getCanvasExports(page)
    expect(noExport).toBeUndefined()
    await expect(page.locator(".prompter-text")).toBeEmpty()

    await page.locator("#export").click()
    await callCanvasIdle(page)
    const expectedLabel = hello.exports["text/plain"].at(-1)
    await expect(page.locator(".prompter-text")).toHaveText(expectedLabel)
  })
})
