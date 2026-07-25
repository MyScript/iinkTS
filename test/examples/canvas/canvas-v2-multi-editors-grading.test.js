import { test, expect } from "@playwright/test"
import { passModalKey } from "../helper"

async function writeDigitInField(page, fieldId) {
  const svg = await page.locator(`#${fieldId} svg[data-layer="CAPTURE"]`).elementHandle()
  const box = await svg.boundingBox()
  const startX = box.x + 20
  const startY = box.y + 15
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX, startY + 30, { steps: 3 })
  await page.mouse.up()
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(300)
}

// 3 participants x 3 criteria + 1 comment field each = 12 independent editor instances total.
test.describe("Ink Canvas v2 Multiple Editors (Grading table)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/canvas/canvas_v2_multi_editors_grading.html`)
    await passModalKey(page, false)
    // loadAll() only re-enables this button once all 12 cells have fully initialized - a more
    // precise readiness signal than checking DOM children, which can appear before the async
    // load actually completes (a real race: computeBtn used to have no such guard).
    await expect(page.locator("#compute-btn")).toBeEnabled({ timeout: 10000 })
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Ink Canvas v2 - Multiple Editors (Grading table)")
  })

  test("should mount one independent editor per grade cell and per comment cell", async ({ page }) => {
    await expect(page.locator(".ink-field")).toHaveCount(12)
    for (let p = 0; p < 3; p++) {
      for (let c = 0; c < 3; c++) {
        await expect(page.locator(`#grade-${p}-${c} svg[data-layer="CAPTURE"]`)).toBeVisible()
      }
      await expect(page.locator(`#comment-${p} svg[data-layer="CAPTURE"]`)).toBeVisible()
    }
  })

  test("writing in a grade cell should update the Total column automatically, without clicking Compute results", async ({ page }) => {
    await expect(page.locator("#total-0")).toBeEmpty()

    await writeDigitInField(page, "grade-0-0")
    await expect(page.locator("#total-0")).not.toBeEmpty({ timeout: 10000 })
    // No click on #compute-btn anywhere in this test.
    await expect(page.locator("#total-1")).toBeEmpty()
  })

  test("computing results should export every grade cell and populate the Total column", async ({ page }) => {
    await writeDigitInField(page, "grade-0-0")

    await page.locator("#compute-btn").click()
    await expect(page.locator("#total-0")).not.toBeEmpty({ timeout: 10000 })
    // Rows with no grades written still resolve to a numeric total (0), not left blank.
    await expect(page.locator("#total-1")).toHaveText("0")
    await expect(page.locator("#total-2")).toHaveText("0")
  })

  test("the report should list one entry per participant", async ({ page }) => {
    await page.locator("#compute-btn").click()
    await expect(page.locator("#report li")).toHaveCount(3, { timeout: 10000 })
    await expect(page.locator("#report li").nth(0)).toContainText("Alice")
    await expect(page.locator("#report li").nth(1)).toContainText("Bob")
    await expect(page.locator("#report li").nth(2)).toContainText("Charlie")
  })

  test("grade cells should not show a connection-status badge", async ({ page }) => {
    await expect(page.locator("#grade-0-0 .ms-ink-state")).toBeHidden()
  })

  test("each cell's undo/redo/clear toolbar should only affect that cell", async ({ page }) => {
    await writeDigitInField(page, "grade-0-0")
    await writeDigitInField(page, "grade-0-1")

    const cellToolbar = (fieldId) => page.locator(`td:has(#${fieldId}) .mini-btn`)
    await cellToolbar("grade-0-0").nth(2).click() // clear

    await expect(page.locator("#grade-0-0").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(0)
    // The sibling cell's stroke must be untouched by grade-0-0's clear.
    await expect(page.locator("#grade-0-1").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(1)

    await cellToolbar("grade-0-0").nth(0).click() // undo
    await expect(page.locator("#grade-0-0").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(1)

    await cellToolbar("grade-0-0").nth(1).click() // redo
    await expect(page.locator("#grade-0-0").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(0)
  })
})
