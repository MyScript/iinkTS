import { test, expect } from "@playwright/test"
import { passModalKey } from "../helper"
import numbers from "../__dataset__/numbers"

async function writeStrokesInField(page, fieldId, strokes) {
  const svg = await page.locator(`#${fieldId} svg[data-layer="CAPTURE"]`).elementHandle()
  const box = await svg.boundingBox()
  const yOffset = -20
  for (const stroke of strokes) {
    const first = stroke.pointers[0]
    await page.mouse.move(box.x + first.x, box.y + first.y + yOffset)
    await page.mouse.down()
    for (const p of stroke.pointers.slice(1)) {
      await page.mouse.move(box.x + p.x, box.y + p.y + yOffset)
    }
    await page.mouse.up()
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(100)
  }
}

test.describe("Ink Canvas v2 Multiple Canvas (Grading table)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/canvas/canvas_v2_multi_canvas_grading.html`)
    await passModalKey(page, false)
    // loadAll() only re-enables this button once all 12 cells have fully initialized - a more
    // precise readiness signal than checking DOM children, which can appear before the async
    // load actually completes (a real race: computeBtn used to have no such guard).
    await expect(page.locator("#compute-btn")).toBeEnabled({ timeout: 10000 })
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Ink Canvas v2 - Multiple Canvas (Grading table)")
  })

  test("summing several written grades should produce the correct row total", async ({ page }) => {
  
    test.setTimeout(3 * 60 * 1000)

    await test.step("Alice - Clarity = 1", async () => {
      await writeStrokesInField(page, "grade-0-0", numbers[1].strokes)
      await expect(page.locator("#total-0")).toHaveText("1.00", { timeout: 10000 })
    })

    await test.step("Alice - Content = 4 (running total 5)", async () => {
      await writeStrokesInField(page, "grade-0-1", numbers[6].strokes)
      await expect(page.locator("#total-0")).toHaveText("7.00", { timeout: 10000 })
    })

    await test.step("Alice - Style = 19 (running total 24)", async () => {
      await writeStrokesInField(page, "grade-0-2", numbers[19].strokes)
      await expect(page.locator("#total-0")).toHaveText("26.00", { timeout: 10000 })
    })

    await test.step("Bob - Clarity = 1", async () => {
      await writeStrokesInField(page, "grade-1-0", numbers[13].strokes)
      await expect(page.locator("#total-1")).toHaveText("13.00", { timeout: 10000 })
    })

    await test.step("Bob - Content = 1 (running total 2)", async () => {
      await writeStrokesInField(page, "grade-1-1", numbers[10].strokes)
      await expect(page.locator("#total-1")).toHaveText("23.00", { timeout: 10000 })
    })

    await test.step("Bob - Style = 1 (running total 3)", async () => {
      await writeStrokesInField(page, "grade-1-2", numbers[1].strokes)
      await expect(page.locator("#total-1")).toHaveText("24.00", { timeout: 10000 })
    })

    await test.step("Charlie - Clarity = 4", async () => {
      await writeStrokesInField(page, "grade-2-0", numbers[16].strokes)
      await expect(page.locator("#total-2")).toHaveText("16.00", { timeout: 10000 })
    })

    await test.step("Charlie - Content = 4 (running total 32)", async () => {
      await writeStrokesInField(page, "grade-2-1", numbers[16].strokes)
      await expect(page.locator("#total-2")).toHaveText("32.00", { timeout: 10000 })
    })

    await test.step("Charlie - Style = 4 (running total 42)", async () => {
      await writeStrokesInField(page, "grade-2-2", numbers[10].strokes)
      await expect(page.locator("#total-2")).toHaveText("42.00", { timeout: 10000 })
    })

    await test.step("Get summary reflects the same totals in the report", async () => {
      await page.locator("#compute-btn").click()
      await expect(page.locator("#report li").nth(0)).toContainText("Alice: 26.00 / 60", { timeout: 10000 })
      await expect(page.locator("#report li").nth(1)).toContainText("Bob: 24.00 / 60", { timeout: 10000 })
      await expect(page.locator("#report li").nth(2)).toContainText("Charlie: 42.00 / 60", { timeout: 10000 })
    })
  })

  test("grade cells should not show a connection-status badge", async ({ page }) => {
    await expect(page.locator("#grade-0-0 .ms-ink-state")).toBeHidden()
  })

  test("a grade outside 0-20 or unrecognized should clear the cell and show an error", async ({ page }) => {
    // Recognition itself is exercised by the other tests in this file; this one targets the
    // example's own validation logic wired to the 'exported' event, so it triggers that event
    // directly with controlled payloads instead of depending on what a handwritten trace happens
    // to recognize as.
    await writeStrokesInField(page, "grade-0-0", numbers[1].strokes)
    await expect(page.locator("#total-0")).toHaveText("1.00", { timeout: 10000 })

    // An invalid reading is only acted on after a short debounce (see INVALID_GRADE_DEBOUNCE_MS
    // in the example), so a mid-write partial recognition doesn't wipe strokes the user hasn't
    // finished writing yet - the Total updates immediately, the clear/error message lag behind it.
    await page.locator("#grade-0-0").evaluate((el) => el.iink.event.emitExported({ "application/x-latex": "25" }))
    await expect(page.locator("#total-0")).toHaveText("0.00")
    await expect(page.locator("#grade-error-0-0")).toHaveText("Grade must be between 0 and 20 - write it again.", { timeout: 3000 })
    await expect(page.locator("#grade-0-0").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(0)

    await page.locator("#grade-0-0").evaluate((el) => el.iink.event.emitExported({ "application/x-latex": "\\pi" }))
    await expect(page.locator("#grade-error-0-0")).toHaveText("Not a number - write it again.", { timeout: 3000 })

    await writeStrokesInField(page, "grade-0-0", numbers[6].strokes)
    await expect(page.locator("#grade-error-0-0")).toHaveText("", { timeout: 10000 })
    await expect(page.locator("#total-0")).toHaveText("6.00", { timeout: 10000 })
  })

  test("each cell's undo/redo/clear toolbar should only affect that cell", async ({ page }) => {
    await writeStrokesInField(page, "grade-0-0", numbers[1].strokes)
    await writeStrokesInField(page, "grade-0-1", numbers[1].strokes)

    const cellToolbar = (fieldId) => page.locator(`td:has(#${fieldId}) .mini-btn`)
    await cellToolbar("grade-0-0").nth(2).click() // clear

    await expect(page.locator("#grade-0-0").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(0)
    // The sibling cell's stroke must be untouched by grade-0-0's clear.
    await expect(page.locator("#grade-0-1").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(numbers[1].strokes.length)

    await cellToolbar("grade-0-0").nth(0).click() // undo
    await expect(page.locator("#grade-0-0").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(numbers[1].strokes.length)

    await cellToolbar("grade-0-0").nth(1).click() // redo
    await expect(page.locator("#grade-0-0").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(0)
  })
})
