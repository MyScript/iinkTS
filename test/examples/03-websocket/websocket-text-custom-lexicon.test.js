import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  waitForEditorInit,
  getEditorExports,
  callEditorIdle
} from "../helper"
import TextNavAction from "../_partials/text-nav-actions"
import covfefe from "../__dataset__/covfefe"

test.describe("Websocket Text Custom Lexicon", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_custom_lexicon.html")
    await waitForEditorInit(page)
    await callEditorIdle(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Custom lexicon")
  })

  test("should not recognize 'covfefe'", async ({ page }) => {
    await writeStrokes(page, covfefe.strokes)
    await callEditorIdle(page)
    const exports = await getEditorExports(page)
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).not.toEqual(covfefe.exports["text/plain"].at(-1))
  })

  test("should recognize 'covfefe' after", async ({ page }) => {
    await Promise.all([
      waitForEditorInit(page),
      page.locator("#lexicon").fill("covfefe"),
      page.locator("#reinit").click(),
    ])
    await writeStrokes(page, covfefe.strokes)
    await callEditorIdle(page)
    const exports = await getEditorExports(page)
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).toEqual(covfefe.exports["text/plain"].at(-1))
  })

  TextNavAction.test({ skipClear: true, resultLocator: ".prompter-container" })
})
