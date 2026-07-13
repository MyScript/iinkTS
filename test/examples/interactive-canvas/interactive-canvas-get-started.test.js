import { test, expect } from "@playwright/test"
import {
  passModalKey,
  writeStrokes,
  waitForSynchronizedEvent,
  getEditorSymbols,
} from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"

test.describe("Interactive ink canvas Get Started", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_get_started.html`)
    await passModalKey(page)
  })

  test.describe("write", () => {
    test.beforeEach(async ({ page }) => {
      await Promise.all([
        waitForSynchronizedEvent(page),
        writeStrokes(page, helloOneStroke.strokes),
      ])
    })

    test("should have stroke into model.symbols", async ({ page }) => {
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)
      const stroke = symbols[0]
      expect(stroke.type).toEqual("stroke")
      expect(stroke.pointers).toHaveLength(
        helloOneStroke.strokes[0].pointers.length
      )
    })

    test("should display stroke", async ({ page }) => {
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)
      const stroke = symbols[0]
      expect(stroke.type).toEqual("stroke")

      const symLocator = page.locator(`#${stroke.id}`)
      await expect(symLocator).toBeVisible()

      const strokePathLocator = page.locator(`#${stroke.id} path`)

      await expect(strokePathLocator).toBeVisible()
      await expect(strokePathLocator).toHaveAttribute("stroke-width", "2")
      await expect(strokePathLocator).toHaveAttribute(
        "d",
        /^(M 252 244 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0).*/
      )
      await expect(strokePathLocator).toHaveAttribute("d", /(L 336 228\.58)$/)
    })
  })
})
