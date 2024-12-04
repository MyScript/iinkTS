import { test, expect } from "@playwright/test"
import {
  waitForEditorInit,
  writeStrokes,
  waitForExportedEvent,
  setEditorConfiguration,
  getEditorConfiguration,
  getEditorExports,
  getEditorSymbols,
} from "../helper"
import one from "../__dataset__/1"
import equation from "../__dataset__/equation"

test.describe("Rest Math", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/rest/rest_math_iink.html")
    await waitForEditorInit(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Rest Math")
  })

  test("should display katex-html into result", async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, one.strokes),
    ])

    const modelExports = await getEditorExports(page)
    expect(modelExports["application/x-latex"]).toStrictEqual(one.exports.LATEX.at(-1))

    await expect(page.locator("#result .katex-html")).toHaveText(one.exports.LATEX.at(-1))
  })

  test.describe("Request sent", () => {
    let mimeTypeRequest = []
    const countMimeType = async (request) => {
      if (
        request.url().includes("api/v4.0/iink/batch") &&
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

    test("should only request application/x-latex by default", async ({ page }) => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, one.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(1)
      expect(mimeTypeRequest[0]).toContain("application/x-latex")
    })

    test("should only request application/mathml+xml", async ({ page }) => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.math.mimeTypes = ["application/mathml+xml"]
      await setEditorConfiguration(page, configuration)

      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, one.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(1)
      expect(mimeTypeRequest[0]).toContain("application/mathml+xml")
    })

    test("should request application/mathml+xml & application/x-latex", async ({ page }) => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.math.mimeTypes = [
        "application/mathml+xml",
        "application/x-latex",
      ]
      await setEditorConfiguration(page, configuration)

      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, one.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(2)
      const allMimeTypesRequested = mimeTypeRequest.join(" ")
      expect(allMimeTypesRequested).toContain("application/mathml+xml")
      expect(allMimeTypesRequested).toContain("application/x-latex")
    })
  })

  test.describe("Nav actions", () => {
    test("should clear", async ({ page }) => {
      const [exportedDatas] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, one.strokes)
      ])

      expect(exportedDatas["application/x-latex"]).toStrictEqual(one.exports.LATEX.at(-1))

      const promisesResult = await Promise.all([
        waitForExportedEvent(page),
        page.click("#clear"),
      ])
      expect(promisesResult[0]).toBeNull()
      expect(await getEditorExports(page)).toBeFalsy()

      await expect(page.locator("#result")).toBeEmpty()
    })

    test("should undo/redo", async ({ page }) => {
      await test.step("write stroke", async () => {
        await Promise.all([
          waitForExportedEvent(page),
          writeStrokes(page, equation.strokes)
        ])
      })

      await test.step("should undo last stroke", async () => {
        await Promise.all([
          waitForExportedEvent(page),
          page.click("#undo")
        ])
        expect(await getEditorSymbols(page)).toHaveLength(equation.strokes.length - 1)
      })

      await test.step("should undo last stroke", async () => {
        await Promise.all([
          waitForExportedEvent(page),
          page.click("#undo")
        ])
        expect(await getEditorSymbols(page)).toHaveLength(equation.strokes.length - 2)
      })

      await test.step("should undo last stroke", async () => {
        await Promise.all([
          waitForExportedEvent(page),
          page.click("#redo")
        ])
        expect(await getEditorSymbols(page)).toHaveLength(equation.strokes.length - 1)
      })

    })
  })
})
