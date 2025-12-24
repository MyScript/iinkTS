import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  waitForExportedEvent,
  passModalKey,
} from "../helper"
import hello from "../__dataset__/helloOneStroke"
import h from "../__dataset__/h"

test.describe("Websocket Text search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/websocket/websocket_text_search.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Text search")
  })

  test("should find text", async ({ page }) => {
    await test.step("write hello", async () => {
      const [exported] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, hello.strokes),
      ])
      expect(exported).toBeDefined()
    })
    await test.step("should find hello", async () => {
      await Promise.all([
        page.locator("#searchInput").fill("hello"),
        page.click("#searchBtn"),
      ])
      await expect(page.locator(".highlight")).toHaveCount(1)
      await expect(page.locator(".highlight")).toBeVisible()
    })
  })

  test("should not to find", async ({ page }) => {
    await test.step("write h", async () => {
      const [exported] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes),
      ])
      expect(exported).toBeDefined()
    })
    await test.step("should not find hello", async () => {
      await Promise.all([
        page.locator("#searchInput").fill("hello"),
        page.click("#searchBtn"),
      ])
      await expect(page.locator(".highlight")).toHaveCount(0)
    })
  })
})
