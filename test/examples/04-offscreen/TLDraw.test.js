import { test, expect } from "@playwright/test"
import { waitForEditorInit, writeStrokes, } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"

test.describe("Offscreen TLDraw", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/offscreen-interactivity/offscreen_interactivity_tldraw/dist/index.html")
    await expect(page.locator('.loader')).toHaveCount(0)
  })

  test.describe("write", () => {
    test("should have shapes tab updated", async ({ page }) => {
      await writeStrokes(page, helloOneStroke.strokes),
      await page.locator('button:text("Shapes")').click()
      const shapeLoc = await page.locator('.tab-content.active')
      await expect(shapeLoc).toBeVisible()
      let shapeText = await shapeLoc.textContent()
      expect(shapeText).toContain("1 item")
      await shapeLoc.click({
        button: 'left',
        position: { x: 10, y: 10 }
      });
      shapeText = await shapeLoc.textContent()
      expect(shapeText).toContain("12 items")
      const ellipsisLoc = await page.locator('.node-ellipsis').first()
      await expect(ellipsisLoc).toBeVisible()
      await ellipsisLoc.click();
      shapeText = await page.locator('.pushed-content').first().textContent()
      expect(shapeText).toContain("\"type\":string\"draw\"")
      expect(shapeText).toContain("\"typeName\":string\"shape\"")
    })

    test("should have Export JIIX tab updated", async ({ page }) => {
      await writeStrokes(page, helloOneStroke.strokes)
      await page.locator('button:text("Export JIIX")').click()
      const jiixLoc = page.locator('.tab-content.active')
      await expect(jiixLoc).toBeVisible()
      await expect(jiixLoc).toContainText("5 items",{options: {timeout : 2000}})
      await jiixLoc.click({
        button: 'left',
        position: { x: 10, y: 10 }
      });
      const jiixText = await jiixLoc.textContent()
      expect(jiixText).toContain("\"type\":string\"Raw Content\"")
      // let ellipsisLoc = await page.locator('.node-ellipsis').filter({hasText: 'bounding-box'})

      await page.getByText('bounding-box').click();
      const bboxText = await page.locator('.pushed-content').first().textContent()
      expect(bboxText).toContain("\"x\":float")
      expect(bboxText).toContain("\"y\":float")
      expect(bboxText).toContain("\"width\":float")
      expect(bboxText).toContain("\"height\":float")

      const elemsLoc = page.getByText('elements')
      await expect(elemsLoc).toBeVisible()
      await elemsLoc.click();
      const elems2Loc = page.locator('.pushed-content').last()
      await expect(elems2Loc).toBeVisible()
      await expect(elems2Loc).toHaveText("0:{...}7 items")
      await elems2Loc.locator('.node-ellipsis').click();
      const elemsText = await elems2Loc.textContent()
      expect(elemsText).toContain("\"type\":string\"Text\"")
      expect(elemsText).toContain("\"label\":string\"hello\"")
    })

    test("should undo and redo", async ({ page }) => {
      await writeStrokes(page, helloOneStroke.strokes)
      const tabShapeBtnLoc = page.locator('button:text("Shapes")')
      await tabShapeBtnLoc.click()
      await expect(tabShapeBtnLoc).toHaveClass(/active/)

      const shapeTabContentLoc = page.locator('#shapes-tab-content')
      await expect(shapeTabContentLoc).toBeVisible()
      // stroke has been written and shape tab has been updated
      await expect(shapeTabContentLoc).toContainText("1 item")

      await page.getByTitle('Undo').click()
      await expect(shapeTabContentLoc).toBeVisible()
      await expect(shapeTabContentLoc).toContainText("0 item")

      await page.getByTitle('Redo').click()
      await expect(shapeTabContentLoc).toBeVisible()
      await expect(shapeTabContentLoc).toContainText("1 item")
    })

    test("Export HTML should be updated", async ({ page }) => {
      const htmlExportBtnLoc = page.locator('button:text("Export HTML")')
      await htmlExportBtnLoc.click()
      await expect(htmlExportBtnLoc).toHaveClass(/active/)

      const htmlTabContentLoc = page.locator('#html-tab-content')
      await expect(htmlTabContentLoc).toBeVisible()
      await expect(page.frameLocator('iframe').locator('svg')).toHaveCount(0)

      await writeStrokes(page, helloOneStroke.strokes)

      await expect(page.frameLocator('iframe').locator('svg')).toHaveCount(1)

      await expect(page).toHaveScreenshot()
    })
  })
})
