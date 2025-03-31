import { test, expect } from "@playwright/test"
import {
  waitForEditorInit,
  writeStrokes,
  writePointers,
  waitForExportedEvent,
  getEditorExports,
  getEditorExportsType,
  getExportedResults,
} from "../helper"
import ja_JP1Column from "../__dataset__/ja_JP-1Column"
import ja_JP2Columns from "../__dataset__/ja_JP-2Columns"

test.describe("Text ja_JP vertical Recognizer Iink", () => {

  test.beforeEach(async ({ page }) => {
    await Promise.all([
      page.goto("/examples/rest/rest_text_vertical_japanese_recognizerInk.html")
    ])
    await waitForEditorInit(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Japanese Vertical (日本縦型)")
  })

  test("should display text/plain into result for text on 1 column", async ({ page }) => {
    await writeStrokes(page, ja_JP1Column.strokes)
    await getExportedResults(page, ja_JP1Column.exports["text/plain"].at(0), "text/plain", 5)
    
    const plainTextExport = await getEditorExportsType(page, "text/plain")
    const resultText = await page.locator("#result").innerText()
    expect(resultText).toStrictEqual(plainTextExport)
    expect(resultText).toStrictEqual(ja_JP1Column.exports["text/plain"].at(0))
  })

  test("should display text/plain into result for text on 2 columns", async ({ page }) => {
    await writeStrokes(page, ja_JP2Columns.strokes)
    await getExportedResults(page, ja_JP2Columns.exports["text/plain"].at(0), "text/plain", 5)

    const plainTextExport = await getEditorExportsType(page, "text/plain")
    let resultText = await page.locator("#result").innerText()
    resultText = resultText.replace(/\n\n\n/g, "\n"); // FF: remove extra line breaks
    expect(resultText).toStrictEqual(plainTextExport)
    expect(resultText).toStrictEqual(ja_JP2Columns.exports["text/plain"].at(0))
  })

  test.describe("Request sent", () => {
    let mimeTypeRequest = []
    const countMimeType = async (request) => {
      if (
        request.url().includes("api/v4.0/iink/recognize") &&
        request.method() === "POST"
      ) {
        const headers = await request.allHeaders()
        mimeTypeRequest.push(headers.accept)
      }
    }

    test.beforeEach(async ({ page }) => {
      page.on("request", countMimeType)
      mimeTypeRequest = []
    })

    test.afterEach(async ({ page }) => {
      await page.removeListener("request", countMimeType)
    })

    test("should only request text/plain by default", async ({ page }) => {
      const [exportedDatas] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, ja_JP1Column.strokes),
      ])
      expect(mimeTypeRequest[0]).toContain("text/plain")
      expect(exportedDatas["text/plain"]).toContain("手書き認識")

    })
  })

  test("Nav actions", async ({ page }) => {
    await test.step("should write", async () => {
      await writeStrokes(page, ja_JP2Columns.strokes)
      await getExportedResults(page, ja_JP2Columns.exports["text/plain"].at(0), "text/plain", 5)

      const plainTextExport = await getEditorExportsType(page, "text/plain")
      let resultText = await page.locator("#result").innerText()
      resultText = resultText.replace(/\n\n\n/g, "\n"); // FF: remove extra line breaks
      expect(resultText).toStrictEqual(plainTextExport)
      expect(resultText).toStrictEqual(ja_JP2Columns.exports["text/plain"].at(0))
    })

    await test.step("should clear", async () => {
      const promisesResult = await Promise.all([
        waitForExportedEvent(page),
        page.click("#clear"),
      ])
      expect(promisesResult[0]).toBeNull()
      expect(await getEditorExports(page)).toBeFalsy()
      await expect(page.locator("#result")).toBeEmpty()
    })

    await test.step("should undo clear", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        page.click("#undo")
      ])

      expect(await page.locator("#editor").evaluate((node) => node.editor.model.strokes)).toHaveLength(20)
      let resultText = await page.locator("#result").innerText()
      resultText = resultText.replace(/\n\n\n/g, "\n"); // FF: remove extra line breaks
      expect(resultText).toStrictEqual(ja_JP2Columns.exports["text/plain"].at(0))
    })

    await test.step("should undo write", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        page.click("#undo")
      ])
      expect(await page.locator("#editor").evaluate((node) => node.editor.model.strokes)).toHaveLength(19)
    })

    await test.step("should redo write", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        page.click("#redo")
      ])
      expect(await page.locator("#editor").evaluate((node) => node.editor.model.strokes)).toHaveLength(20)
      let resultText = await page.locator("#result").innerText()
      resultText = resultText.replace(/\n\n\n/g, "\n"); // FF: remove extra line breaks
      expect(resultText).toStrictEqual(ja_JP2Columns.exports["text/plain"].at(0))
    })
  })
})