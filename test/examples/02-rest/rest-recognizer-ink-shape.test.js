/* import { test, expect } from "@playwright/test"
import {
  waitForEditorInit,
  writeStrokes,
  waitForExportedEvent,
  getEditorExports,
} from "../helper"
import rectangleShape from "../__dataset__/rectangleShape"
import line from "../__dataset__/line"

test.describe("Rest Shape Recognizer Ink", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/rest/rest_shape_InkRecognizer.html")
    await waitForEditorInit(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Shape Recognizer Ink")
  })

  test("should get Shape type", async ({
    page,
  }) => {
    const [lineExportedDatas] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [rectangleShape.strokes[0]]),
    ])
    expect(lineExportedDatas["application/vnd.myscript.jiix"].type).toEqual(
      rectangleShape.exports[0]["application/vnd.myscript.jiix"].type
    )
  })

  test("should display application/vnd.myscript.jiix into result", async ({ page }) => {
      const [lineExportedDatas] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [rectangleShape.strokes[0]]),
      ])
      expect(lineExportedDatas["application/vnd.myscript.jiix"]).toMatchObject(rectangleShape.exports[0]["application/vnd.myscript.jiix"])

      const [rectExportedDatas] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [rectangleShape.strokes[1]]),
      ])
      expect(rectExportedDatas["application/vnd.myscript.jiix"]).toMatchObject(rectangleShape.exports[1]["application/vnd.myscript.jiix"])
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

    test("should only request application/vnd.myscript.jiix by default", async ({
      page,
    }) => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, line.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(1)
      expect(mimeTypeRequest[0]).toContain("application/vnd.myscript.jiix")
    })

    test.describe("Nav actions", () => {
      test("should clear", async ({ page }) => {
        await Promise.all([
          waitForExportedEvent(page),
          writeStrokes(page, line.strokes),
        ])
        expect(await getEditorExports(page)).toBeDefined()

        const promisesResult = await Promise.all([
          waitForExportedEvent(page),
          page.click("#clear"),
        ])
        expect(promisesResult[0]).toBeNull()
        expect(await getEditorExports(page)).toBeFalsy()
        await expect(page.locator("#result")).toHaveText("null")
      })

      test("should undo/redo", async ({ page }) => {
        const editorEl = page.locator("#editor")
        await Promise.all([
          waitForExportedEvent(page),
          writeStrokes(page, [rectangleShape.strokes[0]]),
        ])
        await Promise.all([
          waitForExportedEvent(page),
          writeStrokes(page, [rectangleShape.strokes[1]]),
        ])

        let strokes = await editorEl.evaluate(
          (node) => node.editor.model.symbols
        )
        expect(strokes.length).toEqual(rectangleShape.strokes.length)

        await Promise.all([waitForExportedEvent(page), page.click("#undo")])

        strokes = await editorEl.evaluate((node) => node.editor.model.symbols)
        expect(strokes.length).toEqual(rectangleShape.strokes.length - 1)

        await Promise.all([waitForExportedEvent(page), page.click("#redo")])

        strokes = await editorEl.evaluate((node) => node.editor.model.symbols)
        expect(strokes.length).toEqual(rectangleShape.strokes.length)
      })
    })
  })
})
 */