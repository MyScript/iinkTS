import { test, expect } from "@playwright/test"
import { waitForEditorInit, writeStrokes, waitForExportedEvent, getEditorExports, passModalKey, getEditorStrokes } from "../helper"
import h from "../__dataset__/h"

test.describe("Rest v2 Text", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/rest/rest_v2_text.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Rest v2 Text")
  })

  test("should display text/plain into result", async ({ page }) => {
    const [exportedDatas] = await Promise.all([waitForExportedEvent(page), writeStrokes(page, h.strokes)])
    const resultText = await page.locator("#result").textContent()
    expect(resultText).toStrictEqual(exportedDatas["text/plain"])
    expect(resultText).toStrictEqual(h.exports["text/plain"].at(-1))
  })

  test("should display stroke in DOM", async ({ page }) => {
    const [exportedDatas] = await Promise.all([waitForExportedEvent(page), writeStrokes(page, h.strokes)])
    const strokes = await getEditorStrokes(page)
    expect(strokes).toHaveLength(1)
    await expect(page.locator(`#${strokes[0].id}`)).toBeVisible()
  })

  test.describe("Request sent", () => {
    let mimeTypeRequest = []
    const countMimeType = async (request) => {
      if (request.url().includes("api/v4.0/iink/recognize") && request.method() === "POST") {
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
      await Promise.all([waitForExportedEvent(page), writeStrokes(page, h.strokes)])
      expect(mimeTypeRequest).toHaveLength(1)
      expect(mimeTypeRequest[0]).toContain("text/plain")
    })
  })

  test("Nav actions", async ({ page }) => {
    await test.step("should write", async () => {
      const [exportedDatas] = await Promise.all([waitForExportedEvent(page), writeStrokes(page, h.strokes)])
      await expect(page.locator("#result")).toHaveText(exportedDatas["text/plain"])
      await expect(page.locator("#result")).toHaveText(h.exports["text/plain"].at(-1))
    })

    await test.step("should clear", async () => {
      const promisesResult = await Promise.all([waitForExportedEvent(page), page.locator("#clear").click()])
      expect(promisesResult[0]).toBeNull()
      expect(await getEditorExports(page)).toBeFalsy()
      await expect(page.locator("#result")).toBeEmpty()
    })

    await test.step("should undo clear", async () => {
      await Promise.all([waitForExportedEvent(page), page.locator("#undo").click()])
      expect(await page.locator("#editorEl").evaluate((node) => node.editor.model.strokes)).toHaveLength(1)
      await expect(page.locator("#result")).toHaveText(h.exports["text/plain"][0])
    })

    await test.step("should undo write", async () => {
      await Promise.all([waitForExportedEvent(page), page.locator("#undo").click()])
      expect(await page.locator("#editorEl").evaluate((node) => node.editor.model.strokes)).toHaveLength(0)
      await expect(page.locator("#result")).toBeEmpty()
    })

    await test.step("should redo write", async () => {
      await Promise.all([waitForExportedEvent(page), page.locator("#redo").click()])
      expect(await page.locator("#editorEl").evaluate((node) => node.editor.model.strokes)).toHaveLength(1)
      await expect(page.locator("#result")).toHaveText(h.exports["text/plain"][0])
    })

    await test.step("should change language", async () => {
      const [requestEn] = await Promise.all([
        page.waitForRequest((req) => req.url().includes("/api/v4.0/iink/recognize") && req.method() === "POST"),
        writeStrokes(page, h.strokes),
      ])
      const enPostData = (await requestEn).postDataJSON()
      expect(enPostData.configuration.lang).toEqual("en_US")

      await page.locator("#language").selectOption("fr_FR")

      const [requestFr] = await Promise.all([
        page.waitForRequest((req) => req.url().includes("/api/v4.0/iink/recognize") && req.method() === "POST"),
        writeStrokes(page, h.strokes),
      ])
      const frPostData = (await requestFr).postDataJSON()
      expect(frPostData.configuration.lang).toEqual("fr_FR")
    })
  })
})
