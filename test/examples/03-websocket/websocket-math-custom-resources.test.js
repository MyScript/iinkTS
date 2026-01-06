import { test, expect } from "@playwright/test"
import {
  waitForExportedEvent,
  callEditorIdle,
  writePointers,
  passModalKey
} from "../helper"
import MathNavAction from "../_partials/math-nav-actions"
import equation from "../__dataset__/equation"

test.describe("Custom resources math", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/websocket/websocket_math_custom_resources.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Custom resources math")
  })

  test("should not recognize equation", async ({ page }) => {
    for(const s of equation.strokes) {
      await Promise.all([
        waitForExportedEvent(page),
        writePointers(page, s.pointers)
      ])
    }
    await callEditorIdle(page)
    await expect(page.locator("#result")).not.toHaveText(equation.exports.LATEX.at(-1))
  })

  MathNavAction.test({ skipUndoRedo: true, resultLocator: "#result" })
})
