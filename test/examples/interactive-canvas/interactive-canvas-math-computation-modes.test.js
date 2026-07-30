import { test, expect } from "@playwright/test"
import {
  passModalKey,
  writeStrokes,
  writePointers,
  callCanvasIdle,
  getCanvasSymbols,
  pollJiix,
  openMathActionMenu,
  selectBlockViaSurround,
  GHOST_STROKE_SELECTOR,
  buildSurroundPointers,
  boundsOf,
  buildEraseSweepPointers,
} from "../helper"
import locator from "../locators"
import sum from "../__dataset__/sum"
import numbers from "../__dataset__/numbers"

const sumStrokes = sum.strokes
const surroundSumStrokes = buildSurroundPointers(sum.strokes)

// Repositions a stroke dataset so its bounding box starts at the same top-left corner
// as `strokes` — used to drop a replacement digit exactly where an erased one used to be.
const translateStrokesOnto = (strokesToMove, strokes) => {
  const target = boundsOf(strokes, 0)
  const source = boundsOf(strokesToMove, 0)
  const dx = target.minX - source.minX
  const dy = target.minY - source.minY
  return strokesToMove.map((s) => ({
    ...s,
    pointers: s.pointers.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
  }))
}

// Once selected, dragging from within the selection's bounding box moves the block.
const dragSelectionBy = async (page, dx, dy) => {
  const xs = surroundSumStrokes.map((p) => p.x)
  const ys = surroundSumStrokes.map((p) => p.y)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const distance = Math.hypot(dx, dy)
  const steps = Math.max(1, Math.round(distance / 5))
  const pointers = Array.from({ length: steps + 1 }, (_, i) => ({
    x: cx + (dx * i) / steps,
    y: cy + (dy * i) / steps,
    t: i * (100 / steps),
    p: 0.5,
  }))
  await writePointers(page, pointers)
}

const writeSumExpressionAndGetBlockId = async (page) => {
  await writeStrokes(page, sumStrokes)
  await callCanvasIdle(page)
  const jiix = await pollJiix(page, 1)
  return jiix.elements[0].id
}

test.describe("Math Computation Modes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_math_computation_modes.html`)
    await passModalKey(page)
  })

  // Follows the "Try it" > "Ghost mode" steps from the example's info panel.
  // "5+3=" is replaced by the verified dataset "3+1=" (sum) — same shape (binary sum ending with "="),
  // chosen because its per-stroke LATEX progression is already asserted elsewhere (websocket-math.test.js).
  test("Try it — Ghost mode", async ({ page }) => {
    let jiixBlockId

    await test.step('1. Select "Show result" + enable "Auto-compute"', async () => {
      await openMathActionMenu(page)
      await page.locator("#ms-menu-action-math-result-mode-input").selectOption("ghost")
      await page.locator("#ms-menu-action-math-auto-compute-input").check()
      await page.locator("#ms-menu-action").click()
    })

    await test.step('2. Write "3+1=" → ghost result appears immediately', async () => {
      jiixBlockId = await writeSumExpressionAndGetBlockId(page)
      let ghostStrokes
      await expect
        .poll(async () => {
          ghostStrokes = page.locator(`#rootEl ${GHOST_STROKE_SELECTOR}`)
          return ghostStrokes.count()
        }, { timeout: 10000 })
        .toBe(2)
      await expect(ghostStrokes.first()).toBeVisible()
      await expect(ghostStrokes.locator("path").first()).toHaveCSS("opacity", "0.5")
    })
    
    let boundsBefore
    
    await test.step("3. Move the expression around → the ghost preview follows it", async () => {
      await selectBlockViaSurround(page, surroundSumStrokes)

      boundsBefore = await page.evaluate(
        (id) => rootEl.iink.math.getGhostBounds(id),
        jiixBlockId
      )

      const dx = 40
      const dy = 30
      await dragSelectionBy(page, dx, dy)

      const after = await page.evaluate(
        (id) => rootEl.iink.math.getGhostBounds(id),
        jiixBlockId
      )

      expect(after).toBeDefined()
      expect(Math.abs(after.x - boundsBefore.x - dx)).toBeLessThan(15)
      expect(Math.abs(after.y - boundsBefore.y - dy)).toBeLessThan(15)
    })

    await test.step('4. Undo the move expression → the ghost preview follows it', async () => {
      await page.locator(locator.menu.action.undoBtn).click()
      await expect
      .poll(async () => {
          const bounds = await page.evaluate(
            (id) => rootEl.iink.math.getGhostBounds(id),
            jiixBlockId
          )
          return boundsBefore.x === bounds?.x && boundsBefore?.y === bounds.y
        })
        .toBe(true)
    })

    await test.step('5. Undo across the "=" boundary → ghost disappears', async () => {
      await page.locator(locator.menu.action.undoBtn).click()
      await expect
        .poll(async () => {
          return page.locator(`#rootEl ${GHOST_STROKE_SELECTOR}`).count()
        }, { timeout: 8000 })
        .toBe(0)
    })
  
    await test.step("6. Redo → ghost should reappear", async () => {
      await page.locator(locator.menu.action.redoBtn).click()
      await expect
        .poll(async () => {
          return page.locator(`#rootEl ${GHOST_STROKE_SELECTOR}`).count()
        }, { timeout: 8000 })
        .toBe(2)
      await expect(page.locator(`#rootEl ${GHOST_STROKE_SELECTOR}`).first()).toBeVisible({ timeout: 8000 })
    })
  })

  // Follows the "Try it" > "Draw mode" steps from the example's info panel.
  // Steps involving a second variable block ("x=2" then "2x=") are skipped: no verified
  // stroke dataset for algebraic variable expressions exists yet in test/examples/__dataset__.
  test("Try it — Draw mode", async ({ page }) => {
    let jiixBlockId
    let firstResultStrokeIds

    const getResultStrokeIds = async () => {
      const symbols = await getCanvasSymbols(page)
      return symbols
        .filter((s) => s.isSolverOutput && s.jiixBlockId === jiixBlockId)
        .map((s) => s.id)
        .sort()
    }

    await test.step('1. Select "Draw result" + enable "Auto-compute"', async () => {
      await openMathActionMenu(page)
      await page.locator("#ms-menu-action-math-result-mode-input").selectOption("draw")
      await page.locator("#ms-menu-action-math-auto-compute-input").check()
      await page.locator("#ms-menu-action").click()
    })

    await test.step('2. Write "3+1=" → result added as ink strokes', async () => {
      jiixBlockId = await writeSumExpressionAndGetBlockId(page)

      // A single computed result can be rendered as more than one ink stroke
      // (e.g. digit "4" drawn as two pen strokes) — track the whole set, not one id.
      await expect
        .poll(async () => (await getResultStrokeIds()).length > 0, { timeout: 8000 })
        .toBe(true)

      firstResultStrokeIds = await getResultStrokeIds()
      await expect(page.locator(`#${firstResultStrokeIds[0]}`)).toBeVisible()
    })

    await test.step("3. Result stays frozen — re-triggering auto-compute does not recompute an already-solved block", async () => {
      await page.evaluate(() => rootEl.iink.math.tryAutoCompute())
      await callCanvasIdle(page)

      expect(await getResultStrokeIds()).toEqual(firstResultStrokeIds)
    })

    await test.step("4. Drag the expression somewhere else → its draw result moves with it", async () => {
      await selectBlockViaSurround(page, surroundSumStrokes)

      const before = await page.locator(`#${firstResultStrokeIds[0]}`).boundingBox()

      const dx = 40
      const dy = 30
      await dragSelectionBy(page, dx, dy)

      const after = await page.locator(`#${firstResultStrokeIds[0]}`).boundingBox()

      expect(Math.abs(after.x - before.x - dx)).toBeLessThan(15)
      expect(Math.abs(after.y - before.y - dy)).toBeLessThan(15)
    })

    await test.step('5. "Force Compute all" → wipes and recomputes every block fresh', async () => {
      // A draw result is frozen once computed (step 3): re-running compute on the same
      // "3+1=" wouldn't produce a different result, so first change the expression itself —
      // erase the "3" and draw a "6" in its place, turning the block into "6+1=". The
      // frozen "4" result is left untouched by this edit; "Force Compute all" is what wipes
      // it and recomputes fresh, this time picking up the new expression.
      // The expression was dragged in step 4, so its strokes no longer sit at the dataset's
      // original coordinates — read the "3" stroke's current position from the model instead
      // (leftmost non-result stroke of the block).
      const canvasSymbols = await getCanvasSymbols(page)
      const expressionStrokes = canvasSymbols.filter(
        (s) => s.jiixBlockId === jiixBlockId && !s.isSolverOutput
      )
      const threeStroke = [
        expressionStrokes.reduce((leftmost, s) =>
          boundsOf([s], 0).minX < boundsOf([leftmost], 0).minX ? s : leftmost
        ),
      ]
      const sixReplacementStrokes = translateStrokesOnto(numbers[6].strokes, threeStroke)

      await page.locator("#ms-menu-tool-erase").click()
      await page.locator("#ms-menu-tool-erase-20").click()
      await writePointers(page, buildEraseSweepPointers(boundsOf(threeStroke)))
      await callCanvasIdle(page)

      await page.locator("#ms-menu-tool-write-pencil").click()
      await writeStrokes(page, sixReplacementStrokes)
      await callCanvasIdle(page)
      // getBlockLabel reads from the cached JIIX export on the model, which only refreshes
      // on an actual export round-trip — pollJiix forces that refresh so the label reflects
      // "6+1=" before Force Compute all runs.
      await pollJiix(page, 1)

      await openMathActionMenu(page)
      await page.locator("#ms-menu-action-math-force-compute-all").click()
      await page.locator("#ms-menu-action").click()

      await expect
        .poll(async () => {
          const ids = await getResultStrokeIds()
          return ids.length > 0 && ids.join() !== firstResultStrokeIds.join()
        }, { timeout: 8000 })
        .toBe(true)
    })
  })
})
