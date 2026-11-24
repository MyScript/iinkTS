import type { TBaseSymbol, TDraft, TSymbol } from "@/iink"
import { describe, test, expect, jest, beforeEach } from "@jest/globals"
import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { EdgeUtil, IIConnectorManager, MatrixTransform, OBBOps, ShapeUtil, StrokeUtil, SymbolType, computePointOnEllipse, type TOBB } from "@/iink"

/**
 * The object under test is created here and is not in the model, so it is the caller's to mutate —
 * a draft in the contract's sense. Mint one the way the store does.
 */
const asDraft = <T>(value: T): TDraft<T> => value as TDraft<T>


const TARGET_BOUNDS = OBBOps.fromBox({ x: 10, y: 20, width: 100, height: 80 })
const TARGET_ID = "target-symbol"

function buildLineWithStartAnchor() {
  const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 100, y: 100 })
  line.startAnchor = { symbolId: TARGET_ID, normalizedX: 0.5, normalizedY: 0.5 }
  return line
}

function buildLineWithEndAnchor() {
  const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 100, y: 100 })
  line.endAnchor = { symbolId: TARGET_ID, normalizedX: 1, normalizedY: 1 }
  return line
}

function buildLineWithBothAnchors() {
  const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 100, y: 100 })
  line.startAnchor = { symbolId: TARGET_ID, normalizedX: 0, normalizedY: 0 }
  line.endAnchor = { symbolId: TARGET_ID, normalizedX: 1, normalizedY: 1 }
  return line
}

function buildPolyLineWithStartAnchor() {
  const poly = EdgeUtil.createPolyLine([
    { x: 0, y: 0 },
    { x: 50, y: 50 },
    { x: 100, y: 100 },
  ])
  poly.startAnchor = { symbolId: TARGET_ID, normalizedX: 0.25, normalizedY: 0.25 }
  return poly
}

function buildPolyLineWithEndAnchor() {
  const poly = EdgeUtil.createPolyLine([
    { x: 0, y: 0 },
    { x: 50, y: 50 },
    { x: 100, y: 100 },
  ])
  poly.endAnchor = { symbolId: TARGET_ID, normalizedX: 0.75, normalizedY: 0.75 }
  return poly
}

function buildArcWithStartAnchor() {
  const arc = EdgeUtil.createArc({ x: 0, y: 0 }, 0, Math.PI, 10, 10, 0)
  arc.startAnchor = { symbolId: TARGET_ID, normalizedX: 0, normalizedY: 0.5 }
  return arc
}

function buildArcWithEndAnchor() {
  const arc = EdgeUtil.createArc({ x: 0, y: 0 }, 0, Math.PI, 10, 10, 0)
  arc.endAnchor = { symbolId: TARGET_ID, normalizedX: 0, normalizedY: 0.5 }
  return arc
}

function buildStrokeWithSingleAnchor(blockId: string) {
  const stroke = StrokeUtil.createEmpty()
  stroke.id = "edge-stroke-1"
  stroke.pointers = [
    { x: 0, y: 0, dt: 0, p: 1 },
    { x: 10, y: 0, dt: 1, p: 1 },
  ]
  stroke.jiixBlockType = "Edge"
  stroke.endAnchor = { symbolId: blockId, normalizedX: 1, normalizedY: 0.5 }
  return stroke
}

function buildStrokeWithBothAnchors(startBlockId: string, endBlockId: string) {
  const stroke = StrokeUtil.createEmpty()
  stroke.id = "edge-stroke-1"
  stroke.pointers = [
    { x: 0, y: 0, dt: 0, p: 1 },
    { x: 10, y: 0, dt: 1, p: 1 },
  ]
  stroke.jiixBlockType = "Edge"
  stroke.startAnchor = { symbolId: startBlockId, normalizedX: 0, normalizedY: 0.5 }
  stroke.endAnchor = { symbolId: endBlockId, normalizedX: 1, normalizedY: 0.5 }
  return stroke
}

// A 2-stroke edge block (e.g. a line's bar plus its arrowhead chevron): both strokes share the
// same jiixBlockId and the same endAnchor, as the sync loop writes an identical anchor to every
// stroke of one block. The chevron's own two points are nearly equidistant from the target, so
// it has no reliable "own" direction — its correct weight only comes from the group's range.
function buildTwoStrokeEdgeGroup(blockId: string) {
  const bar = StrokeUtil.createEmpty()
  bar.id = "edge-stroke-bar"
  bar.pointers = [
    { x: 0, y: 0, dt: 0, p: 1 },
    { x: 10, y: 0, dt: 1, p: 1 },
  ]
  bar.jiixBlockId = "block-edge-1"
  bar.jiixBlockType = "Edge"
  bar.endAnchor = { symbolId: blockId, normalizedX: 1, normalizedY: 0.5 }

  const chevron = StrokeUtil.createEmpty()
  chevron.id = "edge-stroke-chevron"
  chevron.pointers = [
    { x: 0, y: -2, dt: 0, p: 1 },
    { x: 0, y: 2, dt: 1, p: 1 },
  ]
  chevron.jiixBlockId = "block-edge-1"
  chevron.jiixBlockType = "Edge"
  chevron.endAnchor = { symbolId: blockId, normalizedX: 1, normalizedY: 0.5 }

  return { bar, chevron }
}

// Mocks resolving a block's center (via jiix.getStrokesForElement + model.getSymbol) to a
// stroke sitting at the given point, so gradient-follow direction is deterministic in tests.
// A real single-point stroke rather than a bare { bounds } object: SymbolGeometry.boundsOf routes
// through StrokeUtil.computeGeometry, which recomputes bounds from `pointers` rather than trusting
// a stored field, so the mock needs a real (if minimal) point to derive the same zero-size box.
function mockBlockCenter(mock: ReturnType<typeof createCanvasMock>, strokeId: string, center: { x: number; y: number }) {
  const targetStroke = StrokeUtil.createEmpty()
  targetStroke.id = strokeId
  targetStroke.pointers = [{ ...center, dt: 0, p: 0 }]
  jest.spyOn(mock.model, "getSymbol").mockImplementation((id: string) => (id === strokeId ? targetStroke : undefined) as never)
  return targetStroke
}

/**
 * Puts the symbols into the model rather than stubbing the `symbols` getter: the manager now drafts
 * by id before mutating, so a stubbed getter would hand out records the store has never heard of.
 */
function setupSymbols(mock: ReturnType<typeof createCanvasMock>, symbols: unknown[]) {
  mock.model.clear()
  symbols.forEach((s) => mock.model.addSymbol(s as TSymbol))
}

describe("IIConnectorManager", () => {
  let mock: ReturnType<typeof createCanvasMock>
  let manager: IIConnectorManager

  /**
   * The manager commits a draft rather than mutating the committed record, so a local reference held
   * from before the call is a pre-mutation snapshot. Assertions read the document instead.
   */
  const fromModel = <T>(symbol: { id: string }): T => mock.model.symbols.find((s) => s.id === symbol.id) as T


  beforeEach(() => {
    mock = createCanvasMock()
    manager = new IIConnectorManager(asCanvas(mock))
    jest
      .spyOn(mock.model, "getSymbol")
      .mockReturnValue({ id: TARGET_ID, type: SymbolType.Decorator, targetBounds: TARGET_BOUNDS, transform: MatrixTransform.identity() } as unknown as ReturnType<
        typeof mock.model.getSymbol
      >)
  })

  test("should instantiate", () => {
    expect(manager).toBeDefined()
  })

  describe("connectorConfiguration", () => {
    test("defaults followConnectedEdges to true when no config is passed", () => {
      expect(manager.connectorConfiguration.followConnectedEdges).toBe(true)
    })

    test("respects an explicit followConnectedEdges: false at construction", () => {
      const disabledManager = new IIConnectorManager(asCanvas(mock), { followConnectedEdges: false })
      expect(disabledManager.connectorConfiguration.followConnectedEdges).toBe(false)
    })

    test("is mutable at runtime (e.g. from a menu toggle)", () => {
      manager.connectorConfiguration.followConnectedEdges = false
      expect(manager.connectorConfiguration.followConnectedEdges).toBe(false)
    })
  })

  describe("updateAnchoredEdges", () => {
    test("empty symbolIds → model.updateSymbol never called", () => {
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")
      manager.updateAnchoredEdges([])
      expect(updateSpy).not.toHaveBeenCalled()
    })

    test("line with startAnchor for moved symbol → start recomputed", () => {
      const line = buildLineWithStartAnchor()
      setupSymbols(mock, [line])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      // bounds.x + 0.5 * bounds.width = 10 + 50 = 60
      // bounds.y + 0.5 * bounds.height = 20 + 40 = 60
      expect(fromModel<typeof line>(line).start).toEqual({ x: 60, y: 60 })
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(fromModel<typeof line>(line))
      expect(updateSpy).toHaveBeenCalledWith(fromModel<typeof line>(line), true)
    })

    test("line with startAnchor for moved symbol → returns an undo-able pre-mutation snapshot", () => {
      // A converted edge's anchor position is *recomputed* from the target's new bounds, not
      // transformed by a matrix relative to its own prior state — there's no inverse-matrix undo
      // for that, so the caller needs this snapshot to restore it directly.
      const line = buildLineWithStartAnchor()
      const originalStart = { ...line.start }
      setupSymbols(mock, [line])

      const result = manager.updateAnchoredEdges([TARGET_ID])

      expect(result.rigidStrokeIds).toEqual([])
      expect(result.newSymbols).toEqual([fromModel<typeof line>(line)])
      expect(result.oldSymbols).toHaveLength(1)
      expect(result.oldSymbols[0]).not.toBe(line)
      expect((result.oldSymbols[0] as typeof line).start).toEqual(originalStart)
    })

    test("line with endAnchor for moved symbol → end recomputed", () => {
      const line = buildLineWithEndAnchor()
      setupSymbols(mock, [line])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      // bounds.x + 1 * bounds.width = 10 + 100 = 110
      // bounds.y + 1 * bounds.height = 20 + 80 = 100
      expect(fromModel<typeof line>(line).end).toEqual({ x: 110, y: 100 })
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(fromModel<typeof line>(line))
      expect(updateSpy).toHaveBeenCalledWith(fromModel<typeof line>(line), true)
    })

    test("line with both anchors → both recomputed, updateSymbol called once", () => {
      const line = buildLineWithBothAnchors()
      setupSymbols(mock, [line])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      // start: normalizedX=0, normalizedY=0 → (10, 20)
      expect(fromModel<typeof line>(line).start).toEqual({ x: 10, y: 20 })
      // end: normalizedX=1, normalizedY=1 → (110, 100)
      expect(fromModel<typeof line>(line).end).toEqual({ x: 110, y: 100 })
      expect(updateSpy).toHaveBeenCalledTimes(1)
    })

    test("edge anchored to symbol NOT in movedIds → not updated", () => {
      const line = buildLineWithStartAnchor()
      const originalStart = { ...line.start }
      setupSymbols(mock, [line])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges(["other-id"])

      expect(fromModel<typeof line>(line).start).toEqual(originalStart)
      expect(updateSpy).not.toHaveBeenCalled()
    })

    test("line edge with no anchors → not updated", () => {
      const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 100, y: 100 })
      const originalStart = { ...line.start }
      const originalEnd = { ...line.end }
      setupSymbols(mock, [line])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      expect(fromModel<typeof line>(line).start).toEqual(originalStart)
      expect(fromModel<typeof line>(line).end).toEqual(originalEnd)
      expect(updateSpy).not.toHaveBeenCalled()
    })

    test("target not found (getSymbol returns undefined) → not updated", () => {
      jest.spyOn(mock.model, "getSymbol").mockReturnValue(undefined)
      const line = buildLineWithStartAnchor()
      const originalStart = { ...line.start }
      setupSymbols(mock, [line])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      expect(fromModel<typeof line>(line).start).toEqual(originalStart)
      expect(updateSpy).not.toHaveBeenCalled()
    })

    test("polyline with startAnchor → points[0] updated", () => {
      const poly = buildPolyLineWithStartAnchor()
      setupSymbols(mock, [poly])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      // bounds.x + 0.25 * bounds.width = 10 + 25 = 35
      // bounds.y + 0.25 * bounds.height = 20 + 20 = 40
      expect(fromModel<typeof poly>(poly).points[0]).toEqual({ x: 35, y: 40 })
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(fromModel<typeof poly>(poly))
      expect(updateSpy).toHaveBeenCalledWith(fromModel<typeof poly>(poly), true)
    })

    test("polyline with endAnchor → points[last] updated", () => {
      const poly = buildPolyLineWithEndAnchor()
      setupSymbols(mock, [poly])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      // bounds.x + 0.75 * bounds.width = 10 + 75 = 85
      // bounds.y + 0.75 * bounds.height = 20 + 60 = 80
      expect(fromModel<typeof poly>(poly).points[poly.points.length - 1]).toEqual({ x: 85, y: 80 })
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(fromModel<typeof poly>(poly))
      expect(updateSpy).toHaveBeenCalledWith(fromModel<typeof poly>(poly), true)
    })

    describe("with matrix and preTransformBoundsById (rotation case)", () => {
      const POST_BOUNDS = OBBOps.fromBox({ x: 50, y: 50, width: 200, height: 200 })

      beforeEach(() => {
        jest
          .spyOn(mock.model, "getSymbol")
          .mockReturnValue({ id: TARGET_ID, type: SymbolType.Decorator, targetBounds: POST_BOUNDS, transform: MatrixTransform.identity() } as unknown as ReturnType<
            typeof mock.model.getSymbol
          >)
      })

      test("line startAnchor → world point from matrix+preBounds, not postBounds", () => {
        const line = buildLineWithStartAnchor() // normalizedX:0.5, normalizedY:0.5
        setupSymbols(mock, [line])
        const matrix = MatrixTransform.identity().translate(10, 5)
        const preBoundsById = new Map([[TARGET_ID, TARGET_BOUNDS]])

        manager.updateAnchoredEdges([TARGET_ID], matrix, preBoundsById)

        // resolveAnchorPoint(anchor, TARGET_BOUNDS) = {x:60, y:60}; translate(10,5) → {x:70, y:65}
        // if using POST_BOUNDS instead: {x:150, y:150} — proves we use preBounds
        expect(fromModel<typeof line>(line).start).toEqual({ x: 70, y: 65 })
      })

      test("normalizedXY updated to reflect position in post-transform bounds", () => {
        const line = buildLineWithStartAnchor() // normalizedX:0.5, normalizedY:0.5
        setupSymbols(mock, [line])
        const matrix = MatrixTransform.identity().translate(10, 5)
        const preBoundsById = new Map([[TARGET_ID, TARGET_BOUNDS]])

        manager.updateAnchoredEdges([TARGET_ID], matrix, preBoundsById)

        // world point (70, 65) in POST_BOUNDS {x:50,y:50,w:200,h:200}:
        // normalizedX = (70-50)/200 = 0.1, normalizedY = (65-50)/200 = 0.075
        expect(fromModel<typeof line>(line).startAnchor!.normalizedX).toBeCloseTo(0.1)
        expect(fromModel<typeof line>(line).startAnchor!.normalizedY).toBeCloseTo(0.075)
      })

      test("without matrix → falls back to current bounds (backward compat)", () => {
        const line = buildLineWithStartAnchor() // normalizedX:0.5, normalizedY:0.5
        setupSymbols(mock, [line])

        manager.updateAnchoredEdges([TARGET_ID])

        // Uses POST_BOUNDS (no matrix): x=50+0.5*200=150, y=50+0.5*200=150
        expect(fromModel<typeof line>(line).start).toEqual({ x: 150, y: 150 })
      })

      test("matrix present but no preBounds entry → falls back to current bounds", () => {
        const line = buildLineWithStartAnchor()
        setupSymbols(mock, [line])
        const matrix = MatrixTransform.identity().translate(10, 5)
        const emptyMap = new Map<string, TOBB>()

        manager.updateAnchoredEdges([TARGET_ID], matrix, emptyMap)

        // Falls back to POST_BOUNDS: x=50+0.5*200=150, y=50+0.5*200=150
        expect(fromModel<typeof line>(line).start).toEqual({ x: 150, y: 150 })
      })
    })

    test("non-edge symbols (stroke) → ignored", () => {
      const stroke = StrokeUtil.createEmpty()
      setupSymbols(mock, [stroke])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      expect(updateSpy).not.toHaveBeenCalled()
      expect(mock.renderer.drawSymbol).not.toHaveBeenCalled()
    })
  })

  describe("updateAnchoredEdges — arc reprojection", () => {
    test("arc with startAnchor for a moved shape recomputes startAngle and lets the ellipse stretch to reach the target", () => {
      const arc = buildArcWithStartAnchor()
      const radiusYBefore = arc.radiusY
      setupSymbols(mock, [arc])

      manager.updateAnchoredEdges([TARGET_ID])

      expect(fromModel<typeof arc>(arc).startAngle).not.toBe(0)
      // The regression this locks in: the anchor target is far from the original radius, so the
      // ellipse must actually resize to reach it exactly — not stay locked to its old size.
      expect(fromModel<typeof arc>(arc).radiusY).not.toBeCloseTo(radiusYBefore, 0)
    })

    // Regression lock: when only ONE end of a connected arc is anchored to the moving shape,
    // the OTHER endpoint's actual WORLD position — not just its angle sum — must stay exactly
    // where it was. This is what "the edge follows the shape without distorting" means for an
    // arc, and it's the same invariant reprojectArcMidpoint's manual-drag fix now also upholds.
    test("arc with startAnchor for a moved shape: the end endpoint's world position is unchanged", () => {
      const arc = buildArcWithStartAnchor()
      const endBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle + arc.sweepAngle)
      setupSymbols(mock, [arc])

      manager.updateAnchoredEdges([TARGET_ID])

      const endAfter = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle + arc.sweepAngle)
      expect(endAfter.x).toBeCloseTo(endBefore.x, 2)
      expect(endAfter.y).toBeCloseTo(endBefore.y, 2)
    })

    test("arc with endAnchor for a moved shape: the start endpoint's world position is unchanged", () => {
      const arc = buildArcWithEndAnchor()
      const startBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)
      setupSymbols(mock, [arc])

      manager.updateAnchoredEdges([TARGET_ID])

      const startAfter = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)
      expect(startAfter.x).toBeCloseTo(startBefore.x, 2)
      expect(startAfter.y).toBeCloseTo(startBefore.y, 2)
      // Sanity: the anchored end actually moved (this isn't a no-op).
      expect(fromModel<typeof arc>(arc).startAngle + arc.sweepAngle).not.toBeCloseTo(Math.PI, 1)
    })

    // Regression: the Arc branch used to skip recomputeAllEntryPoints entirely (unlike the
    // Line/PolyEdge branches right below it), so entryPoint stayed frozen at whatever it was
    // when the anchor was first created — drawing a phantom segment from the shape's center to
    // that stale point once the connected shape actually moved.
    test("arc with startAnchor: entryPoint is refreshed after the connected shape moves, not left stale", () => {
      const circle = ShapeUtil.createCircle({ x: 50, y: 50 }, 30)
      jest.spyOn(mock.model, "getSymbol").mockImplementation((id: string) => (id === circle.id ? circle : undefined) as never)
      const arc = EdgeUtil.createArc({ x: 50, y: 50 }, 0, Math.PI, 20, 20, 0)
      arc.startAnchor = { symbolId: circle.id, normalizedX: 0.5, normalizedY: 0.5, entryPoint: { x: -9999, y: -9999 } }
      setupSymbols(mock, [arc, circle])

      manager.updateAnchoredEdges([circle.id])

      expect(fromModel<typeof arc>(arc).startAnchor?.entryPoint).toBeDefined()
      expect(fromModel<typeof arc>(arc).startAnchor?.entryPoint).not.toEqual({ x: -9999, y: -9999 })
    })
  })

  describe("drawAnchoredEdgesForMatrix — arc reprojection", () => {
    // Regression: the preview pass (drawAnchoredEdgesForMatrix) and the commit pass
    // (updateAnchoredEdges) must stretch the ellipse to the SAME geometry — otherwise the arc
    // would visually stay locked to its old size while dragging, then snap to the correct
    // stretched size only at pointerup (the same class of bug fixed earlier for gradient-
    // followed raw strokes).
    test("arc with startAnchor for a moving block previews the same stretched geometry the commit produces", () => {
      const previewArc = buildArcWithStartAnchor()
      setupSymbols(mock, [previewArc])

      manager.drawAnchoredEdgesForMatrix([TARGET_ID], MatrixTransform.identity())

      const drawnClone = (mock.renderer.drawSymbol as jest.Mock).mock.calls.at(-1)![0] as typeof previewArc
      expect(drawnClone.radiusY).not.toBeCloseTo(previewArc.radiusY, 0)
      const endAfterPreview = computePointOnEllipse(
        drawnClone.center,
        drawnClone.radiusX,
        drawnClone.radiusY,
        drawnClone.phi,
        drawnClone.startAngle + drawnClone.sweepAngle
      )
      const endBefore = computePointOnEllipse(
        previewArc.center,
        previewArc.radiusX,
        previewArc.radiusY,
        previewArc.phi,
        previewArc.startAngle + previewArc.sweepAngle
      )
      expect(endAfterPreview.x).toBeCloseTo(endBefore.x, 2)
      expect(endAfterPreview.y).toBeCloseTo(endBefore.y, 2)

      const commitArc = buildArcWithStartAnchor()
      setupSymbols(mock, [commitArc])
      manager.updateAnchoredEdges([TARGET_ID])

      const committedArc = fromModel<typeof commitArc>(commitArc)
      expect(committedArc.radiusY).toBeCloseTo(drawnClone.radiusY, 2)
      expect(committedArc.center.x).toBeCloseTo(drawnClone.center.x, 2)
      expect(committedArc.center.y).toBeCloseTo(drawnClone.center.y, 2)
    })

    test("arc with startAnchor: preview also refreshes entryPoint on the drawn clone, without mutating the original (still-stale) arc", () => {
      const circle = ShapeUtil.createCircle({ x: 50, y: 50 }, 30)
      jest.spyOn(mock.model, "getSymbol").mockImplementation((id: string) => (id === circle.id ? circle : undefined) as never)
      const arc = EdgeUtil.createArc({ x: 50, y: 50 }, 0, Math.PI, 20, 20, 0)
      arc.startAnchor = { symbolId: circle.id, normalizedX: 0.5, normalizedY: 0.5, entryPoint: { x: -9999, y: -9999 } }
      setupSymbols(mock, [arc, circle])

      manager.drawAnchoredEdgesForMatrix([circle.id], MatrixTransform.identity())

      const drawnClone = (mock.renderer.drawSymbol as jest.Mock).mock.calls.at(-1)![0] as typeof arc
      expect(drawnClone.startAnchor?.entryPoint).toBeDefined()
      expect(drawnClone.startAnchor?.entryPoint).not.toEqual({ x: -9999, y: -9999 })
      // Preview never mutates the model's own symbol — only the clone it draws.
      expect(fromModel<typeof arc>(arc).startAnchor?.entryPoint).toEqual({ x: -9999, y: -9999 })
    })
  })

  describe("findSymbolAtPoint", () => {
    const CIRCLE_CENTER = { x: 50, y: 50 }
    const CIRCLE_RADIUS = 30

    test("returns symbol whose bounds contain point", () => {
      const circle = ShapeUtil.createCircle(CIRCLE_CENTER, CIRCLE_RADIUS)
      setupSymbols(mock, [circle])

      const result = manager.findSymbolAtPoint({ x: 55, y: 55 }, "other-id")

      expect(result).toEqual(circle)
    })

    test("returns undefined when point outside all symbol bounds", () => {
      const circle = ShapeUtil.createCircle(CIRCLE_CENTER, CIRCLE_RADIUS)
      setupSymbols(mock, [circle])

      const result = manager.findSymbolAtPoint({ x: 200, y: 200 }, "other-id")

      expect(result).toBeUndefined()
    })

    test("excludes symbol with matching excludeId", () => {
      const circle = ShapeUtil.createCircle(CIRCLE_CENTER, CIRCLE_RADIUS)
      setupSymbols(mock, [circle])

      const result = manager.findSymbolAtPoint({ x: 55, y: 55 }, circle.id)

      expect(result).toBeUndefined()
    })

    test("rotated polygon: point inside AABB but outside actual polygon → no match", () => {
      // Simulate a square rotated 45°: becomes a diamond.
      // Original 100x100 square centered at (50,50), rotated 45° → diamond with vertices at
      // top(50,0), right(100,50), bottom(50,100), left(0,50).
      // AABB = {x:0,y:0,w:100,h:100} (unchanged for a square).
      // Corner (5,5) is inside the AABB but outside the diamond.
      const diamond = ShapeUtil.createPolygon([
        { x: 50, y: 0 }, // top
        { x: 100, y: 50 }, // right
        { x: 50, y: 100 }, // bottom
        { x: 0, y: 50 }, // left
      ])
      setupSymbols(mock, [diamond])

      // (5,5) is in the AABB but well outside the diamond
      const result = manager.findSymbolAtPoint({ x: 5, y: 5 }, "other-id")

      expect(result).toBeUndefined()
    })

    test("rotated polygon: point inside actual polygon → match", () => {
      const diamond = ShapeUtil.createPolygon([
        { x: 50, y: 0 },
        { x: 100, y: 50 },
        { x: 50, y: 100 },
        { x: 0, y: 50 },
      ])
      setupSymbols(mock, [diamond])

      // (50,50) is the center — clearly inside the diamond
      const result = manager.findSymbolAtPoint({ x: 50, y: 50 }, "other-id")

      expect(result).toEqual(diamond)
    })

    test("excludes edges from anchor targets", () => {
      const line = EdgeUtil.createLine({ x: 20, y: 20 }, { x: 80, y: 80 })
      setupSymbols(mock, [line])

      const result = manager.findSymbolAtPoint({ x: 50, y: 50 }, "other-id")

      expect(result).toBeUndefined()
    })

    test("skips an unregistered symbol type without throwing, still matching a real symbol at the same point", () => {
      const circle = ShapeUtil.createCircle(CIRCLE_CENTER, CIRCLE_RADIUS)
      const orphan = {
        ...(circle as unknown as TBaseSymbol),
        type: "no-such-type",
        id: "orphan-1",
      } as unknown as TSymbol
      setupSymbols(mock, [orphan, circle])

      let result: TSymbol | undefined
      expect(() => {
        result = manager.findSymbolAtPoint({ x: 55, y: 55 }, "other-id")
      }).not.toThrow()

      expect(result).toEqual(circle)
    })
  })

  describe("applyEndpointAnchor", () => {
    test("sets startAnchor at center when pointIndex=0 and point hits shape", () => {
      const square = ShapeUtil.createPolygon([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ])
      setupSymbols(mock, [square])
      const line = EdgeUtil.createLine({ x: 55, y: 55 }, { x: 200, y: 200 })

      manager.applyEndpointAnchor(asDraft(line), 0, { x: 55, y: 55 })

      expect(line.startAnchor?.symbolId).toBe(square.id)
      expect(line.startAnchor?.normalizedX).toBe(0.5)
      expect(line.startAnchor?.normalizedY).toBe(0.5)
      // Edge start snapped to center (50, 50)
      expect(line.start).toEqual({ x: 50, y: 50 })
      expect(line.endAnchor).toBeUndefined()
    })

    test("sets endAnchor at center when pointIndex=last and point hits shape", () => {
      const square = ShapeUtil.createPolygon([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ])
      setupSymbols(mock, [square])
      const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 55, y: 55 })

      manager.applyEndpointAnchor(asDraft(line), EdgeUtil.getLineVertices(line).length - 1, { x: 55, y: 55 })

      expect(line.endAnchor?.symbolId).toBe(square.id)
      expect(line.endAnchor?.normalizedX).toBe(0.5)
      expect(line.endAnchor?.normalizedY).toBe(0.5)
      // Edge end snapped to center (50, 50)
      expect(line.end).toEqual({ x: 50, y: 50 })
      expect(line.startAnchor).toBeUndefined()
    })

    test("endAnchor has entryPoint set (intersection with polygon border)", () => {
      // Square (0,0)→(100,100), center=(50,50). Free end at (200,50).
      // Edge goes from (200,50) to center (50,50): horizontal line y=50.
      // Right border: x=100, y in [0,100] → entry at (100, 50).
      const square = ShapeUtil.createPolygon([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ])
      setupSymbols(mock, [square])
      // getSymbol must return the real shape so isShape + vertices work
      jest
        .spyOn(mock.model, "getSymbol")
        .mockReturnValue(square as unknown as ReturnType<typeof mock.model.getSymbol>)
      const line = EdgeUtil.createLine({ x: 200, y: 50 }, { x: 55, y: 55 })

      manager.applyEndpointAnchor(asDraft(line), EdgeUtil.getLineVertices(line).length - 1, { x: 55, y: 55 })

      expect(line.endAnchor?.entryPoint).toBeDefined()
      expect(line.endAnchor?.entryPoint?.x).toBeCloseTo(100)
      expect(line.endAnchor?.entryPoint?.y).toBeCloseTo(50)
    })

    test("clears startAnchor when point hits no symbol", () => {
      setupSymbols(mock, [])
      const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 100, y: 100 })
      line.startAnchor = { symbolId: "old", normalizedX: 0.5, normalizedY: 0.5 }

      manager.applyEndpointAnchor(asDraft(line), 0, { x: 0, y: 0 })

      expect(line.startAnchor).toBeUndefined()
    })

    test("ignores mid-vertex pointIndex (not start or end)", () => {
      const circle = ShapeUtil.createCircle({ x: 50, y: 50 }, 30)
      setupSymbols(mock, [circle])
      const poly = EdgeUtil.createPolyLine([
        { x: 0, y: 0 },
        { x: 55, y: 55 },
        { x: 100, y: 100 },
      ])

      manager.applyEndpointAnchor(asDraft(poly), 1, { x: 55, y: 55 })

      expect(poly.startAnchor).toBeUndefined()
      expect(poly.endAnchor).toBeUndefined()
    })

    test("Arc: sets startAnchor and stretches the ellipse so the endpoint lands exactly on the shape's center", () => {
      const circle = ShapeUtil.createCircle({ x: 50, y: 50 }, 30)
      setupSymbols(mock, [circle])
      const arc = EdgeUtil.createArc({ x: 50, y: 50 }, 0, Math.PI, 20, 20, 0)
      const endBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle + arc.sweepAngle)

      manager.applyEndpointAnchor(asDraft(arc), 0, { x: 55, y: 55 })

      expect(arc.startAnchor).toEqual(
        expect.objectContaining({ symbolId: circle.id, normalizedX: 0.5, normalizedY: 0.5 })
      )
      const startAfter = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)
      expect(startAfter.x).toBeCloseTo(50, 1)
      expect(startAfter.y).toBeCloseTo(50, 1)
      // The other endpoint (end) stays exactly where it was — only the dragged one moved.
      const endAfter = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle + arc.sweepAngle)
      expect(endAfter.x).toBeCloseTo(endBefore.x, 1)
      expect(endAfter.y).toBeCloseTo(endBefore.y, 1)
    })

    test("Arc: dropping the endpoint away from any shape clears the anchor", () => {
      const circle = ShapeUtil.createCircle({ x: 50, y: 50 }, 30)
      setupSymbols(mock, [circle])
      const arc = EdgeUtil.createArc({ x: 50, y: 50 }, 0, Math.PI, 20, 20, 0)
      arc.startAnchor = { symbolId: circle.id, normalizedX: 0.5, normalizedY: 0.5 }

      manager.applyEndpointAnchor(asDraft(arc), 0, { x: 500, y: 500 })

      expect(arc.startAnchor).toBeUndefined()
    })
  })

  describe("showAnchorHint", () => {
    test("draws rect and returns target when point inside symbol", () => {
      const circle = ShapeUtil.createCircle({ x: 50, y: 50 }, 30)
      setupSymbols(mock, [circle])

      const result = manager.showAnchorHint({ x: 55, y: 55 }, "other-id")

      expect(result).toEqual(circle)
      expect(mock.renderer.drawRect).toHaveBeenCalledTimes(1)
    })

    test("returns undefined and skips drawRect when no symbol at point", () => {
      setupSymbols(mock, [])

      const result = manager.showAnchorHint({ x: 55, y: 55 }, "other-id")

      expect(result).toBeUndefined()
      expect(mock.renderer.drawRect).not.toHaveBeenCalled()
    })

    test("clears previous hint before drawing new one", () => {
      const circle = ShapeUtil.createCircle({ x: 50, y: 50 }, 30)
      setupSymbols(mock, [circle])

      manager.showAnchorHint({ x: 55, y: 55 }, "other-id")
      manager.showAnchorHint({ x: 55, y: 55 }, "other-id")

      expect(mock.renderer.clearElements).toHaveBeenCalledTimes(2)
    })

    test("fills the hint rect with a hatched pattern tagged with the same role, so it clears together with the rect", () => {
      const circle = ShapeUtil.createCircle({ x: 50, y: 50 }, 30)
      setupSymbols(mock, [circle])

      manager.showAnchorHint({ x: 55, y: 55 }, "other-id")

      const patternCall = (mock.renderer.appendElement as jest.Mock).mock.calls.at(-1)![0] as SVGPatternElement
      expect(patternCall.tagName.toLowerCase()).toBe("pattern")
      expect(patternCall.getAttribute("role")).toBe("anchor-hint")

      const rectAttrs = (mock.renderer.drawRect as jest.Mock).mock.calls.at(-1)![1] as Record<string, string>
      expect(rectAttrs.role).toBe("anchor-hint")
      expect(rectAttrs.fill).toBe(`url(#${patternCall.id})`)
    })
  })

  describe("drawAnchoredEdgesForMatrix", () => {
    test("empty symbolIds → renderer.drawSymbol never called", () => {
      manager.drawAnchoredEdgesForMatrix([], MatrixTransform.identity())
      expect(mock.renderer.drawSymbol).not.toHaveBeenCalled()
    })

    test("line startAnchor → start moved by matrix", () => {
      const line = buildLineWithStartAnchor()
      setupSymbols(mock, [line])
      const matrix = MatrixTransform.identity().translate(10, 5)

      manager.drawAnchoredEdgesForMatrix([TARGET_ID], matrix)

      // resolveAnchorPoint(startAnchor{normalizedX:0.5,normalizedY:0.5}, TARGET_BOUNDS{x:10,y:20,w:100,h:80}) = {x:60,y:60}
      // matrix.translate(10,5) applied: {x:70,y:65}
      expect(mock.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      const drawn = (mock.renderer.drawSymbol as jest.Mock).mock.calls[0][0] as typeof line
      expect(drawn.start).toEqual({ x: 70, y: 65 })
    })

    test("original line is not mutated by drawAnchoredEdgesForMatrix", () => {
      const line = buildLineWithStartAnchor()
      const originalStart = { ...line.start }
      setupSymbols(mock, [line])

      manager.drawAnchoredEdgesForMatrix([TARGET_ID], MatrixTransform.identity().translate(10, 0))

      expect(fromModel<typeof line>(line).start).toEqual(originalStart)
    })

    test("polyline endAnchor → last point moved by matrix", () => {
      const poly = buildPolyLineWithEndAnchor()
      setupSymbols(mock, [poly])
      const matrix = MatrixTransform.identity().translate(0, 10)

      manager.drawAnchoredEdgesForMatrix([TARGET_ID], matrix)

      // resolveAnchorPoint(endAnchor{normalizedX:0.75,normalizedY:0.75}, TARGET_BOUNDS) = {x:85,y:80}
      // translate(0,10): {x:85,y:90}
      const drawn = (mock.renderer.drawSymbol as jest.Mock).mock.calls[0][0] as typeof poly
      const last = drawn.points[drawn.points.length - 1]
      expect(last).toEqual({ x: 85, y: 90 })
    })

    test("edge anchored to symbol NOT in symbolIds → not redrawn", () => {
      const line = buildLineWithStartAnchor()
      setupSymbols(mock, [line])

      manager.drawAnchoredEdgesForMatrix(["other-id"], MatrixTransform.identity().translate(10, 0))

      expect(mock.renderer.drawSymbol).not.toHaveBeenCalled()
    })

    test("arc anchored to a non-Shape target is previewed, like the Line/PolyEdge branches and the commit path", () => {
      // getSymbol is mocked to a bare { id, type, bounds } — a registered type so
      // SymbolGeometry.boundsOf can resolve it, but no `kind`, so it isn't a real, recognized
      // TShape either. The commit path moves such an arc, so the preview must too, otherwise the
      // arc only jumps on pointer-up.
      const arc = buildArcWithStartAnchor()
      const originalStartAngle = arc.startAngle
      setupSymbols(mock, [arc])

      manager.drawAnchoredEdgesForMatrix([TARGET_ID], MatrixTransform.identity().translate(10, 5))

      expect(mock.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      const drawn = (mock.renderer.drawSymbol as jest.Mock).mock.calls[0][0] as typeof arc
      expect(drawn.startAngle).not.toBe(originalStartAngle)
      // preview must not mutate the model symbol
      expect(fromModel<typeof arc>(arc).startAngle).toBe(originalStartAngle)
    })
  })

  describe("drawAnchoredEdgesForMatrix — raw stroke gradient/rigid follow", () => {
    test("single-anchor edge stroke targeting a moving block gets a gradient toward it", () => {
      const stroke = buildStrokeWithSingleAnchor("block-shape-1")
      setupSymbols(mock, [stroke])
      jest
        .spyOn(mock.jiix, "getStrokesForElement")
        .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))
      mockBlockCenter(mock, "shape-stroke-1", { x: 100, y: 0 })
      const matrix = MatrixTransform.identity().translate(5, 5)

      manager.drawAnchoredEdgesForMatrix(["shape-stroke-1"], matrix)

      // point[1] (10,0) is nearest the moving block's center (100,0) → full weight.
      // point[0] (0,0) is farthest → no movement.
      const drawnClone = (mock.renderer.drawSymbol as jest.Mock).mock.calls.at(-1)![0] as typeof stroke
      expect(drawnClone.pointers[0]).toEqual({ x: 0, y: 0, dt: 0, p: 1 })
      expect(drawnClone.pointers[1]).toEqual({ x: 15, y: 5, dt: 1, p: 1 })
    })

    test("dual-anchor edge stroke gets a gradient when only one connected block is moving", () => {
      const stroke = buildStrokeWithBothAnchors("block-shape-1", "block-shape-2")
      setupSymbols(mock, [stroke])
      jest.spyOn(mock.jiix, "getStrokesForElement").mockImplementation((id: string) => {
        if (id === "block-shape-1") return ["shape-stroke-1"]
        if (id === "block-shape-2") return ["other-stroke-x"]
        return []
      })
      mockBlockCenter(mock, "shape-stroke-1", { x: 100, y: 0 })
      const matrix = MatrixTransform.identity().translate(5, 5)

      manager.drawAnchoredEdgesForMatrix(["shape-stroke-1"], matrix)

      const drawnClone = (mock.renderer.drawSymbol as jest.Mock).mock.calls.at(-1)![0] as typeof stroke
      expect(drawnClone.pointers[0]).toEqual({ x: 0, y: 0, dt: 0, p: 1 })
      expect(drawnClone.pointers[1]).toEqual({ x: 15, y: 5, dt: 1, p: 1 })
    })

    test("dual-anchor edge stroke is rigidly translated when both connected blocks move together", () => {
      const stroke = buildStrokeWithBothAnchors("block-shape-1", "block-shape-2")
      setupSymbols(mock, [stroke])
      jest.spyOn(mock.jiix, "getStrokesForElement").mockImplementation((id: string) => {
        if (id === "block-shape-1") return ["shape-stroke-1"]
        if (id === "block-shape-2") return ["shape-stroke-2"]
        return []
      })
      const matrix = MatrixTransform.identity().translate(5, 5)

      manager.drawAnchoredEdgesForMatrix(["shape-stroke-1", "shape-stroke-2"], matrix)

      const drawnClone = (mock.renderer.drawSymbol as jest.Mock).mock.calls.at(-1)![0] as typeof stroke
      expect(drawnClone.pointers[0]).toEqual({ x: 5, y: 5, dt: 0, p: 1 })
      expect(drawnClone.pointers[1]).toEqual({ x: 15, y: 5, dt: 1, p: 1 })
    })

    test("edge stroke that is itself being transformed is not previewed as a follower", () => {
      const stroke = buildStrokeWithSingleAnchor("block-shape-1")
      setupSymbols(mock, [stroke])
      jest
        .spyOn(mock.jiix, "getStrokesForElement")
        .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))
      const matrix = MatrixTransform.identity().translate(5, 5)

      // The edge stroke is part of the selection being dragged: the normal direct-transform
      // path already previews it (CSS transform on its element), so the follow pass must skip it.
      manager.drawAnchoredEdgesForMatrix(["shape-stroke-1", stroke.id], matrix)

      expect(mock.renderer.drawSymbol).not.toHaveBeenCalled()
    })

    test("multi-stroke edge block (bar + chevron) computes gradient weight from the GROUP's distance range, not each stroke's own endpoints", () => {
      const { bar, chevron } = buildTwoStrokeEdgeGroup("block-shape-1")
      setupSymbols(mock, [bar, chevron])
      jest
        .spyOn(mock.jiix, "getStrokesForElement")
        .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))
      mockBlockCenter(mock, "shape-stroke-1", { x: 100, y: 0 })
      const matrix = MatrixTransform.identity().translate(5, 5)

      manager.drawAnchoredEdgesForMatrix(["shape-stroke-1"], matrix)

      const drawnClones = (mock.renderer.drawSymbol as jest.Mock).mock.calls.map(
        (call) => call[0] as typeof bar
      )
      const drawnBar = drawnClones.find((c) => c.id === bar.id)!
      const drawnChevron = drawnClones.find((c) => c.id === chevron.id)!

      // bar[1] (10,0) is the group's nearest point to the target (100,0) → full weight.
      expect(drawnBar.pointers[1]).toEqual({ x: 15, y: 5, dt: 1, p: 1 })
      // Both chevron points are farther from the target than any bar point, so they're the
      // group's farthest — weight 0, UNCHANGED. Isolated per-stroke math (the old algorithm)
      // would have called them a tie and moved chevron[0] fully while leaving chevron[1] put,
      // splitting the chevron apart instead of keeping it rigid relative to the group's far end.
      expect(drawnChevron.pointers[0]).toEqual({ x: 0, y: -2, dt: 0, p: 1 })
      expect(drawnChevron.pointers[1]).toEqual({ x: 0, y: 2, dt: 1, p: 1 })
    })
  })

  describe("updateAnchoredEdges — raw stroke gradient/rigid follow (commit path)", () => {
    test("returns the ids of the edge strokes it mutated, gradient-shifted toward the moving block", () => {
      const stroke = buildStrokeWithSingleAnchor("block-shape-1")
      setupSymbols(mock, [stroke])
      jest
        .spyOn(mock.jiix, "getStrokesForElement")
        .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))
      mockBlockCenter(mock, "shape-stroke-1", { x: 100, y: 0 })

      const followed = manager.updateAnchoredEdges(["shape-stroke-1"], MatrixTransform.identity().translate(5, 5))

      // Gradient-moved (not rigid): needs a pre-mutation snapshot for undo, not just an id.
      expect(followed.rigidStrokeIds).toEqual([])
      expect(followed.newSymbols.map((s) => s.id)).toEqual([stroke.id])
      expect((followed.oldSymbols[0] as typeof stroke).pointers).toEqual([
        { x: 0, y: 0, dt: 0, p: 1 },
        { x: 10, y: 0, dt: 1, p: 1 },
      ])
      // point[1] (10,0) is nearest the moving block's center (100,0) → full weight.
      expect(fromModel<typeof stroke>(stroke).pointers[0]).toEqual(expect.objectContaining({ x: 0, y: 0 }))
      expect(fromModel<typeof stroke>(stroke).pointers[1]).toEqual(expect.objectContaining({ x: 15, y: 5 }))
    })

    test("dual-anchor edge stroke is rigidly translated (commit) when both connected blocks move together", () => {
      const stroke = buildStrokeWithBothAnchors("block-shape-1", "block-shape-2")
      setupSymbols(mock, [stroke])
      jest.spyOn(mock.jiix, "getStrokesForElement").mockImplementation((id: string) => {
        if (id === "block-shape-1") return ["shape-stroke-1"]
        if (id === "block-shape-2") return ["shape-stroke-2"]
        return []
      })

      const followed = manager.updateAnchoredEdges(
        ["shape-stroke-1", "shape-stroke-2"],
        MatrixTransform.identity().translate(5, 5)
      )

      // Rigid (both connected blocks moving together): id-only, safe to undo via inverse matrix.
      expect(followed.rigidStrokeIds).toEqual([stroke.id])
      expect(followed.oldSymbols).toEqual([])
      expect(followed.newSymbols).toEqual([])
      expect(fromModel<typeof stroke>(stroke).pointers[0]).toEqual(expect.objectContaining({ x: 5, y: 5 }))
      expect(fromModel<typeof stroke>(stroke).pointers[1]).toEqual(expect.objectContaining({ x: 15, y: 5 }))
    })

    test("edge stroke that is itself being transformed is neither followed nor reported", () => {
      const stroke = buildStrokeWithSingleAnchor("block-shape-1")
      setupSymbols(mock, [stroke])
      jest
        .spyOn(mock.jiix, "getStrokesForElement")
        .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))

      const followed = manager.updateAnchoredEdges(
        ["shape-stroke-1", stroke.id],
        MatrixTransform.identity().translate(5, 5)
      )

      expect(followed).toEqual({ rigidStrokeIds: [], oldSymbols: [], newSymbols: [] })
      // Untouched by the follow pass — the caller's own transform path owns this stroke.
      expect(fromModel<typeof stroke>(stroke).pointers[0]).toEqual(expect.objectContaining({ x: 0, y: 0 }))
      expect(fromModel<typeof stroke>(stroke).pointers[1]).toEqual(expect.objectContaining({ x: 10, y: 0 }))
    })

    test("multi-stroke edge block (commit): each stroke gets its own pre-mutation snapshot, weighted by the group's distance range", () => {
      const { bar, chevron } = buildTwoStrokeEdgeGroup("block-shape-1")
      setupSymbols(mock, [bar, chevron])
      jest
        .spyOn(mock.jiix, "getStrokesForElement")
        .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))
      mockBlockCenter(mock, "shape-stroke-1", { x: 100, y: 0 })

      const followed = manager.updateAnchoredEdges(["shape-stroke-1"], MatrixTransform.identity().translate(5, 5))

      expect(followed.rigidStrokeIds).toEqual([])
      expect(followed.newSymbols.map((s) => s.id).sort()).toEqual([bar.id, chevron.id].sort())

      // Group's nearest point (bar[1]) gets full weight; the chevron, being the group's
      // farthest points, gets none — both chevron points move together (weight 0), not split.
      expect(fromModel<typeof bar>(bar).pointers[1]).toEqual(expect.objectContaining({ x: 15, y: 5 }))
      expect(fromModel<typeof chevron>(chevron).pointers[0]).toEqual(expect.objectContaining({ x: 0, y: -2 }))
      expect(fromModel<typeof chevron>(chevron).pointers[1]).toEqual(expect.objectContaining({ x: 0, y: 2 }))
    })

    test("getFollowedStrokeIds reports followers without mutating them", () => {
      const stroke = buildStrokeWithSingleAnchor("block-shape-1")
      setupSymbols(mock, [stroke])
      jest
        .spyOn(mock.jiix, "getStrokesForElement")
        .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))

      expect(manager.getFollowedStrokeIds(["shape-stroke-1"])).toEqual([stroke.id])
      expect(manager.getFollowedStrokeIds(["shape-stroke-1", stroke.id])).toEqual([])
      expect(manager.getFollowedStrokeIds([])).toEqual([])
      expect(fromModel<typeof stroke>(stroke).pointers[0]).toEqual(expect.objectContaining({ x: 0, y: 0 }))
    })
  })

  describe("clearAnchoredEdgesFor", () => {
    test("detaches an anchored line edge that is itself transformed", () => {
      const line = buildLineWithStartAnchor()
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([line])

      expect(line.startAnchor).toBeUndefined()
      expect(line.endAnchor).toBeUndefined()
      expect(updateSpy).toHaveBeenCalledWith(line)
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(line)
    })

    test("detaches an anchored polyline edge that is itself transformed", () => {
      const poly = buildPolyLineWithEndAnchor()
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([poly])

      expect(poly.startAnchor).toBeUndefined()
      expect(poly.endAnchor).toBeUndefined()
      expect(updateSpy).toHaveBeenCalledWith(poly)
    })

    test("detaches an anchored arc edge that is itself transformed", () => {
      const arc = buildArcWithStartAnchor()
      arc.endAnchor = { symbolId: TARGET_ID, normalizedX: 1, normalizedY: 0.5 }
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([arc])

      expect(arc.startAnchor).toBeUndefined()
      expect(arc.endAnchor).toBeUndefined()
      expect(updateSpy).toHaveBeenCalledWith(arc)
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(arc)
    })

    test("leaves an edge without anchors untouched", () => {
      const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 10, y: 10 })
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([line])

      expect(updateSpy).not.toHaveBeenCalled()
      expect(mock.renderer.drawSymbol).not.toHaveBeenCalled()
    })

    test("edge stroke that is itself being transformed is not previewed as a follower", () => {
      const stroke = buildStrokeWithSingleAnchor("block-shape-1")
      setupSymbols(mock, [stroke])
      jest
        .spyOn(mock.jiix, "getStrokesForElement")
        .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))
      const matrix = MatrixTransform.identity().translate(5, 5)

      // The edge stroke is part of the selection being dragged: the normal direct-transform
      // path already previews it (CSS transform on its element), so the follow pass must skip it.
      manager.drawAnchoredEdgesForMatrix(["shape-stroke-1", stroke.id], matrix)

      expect(mock.renderer.drawSymbol).not.toHaveBeenCalled()
    })
  })

  describe("clearAnchoredEdgesFor", () => {
    test("detaches an anchored line edge that is itself transformed", () => {
      const line = buildLineWithStartAnchor()
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([line])

      expect(line.startAnchor).toBeUndefined()
      expect(line.endAnchor).toBeUndefined()
      expect(updateSpy).toHaveBeenCalledWith(line)
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(line)
    })

    test("detaches an anchored polyline edge that is itself transformed", () => {
      const poly = buildPolyLineWithEndAnchor()
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([poly])

      expect(poly.startAnchor).toBeUndefined()
      expect(poly.endAnchor).toBeUndefined()
      expect(updateSpy).toHaveBeenCalledWith(poly)
    })

    test("detaches an anchored arc edge that is itself transformed", () => {
      const arc = buildArcWithStartAnchor()
      arc.endAnchor = { symbolId: TARGET_ID, normalizedX: 1, normalizedY: 0.5 }
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([arc])

      expect(arc.startAnchor).toBeUndefined()
      expect(arc.endAnchor).toBeUndefined()
      expect(updateSpy).toHaveBeenCalledWith(arc)
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(arc)
    })

    test("leaves an edge without anchors untouched", () => {
      const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 10, y: 10 })
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([line])

      expect(updateSpy).not.toHaveBeenCalled()
      expect(mock.renderer.drawSymbol).not.toHaveBeenCalled()
    })

    test("edge stroke that is itself being transformed is not previewed as a follower", () => {
      const stroke = buildStrokeWithSingleAnchor("block-shape-1")
      setupSymbols(mock, [stroke])
      jest
        .spyOn(mock.jiix, "getStrokesForElement")
        .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))
      const matrix = MatrixTransform.identity().translate(5, 5)

      // The edge stroke is part of the selection being dragged: the normal direct-transform
      // path already previews it (CSS transform on its element), so the follow pass must skip it.
      manager.drawAnchoredEdgesForMatrix(["shape-stroke-1", stroke.id], matrix)

      expect(mock.renderer.drawSymbol).not.toHaveBeenCalled()
    })
  })

  describe("updateAnchoredEdges — raw stroke rigid follow (commit path)", () => {
    test("getFollowedStrokeIds reports followers without mutating them", () => {
      const stroke = buildStrokeWithSingleAnchor("block-shape-1")
      setupSymbols(mock, [stroke])
      jest
        .spyOn(mock.jiix, "getStrokesForElement")
        .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))

      expect(manager.getFollowedStrokeIds(["shape-stroke-1"])).toEqual([stroke.id])
      expect(manager.getFollowedStrokeIds(["shape-stroke-1", stroke.id])).toEqual([])
      expect(manager.getFollowedStrokeIds([])).toEqual([])
      expect(fromModel<typeof stroke>(stroke).pointers[0]).toEqual(expect.objectContaining({ x: 0, y: 0 }))
    })
  })

  describe("clearAnchoredEdgesFor", () => {
    test("detaches an anchored line edge that is itself transformed", () => {
      const line = buildLineWithStartAnchor()
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([line])

      expect(line.startAnchor).toBeUndefined()
      expect(line.endAnchor).toBeUndefined()
      expect(updateSpy).toHaveBeenCalledWith(line)
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(line)
    })

    test("detaches an anchored polyline edge that is itself transformed", () => {
      const poly = buildPolyLineWithEndAnchor()
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([poly])

      expect(poly.startAnchor).toBeUndefined()
      expect(poly.endAnchor).toBeUndefined()
      expect(updateSpy).toHaveBeenCalledWith(poly)
    })

    test("detaches an anchored arc edge that is itself transformed", () => {
      const arc = buildArcWithStartAnchor()
      arc.endAnchor = { symbolId: TARGET_ID, normalizedX: 1, normalizedY: 0.5 }
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([arc])

      expect(arc.startAnchor).toBeUndefined()
      expect(arc.endAnchor).toBeUndefined()
      expect(updateSpy).toHaveBeenCalledWith(arc)
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(arc)
    })

    test("leaves an edge without anchors untouched", () => {
      const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 10, y: 10 })
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.clearAnchoredEdgesFor([line])

      expect(updateSpy).not.toHaveBeenCalled()
      expect(mock.renderer.drawSymbol).not.toHaveBeenCalled()
    })
  })
})

describe("connectorConfiguration.followConnectedEdges = false — disables all follow behavior", () => {
  let mock: ReturnType<typeof createCanvasMock>
  let manager: IIConnectorManager

  /** Same reason as the suite above: read the document, not the pre-commit local reference. */
  const fromModel = <T>(symbol: { id: string }): T => mock.model.symbols.find((s) => s.id === symbol.id) as T

  beforeEach(() => {
    mock = createCanvasMock()
    manager = new IIConnectorManager(asCanvas(mock), { followConnectedEdges: false })
    jest
      .spyOn(mock.model, "getSymbol")
      .mockReturnValue({ id: TARGET_ID, type: SymbolType.Decorator, targetBounds: TARGET_BOUNDS, transform: MatrixTransform.identity() } as unknown as ReturnType<
        typeof mock.model.getSymbol
      >)
  })

  test("updateAnchoredEdges: a converted Line's anchored endpoint is left untouched", () => {
    const line = buildLineWithStartAnchor()
    setupSymbols(mock, [line])
    const startBefore = { ...line.start }

    const result = manager.updateAnchoredEdges([TARGET_ID], MatrixTransform.identity().translate(20, 20))

    expect(fromModel<typeof line>(line).start).toEqual(startBefore)
    expect(result).toEqual({ rigidStrokeIds: [], oldSymbols: [], newSymbols: [] })
  })

  test("drawAnchoredEdgesForMatrix: a converted Line's preview never draws", () => {
    const line = buildLineWithStartAnchor()
    setupSymbols(mock, [line])

    manager.drawAnchoredEdgesForMatrix([TARGET_ID], MatrixTransform.identity().translate(20, 20))

    expect(mock.renderer.drawSymbol).not.toHaveBeenCalled()
  })

  test("getFollowedStrokeIds / getRigidFollowedStrokeIds: a gradient-followed raw stroke is not reported", () => {
    const stroke = buildStrokeWithSingleAnchor("block-shape-1")
    setupSymbols(mock, [stroke])
    jest
      .spyOn(mock.jiix, "getStrokesForElement")
      .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))
    mockBlockCenter(mock, "shape-stroke-1", { x: 100, y: 0 })

    expect(manager.getFollowedStrokeIds(["shape-stroke-1"])).toEqual([])
    expect(manager.getRigidFollowedStrokeIds(["shape-stroke-1"])).toEqual([])
  })

  test("updateAnchoredEdges: a gradient-followed raw stroke is not mutated", () => {
    const stroke = buildStrokeWithSingleAnchor("block-shape-1")
    setupSymbols(mock, [stroke])
    jest
      .spyOn(mock.jiix, "getStrokesForElement")
      .mockImplementation((id: string) => (id === "block-shape-1" ? ["shape-stroke-1"] : []))
    mockBlockCenter(mock, "shape-stroke-1", { x: 100, y: 0 })
    const before = stroke.pointers.map((p) => ({ ...p }))

    const result = manager.updateAnchoredEdges(["shape-stroke-1"], MatrixTransform.identity().translate(5, 5))

    expect(fromModel<typeof stroke>(stroke).pointers).toEqual(before)
    expect(result).toEqual({ rigidStrokeIds: [], oldSymbols: [], newSymbols: [] })
  })
})
