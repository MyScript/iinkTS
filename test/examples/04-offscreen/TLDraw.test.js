import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"

test.describe("Offscreen TLDraw", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/offscreen-interactivity/offscreen_interactivity_tldraw/dist/index.html`)
    if(await page.getByRole('textbox', { name: 'Host:' }).isVisible()) {
      await passModalKey(page)
    }
    else
    {
      await page.getByTestId('main-menu.button').click()
    }
    await expect(page.locator('.loader')).toHaveCount(0)
  })

  test("tabs should be empty", async ({ page }) => {
    await test.step("check shapes tab is empty", async () => {
      const tabBtnLocator = page.locator('button:text("Shapes")')
      await tabBtnLocator.click()
      await expect(tabBtnLocator).toHaveClass(/active/)

      const tabContentLoc = page.locator('#shapes-tab-content')
      await expect(tabContentLoc).toBeVisible()
      await expect(tabContentLoc).toContainText("0 item")
    })
    await test.step("check Export JIIX tab is empty", async () => {
      const tabBtnLocator = page.locator('button:text("Export JIIX")')
      await tabBtnLocator.click()
      await expect(tabBtnLocator).toHaveClass(/active/)

      const tabContentLoc = page.locator('#jiix-tab-content')
      await expect(tabContentLoc).toBeVisible()
      await expect(tabContentLoc).toContainText("0 item")
    })
    await test.step("check HTML tab is empty", async () => {
      const tabBtnLocator = page.locator('button:text("Export HTML")')
      await tabBtnLocator.click()
      await expect(tabBtnLocator).toHaveClass(/active/)

      const tabContentLoc = page.locator('#html-tab-content')
      await expect(tabContentLoc).toBeVisible()
      await expect(page.frameLocator('iframe').locator('svg')).toHaveCount(0)
    })
  })

  test("tabs should be updated after writing", async ({ page }) => {
    await test.step("write hello", async () => {
      await writeStrokes(page, helloOneStroke.strokes)
    })

    await test.step("check Export HTML tab is updated", async () => {
      const tabBtnLocator = page.locator('button:text("Export HTML")')
      await tabBtnLocator.click()
      await expect(tabBtnLocator).toHaveClass(/active/)

      const tabContentLoc = page.locator('#html-tab-content')
      await expect(tabContentLoc).toBeVisible()
      await expect(tabContentLoc.frameLocator('iframe').locator('svg')).toHaveCount(1)
      await expect(page).toHaveScreenshot({ name: "tldraw-hello-html.png" })
    })

    await test.step("check shapes tab is updated", async () => {
      const tabBtnLocator = page.locator('button:text("Shapes")')
      await tabBtnLocator.click()
      await expect(tabBtnLocator).toHaveClass(/active/)

      const tabContentLoc = page.locator('#shapes-tab-content')
      await expect(tabContentLoc).toBeVisible()
      await expect(tabContentLoc).toContainText("1 item")
      await expect(page).toHaveScreenshot({ name: "tldraw-hello-shapes.png" })
    })

    await test.step("check Export JIIX tab is empty", async () => {
      const tabBtnLocator = page.locator('button:text("Export JIIX")')
      await tabBtnLocator.click()
      await expect(tabBtnLocator).toHaveClass(/active/)

      const tabContentLoc = page.locator('#jiix-tab-content')
      await expect(tabContentLoc).toBeVisible()
      await expect(tabContentLoc).toContainText("5 items")
      await tabContentLoc.click({
        button: 'left',
        position: { x: 10, y: 10 }
      });
      await expect(tabContentLoc).toContainText("\"type\":string\"Raw Content\"")
      await expect(page).toHaveScreenshot({ name: "tldraw-hello-jiix.png" })
    })
  })

  test("should undo and redo", async ({ page }) => {
    await test.step("write hello", async () => {
      await writeStrokes(page, helloOneStroke.strokes)
    })
    const tabShapeBtnLoc = page.locator('button:text("Shapes")')
    await tabShapeBtnLoc.click()
    await expect(tabShapeBtnLoc).toHaveClass(/active/)

    const shapeTabContentLoc = page.locator('#shapes-tab-content')
    await expect(shapeTabContentLoc).toBeVisible()
    // stroke has been written and shape tab has been updated
    await expect(shapeTabContentLoc).toContainText("1 item")

    await page.locator('button[data-testid="quick-actions.undo"]').click()
    await expect(shapeTabContentLoc).toContainText("0 item")

    await page.locator('button[data-testid="quick-actions.redo"]').click()
    await expect(shapeTabContentLoc).toContainText("1 item")
  })
})
