import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  waitForExportedEvent,
  passModalKey
} from "../helper"
import h from "../__dataset__/h"

test.describe("Canvas v1 custom client", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/canvas/canvas_v1_custom_client.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Ink Canvas custom http client")
  })

  test("should have info empty", async ({ page }) => {
    await expect(page.locator("#client-url")).toHaveText(/Server url:/)
    await expect(page.locator("#client-sent")).toHaveText("Message sent:")
    await expect(page.locator("#client-received")).toHaveText("Message received:")
  })

  test("should have information defined after writing", async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes)
    ])

    await expect(page.locator("#client-url")).toHaveText(/Server url:/)
    await expect(page.locator("#client-url")).toHaveText(/\/api\/v4.0\/iink\/batch/)
    await expect(page.locator("#client-sent")).toHaveText(/POST: {"configuration":{"lang":"en_US"/)
    await expect(page.locator("#client-received")).toHaveText(/Response: {"type":"Text","label":"h"/)
  })
})
