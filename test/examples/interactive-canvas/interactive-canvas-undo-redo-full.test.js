import { test, expect } from "@playwright/test"
import {
  passModalKey,
  writeStrokes,
  writePointers,
  waitForSynchronizedEvent,
  waitForChangedEvent,
  waitForConvertedEvent,
  getCanvasSymbols,
  callCanvasIdle,
  openMenuCollapsible,
} from "../helper"
import locator from "../locators"
import helloOneStroke from "../__dataset__/helloOneStroke"

// Font sizes are expressed as a fraction of the guide size (see interactive-canvas-get-started-styles.test.js).
const DEFAULT_GUIDE_SIZE = 50
const NEW_COLOR = { rgb: "ff0000", hex: "#ff0000" }
const NEW_WIDTH = 4 // "L" thickness
const NEW_FONT_SIZE_PIXELS = 1 // "L" font size => 1 * DEFAULT_GUIDE_SIZE
const NEW_FONT_WEIGHT = "bold"

// Style/font menu changes only restyle a symbol that is currently selected (InteractiveInkCanvas.ts
// updateSymbols with a patch) — without a selection they only set the default style
// applied to future strokes. Select programmatically instead of via a surround gesture: more
// robust than drawing a second real gesture in the same test (see helper.js selectBlockById).
const selectSymbol = async (page, id) => {
  await page.evaluate((symbolId) => rootEl.iink.select([symbolId]), id)
  await expect
    .poll(() => page.evaluate(() => rootEl.iink.model.symbolsSelected.length), { timeout: 3000 })
    .toBeGreaterThan(0)
}

const clickUndo = async (page) =>
  Promise.all([
    waitForChangedEvent(page),
    page.locator(locator.menu.action.undoBtn).click(),
  ])

const clickRedo = async (page) =>
  Promise.all([
    waitForChangedEvent(page),
    page.locator(locator.menu.action.redoBtn).click(),
  ])

// Bounds are stored as {center, width, height} (TOBB) — convert to the {minX, maxX, minY, maxY}
// shape used below (see OBBOps.toBox: x/y = center - size/2). A few px of padding so the
// eraser also covers ink sitting right at the glyph edge.
const toEraseBounds = (bounds, padding = 4) => ({
  minX: bounds.center.x - bounds.width / 2 - padding,
  maxX: bounds.center.x + bounds.width / 2 + padding,
  minY: bounds.center.y - bounds.height / 2 - padding,
  maxY: bounds.center.y + bounds.height / 2 + padding,
})

// helper.js's buildEraseSweepPointers only samples row endpoints, which is fine for a single
// narrow stroke (its existing callers) but leaves a multi-character text symbol's middle
// untouched: page.mouse.move() jumps straight to each point with no intermediate events, so
// only the ~20px eraser radius around each sampled point actually erases anything. Sample a
// dense zigzag grid instead so no gap along the swept path exceeds the eraser radius.
const buildDenseEraseGrid = (bounds, step = 15) => {
  const { minX, maxX, minY, maxY } = bounds
  const rows = Math.max(2, Math.ceil((maxY - minY) / step) + 1)
  const cols = Math.max(2, Math.ceil((maxX - minX) / step) + 1)
  const pointers = []
  let t = 0
  for (let row = 0; row < rows; row++) {
    const y = minY + ((maxY - minY) * row) / (rows - 1)
    const xs = Array.from({ length: cols }, (_, col) => minX + ((maxX - minX) * col) / (cols - 1))
    if (row % 2 === 1) xs.reverse()
    for (const x of xs) {
      pointers.push({ x: Math.round(x), y: Math.round(y), t: (t += 20), p: 0.5 })
    }
  }
  return pointers
}

test.describe("Interactive ink canvas full undo/redo", { tag: "@minimal" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_get_started.html`)
    await passModalKey(page)
  })

  test("write, style, convert, font, erase — each undo/redo, then a full multi-level chain", async ({ page }) => {
    let strokeId, originalColor, originalWidth
    let textId, originalFontSize, originalFontWeight

    await test.step("write stroke", async () => {
      await Promise.all([
        waitForSynchronizedEvent(page),
        writeStrokes(page, helloOneStroke.strokes),
      ])
      const symbols = await getCanvasSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("stroke")
      strokeId = symbols[0].id
      originalColor = symbols[0].style.color
      originalWidth = symbols[0].style.width
    })

    await test.step("undo/redo write", async () => {
      await clickUndo(page)
      expect(await getCanvasSymbols(page)).toHaveLength(0)

      await clickRedo(page)
      const symbols = await getCanvasSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("stroke")
      strokeId = symbols[0].id
    })

    await test.step("change color, undo/redo", async () => {
      await selectSymbol(page, strokeId)
      await page.locator("#ms-menu-style-color").click()
      await page.locator(`#ms-menu-style-color-list-${NEW_COLOR.rgb}`).click()

      let symbols = await getCanvasSymbols(page)
      expect(symbols.find((s) => s.id === strokeId).style.color).toStrictEqual(NEW_COLOR.hex)

      await clickUndo(page)
      symbols = await getCanvasSymbols(page)
      expect(symbols.find((s) => s.id === strokeId).style.color).toStrictEqual(originalColor)

      await clickRedo(page)
      symbols = await getCanvasSymbols(page)
      expect(symbols.find((s) => s.id === strokeId).style.color).toStrictEqual(NEW_COLOR.hex)
    })

    await test.step("change thickness, undo/redo", async () => {
      await selectSymbol(page, strokeId)
      await openMenuCollapsible(page, "#ms-menu-style-thickness")
      await page.locator(`#ms-menu-style-thickness-${NEW_WIDTH}`).click()

      let symbols = await getCanvasSymbols(page)
      expect(symbols.find((s) => s.id === strokeId).style.width).toStrictEqual(NEW_WIDTH)

      await clickUndo(page)
      symbols = await getCanvasSymbols(page)
      expect(symbols.find((s) => s.id === strokeId).style.width).toStrictEqual(originalWidth)

      await clickRedo(page)
      symbols = await getCanvasSymbols(page)
      expect(symbols.find((s) => s.id === strokeId).style.width).toStrictEqual(NEW_WIDTH)
      // carried through to the convert step below
      expect(symbols.find((s) => s.id === strokeId).style.color).toStrictEqual(NEW_COLOR.hex)
    })

    await test.step("convert, undo/redo", async () => {
      await Promise.all([
        waitForConvertedEvent(page),
        page.locator(locator.menu.action.convertBtn).click(),
      ])
      let symbols = await getCanvasSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      textId = symbols[0].id
      originalFontSize = symbols[0].chars[0].fontSize
      originalFontWeight = symbols[0].chars[0].fontWeight

      await clickUndo(page)
      symbols = await getCanvasSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("stroke")
      expect(symbols[0].style.color).toStrictEqual(NEW_COLOR.hex)
      expect(symbols[0].style.width).toStrictEqual(NEW_WIDTH)
      strokeId = symbols[0].id

      await clickRedo(page)
      symbols = await getCanvasSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      textId = symbols[0].id
    })

    await test.step("change font size, undo/redo", async () => {
      await selectSymbol(page, textId)
      await openMenuCollapsible(page, "#ms-menu-style-font-size")
      await page.locator(`[id="ms-menu-style-font-size-${NEW_FONT_SIZE_PIXELS}"]`).click()

      const expectedFontSize = NEW_FONT_SIZE_PIXELS * DEFAULT_GUIDE_SIZE
      let symbols = await getCanvasSymbols(page)
      let text = symbols.find((s) => s.id === textId)
      text.chars.forEach((c) => expect(c.fontSize).toStrictEqual(expectedFontSize))

      await clickUndo(page)
      symbols = await getCanvasSymbols(page)
      text = symbols.find((s) => s.id === textId)
      text.chars.forEach((c) => expect(c.fontSize).toStrictEqual(originalFontSize))

      await clickRedo(page)
      symbols = await getCanvasSymbols(page)
      text = symbols.find((s) => s.id === textId)
      text.chars.forEach((c) => expect(c.fontSize).toStrictEqual(expectedFontSize))
    })

    await test.step("change font weight, undo/redo", async () => {
      await selectSymbol(page, textId)
      await openMenuCollapsible(page, "#ms-menu-style-font-weight")
      await page.locator(`#ms-menu-style-font-weight-${NEW_FONT_WEIGHT}`).click()

      let symbols = await getCanvasSymbols(page)
      let text = symbols.find((s) => s.id === textId)
      text.chars.forEach((c) => expect(c.fontWeight).toStrictEqual(NEW_FONT_WEIGHT))

      await clickUndo(page)
      symbols = await getCanvasSymbols(page)
      text = symbols.find((s) => s.id === textId)
      text.chars.forEach((c) => expect(c.fontWeight).toStrictEqual(originalFontWeight))

      await clickRedo(page)
      symbols = await getCanvasSymbols(page)
      text = symbols.find((s) => s.id === textId)
      text.chars.forEach((c) => expect(c.fontWeight).toStrictEqual(NEW_FONT_WEIGHT))
    })

    await test.step("erase, undo/redo", async () => {
      const symbolsBeforeErase = await getCanvasSymbols(page)
      const textBounds = toEraseBounds(symbolsBeforeErase.find((s) => s.id === textId).bounds)

      await page.locator("#ms-menu-tool-erase").click()
      await page.locator("#ms-menu-tool-erase-20").click()
      await writePointers(page, buildDenseEraseGrid(textBounds))
      await callCanvasIdle(page)
      expect(await getCanvasSymbols(page)).toHaveLength(0)

      await clickUndo(page)
      let symbols = await getCanvasSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      symbols[0].chars.forEach((c) => {
        expect(c.fontSize).toStrictEqual(NEW_FONT_SIZE_PIXELS * DEFAULT_GUIDE_SIZE)
        expect(c.fontWeight).toStrictEqual(NEW_FONT_WEIGHT)
      })

      await clickRedo(page)
      symbols = await getCanvasSymbols(page)
      expect(symbols).toHaveLength(0)
    })

    await test.step("multi-level undo to blank canvas, then multi-level redo back to final state", async () => {
      const STEPS = 7 // write, color, thickness, convert, font-size, font-weight, erase

      for (let i = 0; i < STEPS; i++) {
        await clickUndo(page)
      }
      expect(await getCanvasSymbols(page)).toHaveLength(0)

      for (let i = 0; i < STEPS; i++) {
        await clickRedo(page)
      }
      expect(await getCanvasSymbols(page)).toHaveLength(0)
    })
  })
})
