import { beforeAll, describe, expect, jest, test } from "@jest/globals"

import { asCanvas, createCanvasMock } from "../../../__mocks__/createCanvasMock"
import { buildIIDecorator, buildIIStroke } from "../../../helpers"

import type { TBaseSymbol, TBox, TPartialDeep, TPoint, TTransformContext, TSymbol } from "@/iink"
import { BoxOps, DecoratorKind, DecoratorUtil, Geometry2d, IIResizeManager, IIRotationManager, IITranslateManager, MatrixTransform, Polygon2d, SymbolUtil, applyMatrixToPoint, registerBuiltinSymbolUtils, symbolRegistry } from "@/iink"

/**
 * `IIAbstractTransformManager` used to declare five `applyTo*` members so that a
 * `switch (symbol.type)` in `applyToSymbol` could reach them, with a throwing `default`. That
 * default is why a symbol type the library did not know could be created, stored, selected and
 * drawn — and then not moved, however well its util was registered.
 *
 * IIC-2014 replaced the five members and the switch with one `applyThroughUtil` hook per manager.
 * This file holds what that bought.
 */
type TStickyNote = TBaseSymbol & { type: "sticky-note"; point: TPoint; scale: number; degree: number }

class StickyNoteUtil extends SymbolUtil<TStickyNote> {
  readonly type = "sticky-note"

  create(partial: TPartialDeep<TStickyNote>): TStickyNote {
    return { ...partial, type: "sticky-note" } as TStickyNote
  }
  getGeometry(symbol: TStickyNote): Geometry2d {
    // A custom type says what shape it is and inherits every test from it, instead of hand-building
    // a record of bounds, vertices, edges and snap points.
    return new Polygon2d(BoxOps.getCorners({ x: symbol.point.x, y: symbol.point.y, width: 10, height: 10 }))
  }
  overlaps(_symbol: TStickyNote, _box: TBox): boolean {
    return false
  }
  translate(symbol: TStickyNote, { matrix }: TTransformContext): void {
    symbol.point = applyMatrixToPoint(symbol.point, matrix)
  }
  rotate(symbol: TStickyNote, { matrix }: TTransformContext): void {
    symbol.degree += MatrixTransform.rotation(matrix)
  }
  resize(symbol: TStickyNote, { matrix }: TTransformContext): void {
    symbol.scale *= matrix.xx
  }
  getSVGElement(): SVGGraphicsElement {
    return document.createElementNS("http://www.w3.org/2000/svg", "g")
  }
}

const buildSticky = (): TStickyNote =>
  ({ id: "note-1", type: "sticky-note", point: { x: 1, y: 2 }, scale: 1, degree: 0 }) as TStickyNote

describe("IIAbstractTransformManager", () => {
  beforeAll(() => {
    registerBuiltinSymbolUtils()
    symbolRegistry.register(new StickyNoteUtil())
  })

  describe("a symbol type the library does not know", () => {
    test("should translate", () => {
      const sticky = buildSticky()
      const canvas = createCanvasMock()
      new IITranslateManager(asCanvas(canvas)).applyToSymbol(
        sticky as unknown as TSymbol,
        MatrixTransform.identity().translate(10, 15)
      )
      expect(sticky.point).toEqual({ x: 11, y: 17 })
    })

    test("should rotate", () => {
      const sticky = buildSticky()
      const canvas = createCanvasMock()
      const manager = new IIRotationManager(asCanvas(canvas))
      manager.center = { x: 0, y: 0 }
      manager.applyToSymbol(sticky as unknown as TSymbol, MatrixTransform.identity().rotate(Math.PI / 2, manager.center))
      expect(sticky.degree).toBeCloseTo(Math.PI / 2, 10)
    })

    test("should resize", () => {
      const sticky = buildSticky()
      const canvas = createCanvasMock()
      const manager = new IIResizeManager(asCanvas(canvas))
      manager.transformOrigin = { x: 0, y: 0 }
      manager.applyToSymbol(
        sticky as unknown as TSymbol,
        MatrixTransform.identity().scale(3, 3, manager.transformOrigin)
      )
      expect(sticky.scale).toBe(3)
    })
  })

  describe("a symbol type no util owns", () => {
    test.each([
      ["translate", (c: ReturnType<typeof createCanvasMock>) => new IITranslateManager(asCanvas(c))],
      ["rotate", (c: ReturnType<typeof createCanvasMock>) => new IIRotationManager(asCanvas(c))],
      ["resize", (c: ReturnType<typeof createCanvasMock>) => new IIResizeManager(asCanvas(c))],
    ])("should be refused by %s, from the registry", (_name, build) => {
      // The refusal did not disappear with the throwing default; it moved to `getUtilFor`, which
      // also reports what is registered — the difference between a typo and a registry never
      // populated.
      const orphan = { id: "x", type: "no-such-type" } as unknown as TSymbol
      expect(() => build(createCanvasMock()).applyToSymbol(orphan, MatrixTransform.identity())).toThrow(
        'No util is registered for type "no-such-type"'
      )
    })
  })

  describe("a decorator", () => {
    test("should pass through untouched, from its util rather than an early return", () => {
      // `applyToSymbol` used to return early for decorators. `DecoratorUtil` implements all three
      // operations as deliberate no-ops — a standalone decorator's bounds are recomputed from the
      // symbols it decorates, so moving it too would double the displacement — and IIC-2014 made
      // that the live path.
      const decorator = buildIIDecorator(DecoratorKind.Underline)
      const before = JSON.stringify(decorator)
      const canvas = createCanvasMock()
      // Spied rather than only observed: "untouched" is what an early return produced too, so the
      // assertion has to be that the util was asked, not merely that nothing moved.
      const asked = jest.spyOn(DecoratorUtil.prototype, "translate")
      try {
        new IITranslateManager(asCanvas(canvas)).applyToSymbol(decorator, MatrixTransform.identity().translate(10, 15))
        expect(asked).toHaveBeenCalledTimes(1)
      } finally {
        asked.mockRestore()
      }
      expect(JSON.stringify(decorator)).toBe(before)
    })
  })

  /**
   * Task 12: committing a transform rewrites one attribute instead of rebuilding the element
   * (`SVGRenderer.setSymbolTransform`). `SymbolGeometry` only caches geometry for a frozen
   * symbol - `SymbolStore` freezes on commit, `draftSymbol()` returns an unfrozen clone - so the
   * renderer must be handed the record `commitSymbol` just froze, not the draft that produced it.
   */
  describe("applyAndDraw", () => {
    test("commits before drawing, so the renderer is handed an already-frozen record", () => {
      const canvas = createCanvasMock()
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)

      // `SymbolStore.update` freezes its argument in place, so by the time `applyMatrix` returns,
      // every symbol it touched is frozen regardless of call order - asserting `isFrozen` only
      // after the fact would pass even if the renderer were called first. What actually
      // distinguishes "commit, then draw" from "draw, then commit" is whether the symbol was
      // frozen yet *at the moment the renderer received it* - captured here synchronously, inside
      // the mock, before anything later in the call can freeze it out from under the assertion.
      const frozenAtCallTime: boolean[] = []
      canvas.renderer.setSymbolTransform = jest.fn((s: TSymbol) => {
        frozenAtCallTime.push(Object.isFrozen(s))
      })

      const manager = new IITranslateManager(asCanvas(canvas))
      manager.applyMatrix([stroke], MatrixTransform.identity().translate(10, 15))

      expect(canvas.renderer.drawSymbol).not.toHaveBeenCalled()
      expect(canvas.renderer.setSymbolTransform).toHaveBeenCalledTimes(1)
      expect(frozenAtCallTime).toEqual([true])

      const passed = (canvas.renderer.setSymbolTransform as jest.Mock).mock.calls[0][0] as TSymbol
      expect(passed).toBe(canvas.model.getSymbol(stroke.id))
    })
  })
})
