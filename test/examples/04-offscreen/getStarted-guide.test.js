import { test, expect } from "@playwright/test"
import {
  passModalKey,
  getEditorConfiguration,
  waitForUIUpdatedEvent
} from "../helper"

import locator from "../locators"

test.describe("Offscreen Get Started - Guides", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/offscreen-interactivity/index.html`)
    await passModalKey(page)
  })

  test("Menu guide display", async ({ page }) => {
    await test.step("should not display menu guide", async () => {
      const menuActionGuideBtn = page.locator(locator.menu.action.guide.enable)
      await expect(menuActionGuideBtn).toBeHidden()
    })

    await test.step("should display menu guide", async () => {
      await page.locator(locator.menu.action.triggerBtn).click()
      const menuActionGuideBtn = page.locator(locator.menu.action.guide.triggerBtn)
      await expect(menuActionGuideBtn).toBeVisible()
      await menuActionGuideBtn.click()
      await expect(page.getByText("Guide", { exact: true })).toBeVisible()
      await expect(page.getByRole("checkbox", { id: locator.menu.action.guide.enable })).toBeVisible()
      await expect(page.locator(locator.menu.action.guide.types)).toBeVisible()
      await expect(page.locator("#ms-menu-action-guide-size")).toBeVisible()
    })
  })

  const guideSizes = [
    // No test too small because it's too slow
    // { "size": "S", "locator": locator.menu.action.guide.sizeS },
    { "size": "M", "locator": locator.menu.action.guide.sizeM },
    { "size": "L", "locator": locator.menu.action.guide.sizeL },
    { "size": "XL", "locator": locator.menu.action.guide.sizeXL },
  ]

  guideSizes.forEach(async (guideSize) => {

    test(`should display guides in grid mode with size: "${ guideSize.size }"`, async ({ page }) => {

      await test.step("should set guide style to grid", async () => {
        await page.locator(locator.menu.action.triggerBtn).click()
        await page.locator(locator.menu.action.guide.triggerBtn).click()
        await page.getByRole("checkbox", { id: locator.menu.action.guide.enable }).check()
        await page.locator(locator.menu.action.guide.types).selectOption({ value: "grid" })
      })

      await test.step("should set guide size to : " + guideSize.size, async () => {
        await expect(page.locator(guideSize.locator)).toBeVisible()
        await Promise.all([
          waitForUIUpdatedEvent(page),
          page.locator(guideSize.locator).click()
        ])
        await expect(page.locator(locator.guidesWrapper)).toBeVisible()
      })

      await expect(page).toHaveScreenshot()
    })

    test(`should display guides in line mode with size: "${ guideSize.size }"`, async ({ page }) => {

      await test.step("should set guide style to line", async () => {
        await page.locator(locator.menu.action.triggerBtn).click()
        await page.locator(locator.menu.action.guide.triggerBtn).click()
        await page.getByRole("checkbox", { id: locator.menu.action.guide.enable }).check()
        await page.locator(locator.menu.action.guide.types).selectOption({ value: "line" })
      })

      await test.step("should set guide size to : " + guideSize.size, async () => {
        await expect(page.locator(guideSize.locator)).toBeVisible()
        await Promise.all([
          waitForUIUpdatedEvent(page),
          page.locator(guideSize.locator).click()
        ])
        await expect(page.locator(locator.guidesWrapper)).toBeVisible()
      })

      await expect(page).toHaveScreenshot()
    })

    test(`should display guides in point mode with size: "${ guideSize.size }"`, async ({ page }) => {

      await test.step("should set guide style to point", async () => {
        await page.locator(locator.menu.action.triggerBtn).click()
        await page.locator(locator.menu.action.guide.triggerBtn).click()
        await page.getByRole("checkbox", { id: locator.menu.action.guide.enable }).check()
        await page.locator(locator.menu.action.guide.types).selectOption({ value: "point" })
      })

      await test.step("should set guide size to : " + guideSize.size, async () => {
        await expect(page.locator(guideSize.locator)).toBeVisible()
        await Promise.all([
          waitForUIUpdatedEvent(page),
          page.locator(guideSize.locator).click()
        ])
        await expect(page.locator(locator.guidesWrapper)).toBeVisible()
      })

      await expect(page).toHaveScreenshot()
    })
  })
})

