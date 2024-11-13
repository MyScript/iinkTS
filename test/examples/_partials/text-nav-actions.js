import { test, expect } from "@playwright/test"
import { writeStrokes, writePointers, waitForExportedEvent, callEditorIdle, getEditorConfiguration } from "../helper"
import h from "../__dataset__/h"
import hello from "../__dataset__/helloMultipleStrokes"

export default {
  test({ skipClear, skipUndoRedo, resultLocator } = { resultLocator: "#result"}) {
    test.describe("Nav actions", () => {
      test.beforeEach(async ({ page }) => {
        await callEditorIdle(page)
      })

      !skipClear && test("should clear", async ({ page }) => {
        const [exportBeforeClear] = await Promise.all([
          waitForExportedEvent(page),
          writeStrokes(page, h.strokes)
        ])
        expect(exportBeforeClear["application/vnd.myscript.jiix"].label).toStrictEqual(h.exports["text/plain"])
        await expect(page.locator(resultLocator)).toHaveText(h.exports["text/plain"])

        const [exportAfterClear] = await Promise.all([
          waitForExportedEvent(page),
          page.click("#clear")
        ])
        await expect(page.locator(resultLocator)).toBeEmpty()
        expect(exportAfterClear["application/vnd.myscript.jiix"].label).toStrictEqual("")
      })

      !skipUndoRedo && test('should undo/redo', async ({ page }) => {

        await test.step("should have undo/redo mode set to \"stroke\" by default", async () => {
          const config = await getEditorConfiguration(page)
          expect(config.recognition.math["undo-redo"].mode).toEqual("stroke")
        })

        await test.step("should write strokes", async () => {
          let exports
          for(const s of hello.strokes) {
            [exports] = await Promise.all([
              waitForExportedEvent(page),
              writePointers(page, s.pointers),
            ])
          }
          await expect(page.locator(resultLocator)).toHaveText(hello.exports["text/plain"].at(-1))
          expect(exports['application/vnd.myscript.jiix'].label).toStrictEqual(hello.exports['text/plain'].at(-1))
        })

        await test.step("should undo last stroke written", async () => {
          const [undoExports] = await Promise.all([
            waitForExportedEvent(page),
            page.click('#undo')
          ])
          expect(undoExports['application/vnd.myscript.jiix'].label).toStrictEqual(hello.exports['text/plain'].at(-2))
          await expect(page.locator(resultLocator)).toHaveText(hello.exports["text/plain"].at(-2))
        })

        await test.step("should undo penultimate stroke written", async () => {
          const [undo2Exports] = await Promise.all([
            waitForExportedEvent(page),
            page.click('#undo')
          ])
          expect(undo2Exports['application/vnd.myscript.jiix'].label).toStrictEqual(hello.exports['text/plain'].at(-3))
          await expect(page.locator(resultLocator)).toHaveText(hello.exports["text/plain"].at(-3))
        })

        await test.step("should redo penultimate stroke written", async () => {
          const [redoExports] = await Promise.all([
            waitForExportedEvent(page),
            page.click('#redo')
          ])
          expect(redoExports['application/vnd.myscript.jiix'].label).toStrictEqual(hello.exports['text/plain'].at(-2))
          await expect(page.locator(resultLocator)).toHaveText(hello.exports["text/plain"].at(-2))
        })

      })
    })
  }
}
