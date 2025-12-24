import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  waitForExportedEvent,
  getEditorExports,
  getEditorExportsType,
  getExportedResults,
  passModalKey
} from "../helper"
import ja_JP1Column from "../__dataset__/ja_JP-1Column"
import ja_JP2Columns from "../__dataset__/ja_JP-2Columns"

test.describe("Text ja_JP vertical Recognizer Iink", () => {
  test.beforeEach(async ({ page }) => {
    page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/rest/rest_v2_text_vertical_japanese.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Japanese Vertical (日本縦型)")
  })

  test("should display text/plain into result for text on 1 column", async ({
    page,
  }) => {
    await test.step("write strokes", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, ja_JP1Column.strokes),
      ])
    })
    await expect(page.locator("#result")).toHaveText(
      ja_JP1Column.exports["text/plain"].at(1)
    )

    const plainTextExport = await getEditorExportsType(page, "text/plain")
    expect(plainTextExport).toStrictEqual(
      ja_JP1Column.exports["text/plain"].at(1)
    )
  })

  test("should display text/plain into result for text on 2 columns", async ({
    page,
  }) => {
    await writeStrokes(page, ja_JP2Columns.strokes)
    await getExportedResults(
      page,
      ja_JP2Columns.exports["text/plain"].at(0),
      "text/plain",
      5
    )

    const plainTextExport = await getEditorExportsType(page, "text/plain")
    let resultText = await page.locator("#result").innerText()
    resultText = resultText.replace(/\n\n\n/g, "\n") // FF: remove extra line breaks
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
      await test.step("write strokes", async () => {
        await Promise.all([
          waitForExportedEvent(page),
          writeStrokes(page, ja_JP1Column.strokes),
        ])
      })

      await expect(page.locator("#result")).toHaveText(
        ja_JP1Column.exports["text/plain"].at(1)
      )

      expect(mimeTypeRequest[0]).toContain("text/plain")
      const plainTextExport = await getEditorExportsType(page, "text/plain")
      expect(plainTextExport).toStrictEqual(
        ja_JP1Column.exports["text/plain"].at(1)
      )
    })
  })

  test("Nav actions", async ({ page }) => {
    await test.step("should write", async () => {
      await writeStrokes(page, ja_JP2Columns.strokes)
      await getExportedResults(
        page,
        ja_JP2Columns.exports["text/plain"].at(0),
        "text/plain",
        5
      )

      const plainTextExport = await getEditorExportsType(page, "text/plain")
      let resultText = await page.locator("#result").innerText()
      resultText = resultText.replace(/\n\n\n/g, "\n") // FF: remove extra line breaks
      expect(resultText).toStrictEqual(plainTextExport)
      expect(resultText).toStrictEqual(
        ja_JP2Columns.exports["text/plain"].at(0)
      )
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
      await Promise.all([waitForExportedEvent(page), page.click("#undo")])

      expect(
        await page
          .locator("#editorEl")
          .evaluate((node) => node.editor.model.strokes)
      ).toHaveLength(20)
      let resultText = await page.locator("#result").innerText()
      resultText = resultText.replace(/\n\n\n/g, "\n") // FF: remove extra line breaks
      expect(resultText).toStrictEqual(
        ja_JP2Columns.exports["text/plain"].at(0)
      )
    })

    await test.step("should undo write", async () => {
      await Promise.all([waitForExportedEvent(page), page.click("#undo")])
      expect(
        await page
          .locator("#editorEl")
          .evaluate((node) => node.editor.model.strokes)
      ).toHaveLength(19)
    })

    await test.step("should redo write", async () => {
      await Promise.all([waitForExportedEvent(page), page.click("#redo")])
      expect(
        await page
          .locator("#editorEl")
          .evaluate((node) => node.editor.model.strokes)
      ).toHaveLength(20)
      let resultText = await page.locator("#result").innerText()
      resultText = resultText.replace(/\n\n\n/g, "\n") // FF: remove extra line breaks
      expect(resultText).toStrictEqual(
        ja_JP2Columns.exports["text/plain"].at(0)
      )
    })
  })
})
