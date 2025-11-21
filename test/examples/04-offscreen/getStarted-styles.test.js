import { test, expect } from "@playwright/test"
import {
  passModalKey,
  getEditorSymbols,
  callEditorIdle,
  waitForConvertedEvent,
  waitForEditorInit,
  waitForSynchronizedEvent,
  writeStrokes,
  callEditoConvert
} from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"

test.describe("Offscreen Get Started Menu Style", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/offscreen-interactivity/index.html")
    await passModalKey(page)
  })

  test.describe("Stroke color", () => {
    const colors = [
      { color: "blue", rgb: "0000ff" },
      { color: "green", rgb: "00ff00" },
      { color: "red", rgb: "ff0000" },
      { color: "black", rgb: "000000" },
    ]

    colors.forEach(async (color) => {
      test(`should write with color: ${ color.color }`, async ({ page }) => {
        await page.locator("#ms-menu-style-color").click()
        await page.locator("#ms-menu-style-color-" + color.rgb + "-btn").click()

        await Promise.all([
          waitForSynchronizedEvent(page),
          writeStrokes(page, helloOneStroke.strokes),
        ])

        const symbols = await getEditorSymbols(page)
        const stroke = symbols[0].strokes[0]
        expect(stroke.style.color).toStrictEqual("#" + color.rgb)
        expect(stroke.style.width).toStrictEqual(2)

        const strokePathLocator = page.locator(` #${ stroke.id } path`)
        await expect(strokePathLocator).toBeVisible()
        await expect(strokePathLocator).toHaveAttribute("fill", "#" + color.rgb)
      })
    })
  })

  test.describe("Stroke thickness", () => {
    const thicknesses = [
      { size: "S", width: 1 },
      { size: "M", width: 2 },
      { size: "L", width: 4 },
      { size: "XL", width: 8 },
    ]
    thicknesses.forEach(async (thickness) => {
      test(`should write with size: ${ thickness.size }`, async ({ page }) => {
        await page.locator("#ms-menu-style-thickness").click()
        await page
          .locator("#ms-menu-style-thickness-" + thickness.size + "-btn")
          .click()

        await Promise.all([
          waitForSynchronizedEvent(page),
          writeStrokes(page, helloOneStroke.strokes),
        ])

        const symbols = await getEditorSymbols(page)
        const stroke = symbols[0].strokes[0]
        expect(stroke.style.color).toStrictEqual("#000000")
        expect(stroke.style.width).toStrictEqual(thickness.width)

        const strokePathLocator = page.locator(` #${ stroke.id } path`)
        await expect(strokePathLocator).toBeVisible()
        await expect(strokePathLocator).toHaveAttribute(
          "stroke-width",
          thickness.width.toString()
        )
      })
    })
  })

  test.describe("Font size", () => {
    const fontSizes = [
      //{"size":"Auto", "pixels":34},
      { size: "S", pixels: 25 },
      { size: "M", pixels: 37.5 },
      { size: "L", pixels: 50 },
    ]
    fontSizes.forEach(async (fontSize) => {
      test(`should convert stroke with font size: ${fontSize.size}`, async ({ page }) => {
        await page.locator("#ms-menu-style-font-size").click()
        await page.locator("#ms-menu-style-font-size-" + fontSize.size + "-btn").click()
        await Promise.all([
          waitForSynchronizedEvent(page),
          writeStrokes(page, helloOneStroke.strokes),
        ])

        await Promise.all([
          waitForConvertedEvent(page),
          callEditoConvert(page)
        ])

        const symbols = await getEditorSymbols(page)
        expect(symbols).toHaveLength(1)

        const chars = symbols[0].chars
        expect(chars.length).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label.length)

        for (const char of chars) {
          expect(char.fontSize).toStrictEqual(fontSize.pixels)
          await expect(page.locator(`#${ char.id }`)).toHaveAttribute("font-size", fontSize.pixels.toString() + "px")
        }
      })
    })

    test("should have a correct text converted size with fontSize Auto", async ({ page, }) => {
      await page.locator("#ms-menu-style-font-size").click()
      await page.locator("#ms-menu-style-font-size-Auto-btn").click()

      await Promise.all([
        waitForSynchronizedEvent(page),
        writeStrokes(page, helloOneStroke.strokes),
      ])

      await Promise.all([
        waitForConvertedEvent(page),
        callEditoConvert(page)
      ])

      const minX = Math.min(...helloOneStroke.strokes[0].pointers.map(p => p.x))
      const minY = Math.min(...helloOneStroke.strokes[0].pointers.map(p => p.y))
      const maxY = Math.max(...helloOneStroke.strokes[0].pointers.map(p => p.y))

      const strokesHeight = maxY - minY
      const symbolsAfterConvert = await page.evaluate("editorEl.editor.model.symbols")
      const boundsHeight = symbolsAfterConvert[0].bounds.height
      const chars = symbolsAfterConvert[0].chars
      expect(chars.length).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label.length)
      // Allow 20% of difference between the height of the strokes and the height of the bounds
      expect(boundsHeight).toBeLessThanOrEqual(1.2 * strokesHeight)
      expect(boundsHeight).toBeGreaterThanOrEqual(0.7 * strokesHeight)
      for (const char of chars) {
        expect(Math.round(char.bounds.height)).toStrictEqual(Math.round(boundsHeight))
        expect(char.fontSize).toBeLessThan(boundsHeight)
      }
      //verify place is correct
      const startXGap = Math.abs(minX - symbolsAfterConvert[0].bounds.x)
      const startYGap = Math.abs(minY - symbolsAfterConvert[0].bounds.y)
      expect(startXGap).toBeLessThanOrEqual(20)
      expect(startYGap).toBeLessThanOrEqual(30)
    })
  })

  test.describe("Font weight", () => {
    const fontWeights = [
      { label: "Normal", id: "ms-menu-style-font-weight-Normal-btn", value: "normal" },
      { label: "Bold", id: "ms-menu-style-font-weight-Bold-btn", value: "bold" }
    ]
    fontWeights.forEach(fw => {
      test(`should have convert with font weight ${fw.label}`, async ({ page }) => {
        await page.locator("#ms-menu-style-font-weight").click()
        await page.locator(`#${fw.id}`).click()

        await Promise.all([
          waitForSynchronizedEvent(page),
          writeStrokes(page, helloOneStroke.strokes),
        ])

        await Promise.all([
          waitForConvertedEvent(page),
          callEditoConvert(page)
        ])

        const symbols = await getEditorSymbols(page)
        let chars = symbols[0].chars
        for (const char of chars) {
          expect(char.fontWeight).toStrictEqual(fw.value)
          await expect(page.locator(`#${ char.id }`)).toHaveAttribute("font-weight", fw.value)
        }
      })
    })
  })

  test.describe("Opacity", () => {
    test("should have the correct opacity", async ({ page }) => {
      await page.locator("#ms-menu-style-opacity").click()
      await page.locator("#ms-menu-style-opacity-input").fill("50")

      await Promise.all([
        waitForSynchronizedEvent(page),
        writeStrokes(page, helloOneStroke.strokes),
      ])

      const symbols = await getEditorSymbols(page)
      const stroke = symbols[0].strokes[0]
      expect(stroke.style.opacity).toStrictEqual(0.5)
      await expect(page.locator(`#${ stroke.id } path`)).toHaveAttribute("opacity", "0.5")
    })
  })
})
