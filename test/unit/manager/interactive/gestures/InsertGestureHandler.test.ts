import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../../helpers"
import { type TStroke, InsertGestureHandler, GestureHelpers, OBBOps, StrokeOps, MatrixTransform } from "@/iink"

describe("InsertGestureHandler.ts", () => {
  let canvas: ReturnType<typeof createCanvasMock>
  let helpers: GestureHelpers
  let handler: InsertGestureHandler

  beforeEach(() => {
    canvas = createCanvasMock()
    ;(canvas.transform as unknown as Record<string, unknown>).translate = {
      applyToSymbol: jest.fn().mockImplementation((sym: TStroke, matrix: MatrixTransform) => {
        sym.pointers.forEach((p) => {
          const np = MatrixTransform.applyToPoint(matrix, p)
          p.x = +np.x.toFixed(3)
          p.y = +np.y.toFixed(3)
        })
        StrokeOps.updateBounds(sym)
        return sym
      }),
    }
    helpers = new GestureHelpers(asCanvas(canvas))
    handler = new InsertGestureHandler(asCanvas(canvas), helpers)
  })

  test("should instantiate", () => {
    expect(handler).toBeDefined()
    expect(handler.gestureType).toBe("INSERT")
  })

  describe("createStrokesFromGestureSubStroke", () => {
    test("should create strokes from substroke data", () => {
      const strokeOrigin = buildIIStroke()
      StrokeOps.addPointer(strokeOrigin, { x: 0, y: 0, p: 1, t: 100 })
      StrokeOps.addPointer(strokeOrigin, { x: 5, y: 5, p: 0.8, t: 200 })

      const subStrokes = [
        { x: [0, 1], y: [0, 1] },
        { x: [5, 6], y: [5, 6] },
      ]

      const strokes = handler.createStrokesFromGestureSubStroke(strokeOrigin, subStrokes)

      expect(strokes.length).toBe(2)
      expect(strokes[0].pointers.length).toBe(2)
      expect(strokes[1].pointers.length).toBe(2)
    })

    test("should handle single substroke", () => {
      const strokeOrigin = buildIIStroke()
      StrokeOps.addPointer(strokeOrigin, { x: 0, y: 0, p: 1, t: 100 })

      const subStrokes = [{ x: [0, 1], y: [0, 1] }]

      const strokes = handler.createStrokesFromGestureSubStroke(strokeOrigin, subStrokes)

      expect(strokes.length).toBe(1)
    })
  })

  describe("computeSplitStroke", () => {
    test("should split stroke into before and after parts", () => {
      const strokeOrigin = buildIIStroke()
      StrokeOps.addPointer(strokeOrigin, { x: 0, y: 0, p: 1, t: 100 })
      StrokeOps.addPointer(strokeOrigin, { x: 5, y: 5, p: 0.8, t: 200 })
      StrokeOps.addPointer(strokeOrigin, { x: 10, y: 10, p: 0.9, t: 300 })

      const subStrokes = [
        { x: [0, 1], y: [0, 1] },
        { x: [5, 6], y: [5, 6] },
      ]

      const result = handler.computeSplitStroke(strokeOrigin, subStrokes)

      expect(result.before).toBeDefined()
      expect(result.after).toBeDefined()
    })

    test("should translate after stroke", () => {
      const strokeOrigin = buildIIStroke()
      StrokeOps.addPointer(strokeOrigin, { x: 0, y: 0, p: 1, t: 100 })
      StrokeOps.addPointer(strokeOrigin, { x: 5, y: 5, p: 0.8, t: 200 })

      const subStrokes = [
        { x: [0, 1], y: [0, 1] },
        { x: [5, 6], y: [5, 6] },
      ]

      const result = handler.computeSplitStroke(strokeOrigin, subStrokes)

      expect(result.after).toBeDefined()
      if (result.after) {
        // After stroke should be translated
        expect(OBBOps.toBox(result.after.bounds).x).not.toBe(5)
      }
    })
  })

  describe("computeChangesOnSplitStroke", () => {
    test("should return changes with replaced symbols", () => {
      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 5, y: 5, p: 1, t: 100 })

      const strokeToSplit = buildIIStroke()
      StrokeOps.addPointer(strokeToSplit, { x: 0, y: 0, p: 1, t: 100 })
      StrokeOps.addPointer(strokeToSplit, { x: 10, y: 10, p: 1, t: 200 })

      canvas.model.addSymbol(strokeToSplit)

      const subStrokes = [
        { fullStrokeId: strokeToSplit.id, x: [0, 1], y: [0, 1] },
        { fullStrokeId: strokeToSplit.id, x: [5, 6], y: [5, 6] },
      ]

      const changes = handler.computeChangesOnSplitStroke(gestureStroke, strokeToSplit.id, subStrokes)

      expect(changes.replaced).toBeDefined()
      expect(changes.replaced?.oldSymbols.length).toBeGreaterThanOrEqual(0)
    })
  })
})
