import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  waitForExportedEvent,
  getEditorExportsType,
  getEditorConfiguration,
  callEditorIdle
} from "../helper"
import one from "../__dataset__/1"
import equation from "../__dataset__/equation"

export default {
  test({ skipClear, skipUndoRedo, resultLocator } = { resultLocator: "#result .katex-html"}) {
    test.describe("Nav actions", () => {
      test.beforeEach(async ({ page }) => {
        await callEditorIdle(page)
      })

      !skipClear && test("should clear", async ({ page }) => {
        await Promise.all([
          waitForExportedEvent(page),
          writeStrokes(page, one.strokes)
        ])
        await expect(page.locator(resultLocator)).toHaveText(one.exports.LATEX.at(-1))

        const [clearExport] = await Promise.all([
          waitForExportedEvent(page),
          page.locator("#clear").click()
        ])

        expect(clearExport["application/x-latex"]).toEqual("")
        await expect(page.locator("#result")).toBeEmpty()
      })

      !skipUndoRedo && test("should undo/redo in mode \"stroke\" by default", async ({ page }) => {

        await test.step("should have undo/redo mode set to \"stroke\" by default", async () => {
          const config = await getEditorConfiguration(page)
          expect(config.recognition.math["undo-redo"].mode).toEqual("stroke")
        })

        await test.step("should write stroke", async () => {
          await Promise.all([
            waitForExportedEvent(page),
            writeStrokes(page, equation.strokes)
          ])
          await callEditorIdle(page)
          await expect(page.locator(resultLocator)).toHaveText(equation.exports.LATEX.at(-1))
          const latex = await getEditorExportsType(page, "application/x-latex")
          expect(latex).toEqual(equation.exports.LATEX.at(-1))
        })

        await test.step("should undo last stroke written", async () => {
          const [exportEvt] = await Promise.all([
            waitForExportedEvent(page),
            page.click("#undo")
          ])
          expect(exportEvt["application/x-latex"]).toEqual(equation.exports.LATEX.at(-2))
          await expect(page.locator(resultLocator)).toHaveText(equation.exports.LATEX.at(-2))
          const latex = await getEditorExportsType(page, "application/x-latex")
          expect(latex).toEqual(equation.exports.LATEX.at(-2))
        })

        await test.step("should undo penultimate stroke written", async () => {
          const [exportEvt] = await Promise.all([
            waitForExportedEvent(page),
            page.click("#undo")
          ])
          expect(exportEvt["application/x-latex"]).toEqual(equation.exports.LATEX.at(-3))
          await expect(page.locator(resultLocator)).toHaveText(equation.exports.LATEX.at(-3).replace("-", "−"))
          const latex = await getEditorExportsType(page, "application/x-latex")
          expect(latex).toEqual(equation.exports.LATEX.at(-3))
        })

        await test.step("should redo penultimate stroke written", async () => {
          const [exportEvt] = await Promise.all([
            waitForExportedEvent(page),
            page.click("#redo")
          ])
          expect(exportEvt["application/x-latex"]).toEqual(equation.exports.LATEX.at(-2))
          await expect(page.locator(resultLocator)).toHaveText(equation.exports.LATEX.at(-2))
          const latex = await getEditorExportsType(page, "application/x-latex")
          expect(latex).toEqual(equation.exports.LATEX.at(-2))
        })
      })
    })
  }
}
