import { test, expect } from "@playwright/test"
import { waitForCanvasInit, passModalKey } from "../helper"
import TextNavActions from "../_partials/text-nav-actions"

test.describe("Interactive Canvas SSR Text Search Without Smartguide", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_text_no_guides.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("No guides")
  })

  test("should not see guides", async ({ page }) => {
    await expect(page.locator("line")).toHaveCount(0)
  })
})
