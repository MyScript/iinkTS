import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke, buildIIText } from "../../../helpers"
import { DecoratorKind, DecoratorUtil, GestureHelpers, InsertAction, InsertGestureHandler, MatrixTransform, OBBOps, StrokeUtil, SymbolGeometry, type TGesture, type TStroke } from "@/iink"

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
      StrokeUtil.addPointer(strokeOrigin, { x: 0, y: 0, p: 1, dt: 100 })
      StrokeUtil.addPointer(strokeOrigin, { x: 5, y: 5, p: 0.8, dt: 200 })

      const subStrokes = [
        { x: [0, 1], y: [0, 1] },
        { x: [5, 6], y: [5, 6] },
      ]

      const strokes = handler.createStrokesFromGestureSubStroke(strokeOrigin, subStrokes)

      expect(strokes.length).toBe(2)
      expect(strokes[0].pointers.length).toBe(2)
      expect(strokes[1].pointers.length).toBe(2)
    })

    test("should give the sub-strokes the origin of the stroke they were cut from", () => {
      // Their pointers keep the dt they were captured with, counted from the original stroke's
      // origin. A fresh creationTime here would make `toWireStroke` place every one of those
      // points at the instant of the split instead of when they were actually written.
      const strokeOrigin = buildIIStroke({ nbPoint: 0 })
      strokeOrigin.creationTime = 1700000000000
      StrokeUtil.addPointer(strokeOrigin, { x: 0, y: 0, p: 1, dt: 100 })
      StrokeUtil.addPointer(strokeOrigin, { x: 50, y: 50, p: 0.8, dt: 200 })

      const strokes = handler.createStrokesFromGestureSubStroke(strokeOrigin, [
        { x: [0, 1], y: [0, 1] },
        { x: [50, 51], y: [50, 51] },
      ])

      expect(strokes.map((s) => s.creationTime)).toEqual([1700000000000, 1700000000000])
      expect(strokes.map((s) => s.pointerType)).toEqual([strokeOrigin.pointerType, strokeOrigin.pointerType])
      expect(strokes[0].pointers[0].dt).toEqual(100)
    })

    test("should handle single substroke", () => {
      const strokeOrigin = buildIIStroke()
      StrokeUtil.addPointer(strokeOrigin, { x: 0, y: 0, p: 1, dt: 100 })

      const subStrokes = [{ x: [0, 1], y: [0, 1] }]

      const strokes = handler.createStrokesFromGestureSubStroke(strokeOrigin, subStrokes)

      expect(strokes.length).toBe(1)
    })
  })

  describe("computeSplitStroke", () => {
    test("should split stroke into before and after parts", () => {
      const strokeOrigin = buildIIStroke()
      StrokeUtil.addPointer(strokeOrigin, { x: 0, y: 0, p: 1, dt: 100 })
      StrokeUtil.addPointer(strokeOrigin, { x: 5, y: 5, p: 0.8, dt: 200 })
      StrokeUtil.addPointer(strokeOrigin, { x: 10, y: 10, p: 0.9, dt: 300 })

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
      StrokeUtil.addPointer(strokeOrigin, { x: 0, y: 0, p: 1, dt: 100 })
      StrokeUtil.addPointer(strokeOrigin, { x: 5, y: 5, p: 0.8, dt: 200 })

      const subStrokes = [
        { x: [0, 1], y: [0, 1] },
        { x: [5, 6], y: [5, 6] },
      ]

      const result = handler.computeSplitStroke(strokeOrigin, subStrokes)

      expect(result.after).toBeDefined()
      if (result.after) {
        // After stroke should be translated
        expect(OBBOps.toBox(SymbolGeometry.boundsOf(result.after)).x).not.toBe(5)
      }
    })
  })

  describe("computeChangesOnSplitStroke", () => {
    test("should return changes with replaced symbols", () => {
      const gestureStroke = buildIIStroke()
      StrokeUtil.addPointer(gestureStroke, { x: 5, y: 5, p: 1, dt: 100 })

      const strokeToSplit = buildIIStroke()
      StrokeUtil.addPointer(strokeToSplit, { x: 0, y: 0, p: 1, dt: 100 })
      StrokeUtil.addPointer(strokeToSplit, { x: 10, y: 10, p: 1, dt: 200 })

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

  describe("computeChangesOnSplitText", () => {
    test("should keep the underline/strikethrough decorators on both parts of a split word", () => {
      const textToSplit = buildIIText({
        chars: [
          {
            id: "char-1",
            label: "Hel",
            fontSize: 16,
            fontWeight: "normal",
            color: "#000000",
            bounds: { x: 0, y: 10, width: 15, height: 16 },
          },
          {
            id: "char-2",
            label: "lo",
            fontSize: 16,
            fontWeight: "normal",
            color: "#000000",
            bounds: { x: 15, y: 10, width: 15, height: 16 },
          },
        ],
        boundingBox: { x: 0, y: 10, width: 30, height: 16 },
      })
      textToSplit.decorators.push(DecoratorUtil.createDecorator(DecoratorKind.Underline, textToSplit.style))

      canvas.model.addSymbol(textToSplit)

      const gestureStroke = buildIIStroke()
      StrokeUtil.addPointer(gestureStroke, { x: 15, y: 10, p: 1, dt: 100 })
      StrokeUtil.addPointer(gestureStroke, { x: 15, y: 26, p: 1, dt: 200 })

      const changes = handler.computeChangesOnSplitText(gestureStroke, textToSplit, InsertAction.LineBreak)

      expect(changes.replaced?.newSymbols.length).toBe(2)
      changes.replaced?.newSymbols.forEach((newText) => {
        expect((newText as typeof textToSplit).decorators.map((d) => d.kind)).toContain(DecoratorKind.Underline)
      })
    })
  })

  describe("apply", () => {
    test("does not translate a stroke from another row even when the server reports it in strokeAfterIds", async () => {
      canvas.configuration.rendering.guides.gap = 10
      ;(canvas.gesture as unknown as Record<string, unknown>).insertAction = InsertAction.LineBreak
      const translateSpy = jest.fn()
      ;(canvas.gesture as unknown as Record<string, unknown>).translator = { translate: translateSpy }

      // Gesture sits in row 3 (center.y = 25 -> round(25/10) = 3)
      const gestureStroke = buildIIStroke({ box: { height: 10, width: 0, x: 50, y: 20 } })

      // Legitimately in the same row, to the right of the gesture -> should be translated
      const afterStroke = buildIIStroke({ box: { height: 10, width: 5, x: 100, y: 20 } })
      canvas.model.addSymbol(afterStroke)

      // Geometrically in row 0, NOT the gesture's row, but (bogusly) reported by the server
      // in strokeAfterIds -> must NOT be translated
      const strayStroke = buildIIStroke({ box: { height: 5, width: 5, x: 100, y: 0 } })
      canvas.model.addSymbol(strayStroke)

      const gesture: TGesture = {
        gestureType: "INSERT",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [strayStroke.id],
      }

      await handler.apply(gestureStroke, gesture)

      const translatedSymbols = translateSpy.mock.calls.flatMap((call) => call[0] as TStroke[])
      expect(translatedSymbols).toContainEqual(afterStroke)
      expect(translatedSymbols).not.toContain(strayStroke)
    })
  })

  describe("apply — split and line break", () => {
    let rowHeight: number
    let translate: jest.Mock
    const insert = (extra: Partial<TGesture> = {}): TGesture => ({
      gestureType: "INSERT",
      gestureStrokeId: "gesture",
      strokeIds: [],
      strokeBeforeIds: [],
      strokeAfterIds: [],
      ...extra,
    })

    beforeEach(() => {
      rowHeight = canvas.configuration.rendering.guides.gap
      translate = jest.fn(() => Promise.resolve())
      ;(canvas.gesture as unknown as Record<string, unknown>).translator = { translate }
      ;(canvas.gesture as unknown as Record<string, unknown>).insertAction = InsertAction.LineBreak
    })

    test("should replace a cut stroke by its two halves", async () => {
      const stroke = buildIIStroke({ box: { x: 0, y: 0.2 * rowHeight, width: 100, height: 0 }, nbPoint: 10 })
      canvas.model.addSymbol(stroke)
      const [left, right] = [stroke.pointers.slice(0, 5), stroke.pointers.slice(5)]
      const gestureStroke = buildIIStroke({ box: { x: 50, y: 0.1 * rowHeight, width: 0, height: 9 } })

      await handler.apply(
        gestureStroke,
        insert({
          strokeIds: [stroke.id],
          subStrokes: [
            { fullStrokeId: stroke.id, x: left.map((p) => p.x), y: left.map((p) => p.y) },
            { fullStrokeId: stroke.id, x: right.map((p) => p.x), y: right.map((p) => p.y) },
          ],
        })
      )

      expect(translate).not.toHaveBeenCalled()
      expect(canvas.replaceSymbols).toHaveBeenNthCalledWith(
        1,
        [stroke],
        [expect.objectContaining({ type: "stroke" }), expect.objectContaining({ type: "stroke" })],
        false
      )
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
    })

    test("should push a row's strokes down one row on a line break before them", async () => {
      const stroke = buildIIStroke({ box: { x: 50, y: 0.6 * rowHeight, width: 10, height: 9 } })
      canvas.model.addSymbol(stroke)
      const gestureStroke = buildIIStroke({ box: { x: 30, y: 0.6 * rowHeight, width: 5, height: 9 } })

      await handler.apply(gestureStroke, insert())

      expect(translate).toHaveBeenNthCalledWith(1, [stroke], 0, rowHeight, false)
      expect(canvas.replaceSymbols).not.toHaveBeenCalled()
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
    })
  })
})
