import { test, expect } from "@playwright/test"

test.describe("Interactive Canvas SSR handle error", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_handle_errors.html`)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Interactive Canvas SSR Handle error")
  })

  test("should have error message", async ({ page }) => {
    await expect(page.locator(".ms-modal")).toBeVisible()
    await expect(page.locator(".ms-modal .ms-modal-title-bar h3")).toHaveText(/Error/)
    await expect(page.locator(".ms-modal .ms-modal-content")).toHaveText(
      "Application credentials are invalid. Please check or regenerate your application key and hmackey."
    )
  })
})
