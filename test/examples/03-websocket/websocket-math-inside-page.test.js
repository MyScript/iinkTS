import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  getEditorExports,
  waitForImportedEvent,
  waitForExportedEvent,
  callEditorIdle,
  passModalKey,
} from "../helper"

const mathContentList = [
  {
    id: "eq-1",
    latex: "a^{2}+b^{2}=c^{2}",
    textContent: "a2+b2=c2",
    strokesToWrite: [
      {
        id: "mouse-1726155506927",
        type: "stroke",
        pointerType: "mouse",
        pointers: [
          { x: 159, y: 174, t: 1689858551959, p: 0.5 },
          { x: 157, y: 177, t: 1689858552062, p: 0.81 },
          { x: 156, y: 180, t: 1689858552078, p: 0.68 },
          { x: 154, y: 183, t: 1689858552094, p: 0.7 },
          { x: 150, y: 188, t: 1689858552112, p: 0.77 },
          { x: 149, y: 191, t: 1689858552128, p: 0.68 },
          { x: 146, y: 195, t: 1689858552162, p: 0.74 },
          { x: 143, y: 199, t: 1689858552194, p: 0.74 },
          { x: 142, y: 202, t: 1689858552228, p: 0.68 },
          { x: 138, y: 205, t: 1689858552261, p: 0.74 },
          { x: 144, y: 204, t: 1689858552711, p: 0.77 },
          { x: 149, y: 204, t: 1689858552727, p: 0.74 },
          { x: 154, y: 204, t: 1689858552744, p: 0.74 },
          { x: 159, y: 204, t: 1689858552761, p: 0.74 },
          { x: 162, y: 204, t: 1689858552835, p: 0.68 },
          { x: 166, y: 202, t: 1689858552877, p: 0.73 },
          { x: 169, y: 202, t: 1689858552910, p: 0.68 },
          { x: 168, y: 205, t: 1689858553177, p: 0.68 },
          { x: 169, y: 208, t: 1689858553193, p: 0.68 },
          { x: 169, y: 212, t: 1689858553227, p: 0.71 },
          { x: 169, y: 216, t: 1689858553243, p: 0.71 },
          { x: 168, y: 219, t: 1689858553260, p: 0.68 },
          { x: 168, y: 222, t: 1689858553277, p: 0.68 },
          { x: 168, y: 225, t: 1689858553431, p: 0.68 },
          { x: 168, y: 229, t: 1689858553460, p: 0.71 },
        ],
      },
    ],
    latexAfterWriting: "4a^{2}+b^{2}=c^{2}",
  },
  {
    id: "eq-2",
    latex: "c=\\sqrt{a^{2}+b^{2}}",
    textContent: "c=a2+b2​",
    strokesToWrite: [
      {
        id: "mouse-1726156151286",
        type: "stroke",
        pointerType: "mouse",
        pointers: [
          { x: 190, y: 194, t: 1689859052854, p: 0.5 },
          { x: 190, y: 191, t: 1689859052908, p: 0.83 },
          { x: 191, y: 188, t: 1689859052922, p: 0.68 },
          { x: 192, y: 183, t: 1689859052956, p: 0.75 },
          { x: 193, y: 180, t: 1689859052972, p: 0.68 },
          { x: 195, y: 176, t: 1689859052989, p: 0.73 },
          { x: 198, y: 174, t: 1689859053054, p: 0.7 },
          { x: 201, y: 172, t: 1689859053092, p: 0.7 },
          { x: 206, y: 171, t: 1689859053122, p: 0.75 },
          { x: 211, y: 171, t: 1689859053139, p: 0.74 },
          { x: 215, y: 172, t: 1689859053155, p: 0.72 },
          { x: 218, y: 173, t: 1689859053189, p: 0.68 },
          { x: 222, y: 175, t: 1689859053222, p: 0.73 },
          { x: 224, y: 178, t: 1689859053238, p: 0.7 },
          { x: 226, y: 181, t: 1689859053272, p: 0.7 },
          { x: 227, y: 184, t: 1689859053289, p: 0.68 },
          { x: 227, y: 187, t: 1689859053306, p: 0.68 },
          { x: 227, y: 192, t: 1689859053339, p: 0.74 },
          { x: 226, y: 195, t: 1689859053356, p: 0.68 },
          { x: 225, y: 198, t: 1689859053372, p: 0.68 },
          { x: 225, y: 201, t: 1689859053389, p: 0.68 },
          { x: 222, y: 206, t: 1689859053421, p: 0.76 },
          { x: 221, y: 209, t: 1689859053438, p: 0.68 },
          { x: 218, y: 213, t: 1689859053472, p: 0.74 },
          { x: 214, y: 217, t: 1689859053489, p: 0.76 },
          { x: 210, y: 220, t: 1689859053522, p: 0.74 },
          { x: 208, y: 224, t: 1689859053555, p: 0.73 },
          { x: 205, y: 227, t: 1689859053589, p: 0.72 },
          { x: 201, y: 230, t: 1689859053621, p: 0.74 },
          { x: 198, y: 233, t: 1689859053739, p: 0.72 },
          { x: 206, y: 232, t: 1689859053922, p: 0.8 },
          { x: 215, y: 231, t: 1689859053938, p: 0.81 },
          { x: 228, y: 231, t: 1689859053955, p: 0.64 },
          { x: 238, y: 231, t: 1689859053971, p: 0.68 },
          { x: 247, y: 231, t: 1689859053988, p: 0.81 },
          { x: 255, y: 231, t: 1689859054005, p: 0.8 },
        ],
      },
    ],
    latexAfterWriting: "2c=\\sqrt{a^{2}+b^{2}}",
  },
  {
    id: "eq-3",
    latex: "a=\\sqrt{c^{2}-b^{2}}",
    textContent: "a=c2−b2​",
    strokesToWrite: [
      {
        id: "mouse-1726156208444",
        type: "stroke",
        pointerType: "mouse",
        pointers: [
          { x: 159, y: 174, t: 1689858551959, p: 0.5 },
          { x: 157, y: 177, t: 1689858552062, p: 0.81 },
          { x: 156, y: 180, t: 1689858552078, p: 0.68 },
          { x: 154, y: 183, t: 1689858552094, p: 0.7 },
          { x: 150, y: 188, t: 1689858552112, p: 0.77 },
          { x: 149, y: 191, t: 1689858552128, p: 0.68 },
          { x: 146, y: 195, t: 1689858552162, p: 0.74 },
          { x: 143, y: 199, t: 1689858552194, p: 0.74 },
          { x: 142, y: 202, t: 1689858552228, p: 0.68 },
          { x: 138, y: 205, t: 1689858552261, p: 0.74 },
          { x: 144, y: 204, t: 1689858552711, p: 0.77 },
          { x: 149, y: 204, t: 1689858552727, p: 0.74 },
          { x: 154, y: 204, t: 1689858552744, p: 0.74 },
          { x: 159, y: 204, t: 1689858552761, p: 0.74 },
          { x: 162, y: 204, t: 1689858552835, p: 0.68 },
          { x: 166, y: 202, t: 1689858552877, p: 0.73 },
          { x: 169, y: 202, t: 1689858552910, p: 0.68 },
          { x: 168, y: 205, t: 1689858553177, p: 0.68 },
          { x: 169, y: 208, t: 1689858553193, p: 0.68 },
          { x: 169, y: 212, t: 1689858553227, p: 0.71 },
          { x: 169, y: 216, t: 1689858553243, p: 0.71 },
          { x: 168, y: 219, t: 1689858553260, p: 0.68 },
          { x: 168, y: 222, t: 1689858553277, p: 0.68 },
          { x: 168, y: 225, t: 1689858553431, p: 0.68 },
          { x: 168, y: 229, t: 1689858553460, p: 0.71 },
        ],
      },
    ],
    latexAfterWriting: "4a=\\sqrt{c^{2}-b^{2}}",
  },
  {
    id: "eq-4",
    latex: "b=\\sqrt{c^{2}-a^{2}}",
    textContent: "b=c2−a2​",
    strokesToWrite: [
      {
        id: "mouse-1726156283299",
        type: "stroke",
        pointerType: "mouse",
        pointers: [
          { x: 190, y: 194, t: 1689859052854, p: 0.5 },
          { x: 190, y: 191, t: 1689859052908, p: 0.83 },
          { x: 191, y: 188, t: 1689859052922, p: 0.68 },
          { x: 192, y: 183, t: 1689859052956, p: 0.75 },
          { x: 193, y: 180, t: 1689859052972, p: 0.68 },
          { x: 195, y: 176, t: 1689859052989, p: 0.73 },
          { x: 198, y: 174, t: 1689859053054, p: 0.7 },
          { x: 201, y: 172, t: 1689859053092, p: 0.7 },
          { x: 206, y: 171, t: 1689859053122, p: 0.75 },
          { x: 211, y: 171, t: 1689859053139, p: 0.74 },
          { x: 215, y: 172, t: 1689859053155, p: 0.72 },
          { x: 218, y: 173, t: 1689859053189, p: 0.68 },
          { x: 222, y: 175, t: 1689859053222, p: 0.73 },
          { x: 224, y: 178, t: 1689859053238, p: 0.7 },
          { x: 226, y: 181, t: 1689859053272, p: 0.7 },
          { x: 227, y: 184, t: 1689859053289, p: 0.68 },
          { x: 227, y: 187, t: 1689859053306, p: 0.68 },
          { x: 227, y: 192, t: 1689859053339, p: 0.74 },
          { x: 226, y: 195, t: 1689859053356, p: 0.68 },
          { x: 225, y: 198, t: 1689859053372, p: 0.68 },
          { x: 225, y: 201, t: 1689859053389, p: 0.68 },
          { x: 222, y: 206, t: 1689859053421, p: 0.76 },
          { x: 221, y: 209, t: 1689859053438, p: 0.68 },
          { x: 218, y: 213, t: 1689859053472, p: 0.74 },
          { x: 214, y: 217, t: 1689859053489, p: 0.76 },
          { x: 210, y: 220, t: 1689859053522, p: 0.74 },
          { x: 208, y: 224, t: 1689859053555, p: 0.73 },
          { x: 205, y: 227, t: 1689859053589, p: 0.72 },
          { x: 201, y: 230, t: 1689859053621, p: 0.74 },
          { x: 198, y: 233, t: 1689859053739, p: 0.72 },
          { x: 206, y: 232, t: 1689859053922, p: 0.8 },
          { x: 215, y: 231, t: 1689859053938, p: 0.81 },
          { x: 228, y: 231, t: 1689859053955, p: 0.64 },
          { x: 238, y: 231, t: 1689859053971, p: 0.68 },
          { x: 247, y: 231, t: 1689859053988, p: 0.81 },
          { x: 255, y: 231, t: 1689859054005, p: 0.8 },
        ],
      },
    ],
    latexAfterWriting: "2b=\\sqrt{c^{2}-a^{2}}",
  },
]

test.describe("Websocket Math Inside Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_math_inside_page.html")
    await passModalKey(page)
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(2000)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Dynamic math part inside a page")
  })

  mathContentList.forEach(async (mc) => {
    test(`Math content for ${mc.id}`, async ({ page }) => {
      await test.step(`should open modal editor`, async () => {
        await expect(page.locator("#editor-modal")).toBeHidden()
        await expect(page.locator(`#${mc.id} .katex-html`)).toHaveText(
          mc.textContent
        )
        await page.locator(`#${mc.id}`).click()
        await expect(page.locator("#editor-modal")).toBeVisible()

      })

      await test.step(`should import data-jiix`, async () => {
        await callEditorIdle(page)
        const currentExport = await getEditorExports(page)
        expect(currentExport["application/x-latex"]).toEqual(mc.latex)
      })

      await test.step(`should update equation`, async () => {
        await Promise.all([
          waitForExportedEvent(page),
          writeStrokes(page, mc.strokesToWrite),
        ])
        await callEditorIdle(page)
        const currentExport = await getEditorExports(page)
        expect(currentExport["application/x-latex"]).toEqual(
          mc.latexAfterWriting
        )
      })

      await test.step(`should close modal editor`, async () => {
        await callEditorIdle(page)
        await page.locator("#close").click()
        await expect(page.locator("#editor-modal")).toBeHidden()
      })

      await test.step(`should update math content`, async () => {
        await callEditorIdle(page)
        await expect(page.locator(`#${mc.id} .katex-html`)).not.toHaveText(
          mc.textContent
        )
      })

      await test.step(`should re-open modal editor with new equation`, async () => {
        await Promise.all([
          waitForImportedEvent(page),
          page.locator(`#${mc.id}`).click(),
        ])
        await expect(page.locator("#editor-modal")).toBeVisible()
        await callEditorIdle(page)
        const currentExport = await getEditorExports(page)
        expect(currentExport["application/x-latex"]).toEqual(
          mc.latexAfterWriting
        )
      })

      await test.step(`should re-close modal editor`, async () => {
        await page.locator("#close").click()
        await expect(page.locator("#editor-modal")).toBeHidden()
      })
    })
  })
})
