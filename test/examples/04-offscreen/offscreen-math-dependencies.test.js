import { test, expect } from "@playwright/test"
import {
  passModalKey,
  writeStrokes,
  writePointers,
  callEditorIdle,
  getEditorSymbols,
  getEditorExportsType,
} from "../helper"
import mathDependencies from "../__dataset__/math_dependencies"
import overridingSource from "../__dataset__/math_dependencies_overriding_source"

const SOURCE_LABEL = "x=2"
const DEPENDENT_LABEL = "3x+2="

// Recorded as one continuous capture. The dataset keeps its own embedded jiix export, which
// shows 2 math blocks with 5 and 8 strokes respectively (raw-content/51 = "x=2", the next
// element = "3x+2="), matching the top-level strokes count (13) and their natural writing
// order (source definition written first, per the doc's "Try it" steps 1-2).
const sourceStrokes = mathDependencies.strokes.slice(0, 5)
const dependentStrokes = mathDependencies.strokes.slice(5)

// Per the dataset's own leading comment: strokes 1-5 = "x=2" (source), strokes 6-10 = "x²="
// (dependent), strokes 11-12 = "5" written over the erased "2" — i.e. at the same position,
// which is what lets us derive the erase target's bounding box without a dedicated capture.
const overrideSourceStrokes = overridingSource.strokes.slice(0, 5)
const overrideDependentStrokes = overridingSource.strokes.slice(5, 10)
const overrideReplacementStrokes = overridingSource.strokes.slice(10, 12)

const boundsOf = (strokes, padding = 6) => {
  const points = strokes.flatMap((s) => s.pointers)
  return {
    minX: Math.min(...points.map((p) => p.x)) - padding,
    maxX: Math.max(...points.map((p) => p.x)) + padding,
    minY: Math.min(...points.map((p) => p.y)) - padding,
    maxY: Math.max(...points.map((p) => p.y)) + padding,
  }
}

// Boustrophedon (back-and-forth) sweep across a bounding box, dense enough to fully cover it
// with the eraser regardless of exact eraser width.
const buildEraseSweepPointers = (bounds, rows = 6) => {
  const { minX, maxX, minY, maxY } = bounds
  const pointers = []
  let t = 0
  for (let i = 0; i < rows; i++) {
    const y = Math.round(minY + ((maxY - minY) * i) / (rows - 1))
    const xs = i % 2 === 0 ? [minX, maxX] : [maxX, minX]
    for (const x of xs) {
      pointers.push({ x, y, t: (t += 40), p: 0.5 })
    }
  }
  return pointers
}

const pollJiixElementCount = async (page, minCount) => {
  await expect
    .poll(async () => {
      const jiix = await getEditorExportsType(page, "application/vnd.myscript.jiix")
      return jiix?.elements?.length ?? 0
    }, { timeout: 8000 })
    .toBeGreaterThanOrEqual(minCount)
}

// Match by substring, not strict equality: cloud recognition of the longer "3x+2=" expression
// can vary slightly run to run (spacing, minus-sign glyph, ...), even though it's stable enough
// to always contain "x=2" for the short source definition. Once the source is identified, the
// dependent is simply "the other of the 2 blocks" — no need for its label to match exactly.
const getBlockIdByLabel = async (page, label) => {
  const jiix = await getEditorExportsType(page, "application/vnd.myscript.jiix")
  for (const element of jiix.elements) {
    const blockLabel = await page.evaluate((id) => editorEl.editor.jiix.getBlockLabel(id), element.id)
    if (blockLabel?.includes(label)) {
      return element.id
    }
  }
  return undefined
}

// Follows "Try it" steps 1-2: write the source definition, then the dependent expression.
const writeSourceThenDependent = async (page) => {
  await writeStrokes(page, sourceStrokes)
  await callEditorIdle(page)
  await pollJiixElementCount(page, 1)

  await writeStrokes(page, dependentStrokes)
  await callEditorIdle(page)
  await pollJiixElementCount(page, 2)

  const jiix = await getEditorExportsType(page, "application/vnd.myscript.jiix")
  const sourceId = await getBlockIdByLabel(page, SOURCE_LABEL)
  const dependentId = jiix.elements.map((e) => e.id).find((id) => id !== sourceId)
  return { sourceId, dependentId }
}

const getSolverOutputIds = async (page, jiixBlockId) => {
  const symbols = await getEditorSymbols(page)
  return symbols
    .filter((s) => s.isSolverOutput && s.jiixBlockId === jiixBlockId)
    .map((s) => s.id)
    .sort()
}

test.describe("Math Dependencies", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/offscreen-interactivity/offscreen_interactivity_math_dependencies.html`)
    await passModalKey(page)
  })

  // Follows the "Try it" > step 1: write a variable definition like "x=2" — with no dependent
  // expression yet, it shows up as an isolated block in the side panel.
  test('Try it — 1. Write a source variable definition (x=2) → shows as an isolated block', async ({ page }) => {
    await writeStrokes(page, sourceStrokes)
    await callEditorIdle(page)
    await pollJiixElementCount(page, 1)

    const dependencyList = page.locator("#dependency-list")
    await expect(dependencyList).toContainText("Isolated blocks", { timeout: 5000 })
    await expect(dependencyList).toContainText(SOURCE_LABEL)
  })

  // Follows the "Try it" > step 2: write an expression using that variable like "3x+2=" — the
  // side panel now tracks it as a dependent of the source block.
  test('Try it — 2. Write a dependent expression (3x+2=) → dependency tracked in the side panel', async ({ page }) => {
    await writeSourceThenDependent(page)

    const dependencyList = page.locator("#dependency-list")
    await expect(dependencyList).toContainText(SOURCE_LABEL, { timeout: 5000 })
    await expect(dependencyList).toContainText(DEPENDENT_LABEL)
    await expect(dependencyList).toContainText("used by 1 block")
    await expect(dependencyList).toContainText(`x = ${SOURCE_LABEL}`)
  })

  // Follows the "Try it" > steps 3-4: toggle "Auto-compute" on, then writing the dependent
  // expression (ending with "=") computes its result automatically.
  test('Try it — 3-4. Enable Auto-compute → dependent expression computes automatically when written', async ({ page }) => {
    await page.locator("#ms-menu-action").click()
    await page.locator("#ms-menu-action-math-trigger").click()
    await page.locator("#ms-menu-action-math-auto-compute-input").check()
    await page.locator("#ms-menu-action").click()

    const { dependentId } = await writeSourceThenDependent(page)

    await expect
      .poll(async () => (await getSolverOutputIds(page, dependentId)).length > 0, { timeout: 12000 })
      .toBe(true)
  })

  // Follows the "Try it" > steps 5-6: change the variable value and watch the dependent
  // expression recalculate — by erasing and rewriting the source's own ink (a BLOCK variable's
  // value is defined by the user's handwriting, not overridable through Edit Variables or the
  test('Try it — 5-6. Erase and rewrite "x" on the source block → dependent expression recalculates', async ({ page }) => {
    await page.locator("#ms-menu-action").click()
    await page.locator("#ms-menu-action-math-trigger").click()
    await page.locator("#ms-menu-action-math-result-mode-input").selectOption("ghost")
    await page.locator("#ms-menu-action-math-auto-compute-input").check()
    await page.locator("#ms-menu-action").click()

    await writeStrokes(page, overrideSourceStrokes)
    await callEditorIdle(page)
    await pollJiixElementCount(page, 1)

    await writeStrokes(page, overrideDependentStrokes)
    await callEditorIdle(page)
    await pollJiixElementCount(page, 2)

    const jiix = await getEditorExportsType(page, "application/vnd.myscript.jiix")
    const sourceId = await getBlockIdByLabel(page, SOURCE_LABEL)
    const dependentId = jiix.elements.map((e) => e.id).find((id) => id !== sourceId)
    expect(dependentId).toBeTruthy()

    await expect(page.locator('#editorEl [id^="ghost-stroke-"]').first()).toBeVisible({ timeout: 12000 })
    const before = await page.evaluate((id) => editorEl.editor.math.getGhostBounds(id), dependentId)
    expect(before).toBeDefined()

    // Erase the "2" in "x=2": the replacement "5" strokes are recorded at the same position,
    // so their (padded) bounding box is exactly the eraser drag target. The size submenu
    // is hidden until the trigger button itself is clicked open.
    await page.locator("#ms-menu-tool-erase").click()
    await page.locator("#ms-menu-tool-erase-20").click()
    await writePointers(page, buildEraseSweepPointers(boundsOf(overrideReplacementStrokes, -20)))
    await callEditorIdle(page)
    await expect
      .poll(async () => {
        const label = await page.evaluate((id) => editorEl.editor.jiix.getBlockLabel(id), sourceId)
        return label?.includes("2")
      }, { timeout: 8000 })
      .toBe(false)

    await page.locator("#ms-menu-tool-write-pencil").click()
    await writeStrokes(page, overrideReplacementStrokes)
    await callEditorIdle(page)

    await expect
      .poll(async () => {
        const label = await page.evaluate((id) => editorEl.editor.jiix.getBlockLabel(id), sourceId)
        return label?.includes("5")
      }, { timeout: 8000 })
      .toBe(true)

    await page.evaluate(() => editorEl.editor.math.tryAutoCompute())
    await callEditorIdle(page)

    await expect
      .poll(async () => {
        const after = await page.evaluate((id) => editorEl.editor.math.getGhostBounds(id), dependentId)
        return after !== undefined && (after.width !== before.width || after.x !== before.x)
      }, { timeout: 12000 })
      .toBe(true)
  })

  // Follows the "Try it" > step 7: hover over a math block to see its dependencies highlighted
  // (source in green glow, dependents outlined) — driven by the real "hover-zone-<id>" overlay
  // element with pointerenter/pointerleave listeners (IIOverlayManager#createHoverZone).
  test('Try it — 7. Hover over the source block → dependency highlighted on the dependent block', async ({ page }) => {
    const { sourceId, dependentId } = await writeSourceThenDependent(page)

    const hoverZoneId = `hover-zone-${sourceId}`.replace(/[^a-zA-Z0-9_-]/g, "_")
    await page.locator(`#${hoverZoneId}`).hover()

    // .first(): the renderer can leave a stale duplicate overlay rect behind (same
    // data-overlay/data-block-id) — harmless visually, but breaks Playwright's strict mode.
    await expect(page.locator(`[data-overlay="glow"][data-block-id="${sourceId}"]`).first()).toBeVisible()
    await expect(page.locator(`[data-overlay="highlight"][data-block-id="${dependentId}"]`).first()).toBeVisible()
  })
})
