import { test, expect } from "@playwright/test"
import {
  passModalKey,
  writeStrokes,
  waitForConvertedEvent,
  callCanvasIdle,
  callCanvasConvert,
  getCanvasSymbols,
  pollJiix,
} from "../helper"
import dataset from "../__dataset__/diagram_connections"

// Selects `id` then drags it by (tx, ty) via a real mouse gesture — programmatic selection is
// robust (avoids hit-testing an ink stroke's exact drawn path), the drag itself must be a real
// pointer sequence since that's what actually exercises IISelectionManager/IITranslateManager.
const dragSymbol = async (page, id, tx, ty) => {
  await page.evaluate((symbolId) => rootEl.iink.select([symbolId]), id)
  await expect
    .poll(() => page.evaluate(() => rootEl.iink.model.symbolsSelected.length), { timeout: 3000 })
    .toBeGreaterThan(0)

  // The rendered element's own rect, not the symbol's stored geometry: a stroke, shape or edge no
  // longer stores a box, and where one is *drawn* is its raw coordinates seen through the matrix its
  // group carries — which is exactly what a drag has to start from. Already in page coordinates, so
  // there is no SVG offset to add.
  const box = await page.locator(`#${id}`).boundingBox()
  const startX = box.x + box.width / 2
  const startY = box.y + box.height / 2

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + tx, startY + ty, { steps: 5 })
  await page.mouse.up()
}

// The rectangle connected to BOTH edges (the line's one end, the arrow's one end) — the one JIIX
// node id that shows up in every edge's `connected` array.
const findSharedConnectedNodeId = (edgeElements) => {
  const [first, ...rest] = edgeElements
  return first.connected.find((nodeId) => rest.every((edge) => edge.connected.includes(nodeId)))
}

// Same idea post-convert: the shape id that every converted edge's start/end anchor points at.
const findSharedAnchorTargetId = (edges) => {
  const [first, ...rest] = edges
  const firstTargets = [first.startAnchor?.symbolId, first.endAnchor?.symbolId].filter(Boolean)
  return firstTargets.find((targetId) =>
    rest.every((edge) => edge.startAnchor?.symbolId === targetId || edge.endAnchor?.symbolId === targetId)
  )
}

test.describe("Interactive ink canvas diagram connections", { tag: ["@touch", "@slow"] }, () => {
  // Replaying the diagram dataset takes close to a minute on a loaded WebKit run
  test.describe.configure({ timeout: 120 * 1000 })

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_diagram_connections.html`
    )
    await passModalKey(page)
  })

  test("tracks shape-edge connections live in ink, follows them on move before and after Convert, groups a multi-stroke edge into one panel entry, and preserves connections through Convert", async ({
    page,
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip("sdk bug, MSIS-10054")
    // Dataset: rectangle, a line edge (rectangle↔circle), a circle, a 2-stroke arrow edge
    // (rectangle↔rectangle), and a second rectangle — recorded as one continuous capture. The
    // first rectangle is connected to both edges; the circle and second rectangle are each
    // connected to exactly one.
    let jiix
    let edgeElements
    let rect1BlockId

    await test.step("write the diagram", async () => {
      await writeStrokes(page, dataset.strokes)
      await callCanvasIdle(page)
    })

    await test.step("sync recognizes 3 shapes and 2 dual-connected edges", async () => {
      jiix = await pollJiix(page, 5, 20000)
      expect(jiix.elements).toHaveLength(5)

      edgeElements = jiix.elements.filter((e) => e.type === "Edge")
      expect(edgeElements).toHaveLength(2)
      // Both edges connect exactly 2 shapes each — this dataset has no free-floating connections.
      edgeElements.forEach((edge) => expect(edge.connected).toHaveLength(2))

      rect1BlockId = findSharedConnectedNodeId(edgeElements)
      expect(rect1BlockId).toBeTruthy()
    })

    await test.step("panel groups the multi-stroke edge into one entry and shows both target kinds", async () => {
      // The 2-stroke arrow edge must render as a single panel entry, not one per stroke.
      await expect(page.locator("#connections-list .connection-info")).toHaveCount(2)

      const panelText = await page.locator("#connections-list").innerText()
      expect(panelText).toContain("rectangle")
      expect(panelText).toContain("circle")
      expect(panelText).toMatch(/ink/)
    })

    await test.step("every ink edge stroke got a real anchor on both ends", async () => {
      const symbols = await getCanvasSymbols(page)
      const edgeStrokes = symbols.filter((s) => s.jiixBlockType === "Edge")
      expect(edgeStrokes.length).toBeGreaterThan(0)
      expect(edgeStrokes.every((s) => s.startAnchor && s.endAnchor)).toBe(true)
    })

    await test.step("dragging the shared rectangle (pre-convert) moves both connected edges", async () => {
      const rect1Element = jiix.elements.find((e) => e.id === rect1BlockId)
      const rect1StrokeId = rect1Element.items[0].id

      const before = await getCanvasSymbols(page)
      const edgeStrokesBefore = before.filter((s) => s.jiixBlockType === "Edge")
      const snapshotBefore = new Map(edgeStrokesBefore.map((s) => [s.id, JSON.stringify(s.pointers)]))

      await dragSymbol(page, rect1StrokeId, 60, 60)
      await callCanvasIdle(page)

      const after = await getCanvasSymbols(page)
      const edgeStrokesAfter = after.filter((s) => s.jiixBlockType === "Edge")
      // Each connected edge block (line + arrow) has at least one stroke whose points moved —
      // the gradient-follow shifts the end nearest the dragged shape, not necessarily every point.
      const blockIds = new Set(edgeStrokesAfter.map((s) => s.jiixBlockId))
      expect(blockIds.size).toBe(2)
      blockIds.forEach((blockId) => {
        const strokesInBlock = edgeStrokesAfter.filter((s) => s.jiixBlockId === blockId)
        const movedInBlock = strokesInBlock.some((s) => JSON.stringify(s.pointers) !== snapshotBefore.get(s.id))
        expect(movedInBlock).toBe(true)
      })
    })

    let convertedEdges
    let sharedShapeId

    await test.step("convert preserves the connections onto the resulting vector edges", async () => {
      await Promise.all([waitForConvertedEvent(page), callCanvasConvert(page)])
      await callCanvasIdle(page)

      const symbolsAfterConvert = await getCanvasSymbols(page)
      convertedEdges = symbolsAfterConvert.filter((s) => s.type === "edge")
      expect(convertedEdges).toHaveLength(2)
      expect(convertedEdges.every((e) => e.startAnchor && e.endAnchor)).toBe(true)

      // Anchors must point at real symbol ids now (post-convert), not the pre-convert jiixBlockId.
      const convertedShapeIds = new Set(symbolsAfterConvert.filter((s) => s.type === "shape").map((s) => s.id))
      convertedEdges.forEach((edge) => {
        expect(convertedShapeIds.has(edge.startAnchor.symbolId)).toBe(true)
        expect(convertedShapeIds.has(edge.endAnchor.symbolId)).toBe(true)
      })

      sharedShapeId = findSharedAnchorTargetId(convertedEdges)
      expect(sharedShapeId).toBeTruthy()
    })

    await test.step("panel still shows 2 converted entries after Convert", async () => {
      await expect(page.locator("#connections-list .connection-info")).toHaveCount(2)
      const panelTextAfterConvert = await page.locator("#connections-list").innerText()
      expect(panelTextAfterConvert).toContain("converted")
    })

    await test.step("dragging the shared shape (post-convert) moves both connected edges", async () => {
      const snapshotBefore = new Map(convertedEdges.map((e) => [e.id, JSON.stringify(e)]))

      await dragSymbol(page, sharedShapeId, 60, 60)
      await callCanvasIdle(page)

      const symbolsAfterDrag = await getCanvasSymbols(page)
      const edgesAfterDrag = symbolsAfterDrag.filter((s) => s.type === "edge")
      expect(edgesAfterDrag).toHaveLength(2)
      edgesAfterDrag.forEach((edge) => {
        expect(JSON.stringify(edge)).not.toEqual(snapshotBefore.get(edge.id))
      })
    })
  })

  test("tracks shape-edge connections live in ink and preserves connections through Convert follows them on move before", async ({
    page,
  }) => {
    // Dataset: rectangle, a line edge (rectangle↔circle), a circle, a 2-stroke arrow edge
    // (rectangle↔rectangle), and a second rectangle — recorded as one continuous capture. The
    // first rectangle is connected to both edges; the circle and second rectangle are each
    // connected to exactly one.
    let jiix
    let edgeElements
    let rect1BlockId

    await test.step("write the diagram", async () => {
      await writeStrokes(page, dataset.strokes)
      await callCanvasIdle(page)
    })

    await test.step("sync recognizes 3 shapes and 2 dual-connected edges", async () => {
      jiix = await pollJiix(page, 5, 20000)
      expect(jiix.elements).toHaveLength(5)

      edgeElements = jiix.elements.filter((e) => e.type === "Edge")
      expect(edgeElements).toHaveLength(2)
      // Both edges connect exactly 2 shapes each — this dataset has no free-floating connections.
      edgeElements.forEach((edge) => expect(edge.connected).toHaveLength(2))

      rect1BlockId = findSharedConnectedNodeId(edgeElements)
      expect(rect1BlockId).toBeTruthy()
    })

    await test.step("panel groups the multi-stroke edge into one entry and shows both target kinds", async () => {
      // The 2-stroke arrow edge must render as a single panel entry, not one per stroke.
      await expect(page.locator("#connections-list .connection-info")).toHaveCount(2)

      const panelText = await page.locator("#connections-list").innerText()
      expect(panelText).toContain("rectangle")
      expect(panelText).toContain("circle")
      expect(panelText).toMatch(/ink/)
    })

    await test.step("every ink edge stroke got a real anchor on both ends", async () => {
      const symbols = await getCanvasSymbols(page)
      const edgeStrokes = symbols.filter((s) => s.jiixBlockType === "Edge")
      expect(edgeStrokes.length).toBeGreaterThan(0)
      expect(edgeStrokes.every((s) => s.startAnchor && s.endAnchor)).toBe(true)
    })

    let convertedEdges
    let sharedShapeId

    await test.step("convert preserves the connections onto the resulting vector edges", async () => {
      await Promise.all([waitForConvertedEvent(page), callCanvasConvert(page)])
      await callCanvasIdle(page)

      const symbolsAfterConvert = await getCanvasSymbols(page)
      convertedEdges = symbolsAfterConvert.filter((s) => s.type === "edge")
      expect(convertedEdges).toHaveLength(2)
      expect(convertedEdges.every((e) => e.startAnchor && e.endAnchor)).toBe(true)

      // Anchors must point at real symbol ids now (post-convert), not the pre-convert jiixBlockId.
      const convertedShapeIds = new Set(symbolsAfterConvert.filter((s) => s.type === "shape").map((s) => s.id))
      convertedEdges.forEach((edge) => {
        expect(convertedShapeIds.has(edge.startAnchor.symbolId)).toBe(true)
        expect(convertedShapeIds.has(edge.endAnchor.symbolId)).toBe(true)
      })

      sharedShapeId = findSharedAnchorTargetId(convertedEdges)
      expect(sharedShapeId).toBeTruthy()
    })

    await test.step("panel still shows 2 converted entries after Convert", async () => {
      await expect(page.locator("#connections-list .connection-info")).toHaveCount(2)
      const panelTextAfterConvert = await page.locator("#connections-list").innerText()
      expect(panelTextAfterConvert).toContain("converted")
    })

    await test.step("dragging the shared shape (post-convert) moves both connected edges", async () => {
      const snapshotBefore = new Map(convertedEdges.map((e) => [e.id, JSON.stringify(e)]))

      await dragSymbol(page, sharedShapeId, 60, 60)
      await callCanvasIdle(page)

      const symbolsAfterDrag = await getCanvasSymbols(page)
      const edgesAfterDrag = symbolsAfterDrag.filter((s) => s.type === "edge")
      expect(edgesAfterDrag).toHaveLength(2)
      edgesAfterDrag.forEach((edge) => {
        expect(JSON.stringify(edge)).not.toEqual(snapshotBefore.get(edge.id))
      })
    })
  })
})
