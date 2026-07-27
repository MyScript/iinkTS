import { test, expect } from "@playwright/test"
import { passModalKey } from "../helper"

async function writeInField(page, fieldId, offsetX = 30, offsetY = 40) {
  const svg = await page.locator(`#${fieldId} svg[data-layer="CAPTURE"]`).elementHandle()
  const box = await svg.boundingBox()
  const startX = box.x + offsetX
  const startY = box.y + offsetY
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(startX + i * 3, startY + Math.sin(i / 2) * 15, { steps: 2 })
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(15)
  }
  await page.mouse.up()
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(300)
}

// Must match the QUESTIONS array length in canvas_v2_multi_canvas_exam.html.
const QUESTION_COUNT = 8

test.describe("Ink Canvas v2 Multiple Canvas (Exam)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/canvas/canvas_v2_multi_canvas_exam.html`)
    await passModalKey(page, false)
    // loadAll() only re-enables this button once every field's canvas has fully initialized -
    // a more precise readiness signal than checking DOM children, which can appear before the
    // async load actually completes.
    await expect(page.locator("#validate-btn")).toBeEnabled({ timeout: 10000 })
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Ink Canvas v2 - Multiple Canvas (Exam)")
  })

  test("should mount one independent canvas per question", async ({ page }) => {
    await expect(page.locator(".ink-field")).toHaveCount(QUESTION_COUNT)
    for (let i = 0; i < QUESTION_COUNT; i++) {
      await expect(page.locator(`#field-${i} svg[data-layer="CAPTURE"]`)).toBeVisible()
    }
  })

  test("validating should export every field and tally a score", async ({ page }) => {
    await writeInField(page, "field-0")
    await writeInField(page, "field-1")
    await writeInField(page, "field-2")

    await page.locator("#validate-btn").click()
    await expect(page.locator("#exam-score")).toHaveText(new RegExp(`Score: \\d \\/ ${QUESTION_COUNT}`), { timeout: 10000 })

    // Each result badge reflects the field's own recognized text, independent of the others.
    for (const id of ["result-0", "result-1", "result-2"]) {
      await expect(page.locator(`#${id}`)).not.toBeEmpty()
    }
  })

  test("an empty field should be marked incorrect, not crash validation", async ({ page }) => {
    // Only answer question 0, leave the rest blank.
    await writeInField(page, "field-0")

    await page.locator("#validate-btn").click()
    await expect(page.locator("#exam-score")).toHaveText(new RegExp(`Score: \\d \\/ ${QUESTION_COUNT}`), { timeout: 10000 })
    await expect(page.locator("#result-1")).toHaveClass(/incorrect/)
    await expect(page.locator("#result-2")).toHaveClass(/incorrect/)
  })

  test("each field's undo/redo/clear toolbar should only affect that field", async ({ page }) => {
    await writeInField(page, "field-0")
    await writeInField(page, "field-1")

    const clearField0 = page.locator("#question-0 .mini-btn").nth(2)
    await clearField0.click()

    await expect(page.locator("#field-0").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(0)
    // Question 1's stroke must be untouched by question 0's clear.
    await expect(page.locator("#field-1").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(1)

    const undoField0 = page.locator("#question-0 .mini-btn").nth(0)
    await undoField0.click()
    await expect(page.locator("#field-0").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(1)

    const redoField0 = page.locator("#question-0 .mini-btn").nth(1)
    await redoField0.click()
    await expect(page.locator("#field-0").evaluate((el) => el.iink.model.strokes.length)).resolves.toBe(0)
  })
})
