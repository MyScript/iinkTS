import { test, expect } from "@playwright/test"
import {
  waitForEditorInit,
  getEditorConfiguration,
  waitForUIUpdatedEvent
} from "../helper"

import locator from "../locators"

test.describe("Offscreen Get Started - Guides", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/offscreen-interactivity/index.html")
    await waitForEditorInit(page)
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

      const conf = await getEditorConfiguration(page)
      const increment = conf.rendering.guides.gap / 5

      const viewportSize = page.viewportSize()
      const width = Math.max(viewportSize.width, conf.rendering.minWidth)
      const height = Math.max(viewportSize.height, conf.rendering.minHeight)

      await test.step("verify horizontal lines", async () => {
        let i = 0
        for (let y = 0; y < height; y += increment) {
          const ll = page.locator(locator.guidesWrapper + ` line[y1="${ y }"][y2="${ y }"]`)
          await expect(ll).toHaveAttribute("x1", "0")
          await expect(ll).toHaveAttribute("x2", width.toString())
          await expect(ll).toHaveAttribute("stroke-width", i % 5 ? "0.25" : "1")
          i++
        }
      })

      await test.step("verify vertical lines", async () => {
        let i = 0
        for (let x = 0; x < width; x += increment) {
          const ll = page.locator(locator.guidesWrapper + ` line[x1="${ x }"][x2="${ x }"]`)
          await expect(ll).toHaveAttribute("y1", "0")
          await expect(ll).toHaveAttribute("y2", height.toString())
          await expect(ll).toHaveAttribute("stroke-width", i % 5 ? "0.25" : "1")
          i++
        }
      })

      await test.step("verify no points", async () => {
        await expect(page.locator(locator.guidesWrapper + ` circle`)).toHaveCount(0)
      })
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

      const conf = await getEditorConfiguration(page)
      const viewportSize = page.viewportSize()
      const width = Math.max(viewportSize.width, conf.rendering.minWidth)
      const height = Math.max(viewportSize.height, conf.rendering.minHeight)
      const increment = conf.rendering.guides.gap

      await test.step("verify horizontal lines", async () => {
        let i = 0
        for (let y = increment; y < height; y += increment) {
          const ll = page.locator(locator.guidesWrapper + ` line[y1="${ y }"][y2="${ y }"]`)
          await expect(ll).toHaveAttribute("x1", (increment).toString())
          await expect(ll).toHaveAttribute("x2", (width - increment).toString())
          await expect(ll).toHaveAttribute("stroke-width", "1")
          i++
        }
      })

      await test.step("verify no vertical lines", async () => {
        for (let x = 0; x < width; x += increment) {
          await expect(page.locator(locator.guidesWrapper + ` line[x1="${ x }"][x2="${ x }"]`)).toHaveCount(0)
        }
      })

      await test.step("verify there is no point", async () => {
        await expect(page.locator(locator.guidesWrapper + ` circle`)).toHaveCount(0)
      })
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


      const conf = await getEditorConfiguration(page)
      const viewportSize = page.viewportSize()
      const width = Math.max(viewportSize.width, conf.rendering.minWidth)
      const height = Math.max(viewportSize.height, conf.rendering.minHeight)
      const increment = conf.rendering.guides.gap

      await test.step("verify there is no line", async () => {
        await expect(page.locator(locator.guidesWrapper + ` line`)).toHaveCount(0)
      })

      await test.step("verify points", async () => {
        for (let x = increment; x < width; x += increment) {
          for (let y = increment; y < height; y += increment) {
            const ll = page.locator(locator.guidesWrapper + ` circle[cx="${ x }"][cy="${ y }"]`)
            await expect(ll).toHaveAttribute("r", "1")
          }
        }
      })
    })
  })
})

