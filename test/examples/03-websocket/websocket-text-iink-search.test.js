import { test, expect } from "@playwright/test"
import { writeStrokes, waitForExportedEvent, waitForEditorWebSocket } from "../helper"
import hello from "../__dataset__/helloOneStroke"

test.describe("Websocket Text search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_iink_search.html")
    await waitForEditorWebSocket(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Text search")
  })

  test("should write hello", async ({ page }) => {
    const [exported] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, hello.strokes)
    ])

    expect(exported).toBeDefined()
  })

  test("should find text", async ({ page }) => {
    await Promise.all([
      page.locator("#searchInput").fill("hello"),
      page.click("#searchBtn")
    ])

    //wait for css highlight
    await page.waitForTimeout(1000)
    const highlight = page.locator(".highlight")
    expect(highlight).toBeDefined()
  })

  test("should failed to find", async ({ page }) => {
    await Promise.all([
      page.locator("#searchInput").fill("test"),
      page.click("#searchBtn")
    ])
    //wait for css highlight
    await page.waitForTimeout(1000)
    expect(await page.locator(".highlight").count()).toEqual(0)
  })
})
