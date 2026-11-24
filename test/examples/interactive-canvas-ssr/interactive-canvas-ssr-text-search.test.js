import { test, expect } from "@playwright/test"
import {
  passModalKey,
} from "../helper"

test.describe("Interactive Canvas SSR Text search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_text_search.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Text search")
  })

  test("should find text", async ({ page }) => {
    await test.step("should find hello", async () => {
      await Promise.all([
        page.locator("#searchInput").fill("hello"),
        page.locator("#searchBtn").click(),
      ])
      await expect(page.locator(".highlight")).toHaveCount(1)
      await expect(page.locator(".highlight")).toBeVisible()
    })
  })

  test("should not find text", async ({ page }) => {
    await test.step("should not find hello", async () => {
      await Promise.all([
        page.locator("#searchInput").fill("hi"),
        page.locator("#searchBtn").click(),
      ])
      await expect(page.locator(".highlight")).toHaveCount(0)
    })
  })
})
