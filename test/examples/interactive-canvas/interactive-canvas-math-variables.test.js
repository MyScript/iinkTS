import { test, expect } from "@playwright/test"
import {
  passModalKey,
  writeStrokes,
  callEditorIdle,
  writePointers,
  buildEraseSweepPointers,
  boundsOf,
  pollJiix,
  getBlockIdByLabel,
  openMathActionMenu,
  openMathContextMenu,
  selectBlockById,
  GHOST_STROKE_SELECTOR,
} from "../helper"
import mathDependencies from "../__dataset__/math_dependencies"
import twoXPlus5 from "../__dataset__/math_context_menu._2x+5="
import overridingSource from "../__dataset__/math_dependencies_overriding_source"
import aPlusB from "../__dataset__/math_variables_a+b="
import chainedVar from "../__dataset__/math_variables_chained_var"

// This example's config sets math.computation.autoCompute=true and resultMode="ghost" as hard
// defaults (menu.action.math.resultMode is false, so there isn't even a selector to change it) —
// unlike the computation-modes/context-menu/dependencies examples, nothing needs toggling via
// the action menu before writing.

const openGlobalEditVariables = async (page) => {
  await openMathActionMenu(page)
  await page.locator("#ms-menu-action-math-variables").click()
  await expect(page.locator(".ms-modal-title")).toContainText("Variable Definitions")
}

test.describe("Math Variables", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_math_variables.html`)
    await passModalKey(page)
  })

  // Follows the "Try it" > "Substitution" item: write "x=5" (stand-in "x=2", same
  // math_dependencies.js dataset as the dependencies test file), then "3x+2=" — computation
  // uses the BLOCK-defined x automatically, no auto-compute toggle needed (already default here).
  test('Try it — Substitution: write x=5 (stand-in x=2), then 3x+2= → uses x automatically', async ({ page }) => {
    const sourceStrokes = mathDependencies.strokes.slice(0, 5)
    const dependentStrokes = mathDependencies.strokes.slice(5)

    await writeStrokes(page, sourceStrokes)
    await callEditorIdle(page)
    await pollJiix(page, 1)

    await writeStrokes(page, dependentStrokes)
    await callEditorIdle(page)
    const jiix = await pollJiix(page, 2)

    const dependentId = await getBlockIdByLabel(page, jiix, "3x+2")
    expect(dependentId).toBeTruthy()

    await expect(page.locator(`#rootEl ${GHOST_STROKE_SELECTOR}`).first()).toBeVisible({ timeout: 12000 })
    const bounds = await page.evaluate((id) => rootEl.iink.math.getGhostBounds(id), dependentId)
    expect(bounds).toBeDefined()
  })

  test('Try it — Global fallback: write 2x= (stand-in 2x+5=) undefined, add global x=10 → computes', async ({ page }) => {
    await writeStrokes(page, twoXPlus5.strokes)
    await callEditorIdle(page)
    const jiix = await pollJiix(page, 1)
    const blockId = jiix.elements[0].id

    await openGlobalEditVariables(page)

    await page.locator(".ms-add-var-btn").click()
    const newRow = page.locator(".ms-new-var-row").last()
    await newRow.locator("input").nth(0).fill("x")
    await newRow.locator("input").nth(1).fill("10")
    await page.getByRole("button", { name: "Apply", exact: true }).click()
    await expect(page.locator(".ms-modal-title")).toBeHidden()

    // Applying a *new global* variable doesn't itself fire a "synchronized" event (unlike
    // setting a per-block variable, which explicitly recalculates its dependents) — force the
    // same auto-compute sweep a real content change would trigger.
    await page.evaluate(() => rootEl.iink.math.tryAutoCompute())
    await callEditorIdle(page)

    await expect(page.locator(`#rootEl ${GHOST_STROKE_SELECTOR}`).first()).toBeVisible({ timeout: 12000 })
    const bounds = await page.evaluate((id) => rootEl.iink.math.getGhostBounds(id), blockId)
    expect(bounds).toBeDefined()
  })

  test('Try it — Updating a BLOCK variable: erase and rewrite "x" on an already-computed block', async ({ page }) => {

    const sourceStrokes = overridingSource.strokes.slice(0, 5)
    const dependentStrokes = overridingSource.strokes.slice(5, 10)
    const replacementStrokes = overridingSource.strokes.slice(10, 12)

    await writeStrokes(page, sourceStrokes)
    await callEditorIdle(page)
    await pollJiix(page, 1)

    await writeStrokes(page, dependentStrokes)
    await callEditorIdle(page)
    const jiix = await pollJiix(page, 2)

    const sourceId = await getBlockIdByLabel(page, jiix, "x=2")
    const dependentId = jiix.elements.map((e) => e.id).find((id) => id !== sourceId)

    await expect(page.locator(`#rootEl ${GHOST_STROKE_SELECTOR}`).first()).toBeVisible({ timeout: 12000 })
    const before = await page.evaluate((id) => rootEl.iink.math.getGhostBounds(id), dependentId)

    await page.locator("#ms-menu-tool-erase").click()
    await page.locator("#ms-menu-tool-erase-20").click()
    await writePointers(page, buildEraseSweepPointers(boundsOf(replacementStrokes, -20)))
    await callEditorIdle(page)
    await expect
      .poll(async () => {
        const label = await page.evaluate((id) => rootEl.iink.jiix.getBlockLabel(id), sourceId)
        return label?.includes("2")
      }, { timeout: 8000 })
      .toBe(false)

    await page.locator("#ms-menu-tool-write-pencil").click()
    await writeStrokes(page, replacementStrokes)
    await callEditorIdle(page)

    await page.locator("#ms-menu-tool-write-pencil").click()
    await writeStrokes(page, replacementStrokes)
    await callEditorIdle(page)
    await page.evaluate(() => rootEl.iink.math.tryAutoCompute())
    await callEditorIdle(page)

    await expect
      .poll(async () => {
        const after = await page.evaluate((id) => rootEl.iink.math.getGhostBounds(id), dependentId)
        return after !== undefined && (after.width !== before.width || after.x !== before.x)
      }, { timeout: 12000 })
      .toBe(true)
  })

  // Follows the "Try it" > "Undefined variable" item: write "A+B=" without defining A or B —
  // they appear as UNDEFINED in the *per-block* context-menu "Edit variables" (the global
  // dialog used above filters UNDEFINED out entirely, see the finding in memory/context-menu
  // test file). Assign values there to resolve, matching the doc's "Set variable" flow.
  test("Try it — Undefined variable: write A+B= without defining them", async ({ page }) => {
    await writeStrokes(page, aPlusB.strokes)
    await callEditorIdle(page)
    const jiix = await pollJiix(page, 1)
    const blockId = jiix.elements[0].id

    await selectBlockById(page, blockId)
    await openMathContextMenu(page)

    const editVariablesButton = page.locator("#ms-menu-context-math-variables")
    await expect(editVariablesButton).toBeVisible()
    await editVariablesButton.click()

    await expect(page.locator(".ms-modal-title")).toContainText("Edit Variable")
    const typeLabels = page.locator(".ms-type-label")
    await expect(typeLabels).toHaveCount(2)
    await expect(typeLabels.nth(0)).toContainText("Undefined")
    await expect(typeLabels.nth(1)).toContainText("Undefined")

    await page.locator("#A").fill("3")
    await page.locator("#B").fill("4")
    await page.getByRole("button", { name: "Apply", exact: true }).click()
    await expect(page.locator(".ms-modal-title")).toBeHidden()

    await page.evaluate(() => rootEl.iink.math.tryAutoCompute())
    await callEditorIdle(page)

    await expect(page.locator(`#rootEl ${GHOST_STROKE_SELECTOR}`).first()).toBeVisible({ timeout: 12000 })
    const bounds = await page.evaluate((id) => rootEl.iink.math.getGhostBounds(id), blockId)
    expect(bounds).toBeDefined()
  })

  // Follows the "Try it" > "Chained variables" item: write "x=3" and "y=x+1", then "y²=" —
  // the result chains through both definitions (y = x+1 = 4, y² = 16). Dataset's own embedded
  // jiix confirms the natural writing-order split: 5 strokes = "x=3", 8 = "y=x+1", 4 = "y^{2}="
  // (5+8+4 = 17, matching the top-level strokes count).
  test("Try it — Chained variables: write x=3 and y=x+1, then y²=", async ({ page }) => {
    const xStrokes = chainedVar.strokes.slice(0, 5)
    const yStrokes = chainedVar.strokes.slice(5, 13)
    const ySquaredStrokes = chainedVar.strokes.slice(13, 17)

    await writeStrokes(page, xStrokes)
    await callEditorIdle(page)
    await pollJiix(page, 1)

    await writeStrokes(page, yStrokes)
    await callEditorIdle(page)
    await pollJiix(page, 2)

    await writeStrokes(page, ySquaredStrokes)
    await callEditorIdle(page)
    const jiix = await pollJiix(page, 3)

    const xId = await getBlockIdByLabel(page, jiix, "x=3")
    const yId = await getBlockIdByLabel(page, jiix, "x+1")
    const ySquaredId = jiix.elements.map((e) => e.id).find((id) => id !== xId && id !== yId)
    expect(ySquaredId).toBeTruthy()

    await expect(page.locator(`#rootEl ${GHOST_STROKE_SELECTOR}`).first()).toBeVisible({ timeout: 12000 })
    const bounds = await page.evaluate((id) => rootEl.iink.math.getGhostBounds(id), ySquaredId)
    expect(bounds).toBeDefined()
  })
})
