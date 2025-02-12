/* import { test, expect } from "@playwright/test"
import {
  waitForEditorInit,
  writeStrokes,
  waitForExportedEvent,
  getEditorExports,
} from "../helper"
import h from "../__dataset__/h"
import rawcontent from "../__dataset__/rawcontent"

test.describe("Raw Content Recognizer Iink", () => {
  test.beforeEach(async ({ page }) => {
    await Promise.all([
      page.goto("/examples/rest/rest_raw_content_recognizerIink.html"),
    ])
    await waitForEditorInit(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Raw Content Recognizer Iink")
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
        writeStrokes(page, h.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(1)
      expect(mimeTypeRequest[0]).toContain("application/vnd.myscript.jiix")
    })
  })

  test("Nav actions", async ({ page }) => {
    await test.step("should write", async () => {
      const [exportedDatas] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, rawcontent.strokes),
      ])
      await expect(page.locator("#result")).toHaveText(
        "application/vnd.myscript.jiix"
      )
      await expect(page.locator("#result")).toHaveText(
        rawcontent.exports[0].label
      )
      await expect(page.locator("#result")).toHaveText(
        rawcontent.exports[0].elements[0].label
      )
      await expect(page.locator("#result")).toHaveText(
        rawcontent.exports[1].elements[1].label
      )
      await expect(page.locator("#result")).toHaveText(
        rawcontent.exports[2].elements[2].label
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
          .locator("#editor")
          .evaluate((node) => node.editor.model.symbols)
      ).toHaveLength(1)
      await expect(page.locator("#result")).toHaveText(
        h.exports["text/plain"][0]
      )
    })

    await test.step("should undo write", async () => {
      await Promise.all([waitForExportedEvent(page), page.click("#undo")])
      expect(
        await page
          .locator("#editor")
          .evaluate((node) => node.editor.model.symbols)
      ).toHaveLength(0)
      await expect(page.locator("#result")).toBeEmpty()
    })

    await test.step("should redo write", async () => {
      await Promise.all([waitForExportedEvent(page), page.click("#redo")])
      expect(
        await page
          .locator("#editor")
          .evaluate((node) => node.editor.model.symbols)
      ).toHaveLength(1)
      await expect(page.locator("#result")).toHaveText(
        h.exports["text/plain"][0]
      )
    })

    await test.step("should change language", async () => {
      const [requestEn] = await Promise.all([
        page.waitForRequest(
          (req) =>
            req.url().includes("/api/v4.0/iink/recognize") &&
            req.method() === "POST"
        ),
        writeStrokes(page, h.strokes),
      ])
      const enPostData = (await requestEn).postDataJSON()
      expect(enPostData.configuration.lang).toEqual("en_US")

      await page.selectOption("#language", "fr_FR")

      await expect(page.locator("#result")).toBeEmpty()

      const [requestFr] = await Promise.all([
        page.waitForRequest(
          (req) =>
            req.url().includes("/api/v4.0/iink/recognize") &&
            req.method() === "POST"
        ),
        writeStrokes(page, h.strokes),
      ])
      const frPostData = (await requestFr).postDataJSON()
      expect(frPostData.configuration.lang).toEqual("fr_FR")
    })
  })
})
 */