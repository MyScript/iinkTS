import { test, expect } from "@playwright/test"
import TextNavActions from "../_partials/text-nav-actions"
import { passModalKey } from "../helper"

test.describe("Interactive Canvas SSR Custom pre-loaded resources", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_text_custom_resources.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Custom pre-loaded resources")
  })

  TextNavActions.test({ skipClear: true, skipUndoRedo: true, resultLocator: ".prompter-container" })
})
