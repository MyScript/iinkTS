import { test, expect } from "@playwright/test"
import { passModalKey } from "../helper"

test.describe("Interactive Canvas SSR Styling canvas", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_text_customize_canvas_css.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Styling canvas")
  })
})
