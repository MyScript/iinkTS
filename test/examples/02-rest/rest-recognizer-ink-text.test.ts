import { test, expect } from "@playwright/test"
import {
  waitForEditorInit,
  writeStrokes,
  waitForExportedEvent,
  getEditorExports,
} from "../helper"
import h from "../__dataset__/h"

test.describe("Text Recognizer Iink", () => {

  test.beforeEach(async ({ page }) => {
    await Promise.all([
      page.goto("/examples/rest/rest_text_recognizerInk.html")
    ])
    await waitForEditorInit(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Text Recognizer Iink")
  })

  test("should display text/plain into result", async ({ page }) => {
    const [exportedDatas] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])
    const resultText = await page.locator("#result").textContent()
    expect(resultText).toStrictEqual(exportedDatas["text/plain"])
    expect(resultText).toStrictEqual(h.exports["text/plain"].at(-1))
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
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(1)
      expect(mimeTypeRequest[0]).toContain("text/plain")
    })
  })

  test("Nav actions", async ({ page }) => {
    await test.step("should write", async () => {
      const [exportedDatas] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes),
      ])
      await expect(page.locator("#result")).toHaveText(exportedDatas["text/plain"])
      await expect(page.locator("#result")).toHaveText(h.exports["text/plain"].at(-1))
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
      expect(await page.locator("#editor").evaluate((node) => node.editor.model.symbols)).toHaveLength(1)
      await expect(page.locator("#result")).toHaveText(h.exports["text/plain"][0])
    })

    await test.step("should undo write", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        page.click("#undo")
      ])
      expect(await page.locator("#editor").evaluate((node) => node.editor.model.symbols)).toHaveLength(0)
      await expect(page.locator("#result")).toBeEmpty()
    })

    await test.step("should redo write", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        page.click("#redo")
      ])
      expect(await page.locator("#editor").evaluate((node) => node.editor.model.symbols)).toHaveLength(1)
      await expect(page.locator("#result")).toHaveText(h.exports["text/plain"][0])
    })

    await test.step("should change language", async () => {
      const [requestEn] = await Promise.all([
        page.waitForRequest(req => req.url().includes("/api/v4.0/iink/recognize") && req.method() === "POST"),
        writeStrokes(page, h.strokes),
      ])
      const enPostData = (await requestEn).postDataJSON()
      expect(enPostData.configuration.lang).toEqual("en_US")

      await page.selectOption("#language", "fr_FR")

      await expect(page.locator("#result")).toBeEmpty()

      const [requestFr] = await Promise.all([
        page.waitForRequest(req => req.url().includes("/api/v4.0/iink/recognize") && req.method() === "POST"),
        writeStrokes(page, h.strokes),
      ])
      const frPostData = (await requestFr).postDataJSON()
      expect(frPostData.configuration.lang).toEqual("fr_FR")
    })
  })
})