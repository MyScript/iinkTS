import { buildIICircle, buildIIStroke, buildIIText } from "../../helpers"
import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IITypesetManager, OBBOps, TSymbolChar, SVGBuilder, TBaseSymbol, TSymbol } from "@/iink"

describe("IITypesetManager.ts", () => {
  const chars: TSymbolChar[] = [
    {
      bounds: { height: 0, width: 0, x: 0, y: 0 },
      color: "black",
      fontSize: 12,
      fontWeight: "normal",
      id: "char-1",
      label: "A",
    },
    {
      bounds: { height: 0, width: 0, x: 0, y: 0 },
      color: "black",
      fontSize: 16,
      fontWeight: "normal",
      id: "char-1",
      label: "A",
    },
  ]
  Object.defineProperty(global.SVGElement.prototype, "getNumberOfChars", {
    writable: true,
    value: jest.fn().mockReturnValue(chars.length),
  })
  Object.defineProperty(global.SVGElement.prototype, "getExtentOfChar", {
    writable: true,
    value: jest.fn((i) => ({ x: i, y: i * 2, height: i * 3, width: i * 4 })),
  })
  Object.defineProperty(global.SVGElement.prototype, "getBBox", {
    writable: true,
    value: jest.fn().mockReturnValue({
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    }),
  })

  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new IITypesetManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  test("should set chars BoundingBox", () => {
    const canvas = createCanvasMock()
    const manager = new IITypesetManager(asCanvas(canvas))
    const text = buildIIText({ chars })
    const textEl = manager.renderer.buildElementFromSymbol(text) as SVGGElement
    manager.setCharsBounds(text, textEl)

    expect(chars[0].bounds).toEqual({ height: 0, width: 0, x: 0, y: 0 })
    expect(chars[1].bounds).toEqual({ height: 3, width: 4, x: 1, y: 2 })
  })

  test("should get element BoundingBox", () => {
    const canvas = createCanvasMock()
    const manager = new IITypesetManager(asCanvas(canvas))
    const text = buildIIText({ chars })
    const textEl = manager.renderer.buildElementFromSymbol(text) as SVGGElement
    expect(manager.getElementBoundingBox(textEl)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
  })

  test("should get BoundingBox", () => {
    const canvas = createCanvasMock()
    const manager = new IITypesetManager(asCanvas(canvas))
    manager.renderer.layer = SVGBuilder.createLayer({ x: 0, y: 0, width: 100, height: 100 })
    manager.renderer.prependElement = jest.fn()
    const text = buildIIText({ chars })
    manager.getElementBoundingBox = jest.fn(() => ({ x: 1, y: 2, width: 3, height: 4 }))
    expect(manager.getBoundingBox(text)).toEqual({ x: 1, y: 2, width: 3, height: 4 })
    expect(manager.getElementBoundingBox).toHaveBeenCalledTimes(1)
  })

  test("shoud get Space Width", () => {
    const canvas = createCanvasMock()
    const manager = new IITypesetManager(asCanvas(canvas))
    manager.getBoundingBox = jest.fn(() => ({ height: 12, width: 42, x: 0, y: 0 }))
    expect(manager.getSpaceWidth(12)).toEqual(42)
    expect(manager.getBoundingBox).toHaveBeenCalledTimes(1)
  })

  test("should update Text BoundingBox", () => {
    const canvas = createCanvasMock()
    const manager = new IITypesetManager(asCanvas(canvas))
    manager.renderer.layer = SVGBuilder.createLayer({ x: 0, y: 0, width: 100, height: 100 })
    manager.renderer.prependElement = jest.fn()
    manager.getElementBoundingBox = jest.fn(() => ({ x: 1989, y: 27, width: 5, height: 42 }))
    manager.setCharsBounds = jest.fn()
    const text = buildIIText({ chars })
    manager.updateBounds(text)
    expect(OBBOps.toBox(text.bounds)).toEqual({ x: 1989, y: 27, width: 5, height: 42 })
    expect(manager.getElementBoundingBox).toHaveBeenCalledTimes(1)
    expect(manager.setCharsBounds).toHaveBeenCalledTimes(1)
  })

  describe("get symbols with row index", () => {
    const rowHeight = 10
    const canvas = createCanvasMock()
    canvas.configuration.rendering.guides.gap = rowHeight
    const manager = new IITypesetManager(asCanvas(canvas))

    const stroke51 = buildIIStroke({ box: { height: 9, width: 10, x: 0, y: 4.6 * rowHeight } })
    canvas.model.addSymbol(stroke51)

    const stroke12 = buildIIStroke({ box: { height: 9, width: 100, x: 50, y: rowHeight / 2 } })
    canvas.model.addSymbol(stroke12)

    const circle13 = buildIICircle({ center: { x: 200, y: rowHeight * 1.4 }, radius: 5 })
    canvas.model.addSymbol(circle13)

    const circle22 = buildIICircle({ center: { x: 200, y: rowHeight * 2.25 }, radius: 5 })
    canvas.model.addSymbol(circle22)

    const stroke21 = buildIIStroke({ box: { height: 9, width: 10, x: 0, y: 1.6 * rowHeight } })
    canvas.model.addSymbol(stroke21)

    const stroke11 = buildIIStroke({ box: { height: 9, width: 10, x: 0, y: rowHeight / 2 } })
    canvas.model.addSymbol(stroke11)

    const stroke31 = buildIIStroke({ box: { height: 9, width: 10, x: 0, y: 2.6 * rowHeight } })
    canvas.model.addSymbol(stroke31)

    test("shoud get rowIndex for each symbols", () => {
      expect(manager.getSymbolRowIndex(stroke11)).toEqual(1)
      expect(manager.getSymbolRowIndex(stroke12)).toEqual(1)
      expect(manager.getSymbolRowIndex(circle13)).toEqual(1)
      expect(manager.getSymbolRowIndex(circle22)).toEqual(2)
      expect(manager.getSymbolRowIndex(stroke21)).toEqual(2)
      expect(manager.getSymbolRowIndex(stroke31)).toEqual(3)
      expect(manager.getSymbolRowIndex(stroke51)).toEqual(5)
    })
    test("shoud get symbols group by row and ordered", () => {
      const rows = manager.getSymbolsByRowOrdered()
      expect(rows[0].rowIndex).toEqual(1)
      expect(rows[0].symbols).toEqual([stroke11, stroke12, circle13])
      expect(rows[1].rowIndex).toEqual(2)
      expect(rows[1].symbols).toEqual([stroke21, circle22])
      expect(rows[2].rowIndex).toEqual(3)
      expect(rows[2].symbols).toEqual([stroke31])
      expect(rows[3].rowIndex).toEqual(5)
      expect(rows[3].symbols).toEqual([stroke51])
    })

    test("skips an unregistered symbol type without throwing, keeping the rest of the rows", () => {
      const orphan = {
        ...(buildIIStroke({ box: { height: 9, width: 10, x: 0, y: 3.5 * rowHeight } }) as unknown as TBaseSymbol),
        type: "no-such-type",
        id: "orphan-1",
      } as unknown as TSymbol
      canvas.model.addSymbol(orphan)

      let rows: ReturnType<typeof manager.getSymbolsByRowOrdered>
      expect(() => {
        rows = manager.getSymbolsByRowOrdered()
      }).not.toThrow()

      expect(rows!.some((r) => r.symbols.some((s) => s.id === orphan.id))).toBe(false)
      expect(rows!.find((r) => r.rowIndex === 1)?.symbols).toEqual([stroke11, stroke12, circle13])
    })
  })
  describe("moveTextAfter", () => {
    /**
     * Reproduces the crash first. `getSymbolsByRowOrdered` reads `model.symbols`, which hands out
     * the store's deep-frozen committed records, and the shift wrote straight onto them.
     */
    test("should shift the texts that follow, without writing into the frozen document", () => {
      const canvas = createCanvasMock()
      const manager = new IITypesetManager(asCanvas(canvas))

      // Order and row come from the stored `bounds` — a typeset symbol's box is a DOM
      // measurement, so `SymbolGeometry` reports it as-is and `point` does not place it.
      const moved = buildIIText({ point: { x: 10, y: 100 }, boundingBox: { x: 10, y: 90, width: 20, height: 20 }, chars })
      const following = buildIIText({
        point: { x: 200, y: 100 },
        boundingBox: { x: 200, y: 90, width: 20, height: 20 },
        chars,
      })
      canvas.model.addSymbol(moved)
      canvas.model.addSymbol(following)
      // What the bug was: the committed record is frozen all the way down.
      expect(Object.isFrozen(canvas.model.getSymbol(following.id))).toBe(true)

      const pairs = manager.moveTextAfter(canvas.model.getSymbol(moved.id) as typeof moved, 25)

      expect(pairs).toHaveLength(1)
      expect(pairs![0].before.id).toBe(following.id)
      expect((pairs![0].before as typeof following).point.x).toBe(200)
      expect((canvas.model.getSymbol(following.id) as typeof following).point.x).toBe(225)
      // The snapshot is a value, not a view on the document: it must not have moved with it.
      expect((pairs![0].before as typeof following).point.x).toBe(200)
    })

    test("should leave a text that precedes it alone", () => {
      const canvas = createCanvasMock()
      const manager = new IITypesetManager(asCanvas(canvas))

      const moved = buildIIText({ point: { x: 200, y: 100 }, boundingBox: { x: 200, y: 90, width: 20, height: 20 }, chars })
      const preceding = buildIIText({
        point: { x: 10, y: 100 },
        boundingBox: { x: 10, y: 90, width: 20, height: 20 },
        chars,
      })
      canvas.model.addSymbol(moved)
      canvas.model.addSymbol(preceding)

      const pairs = manager.moveTextAfter(canvas.model.getSymbol(moved.id) as typeof moved, 25)

      expect(pairs).toEqual([])
      expect((canvas.model.getSymbol(preceding.id) as typeof preceding).point.x).toBe(10)
    })
  })
})
