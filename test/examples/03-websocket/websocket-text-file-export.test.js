import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  waitForExportedEvent,
  passModalKey
} from "../helper"
import hello from "../__dataset__/helloOneStroke"
import TextNavActions from "../_partials/text-nav-actions"

test.describe("Websocket Text file export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_file_export.html")
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Word Export with iink")
  })

  test("should save to word file", async ({ page }) => {
    const [exported] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, hello.strokes)
    ])
    expect(exported).toBeDefined()
    const downloadPromise = page.waitForEvent("download")
    await page.locator("#exportContent").click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe("myDocument.docx")
  })

  test("should save to html file", async ({ page }) => {
    const [exported] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, hello.strokes)
    ])
    expect(exported).toBeDefined()
    const downloadPromise = page.waitForEvent("download")
    await page.selectOption("#exportType", "html")
    await page.locator("#exportContent").click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe("myDocument.html")
  })

  test("should save to png file", async ({ page }) => {
    const [exported] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, hello.strokes)
    ])
    expect(exported).toBeDefined()
    const downloadPromise = page.waitForEvent("download")
    await page.selectOption("#exportType", "png")
    await page.locator("#exportContent").click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe("myDocument.png")
  })

  test("should save to jpg file", async ({ page }) => {
    const [exported] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, hello.strokes)
    ])
    expect(exported).toBeDefined()
    const downloadPromise = page.waitForEvent("download")
    await page.selectOption("#exportType", "jpeg")
    await page.locator("#exportContent").click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe("myDocument.jpg")
  })

  TextNavActions.test({ resultLocator: ".prompter-container" })
})
