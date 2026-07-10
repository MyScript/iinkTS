import { test, expect } from "@playwright/test"
import {
  passModalKey,
  writeStrokes,
  writePointers,
  waitForGesturedEvent,
  callEditorIdle,
  getEditorSymbols,
  getEditorExportsType,
} from "../helper"
import sum from "../__dataset__/sum"
import sqrt5 from "../__dataset__/math_context_menu._sqrt_5"
import fxEqualsX2 from "../__dataset__/math_context_menu._fx=x2"
import twoXPlus5 from "../__dataset__/math_context_menu._2x+5="
import oneFracZero from "../__dataset__/math_context_menu._1frac0"

// No recorded surround-gesture capture exists for the new math_context_menu.* datasets (only
// "sum" has a hand-captured surroundPointers). Selection only needs the gesture stroke to be
// classified as SURROUND by the cloud recognizer and to geometrically contain the expression's
// bounds (see SurroundGestureHandler#apply: OBBOps.contains(gestureStroke.bounds, s.bounds)) —
// so a synthetic padded ellipse around the written strokes' bounding box is sufficient.
const buildSurroundPointers = (strokes, padding = 25) => {
  const points = strokes.flatMap((s) => s.pointers)
  const minX = Math.min(...points.map((p) => p.x)) - padding
  const maxX = Math.max(...points.map((p) => p.x)) + padding
  const minY = Math.min(...points.map((p) => p.y)) - padding
  const maxY = Math.max(...points.map((p) => p.y)) + padding
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const rx = (maxX - minX) / 2
  const ry = (maxY - minY) / 2
  const steps = 32
  const t0 = Date.now()
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2
    return {
      x: Math.round(cx + rx * Math.cos(angle)),
      y: Math.round(cy + ry * Math.sin(angle)),
      t: t0 + i * 15,
      p: 0.6,
    }
  })
}

// Selection in this editor happens via a recognized "surround" gesture (closed loop drawn
// with the write tool) — the math context menu is shown automatically once a single math
// block is selected (see IISelectionManager calling editor.menu.context.show()).
const selectBlockViaSurround = async (page, surroundPointers) => {
  await Promise.all([
    waitForGesturedEvent(page),
    writePointers(page, surroundPointers),
  ])
  await expect
    .poll(() => page.evaluate(() => editorEl.editor.model.symbolsSelected.length), { timeout: 3000 })
    .toBeGreaterThan(0)
}

const openMathContextMenu = async (page) => {
  await expect(page.locator("#ms-menu-context-wrapper")).toBeVisible()
  await page.locator("#ms-menu-context-math-trigger").click()
}

// Waiting for a single "exported"/"synchronized" event is unreliable here: recognition can push
// intermediate updates while writing, so the first event doesn't guarantee the JIIX for the
// finished expression is ready. Poll the actual condition instead.
const writeExpressionAndGetBlockId = async (page, strokes) => {
  await writeStrokes(page, strokes)
  await callEditorIdle(page)
  await expect
    .poll(async () => {
      const jiix = await getEditorExportsType(page, "application/vnd.myscript.jiix")
      return jiix?.elements?.length ?? 0
    }, { timeout: 8000 })
    .toBeGreaterThan(0)
  const jiix = await getEditorExportsType(page, "application/vnd.myscript.jiix")
  return jiix.elements[0].id
}

test.describe("Math Context Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/offscreen-interactivity/offscreen_interactivity_math_context_menu.html`)
    await passModalKey(page)
  })

  // Follows the "Try it" > "Compute" step from the example's info panel ("write √16=... draw a
  // circle around it → Compute numerical result"), using the verified "√5=" dataset.
  test('Try it — Compute: write "√16=" (stand-in "√5="), circle it, Compute numerical result', async ({ page }) => {
    const jiixBlockId = await writeExpressionAndGetBlockId(page, sqrt5.strokes)

    await selectBlockViaSurround(page, buildSurroundPointers(sqrt5.strokes))
    await openMathContextMenu(page)
    const computeButton = page.locator("#ms-menu-context-math-numerical-computation")
    await expect(computeButton).toBeVisible()
    await computeButton.click()

    await expect
      .poll(async () => {
        const symbols = await getEditorSymbols(page)
        return symbols.some((s) => s.isSolverOutput && s.jiixBlockId === jiixBlockId)
      }, { timeout: 8000 })
      .toBe(true)
  })

  // Follows the "Try it" > "Check diagnostic" step from the example's info panel: write "1/0=",
  // circle it, Check diagnostic → DIVISION_BY_ZERO.
  test('Try it — Check diagnostic: write 1/0=, circle it, Check diagnostic → DIVISION_BY_ZERO', async ({ page }) => {
    await writeExpressionAndGetBlockId(page, oneFracZero.strokes)

    await selectBlockViaSurround(page, buildSurroundPointers(oneFracZero.strokes))
    await openMathContextMenu(page)
    const checkDiagnosticButton = page.locator("#ms-menu-context-math-check-diagnostic")
    await expect(checkDiagnosticButton).toBeVisible()
    await checkDiagnosticButton.click()

    const diagnosticCode = page.locator(".ms-diagnostic-code").first()
    await expect(diagnosticCode).toBeVisible()
    await expect(diagnosticCode).toContainText("DIVISION_BY_ZERO")
  })

  // Follows the "Try it" > "Function evaluation" step: write f(x)=x², circle, Evaluate
  // function, set range −5 to 5.
  test("Try it — Function evaluation: write f(x)=x², circle, Evaluate function, set range −5 to 5", async ({ page }) => {
    await writeExpressionAndGetBlockId(page, fxEqualsX2.strokes)

    await selectBlockViaSurround(page, buildSurroundPointers(fxEqualsX2.strokes))
    await openMathContextMenu(page)

    await expect(page.locator("#ms-menu-context-math-evaluate")).toBeVisible()
    await page.locator("#ms-menu-context-math-evaluate").click()

    await expect(page.locator(".ms-modal-title")).toContainText("Evaluate Function")

    await page.locator("#from").fill("-5")
    await page.locator("#to").fill("5")
    await page.getByRole("button", { name: "Evaluate", exact: true }).click()

    // Results render in the "Graph" tab by default — switch to "Table" for a DOM-friendly assertion.
    await page.locator(".ms-tab-headers").getByText("Table", { exact: true }).click()
    await expect(page.locator(".ms-table-wrapper").first()).toBeVisible({ timeout: 8000 })
  })

  // Follows the "Try it" > "Set variable" step: write 2x+5=, circle, Set variable value,
  // enter a number, then Compute.
  test("Try it — Set variable: write 2x+5=, circle, Set variable value, then Compute", async ({ page }) => {
    const jiixBlockId = await writeExpressionAndGetBlockId(page, twoXPlus5.strokes)
    const surroundPointers = buildSurroundPointers(twoXPlus5.strokes)

    await selectBlockViaSurround(page, surroundPointers)
    const selectedIds = await page.evaluate(() => editorEl.editor.model.symbolsSelected.map((s) => s.id))
    await openMathContextMenu(page)

    await expect(page.locator("#ms-menu-context-math-variables")).toBeVisible()
    await page.locator("#ms-menu-context-math-variables").click()

    await expect(page.locator(".ms-modal-title")).toContainText("Edit Variable")
    await page.locator("#x").fill("3")
    await page.getByRole("button", { name: "Apply", exact: true }).click()
    await expect(page.locator(".ms-modal-title")).toBeHidden()

    // Re-select programmatically instead of drawing a second surround gesture: the input ink
    // is untouched by setListVariableValue (it only stores the value for future computation),
    // so the previously-selected symbol ids are still valid.
    await page.evaluate((ids) => {
      editorEl.editor.select(ids)
      editorEl.editor.menu.context.show()
    }, selectedIds)
    await openMathContextMenu(page)
    const computeButton = page.locator("#ms-menu-context-math-numerical-computation")
    await expect(computeButton).toBeVisible()
    await computeButton.click()

    await expect
      .poll(async () => {
        const symbols = await getEditorSymbols(page)
        return symbols.some((s) => s.isSolverOutput && s.jiixBlockId === jiixBlockId)
      }, { timeout: 8000 })
      .toBe(true)
  })

  // Follows the "🔍 Capabilities overview" section of the example's info panel
  // (≡ → Math → Show Math Capabilities Overview). Standalone action, no selection needed.
  test("Capabilities overview: open via ≡ → Math → Show Math Capabilities Overview", async ({ page }) => {
    await writeExpressionAndGetBlockId(page, sum.strokes)

    await page.locator("#ms-menu-action").click()
    await page.locator("#ms-menu-action-math-trigger").click()
    await page.locator("#ms-menu-action-math-capabilities-overview").click()

    await expect(page.locator(".ms-modal-title")).toContainText("Math Symbols Capabilities")
  })

})
