import { test, expect } from "@playwright/test"
import {
  waitForImportedEvent,
  findValuesByKey,
  passModalKey
} from "../helper"

test.describe("Interactive Canvas SSR Math Import JIIX", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_math_import_jiix.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Import math with JIIX")
  })

  test("should import JIIX", async ({ page }) => {
    const [exported] = await Promise.all([
      waitForImportedEvent(page),
      page.locator("#import").click()
    ])
    
    const jiix = exported["application/vnd.myscript.jiix"]
    const jiixTextToImport = await page.locator("#jiix").inputValue()
    const jiixToImport = JSON.parse(jiixTextToImport)
    const labelsJiix = findValuesByKey(jiix, "label")
    const labelsJiixToImport = findValuesByKey(jiixToImport, "label")
    expect(labelsJiix).toEqual(labelsJiixToImport)
  })

})
