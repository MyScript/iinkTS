import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  waitForExportedEvent,
  passModalKey
} from "../helper"
import h from "../__dataset__/h"

test.describe("Rest custom recognizer", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/dev/rest_custom_recognizer.html")
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Rest custom recognizer")
  })

  test("should have info empty", async ({ page }) => {
    await expect(page.locator("#recognizer-url")).toHaveText(/Server url:/)
    await expect(page.locator("#recognizer-sent")).toHaveText("Message sent:")
    await expect(page.locator("#recognizer-received")).toHaveText("Message received:")
  })

  test("should have information defined after writing", async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes)
    ])

    await expect(page.locator("#recognizer-url")).toHaveText(/Server url:/)
    await expect(page.locator("#recognizer-url")).toHaveText(/\/api\/v4.0\/iink\/batch/)
    await expect(page.locator("#recognizer-sent")).toHaveText(/POST: {"configuration":{"lang":"en_US"/)
    await expect(page.locator("#recognizer-received")).toHaveText(/Response: {"type":"Text","label":"h"/)
  })
})
