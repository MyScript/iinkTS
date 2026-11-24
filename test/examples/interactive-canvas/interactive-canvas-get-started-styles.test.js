import { test, expect } from "@playwright/test"
import {
  passModalKey,
  getCanvasSymbols,
  waitForConvertedEvent,
  waitForSynchronizedEvent,
  writeStrokes,
  callCanvasConvert,
  openMenuCollapsible
} from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"

test.describe("Interactive ink canvas Get Started Menu Style", { tag: "@touch" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_get_started.html`)
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
        // The palette slides open with a 500ms max-height transition, and a click landing while
        // the swatches are still moving silently misses them — leaving the strokes written next
        // in the default black. Retry the pick until the pen style actually holds the colour.
        await expect(async () => {
          await page.locator("#ms-menu-style-color-list-" + color.rgb).click()
          expect(await page.evaluate("rootEl.iink.penStyle.color")).toStrictEqual("#" + color.rgb)
        }).toPass({ timeout: 10000 })

        await Promise.all([
          waitForSynchronizedEvent(page),
          writeStrokes(page, helloOneStroke.strokes),
        ])

        const strokes = await getCanvasSymbols(page)
        const stroke = strokes[0]
        expect(stroke.style.color).toStrictEqual("#" + color.rgb)
        expect(stroke.style.width).toStrictEqual(2)

        const strokePathLocator = page.locator(` #${stroke.id}`)
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
        await openMenuCollapsible(page, "#ms-menu-style-thickness")
        await page
          .locator("#ms-menu-style-thickness-" + thickness.width)
          .click()

        await Promise.all([
          waitForSynchronizedEvent(page),
          writeStrokes(page, helloOneStroke.strokes),
        ])

        const strokes = await getCanvasSymbols(page)
        const stroke = strokes[0]
        expect(stroke.style.color).toStrictEqual("#000000")
        expect(stroke.style.width).toStrictEqual(thickness.width)

        const strokePathLocator = page.locator(` #${stroke.id}`)
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
      { size: "S", pixels: 0.5 },
      { size: "M", pixels: 0.75 },
      { size: "L", pixels: 1 },
    ]
    const DEFAULT_GUIDE_SIZE = 50
    fontSizes.forEach(async (fontSize) => {
      test(`should convert stroke with font size: ${fontSize.size}`, async ({ page }) => {
        await openMenuCollapsible(page, "#ms-menu-style-font-size")
        await page.locator(`[id="ms-menu-style-font-size-${fontSize.pixels}"]`).click()
        await Promise.all([
          waitForSynchronizedEvent(page),
          writeStrokes(page, helloOneStroke.strokes),
        ])

        await Promise.all([
          waitForConvertedEvent(page),
          callCanvasConvert(page)
        ])

        const symbols = await getCanvasSymbols(page)
        expect(symbols).toHaveLength(1)

        const chars = symbols[0].chars
        expect(chars).toHaveLength(helloOneStroke.exports["application/vnd.myscript.jiix"].label.length)

        for (const char of chars) {
          expect(char.fontSize).toStrictEqual(fontSize.pixels * DEFAULT_GUIDE_SIZE)
          await expect(page.locator(`#${ char.id }`)).toHaveAttribute("font-size", (fontSize.pixels * DEFAULT_GUIDE_SIZE).toString() + "px")
        }
      })
    })

    test("should have a correct text converted size with fontSize Auto", async ({ page, }) => {
      await openMenuCollapsible(page, "#ms-menu-style-font-size")
      await page.locator("#ms-menu-style-font-size-auto").click()

      await Promise.all([
        waitForSynchronizedEvent(page),
        writeStrokes(page, helloOneStroke.strokes),
      ])

      await Promise.all([
        waitForConvertedEvent(page),
        callCanvasConvert(page)
      ])

      const minX = Math.min(...helloOneStroke.strokes[0].pointers.map(p => p.x))
      const minY = Math.min(...helloOneStroke.strokes[0].pointers.map(p => p.y))
      const maxY = Math.max(...helloOneStroke.strokes[0].pointers.map(p => p.y))

      const strokesHeight = maxY - minY
      const symbolsAfterConvert = await getCanvasSymbols(page)
      const boundsHeight = symbolsAfterConvert[0].bounds.height
      const chars = symbolsAfterConvert[0].chars
      expect(chars).toHaveLength(helloOneStroke.exports["application/vnd.myscript.jiix"].label.length)
      // Allow 20% of difference between the height of the strokes and the height of the bounds
      expect(boundsHeight).toBeLessThanOrEqual(1.2 * strokesHeight)
      expect(boundsHeight).toBeGreaterThanOrEqual(0.7 * strokesHeight)
      for (const char of chars) {
        expect(Math.round(char.bounds.height)).toStrictEqual(Math.round(boundsHeight))
        expect(char.fontSize).toBeLessThan(boundsHeight)
      }
      //verify place is correct
      const startXGap = Math.abs(minX - (symbolsAfterConvert[0].bounds.center.x - symbolsAfterConvert[0].bounds.width / 2))
      const startYGap = Math.abs(minY - (symbolsAfterConvert[0].bounds.center.y - symbolsAfterConvert[0].bounds.height / 2))
      expect(startXGap).toBeLessThanOrEqual(20)
      expect(startYGap).toBeLessThanOrEqual(30)
    })
  })

  test.describe("Font weight", () => {
    const fontWeights = [
      { label: "Normal", id: "ms-menu-style-font-weight-normal", value: "normal" },
      { label: "Bold", id: "ms-menu-style-font-weight-bold", value: "bold" }
    ]
    fontWeights.forEach(fw => {
      test(`should have convert with font weight ${fw.label}`, async ({ page }) => {
        await openMenuCollapsible(page, "#ms-menu-style-font-weight")
        await page.locator(`#${fw.id}`).click()

        await Promise.all([
          waitForSynchronizedEvent(page),
          writeStrokes(page, helloOneStroke.strokes),
        ])

        await Promise.all([
          waitForConvertedEvent(page),
          callCanvasConvert(page)
        ])

        const symbols = await getCanvasSymbols(page)
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

      const strokes = await getCanvasSymbols(page)
      const stroke = strokes[0]
      expect(stroke.style.opacity).toStrictEqual(0.5)
      await expect(page.locator(`#${stroke.id}`)).toHaveAttribute("opacity", "0.5")
    })
  })
})
