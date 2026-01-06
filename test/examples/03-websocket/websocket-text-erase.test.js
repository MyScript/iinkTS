import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  waitForExportedEvent,
  callEditorIdle,
  passModalKey,
} from "../helper"
import ponyErase from "../__dataset__/ponyErase"
import TextNavActions from "../_partials/text-nav-actions"

test.describe("Websocket Text erase", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/websocket/websocket_text_eraser.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Websocket Text Eraser")
  })

  test("should toggle tool writing <-> erasing", async ({ page }) => {
    await expect(page.locator("#pen")).toBeDisabled()
    await expect(page.locator("#eraser")).toBeEnabled()
    expect(await page.locator("#editorEl").getAttribute("class")).not.toContain(
      "erase"
    )
    await page.click("#eraser")
    await expect(page.locator("#pen")).toBeEnabled()
    await expect(page.locator("#eraser")).toBeDisabled()
    expect(await page.locator("#editorEl").getAttribute("class")).toContain(
      "erase"
    )
  })

  test("should erase stroke", async ({ page }) => {
    await callEditorIdle(page)
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [ponyErase.strokes[0]]),
    ])

    const ponyLabelExpected =
      ponyErase.exports[0]["application/vnd.myscript.jiix"].label
    await expect(page.locator(".prompter-text")).toHaveText(ponyLabelExpected)

    await page.click("#eraser")
    await callEditorIdle(page)

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [ponyErase.strokes[1]]),
    ])
    const ponyEraseLabelExpected =
      ponyErase.exports[1]["application/vnd.myscript.jiix"].label
    await expect(page.locator(".prompter-text")).toHaveText(
      ponyEraseLabelExpected
    )
  })

  test("should erase stroke precisely", async ({ page }) => {
    await page.setChecked("#erase-precisely", true)
    await page.waitForFunction(
      () =>
        editorEl?.editor?.configuration?.recognition?.text?.eraser?.[
          "erase-precisely"
        ]
    )
    await page.locator(".loader").waitFor({ state: "hidden" })

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [ponyErase.strokes[0]]),
    ])

    const labelExpected =
      ponyErase.exports[0]["application/vnd.myscript.jiix"].label
    await expect(page.locator(".prompter-text")).toHaveText(labelExpected)

    await page.click("#eraser")
    await callEditorIdle(page)

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [ponyErase.strokes[1]]),
    ])
    await expect(page.locator(".prompter-text")).toHaveText(labelExpected)
  })

  TextNavActions.test({ skipClear: true, resultLocator: ".prompter-container" })
})
