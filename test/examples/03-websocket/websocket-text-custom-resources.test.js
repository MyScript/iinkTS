import { test, expect } from "@playwright/test"
import TextNavActions from "../_partials/text-nav-actions"
import { waitForEditorWebSocket } from "../helper"
// import {
//   writeStrokes,
//   waitForExportedEvent,
//   waitForEditorWebSocket,
//   callEditorIdle
// } from "../helper"
// import abrausorus from "../__dataset__/abrausorus"

test.describe("Websocket Custom pre-loaded resources", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_custom_resources.html")
    await waitForEditorWebSocket(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Custom pre-loaded resources")
  })

  // TODO check resource dinosaur
  // test("should export application/vnd.myscript.jiix", async ({ page }) => {
  //   const [exports] = await Promise.all([
  //     waitForExportedEvent(page),
  //     writeStrokes(page, abrausorus.strokes),
  //   ])

  //   expect(exports["application/vnd.myscript.jiix"].label).toEqual(abrausorus.exports["application/vnd.myscript.jiix"].label)
  // })

  TextNavActions.test({ skipClear: true, resultLocator: ".prompter-container" })
})
