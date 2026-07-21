import { describe, test, expect, jest, beforeEach } from "@jest/globals"
import { createCanvasMock, asEditor } from "../../__mocks__/createCanvasMock"
import {
  IIConnectorManager,
  EdgeLineOps,
  EdgePolyLineOps,
  EdgeArcOps,
  StrokeOps,
  ShapeCircleOps,
  ShapePolygonOps,
  OBBOps,
  type TOBB,
  MatrixTransform,
} from "@/iink"

const TARGET_BOUNDS = OBBOps.fromBox({ x: 10, y: 20, width: 100, height: 80 })
const TARGET_ID = "target-symbol"

function buildLineWithStartAnchor() {
  const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 100, y: 100 })
  line.startAnchor = { symbolId: TARGET_ID, normalizedX: 0.5, normalizedY: 0.5 }
  return line
}

function buildLineWithEndAnchor() {
  const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 100, y: 100 })
  line.endAnchor = { symbolId: TARGET_ID, normalizedX: 1, normalizedY: 1 }
  return line
}

function buildLineWithBothAnchors() {
  const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 100, y: 100 })
  line.startAnchor = { symbolId: TARGET_ID, normalizedX: 0, normalizedY: 0 }
  line.endAnchor = { symbolId: TARGET_ID, normalizedX: 1, normalizedY: 1 }
  return line
}

function buildPolyLineWithStartAnchor() {
  const poly = EdgePolyLineOps.create([
    { x: 0, y: 0 },
    { x: 50, y: 50 },
    { x: 100, y: 100 },
  ])
  poly.startAnchor = { symbolId: TARGET_ID, normalizedX: 0.25, normalizedY: 0.25 }
  return poly
}

function buildPolyLineWithEndAnchor() {
  const poly = EdgePolyLineOps.create([
    { x: 0, y: 0 },
    { x: 50, y: 50 },
    { x: 100, y: 100 },
  ])
  poly.endAnchor = { symbolId: TARGET_ID, normalizedX: 0.75, normalizedY: 0.75 }
  return poly
}

function setupSymbols(mock: ReturnType<typeof createCanvasMock>, symbols: unknown[]) {
  Object.defineProperty(mock.model, "symbols", {
    get: () => [...symbols],
    configurable: true,
  })
}

describe("IIConnectorManager", () => {
  let mock: ReturnType<typeof createCanvasMock>
  let manager: IIConnectorManager

  beforeEach(() => {
    mock = createCanvasMock()
    manager = new IIConnectorManager(asEditor(mock))
    jest
      .spyOn(mock.model, "getRootSymbol")
      .mockReturnValue({ id: TARGET_ID, bounds: TARGET_BOUNDS } as unknown as ReturnType<
        typeof mock.model.getRootSymbol
      >)
  })

  test("should instantiate", () => {
    expect(manager).toBeDefined()
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
      expect(line.start).toEqual({ x: 60, y: 60 })
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(line)
      expect(updateSpy).toHaveBeenCalledWith(line)
    })

    test("line with endAnchor for moved symbol → end recomputed", () => {
      const line = buildLineWithEndAnchor()
      setupSymbols(mock, [line])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      // bounds.x + 1 * bounds.width = 10 + 100 = 110
      // bounds.y + 1 * bounds.height = 20 + 80 = 100
      expect(line.end).toEqual({ x: 110, y: 100 })
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(line)
      expect(updateSpy).toHaveBeenCalledWith(line)
    })

    test("line with both anchors → both recomputed, updateSymbol called once", () => {
      const line = buildLineWithBothAnchors()
      setupSymbols(mock, [line])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      // start: normalizedX=0, normalizedY=0 → (10, 20)
      expect(line.start).toEqual({ x: 10, y: 20 })
      // end: normalizedX=1, normalizedY=1 → (110, 100)
      expect(line.end).toEqual({ x: 110, y: 100 })
      expect(updateSpy).toHaveBeenCalledTimes(1)
    })

    test("edge anchored to symbol NOT in movedIds → not updated", () => {
      const line = buildLineWithStartAnchor()
      const originalStart = { ...line.start }
      setupSymbols(mock, [line])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges(["other-id"])

      expect(line.start).toEqual(originalStart)
      expect(updateSpy).not.toHaveBeenCalled()
    })

    test("line edge with no anchors → not updated", () => {
      const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 100, y: 100 })
      const originalStart = { ...line.start }
      const originalEnd = { ...line.end }
      setupSymbols(mock, [line])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      expect(line.start).toEqual(originalStart)
      expect(line.end).toEqual(originalEnd)
      expect(updateSpy).not.toHaveBeenCalled()
    })

    test("target not found (getRootSymbol returns undefined) → not updated", () => {
      jest.spyOn(mock.model, "getRootSymbol").mockReturnValue(undefined)
      const line = buildLineWithStartAnchor()
      const originalStart = { ...line.start }
      setupSymbols(mock, [line])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      expect(line.start).toEqual(originalStart)
      expect(updateSpy).not.toHaveBeenCalled()
    })

    test("polyline with startAnchor → points[0] updated", () => {
      const poly = buildPolyLineWithStartAnchor()
      setupSymbols(mock, [poly])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      // bounds.x + 0.25 * bounds.width = 10 + 25 = 35
      // bounds.y + 0.25 * bounds.height = 20 + 20 = 40
      expect(poly.points[0]).toEqual({ x: 35, y: 40 })
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(poly)
      expect(updateSpy).toHaveBeenCalledWith(poly)
    })

    test("polyline with endAnchor → points[last] updated", () => {
      const poly = buildPolyLineWithEndAnchor()
      setupSymbols(mock, [poly])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      // bounds.x + 0.75 * bounds.width = 10 + 75 = 85
      // bounds.y + 0.75 * bounds.height = 20 + 60 = 80
      expect(poly.points[poly.points.length - 1]).toEqual({ x: 85, y: 80 })
      expect(mock.renderer.drawSymbol).toHaveBeenCalledWith(poly)
      expect(updateSpy).toHaveBeenCalledWith(poly)
    })

    describe("with matrix and preTransformBoundsById (rotation case)", () => {
      const POST_BOUNDS = OBBOps.fromBox({ x: 50, y: 50, width: 200, height: 200 })

      beforeEach(() => {
        jest
          .spyOn(mock.model, "getRootSymbol")
          .mockReturnValue({ id: TARGET_ID, bounds: POST_BOUNDS } as unknown as ReturnType<
            typeof mock.model.getRootSymbol
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
        expect(line.start).toEqual({ x: 70, y: 65 })
      })

      test("normalizedXY updated to reflect position in post-transform bounds", () => {
        const line = buildLineWithStartAnchor() // normalizedX:0.5, normalizedY:0.5
        setupSymbols(mock, [line])
        const matrix = MatrixTransform.identity().translate(10, 5)
        const preBoundsById = new Map([[TARGET_ID, TARGET_BOUNDS]])

        manager.updateAnchoredEdges([TARGET_ID], matrix, preBoundsById)

        // world point (70, 65) in POST_BOUNDS {x:50,y:50,w:200,h:200}:
        // normalizedX = (70-50)/200 = 0.1, normalizedY = (65-50)/200 = 0.075
        expect(line.startAnchor!.normalizedX).toBeCloseTo(0.1)
        expect(line.startAnchor!.normalizedY).toBeCloseTo(0.075)
      })

      test("without matrix → falls back to current bounds (backward compat)", () => {
        const line = buildLineWithStartAnchor() // normalizedX:0.5, normalizedY:0.5
        setupSymbols(mock, [line])

        manager.updateAnchoredEdges([TARGET_ID])

        // Uses POST_BOUNDS (no matrix): x=50+0.5*200=150, y=50+0.5*200=150
        expect(line.start).toEqual({ x: 150, y: 150 })
      })

      test("matrix present but no preBounds entry → falls back to current bounds", () => {
        const line = buildLineWithStartAnchor()
        setupSymbols(mock, [line])
        const matrix = MatrixTransform.identity().translate(10, 5)
        const emptyMap = new Map<string, TOBB>()

        manager.updateAnchoredEdges([TARGET_ID], matrix, emptyMap)

        // Falls back to POST_BOUNDS: x=50+0.5*200=150, y=50+0.5*200=150
        expect(line.start).toEqual({ x: 150, y: 150 })
      })
    })

    test("non-edge symbols (stroke) → ignored", () => {
      const stroke = StrokeOps.create()
      setupSymbols(mock, [stroke])
      const updateSpy = jest.spyOn(mock.model, "updateSymbol")

      manager.updateAnchoredEdges([TARGET_ID])

      expect(updateSpy).not.toHaveBeenCalled()
      expect(mock.renderer.drawSymbol).not.toHaveBeenCalled()
    })
  })

  describe("findSymbolAtPoint", () => {
    const CIRCLE_CENTER = { x: 50, y: 50 }
    const CIRCLE_RADIUS = 30

    test("returns symbol whose bounds contain point", () => {
      const circle = ShapeCircleOps.create(CIRCLE_CENTER, CIRCLE_RADIUS)
      setupSymbols(mock, [circle])

      const result = manager.findSymbolAtPoint({ x: 55, y: 55 }, "other-id")

      expect(result).toBe(circle)
    })

    test("returns undefined when point outside all symbol bounds", () => {
      const circle = ShapeCircleOps.create(CIRCLE_CENTER, CIRCLE_RADIUS)
      setupSymbols(mock, [circle])

      const result = manager.findSymbolAtPoint({ x: 200, y: 200 }, "other-id")

      expect(result).toBeUndefined()
    })

    test("excludes symbol with matching excludeId", () => {
      const circle = ShapeCircleOps.create(CIRCLE_CENTER, CIRCLE_RADIUS)
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
      const diamond = ShapePolygonOps.create([
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
      const diamond = ShapePolygonOps.create([
        { x: 50, y: 0 },
        { x: 100, y: 50 },
        { x: 50, y: 100 },
        { x: 0, y: 50 },
      ])
      setupSymbols(mock, [diamond])

      // (50,50) is the center — clearly inside the diamond
      const result = manager.findSymbolAtPoint({ x: 50, y: 50 }, "other-id")

      expect(result).toBe(diamond)
    })

    test("excludes edges from anchor targets", () => {
      const line = EdgeLineOps.create({ x: 20, y: 20 }, { x: 80, y: 80 })
      setupSymbols(mock, [line])

      const result = manager.findSymbolAtPoint({ x: 50, y: 50 }, "other-id")

      expect(result).toBeUndefined()
    })
  })

  describe("applyEndpointAnchor", () => {
    test("sets startAnchor at center when pointIndex=0 and point hits shape", () => {
      const square = ShapePolygonOps.create([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ])
      setupSymbols(mock, [square])
      const line = EdgeLineOps.create({ x: 55, y: 55 }, { x: 200, y: 200 })

      manager.applyEndpointAnchor(line, 0, { x: 55, y: 55 })

      expect(line.startAnchor?.symbolId).toBe(square.id)
      expect(line.startAnchor?.normalizedX).toBe(0.5)
      expect(line.startAnchor?.normalizedY).toBe(0.5)
      // Edge start snapped to center (50, 50)
      expect(line.start).toEqual({ x: 50, y: 50 })
      expect(line.endAnchor).toBeUndefined()
    })

    test("sets endAnchor at center when pointIndex=last and point hits shape", () => {
      const square = ShapePolygonOps.create([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ])
      setupSymbols(mock, [square])
      const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 55, y: 55 })
      EdgeLineOps.updateDerivedFields(line)

      manager.applyEndpointAnchor(line, line.vertices.length - 1, { x: 55, y: 55 })

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
      const square = ShapePolygonOps.create([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ])
      setupSymbols(mock, [square])
      // getRootSymbol must return the real shape so isShape + vertices work
      jest
        .spyOn(mock.model, "getRootSymbol")
        .mockReturnValue(square as unknown as ReturnType<typeof mock.model.getRootSymbol>)
      const line = EdgeLineOps.create({ x: 200, y: 50 }, { x: 55, y: 55 })
      EdgeLineOps.updateDerivedFields(line)

      manager.applyEndpointAnchor(line, line.vertices.length - 1, { x: 55, y: 55 })

      expect(line.endAnchor?.entryPoint).toBeDefined()
      expect(line.endAnchor?.entryPoint?.x).toBeCloseTo(100)
      expect(line.endAnchor?.entryPoint?.y).toBeCloseTo(50)
    })

    test("clears startAnchor when point hits no symbol", () => {
      setupSymbols(mock, [])
      const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 100, y: 100 })
      line.startAnchor = { symbolId: "old", normalizedX: 0.5, normalizedY: 0.5 }

      manager.applyEndpointAnchor(line, 0, { x: 0, y: 0 })

      expect(line.startAnchor).toBeUndefined()
    })

    test("ignores mid-vertex pointIndex (not start or end)", () => {
      const circle = ShapeCircleOps.create({ x: 50, y: 50 }, 30)
      setupSymbols(mock, [circle])
      const poly = EdgePolyLineOps.create([
        { x: 0, y: 0 },
        { x: 55, y: 55 },
        { x: 100, y: 100 },
      ])

      manager.applyEndpointAnchor(poly, 1, { x: 55, y: 55 })

      expect(poly.startAnchor).toBeUndefined()
      expect(poly.endAnchor).toBeUndefined()
    })

    test("ignores Arc edges", () => {
      const circle = ShapeCircleOps.create({ x: 50, y: 50 }, 30)
      setupSymbols(mock, [circle])
      const arc = EdgeArcOps.create({ x: 50, y: 50 }, 0, Math.PI, 20, 20, 0)

      manager.applyEndpointAnchor(arc, 0, { x: 55, y: 55 })

      expect((arc as { startAnchor?: unknown }).startAnchor).toBeUndefined()
    })
  })

  describe("showAnchorHint", () => {
    test("draws rect and returns target when point inside symbol", () => {
      const circle = ShapeCircleOps.create({ x: 50, y: 50 }, 30)
      setupSymbols(mock, [circle])

      const result = manager.showAnchorHint({ x: 55, y: 55 }, "other-id")

      expect(result).toBe(circle)
      expect(mock.renderer.drawRect).toHaveBeenCalledTimes(1)
    })

    test("returns undefined and skips drawRect when no symbol at point", () => {
      setupSymbols(mock, [])

      const result = manager.showAnchorHint({ x: 55, y: 55 }, "other-id")

      expect(result).toBeUndefined()
      expect(mock.renderer.drawRect).not.toHaveBeenCalled()
    })

    test("clears previous hint before drawing new one", () => {
      const circle = ShapeCircleOps.create({ x: 50, y: 50 }, 30)
      setupSymbols(mock, [circle])

      manager.showAnchorHint({ x: 55, y: 55 }, "other-id")
      manager.showAnchorHint({ x: 55, y: 55 }, "other-id")

      expect(mock.renderer.clearElements).toHaveBeenCalledTimes(2)
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

      expect(line.start).toEqual(originalStart)
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
  })
})
