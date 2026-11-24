import type { TBaseSymbol, TBox, TPartialDeep, TPoint, TTransformContext } from "@/iink"
import { BoxOps, Geometry2d, Polygon2d, StrokeUtil, TextUtil, applyMatrixToPoint, registerBuiltinSymbolUtils, symbolRegistry, SymbolType, SymbolUtil } from "@/iink"

beforeAll(() => {
  registerBuiltinSymbolUtils()
})

/** A type the library knows nothing about, to stand in for an integrator's own symbol. */
type TStickyNote = TBaseSymbol & { type: "sticky-note"; text: string; point: TPoint }

class StickyNoteUtil extends SymbolUtil<TStickyNote> {
  readonly type = "sticky-note"
  create(partial: TPartialDeep<TStickyNote>): TStickyNote {
    return { ...partial, type: "sticky-note", text: partial.text ?? "" } as TStickyNote
  }
  getGeometry(symbol: TStickyNote): Geometry2d {
    // A custom type says what shape it is and inherits every test from it, instead of hand-building
    // a record of bounds, vertices, edges and snap points.
    return new Polygon2d(BoxOps.getCorners({ x: symbol.point.x, y: symbol.point.y, width: 10, height: 10 }))
  }
  translate(symbol: TStickyNote, { matrix }: TTransformContext): void {
    symbol.point = applyMatrixToPoint(symbol.point, matrix)
  }
  rotate(symbol: TStickyNote, { matrix }: TTransformContext): void {
    symbol.point = applyMatrixToPoint(symbol.point, matrix)
  }
  resize(symbol: TStickyNote, { matrix }: TTransformContext): void {
    symbol.point = applyMatrixToPoint(symbol.point, matrix)
  }
  overlaps(_symbol: TStickyNote, _box: TBox): boolean {
    return false
  }
  getSVGElement(symbol: TStickyNote): SVGGraphicsElement {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
    group.setAttribute("id", symbol.id)
    group.setAttribute("type", symbol.type)
    return group
  }
}

describe("symbolRegistry", () => {
  describe("getUtilFor", () => {
    /**
     * Added by IIC-2004. The transform managers used to call a family dispatcher that re-resolved
     * the kind; they now ask the symbol's own util. That path cannot carry on without a util —
     * skipping a derive leaves stale bounds behind a symbol that still looks right — so unlike
     * `getUtil` this one throws.
     */
    it("should return the util that owns the symbol's type", () => {
      const util = symbolRegistry.getUtilFor({ type: SymbolType.Shape } as TBaseSymbol)
      expect(util.type).toBe(SymbolType.Shape)
    })

    it("should serve a type the integrator registered, not only the built-ins", () => {
      symbolRegistry.register(new StickyNoteUtil())
      expect(symbolRegistry.getUtilFor({ type: "sticky-note" } as TBaseSymbol)).toBeInstanceOf(StickyNoteUtil)
    })

    it("should throw naming the type it could not resolve", () => {
      expect(() => symbolRegistry.getUtilFor({ type: "no-such-type" } as TBaseSymbol)).toThrow(
        'No util is registered for type "no-such-type"'
      )
    })

    it("should list what is registered, so a missing registration is distinguishable from a typo", () => {
      // The two failure modes read identically otherwise, and "registerBuiltinSymbolUtils never
      // ran" is the one that bites: it makes every transform throw at once.
      let message = ""
      try {
        symbolRegistry.getUtilFor({ type: "no-such-type" } as TBaseSymbol)
      } catch (error) {
        message = (error as Error).message
      }
      symbolRegistry.registeredTypes().forEach((type) => expect(message).toContain(type))
    })

    it("should say so plainly when nothing is registered at all", () => {
      const utils = jest.spyOn(symbolRegistry, "getUtil").mockReturnValue(undefined)
      const types = jest.spyOn(symbolRegistry, "registeredTypes").mockReturnValue([])
      try {
        expect(() => symbolRegistry.getUtilFor({ type: SymbolType.Shape } as TBaseSymbol)).toThrow(
          /Registered types: none/
        )
      } finally {
        utils.mockRestore()
        types.mockRestore()
      }
    })

    it("should not be the same contract as getUtil, which stays tolerant", () => {
      // Guards the distinction: if `getUtilFor` were made to return undefined, the transform
      // managers would silently stop deriving and this is what would say so.
      expect(symbolRegistry.getUtil("no-such-type")).toBeUndefined()
      expect(() => symbolRegistry.getUtilFor({ type: "no-such-type" } as TBaseSymbol)).toThrow()
    })
  })

  /**
   * `SymbolType.Group` was an enum member with no `TSymbol` variant, no `Ops`, no util, and no code
   * path able to produce it — so the three `IIGestureManager` sets that listed it could never match.
   * IIC-2005 deleted it. This is what stops the next one from being added.
   */
  describe("coverage of SymbolType", () => {
    /**
     * Not document symbols, so deliberately without a util. The eraser is a transient overlay: it
     * never enters the model, is absent from the `TSymbol` union, and `SVGRenderer` draws it from
     * its own branch rather than by asking a util.
     */
    const NON_DOCUMENT_TYPES: SymbolType[] = [SymbolType.Eraser]

    it("should have a registered util for every type the document can hold", () => {
      // One direction only. A util for a type *not* in the enum is the extension story working as
      // intended, so the reverse would be a wrong invariant to assert.
      const documentTypes = Object.values(SymbolType).filter((type) => !NON_DOCUMENT_TYPES.includes(type))
      const missing = documentTypes.filter((type) => !symbolRegistry.has(type))
      // Named, not counted: a failure has to say which type has no util behind it.
      expect(missing).toEqual([])
    })

    it("should match the TSymbol union, which is what the model actually stores", () => {
      // Guards the guard: the list above is only meaningful if it tracks the union. Six members —
      // stroke, text, math, shape, edge, decorator.
      expect(Object.values(SymbolType).length - NON_DOCUMENT_TYPES.length).toBe(6)
    })
  })
})

/**
 * Moved here from `test/unit/symbol/` by IIC-2013, mirroring where the source lives. Both
 * files described the same subject, so each half was being maintained without reference to the
 * other.
 */
describe("symbolRegistry, register and lookup", () => {
  describe("register", () => {
    test("should return the registry instance for chaining", () => {
      const result = symbolRegistry.register(new StrokeUtil())
      expect(result).toBe(symbolRegistry)
    })

    test("should allow chaining multiple registers", () => {
      expect(() => symbolRegistry.register(new StrokeUtil()).register(new TextUtil())).not.toThrow()
    })
  })

  describe("getUtil", () => {
    test("should return undefined for an unknown type", () => {
      expect(symbolRegistry.getUtil("__no_such_type__")).toBeUndefined()
    })

    test("should return the registered util by type", () => {
      const util = new StrokeUtil()
      symbolRegistry.register(util)
      const retrieved = symbolRegistry.getUtil(SymbolType.Stroke)
      expect(retrieved).toBeDefined()
      expect(retrieved?.type).toBe(SymbolType.Stroke)
    })
  })

  describe("has", () => {
    test("should return false for an unknown type", () => {
      expect(symbolRegistry.has("__no_such_type__")).toBe(false)
    })

    test("should return true after registering a util", () => {
      symbolRegistry.register(new StrokeUtil())
      expect(symbolRegistry.has(SymbolType.Stroke)).toBe(true)
    })
  })
})

describe("registerBuiltinSymbolUtils", () => {
  test("should register all 6 built-in utils into symbolRegistry", () => {
    registerBuiltinSymbolUtils()
    expect(symbolRegistry.has(SymbolType.Stroke)).toBe(true)
    expect(symbolRegistry.has(SymbolType.Text)).toBe(true)
    expect(symbolRegistry.has(SymbolType.Math)).toBe(true)
    expect(symbolRegistry.has(SymbolType.Shape)).toBe(true)
    expect(symbolRegistry.has(SymbolType.Edge)).toBe(true)
    expect(symbolRegistry.has(SymbolType.Decorator)).toBe(true)
  })

  test("getUtil returns a util with matching type after registration", () => {
    registerBuiltinSymbolUtils()
    const strokeUtil = symbolRegistry.getUtil(SymbolType.Stroke)
    expect(strokeUtil?.type).toBe(SymbolType.Stroke)
    const mathUtil = symbolRegistry.getUtil(SymbolType.Math)
    expect(mathUtil?.type).toBe(SymbolType.Math)
  })
})
