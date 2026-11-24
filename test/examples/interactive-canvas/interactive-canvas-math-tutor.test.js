import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes } from "../helper"
import tutor from "../__dataset__/math_tutor"

// A verdict waits for the pen to rest (PAUSE_MS, 2.5 s) and for the server to read the line
const VERDICT_TIMEOUT = 15000

/** The levels are numbered from 1 in each track: a level button is found within its track */
function levelButton(page, track, level) {
  return page.getByRole("group", { name: track }).getByRole("button", { name: new RegExp(`Level ${level}`) })
}

test.describe("Interactive ink canvas Math Tutor", { tag: "@slow" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_math_tutor.html`)
    await passModalKey(page)
  })

  test("should open on the first demo exercise, online", async ({ page }) => {
    await expect(page.locator("#prompt")).toHaveText("Solve for x. Write each step on its own line.")
    await expect(page.locator("#statement")).toContainText("12")
    await expect(page.locator("#connection")).toHaveText("Online")
    await expect(page.locator(".tutor-mark")).toHaveCount(0)
  })

  test("should solve level 1 once the pen rests on the answer", async ({ page }) => {
    await writeStrokes(page, tutor.level1Answer)

    await expect(page.locator("#banner")).toBeVisible({ timeout: VERDICT_TIMEOUT })
    await expect(page.locator(".tutor-mark.is-correct")).toHaveCount(1)
    await expect(page.locator("#stars")).toHaveText("★ 1 solved")
    await expect(page.locator("#nextBtn")).toHaveClass(/is-ready/)
  })

  test("should flag the first wrong line with a hint on the mistake", async ({ page }) => {
    await levelButton(page, "Algebra", 2).click()
    await expect(page.locator("#statement")).toContainText("7")

    await writeStrokes(page, tutor.level2Step1)
    await writeStrokes(page, tutor.level2WrongStep2)

    await expect(page.locator(".tutor-mark.is-wrong")).toHaveCount(1, { timeout: VERDICT_TIMEOUT })
    await expect(page.locator(".tutor-mark.is-correct")).toHaveCount(1)
    await expect(page.locator(".tutor-hint")).toHaveText(
      "Watch the sign: a term changes sign when it moves to the other side."
    )
    await expect(page.locator(".tutor-reading.is-wrong")).toContainText("10")
    await expect(page.locator("#banner")).toBeHidden()
  })

  test("should start over, solve the exercise and move on to the next one", async ({ page }) => {
    // Two reasonings replayed stroke by stroke take about 40 s: too close to the default minute
    test.setTimeout(120 * 1000)
    await levelButton(page, "Algebra", 2).click()
    await writeStrokes(page, tutor.level2Step1)
    await writeStrokes(page, tutor.level2WrongStep2)
    await expect(page.locator(".tutor-mark.is-wrong")).toHaveCount(1, { timeout: VERDICT_TIMEOUT })

    await page.getByRole("button", { name: "Start over" }).click()
    await expect(page.locator(".tutor-mark")).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => window.canvas.model.symbols.length)).toBe(0)

    await writeStrokes(page, tutor.level2Step1)
    await writeStrokes(page, tutor.level2Step2)
    await writeStrokes(page, tutor.level2Answer)
    await expect(page.locator("#banner")).toBeVisible({ timeout: VERDICT_TIMEOUT })
    await expect(page.locator(".tutor-mark.is-correct")).toHaveCount(3)

    await page.getByRole("button", { name: "Next exercise" }).click()
    await expect(page.locator("#statement")).toContainText("11")
    await expect(page.locator("#banner")).toBeHidden()
  })

  test("should ask to finish a perimeter that is not computed yet, then accept the result", async ({ page }) => {
    await levelButton(page, "Geometry", 1).click()
    await expect(page.locator("#prompt")).toHaveText("Find the perimeter P of this rectangle. Write each step on its own line.")
    await expect(page.locator("#statement svg text")).toHaveText(["6", "4"])

    await writeStrokes(page, tutor.geometry1Unfinished)
    await expect(page.locator(".tutor-hint.is-correct")).toHaveText(
      "Right so far. Now finish the calculation: P = one number (π can stay, as in 8π).",
      { timeout: VERDICT_TIMEOUT }
    )
    await expect(page.locator(".tutor-mark.is-correct")).toHaveCount(1)
    await expect(page.locator("#banner")).toBeHidden()

    await writeStrokes(page, tutor.geometry1Answer)
    await expect(page.locator("#banner")).toBeVisible({ timeout: VERDICT_TIMEOUT })
    await expect(page.locator(".tutor-mark.is-correct")).toHaveCount(2)
    await expect(page.locator(".tutor-hint")).toHaveCount(0)
  })

  test("should find the area of the given rectangle", async ({ page }) => {
    await levelButton(page, "Geometry", 2).click()
    await expect(page.locator("#prompt")).toHaveText("Find the area A of this rectangle. Write each step on its own line.")

    await writeStrokes(page, tutor.geometry2Answer)
    await expect(page.locator("#banner")).toBeVisible({ timeout: VERDICT_TIMEOUT })
    await expect(page.locator(".tutor-mark.is-correct")).toHaveCount(1)
  })

  test("should accept a result written under the line it continues, without repeating A", async ({ page }) => {
    await levelButton(page, "Geometry", 2).click()

    await writeStrokes(page, tutor.geometry2Step)
    await writeStrokes(page, tutor.geometry2Continued)
    await expect(page.locator("#banner")).toBeVisible({ timeout: VERDICT_TIMEOUT })
    await expect(page.locator(".tutor-mark.is-correct")).toHaveCount(2)
  })
})
