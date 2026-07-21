import { test, expect } from "@playwright/test"
import {
  waitForExportedEvent,
  getEditorExports,
  writeStrokes,
  passModalKey
} from "../helper"
import h from '../__dataset__/h'

test.describe("Interactive Canvas SSR Text Pointer Events", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_text_pointer_events.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Pointer events")
  })

  test("should import pointers when click on Process button", async ({ page }) => {
    await test.step("write strokes", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        page.getByRole('button', { name: 'Process' }).click(),
      ])
    })

    const prompterText = page.locator(".prompter-text")
    await expect(prompterText).toHaveText("A")
  })
})
