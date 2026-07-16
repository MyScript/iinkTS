import { buildIICircle, buildIIStroke, buildIIText } from "../../helpers"
import { createEditorMock, asEditor } from "../../__mocks__/createEditorMock"
import { IITypesetManager, OBBOps, TSymbolChar, SVGBuilder } from "@/iink"

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
    const editor = createEditorMock()
    const manager = new IITypesetManager(asEditor(editor))
    expect(manager).toBeDefined()
  })

  test("should set chars BoundingBox", () => {
    const editor = createEditorMock()
    const manager = new IITypesetManager(asEditor(editor))
    const text = buildIIText({ chars })
    const textEl = manager.renderer.buildElementFromSymbol(text) as SVGGElement
    manager.setCharsBounds(text, textEl)

    expect(chars[0].bounds).toEqual({ height: 0, width: 0, x: 0, y: 0 })
    expect(chars[1].bounds).toEqual({ height: 3, width: 4, x: 1, y: 2 })
  })

  test("should get element BoundingBox", () => {
    const editor = createEditorMock()
    const manager = new IITypesetManager(asEditor(editor))
    const text = buildIIText({ chars })
    const textEl = manager.renderer.buildElementFromSymbol(text) as SVGGElement
    expect(manager.getElementBoundingBox(textEl)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
  })

  test("should get BoundingBox", () => {
    const editor = createEditorMock()
    const manager = new IITypesetManager(asEditor(editor))
    manager.renderer.layer = SVGBuilder.createLayer({ x: 0, y: 0, width: 100, height: 100 })
    manager.renderer.prependElement = jest.fn()
    const text = buildIIText({ chars })
    manager.getElementBoundingBox = jest.fn(() => ({ x: 1, y: 2, width: 3, height: 4 }))
    expect(manager.getBoundingBox(text)).toEqual({ x: 1, y: 2, width: 3, height: 4 })
    expect(manager.getElementBoundingBox).toHaveBeenCalledTimes(1)
  })

  test("shoud get Space Width", () => {
    const editor = createEditorMock()
    const manager = new IITypesetManager(asEditor(editor))
    manager.getBoundingBox = jest.fn(() => ({ height: 12, width: 42, x: 0, y: 0 }))
    expect(manager.getSpaceWidth(12)).toEqual(42)
    expect(manager.getBoundingBox).toHaveBeenCalledTimes(1)
  })

  test("should update Text BoundingBox", () => {
    const editor = createEditorMock()
    const manager = new IITypesetManager(asEditor(editor))
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
    const editor = createEditorMock()
    editor.configuration.rendering.guides.gap = rowHeight
    const manager = new IITypesetManager(asEditor(editor))

    const stroke51 = buildIIStroke({ box: { height: 9, width: 10, x: 0, y: 4.6 * rowHeight } })
    editor.model.addSymbol(stroke51)

    const stroke12 = buildIIStroke({ box: { height: 9, width: 100, x: 50, y: rowHeight / 2 } })
    editor.model.addSymbol(stroke12)

    const circle13 = buildIICircle({ center: { x: 200, y: rowHeight * 1.4 }, radius: 5 })
    editor.model.addSymbol(circle13)

    const circle22 = buildIICircle({ center: { x: 200, y: rowHeight * 2.25 }, radius: 5 })
    editor.model.addSymbol(circle22)

    const stroke21 = buildIIStroke({ box: { height: 9, width: 10, x: 0, y: 1.6 * rowHeight } })
    editor.model.addSymbol(stroke21)

    const stroke11 = buildIIStroke({ box: { height: 9, width: 10, x: 0, y: rowHeight / 2 } })
    editor.model.addSymbol(stroke11)

    const stroke31 = buildIIStroke({ box: { height: 9, width: 10, x: 0, y: 2.6 * rowHeight } })
    editor.model.addSymbol(stroke31)

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
  })
})
