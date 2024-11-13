import { test, expect } from "@playwright/test"
import {
  waitForEditorRest,
  waitForExportedEvent,
  getEditorExports,
  getEditorSymbols,
} from "../helper"

test.describe("Rest Diagram Import", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/rest/rest_diagram_iink_import.html")
    await waitForEditorRest(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Rest Diagram Import")
  })

  test("should display empty result", async ({ page }) => {
    await expect(page.locator("#result")).toBeEmpty()
  })

  test("should import pointers", async ({ page }) => {
    const [exportedDatas] = await Promise.all([
      waitForExportedEvent(page),
      page.locator("#import-btn").click(),
    ])
    await expect(page.locator("#result")).toHaveText(JSON.stringify(exportedDatas))
    expect(Object.keys(exportedDatas["application/vnd.myscript.jiix"].elements).length).toEqual(12)
    expect(await getEditorSymbols(page)).toHaveLength(40)
  })

  test("Nav actions", async ({ page }) => {

    await test.step("should import pointers", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        page.locator("#import-btn").click(),
      ])
    })

    await test.step("should clear", async () => {
      const promisesResult = await Promise.all([
        waitForExportedEvent(page),
        page.click("#clear"),
      ])
      expect(promisesResult[0]).toBeFalsy()
      expect(await getEditorExports(page)).toBeFalsy()
      await expect(page.locator("#result")).toHaveText("{}")
    })

    await test.step("should undo", async () => {
      const [exportedDatas] = await Promise.all([
        waitForExportedEvent(page),
        page.click("#undo"),
      ])
      await expect(page.locator("#result")).toHaveText(JSON.stringify(exportedDatas))
      expect(Object.keys(exportedDatas["application/vnd.myscript.jiix"].elements).length).toEqual(12)

      expect(await getEditorSymbols(page)).toHaveLength(40)
    })

    await test.step("should redo", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        page.click("#redo"),
      ])
      await expect(page.locator("#result")).toHaveText("{}")
      expect(await getEditorSymbols(page)).toHaveLength(0)
    })
  })
})
