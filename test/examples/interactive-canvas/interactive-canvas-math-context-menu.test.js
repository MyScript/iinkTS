import { test, expect } from "@playwright/test"
import {
  passModalKey,
  writeStrokes,
  callEditorIdle,
  getEditorSymbols,
  pollJiix,
  openMathActionMenu,
  openMathContextMenu,
  selectBlockViaSurround,
  buildSurroundPointers,
} from "../helper"
import sum from "../__dataset__/sum"
import sqrt5 from "../__dataset__/math_context_menu._sqrt_5"
import fxEqualsX2 from "../__dataset__/math_context_menu._fx=x2"
import twoXPlus5 from "../__dataset__/math_context_menu._2x+5="
import oneFracZero from "../__dataset__/math_context_menu._1frac0"

const writeExpressionAndGetBlockId = async (page, strokes) => {
  await writeStrokes(page, strokes)
  await callEditorIdle(page)
  const jiix = await pollJiix(page, 1)
  return jiix.elements[0].id
}

test.describe("Math Context Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_math_context_menu.html`)
    await passModalKey(page)
  })

  // Follows the "Try it" > "Compute" step from the example's info panel ("write √16=... draw a
  // circle around it → Compute numerical result"), using the verified "√5=" dataset.
  test('Try it — Compute: write √5=, circle it, Compute numerical result', async ({ page, browserName }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(browserName === "webkit", "Need investigation IIC-1724")
  
    const jiixBlockId = await writeExpressionAndGetBlockId(page, sqrt5.strokes)

    await selectBlockViaSurround(page, buildSurroundPointers(sqrt5.strokes))
    await openMathContextMenu(page)
    const computeButton = page.locator("#ms-menu-context-math-numerical-computation")
    // The math submenu only becomes visible once IIMenuContext#updateMathMenu's async
    // getAvailableActions/getVariables/getEvaluables round-trip resolves — the default 2500ms
    // expect timeout is too tight under CI load (flaky "Received: hidden" on Safari).
    await expect(computeButton).toBeVisible({ timeout: 5000 })
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
  test('Try it — Check diagnostic: write 1/0=, circle it, Check diagnostic → DIVISION_BY_ZERO', async ({ page, browserName }) => {
    await writeExpressionAndGetBlockId(page, oneFracZero.strokes)

    await selectBlockViaSurround(page, buildSurroundPointers(oneFracZero.strokes))
    await openMathContextMenu(page)
    const checkDiagnosticButton = page.locator("#ms-menu-context-math-check-diagnostic")
    await expect(checkDiagnosticButton).toBeVisible({ timeout: 8000 })
    await checkDiagnosticButton.click()

    const diagnosticCode = page.locator(".ms-diagnostic-code").first()
    await expect(diagnosticCode).toBeVisible()
    await expect(diagnosticCode).toContainText("DIVISION_BY_ZERO")
  })

  // Follows the "Try it" > "Function evaluation" step: write f(x)=x², circle, Evaluate
  // function, set range −5 to 5.
  test("Try it — Function evaluation: write f(x)=x², circle, Evaluate function, set range −5 to 5", async ({ page, browserName }) => {
    await writeExpressionAndGetBlockId(page, fxEqualsX2.strokes)

    await selectBlockViaSurround(page, buildSurroundPointers(fxEqualsX2.strokes))
    await openMathContextMenu(page)

    await expect(page.locator("#ms-menu-context-math-evaluate")).toBeVisible({ timeout: 8000 })
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
  test("Try it — Set variable: write 2x+5=, circle, Set variable value, then Compute", async ({ page, browserName }) => {
    const jiixBlockId = await writeExpressionAndGetBlockId(page, twoXPlus5.strokes)
    const surroundPointers = buildSurroundPointers(twoXPlus5.strokes)

    await selectBlockViaSurround(page, surroundPointers)
    const selectedIds = await page.evaluate(() => rootEl.iink.model.symbolsSelected.map((s) => s.id))
    await openMathContextMenu(page)

    await expect(page.locator("#ms-menu-context-math-variables")).toBeVisible({ timeout: 8000 })
    await page.locator("#ms-menu-context-math-variables").click()

    await expect(page.locator(".ms-modal-title")).toContainText("Edit Variable")
    await page.locator("#x").fill("3")
    await page.getByRole("button", { name: "Apply", exact: true }).click()
    await expect(page.locator(".ms-modal-title")).toBeHidden()

    // Re-select programmatically instead of drawing a second surround gesture: the input ink
    // is untouched by setListVariableValue (it only stores the value for future computation),
    // so the previously-selected symbol ids are still valid.
    await page.evaluate((ids) => {
      rootEl.iink.select(ids)
      rootEl.iink.menu.context.show()
    }, selectedIds)
    await openMathContextMenu(page)
    const computeButton = page.locator("#ms-menu-context-math-numerical-computation")
    await expect(computeButton).toBeVisible({ timeout: 8000 })
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

    await openMathActionMenu(page)
    await page.locator("#ms-menu-action-math-capabilities-overview").click()

    await expect(page.locator(".ms-modal-title")).toContainText("Math Symbols Capabilities")
  })

})
