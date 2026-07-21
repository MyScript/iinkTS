import { test, expect } from "@playwright/test"
import {
  waitForExportedEvent,
  callEditorIdle,
  writePointers,
  passModalKey
} from "../helper"
import MathNavAction from "../_partials/math-nav-actions"
import equation from "../__dataset__/equation"

test.describe("Interactive Canvas SSR Math With Graph", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_math_with_graph.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Interactive Canvas SSR Math With Graph")
  })

  test("should draw equation on graph", async ({ page }) => {
    for(const s of equation.strokes) {
      await Promise.all([
        waitForExportedEvent(page),
        writePointers(page, s.pointers)
      ])
    }
    await callEditorIdle(page)
    await expect(page).toHaveScreenshot()
  })

  MathNavAction.test()
})
