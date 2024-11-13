import { test, expect } from "@playwright/test"
import {
  waitForEditorWebSocket,
  waitForExportedEvent,
  callEditorIdle,
  getEditorConfiguration,
  setEditorConfiguration,
  writePointers
} from "../helper"
import MathNavAction from "../_partials/math-nav-actions"
import equation from "../__dataset__/equation"

test.describe("Custom resources math", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_math_custom_resources.html")
    await waitForEditorWebSocket(page)
    await callEditorIdle(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Custom resources math")
  })

  test("should not recognize text", async ({ page }) => {
    for(const s of equation.strokes) {
      await Promise.all([
        waitForExportedEvent(page),
        writePointers(page, s.pointers)
      ])
    }
    await callEditorIdle(page)
    await expect(page.locator("#result")).not.toHaveText(equation.exports.LATEX.at(-1))
  })

  test("should change configuration and recognize text", async ({ page }) => {

    const config = await getEditorConfiguration(page)
    config.recognition.math.customGrammarContent = undefined
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    for(const s of equation.strokes) {
      await Promise.all([
        waitForExportedEvent(page),
        writePointers(page, s.pointers)
      ])
    }
    await callEditorIdle(page)
    await expect(page.locator("#result")).toHaveText(equation.exports.LATEX.at(-1))
  })

  MathNavAction.test({ skipUndoRedo: true, resultLocator: "#result" })
})
