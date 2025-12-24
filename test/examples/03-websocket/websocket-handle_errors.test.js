import { test, expect } from "@playwright/test"

test.describe("Websocket handle error", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/websocket/websocket_handle_errors.html`)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Websocket Handle error")
  })

  test("should have error message", async ({ page }) => {
    await expect(page.locator(".message-modal.error-msg")).toBeVisible()
    await expect(page.locator(".message-modal.error-msg")).toHaveText(
      "Application credentials are invalid. Please check or regenerate your application key and hmackey."
    )
  })
})
