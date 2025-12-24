import { test, expect } from "@playwright/test"
import TextNavActions from "../_partials/text-nav-actions"
import { waitForEditorInit, passModalKey } from "../helper"
// import {
//   writeStrokes,
//   waitForExportedEvent,
//   waitForEditorInit,
//   callEditorIdle
// } from "../helper"
// import abrausorus from "../__dataset__/abrausorus"

test.describe("Websocket Custom pre-loaded resources", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/websocket/websocket_text_custom_resources.html`)
    await passModalKey(page)
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
