import { test, expect } from "@playwright/test"
import { getCanvasSymbols, passModalKey } from "../helper"

const NIBS = ["ballpoint", "pencil", "fountain", "brush"]

/**
 * One entry per drawn stroke: its id, the nib its style names, and the outline actually rendered.
 *
 * Keyed by id and not by nib: once every stroke carries the same nib, a map keyed by nib collapses
 * to a single entry and any "they all look alike now" assertion passes for the wrong reason.
 */
const drawnStrokes = async (page) =>
  page.evaluate(() =>
    rootEl.iink.model.symbols
      .filter((s) => s.type === "stroke")
      .map((s) => {
        const element = document.getElementById(s.id)
        return {
          id: s.id,
          nib: s.style.pen,
          d: element?.querySelector("path")?.getAttribute("d") ?? element?.getAttribute("d") ?? "",
        }
      })
  )

test.describe("Interactive ink canvas Pen nibs", { tag: "@touch" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_pen_nibs.html`
    )
    await passModalKey(page)
  })

  test("should offer one button per nib and start on the default", async ({ page }) => {
    for (const nib of NIBS) {
      await expect(page.locator(`#nib-${nib}`)).toBeVisible()
    }
    await expect(page.locator("#nib-pencil")).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("#nib-brush")).toHaveAttribute("aria-pressed", "false")
  })

  test("should put the chosen nib on the pen", async ({ page }) => {
    await page.locator("#nib-fountain").click()

    await expect(page.locator("#nib-fountain")).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("#nib-pencil")).toHaveAttribute("aria-pressed", "false")
    expect(await page.evaluate(() => rootEl.iink.penStyle.pen)).toEqual("fountain")
  })

  test("should put the tuning values on the pen", async ({ page }) => {
    await page.locator("#nibAngle").selectOption("30")
    await page.locator("#nibSmoothing").selectOption("4")

    expect(await page.evaluate(() => rootEl.iink.penStyle.penAngle)).toEqual(30)
    expect(await page.evaluate(() => rootEl.iink.penStyle.penSmoothing)).toEqual(4)
  })

  test("should leave out the menus this example is not about", async ({ page }) => {
    // The page is about how a stroke looks, so gesture, guide, snap, diagram and math are switched
    // off in its configuration — what is left in the action menu all acts on appearance.
    await page.locator("#ms-menu-action").dispatchEvent("pointerdown")

    for (const menu of ["gesture", "guide", "snap", "diagram", "math"]) {
      await expect(page.locator(`#ms-menu-action-${menu}`)).toHaveCount(0)
    }
    await expect(page.locator("#ms-menu-action-pen")).toHaveCount(1)
  })

  test.describe("the reference gesture", () => {
    test.beforeEach(async ({ page }) => {
      // A restored session would leave strokes behind and the counts below would be off by a
      // whole run. Cleared through the canvas rather than a button, since the page has none.
      await page.evaluate(() => rootEl.iink.clear())
      await page.locator("#drawSamples").click()
      await expect(async () => {
        expect((await getCanvasSymbols(page)).filter((s) => s.type === "stroke")).toHaveLength(NIBS.length)
      }).toPass()
    })

    test("should draw the same gesture once per nib", async ({ page }) => {
      const strokes = (await getCanvasSymbols(page)).filter((s) => s.type === "stroke")
      expect(strokes.map((s) => s.style.pen)).toEqual(NIBS)
    })

    test("should time every sample strictly forwards", async ({ page }) => {
      // A `dt` that goes backwards is rejected by the recognizer outright, and a generated sample
      // is exactly where that slips in — the timing formula has to accumulate, not multiply.
      const strokes = (await getCanvasSymbols(page)).filter((s) => s.type === "stroke")
      strokes.forEach((stroke) => {
        expect(stroke.pointers[0].dt).toEqual(0)
        stroke.pointers.slice(1).forEach((pointer, i) => {
          expect(pointer.dt).toBeGreaterThan(stroke.pointers[i].dt)
        })
      })
    })

    test("should name each sample beside the stroke it names", async ({ page }) => {
      // Written into the canvas's own SVG rather than laid over the page: the labels have to travel
      // with the strokes when the canvas is panned or zoomed.
      const labels = await page.evaluate(() =>
        [...rootEl.iink.renderer.layer.querySelectorAll('[id^="nib-label-"]')].map((t) => t.textContent)
      )
      expect(labels).toEqual(NIBS)
    })

    test("should draw the same geometry differently for each nib", async ({ page }) => {
      // Identical pointers in, four different outlines out: the nib is what decides the width, and
      // nothing about the captured stroke changed between the rows.
      const drawn = await drawnStrokes(page)
      drawn.forEach((stroke) => expect(stroke.d.length).toBeGreaterThan(0))
      expect(new Set(drawn.map((stroke) => stroke.d)).size).toEqual(NIBS.length)
    })

    test("should change the nib of strokes already on the canvas", async ({ page }) => {
      const before = await drawnStrokes(page)

      await page.locator("#nib-ballpoint").click()
      await page.locator("#applyToAll").click()

      const after = await drawnStrokes(page)
      expect(after.map((stroke) => stroke.nib)).toEqual(NIBS.map(() => "ballpoint"))

      // The stroke already drawn as a ballpoint is untouched; the three others are redrawn, which
      // is the whole point — width is decided at draw time, so it can be decided again.
      const wasBallpoint = before.findIndex((stroke) => stroke.nib === "ballpoint")
      expect(after[wasBallpoint].d).toEqual(before[wasBallpoint].d)
      before
        .map((stroke, i) => ({ stroke, i }))
        .filter(({ i }) => i !== wasBallpoint)
        .forEach(({ stroke, i }) => {
          expect(after[i].d).not.toEqual(stroke.d)
        })
    })
  })
})
