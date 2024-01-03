import { buildOIHighlight, buildOIStroke, buildOIUnderline, delay } from "../helpers"

import
{
  OIModel,
  WriteTool,
  OIStroke,
  TPointer,
  TStyle,
  DefaultStyle,
  SymbolType,
  TExport,
  TOIShape,
  ShapeKind,
  EdgeKind
} from "../../../src/iink"

describe("OIModel.ts", () =>
{
  const width = 100, height = 100, rowHeight = 10
  test("should create", () =>
  {
    const model = new OIModel(width, height, rowHeight)
    expect(model).toBeDefined()
  })

  describe("currentSymbol", () =>
  {
    const model = new OIModel(width, height, rowHeight)

    test("should createCurrentSymbol with pencil", async () =>
    {
      expect(model.currentSymbol).toBeUndefined()
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      expect(model.creationTime).toStrictEqual(model.modificationDate)
      await delay(100)
      model.createCurrentSymbol(WriteTool.Pencil, point, DefaultStyle, 42, "mouse")
      expect(model.modificationDate - model.creationTime).toBeGreaterThanOrEqual(100)
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.style.color).toBe(DefaultStyle.color)
      expect(model.currentSymbol?.style.width).toBe(DefaultStyle.width)
      expect(model.currentSymbol?.type).toBe(SymbolType.Stroke)
      const stroke = model.currentSymbol as OIStroke
      expect(stroke.pointers).toHaveLength(1)
      expect(stroke.pointers[0].x).toBe(point.x)
      expect(stroke.pointers[0].y).toBe(point.y)
      expect(stroke.pointers[0].t).toBe(point.t)
      expect(stroke.pointers[0].p).toBe(point.p)
    })
    test("should createCurrentSymbol with pencil & custom style", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      const style: TStyle = { color: "red", width: 42 }
      model.createCurrentSymbol(WriteTool.Pencil, point, style, 42, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.style.color).toBe(style.color)
      expect(model.currentSymbol?.style.width).toBe(style.width)
    })
    test("should createCurrentSymbol with Rectangle", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.createCurrentSymbol(WriteTool.Rectangle, point, DefaultStyle, 42, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = model.currentSymbol as TOIShape
      expect(shape.kind).toBe(ShapeKind.Rectangle)
    })
    test("should createCurrentSymbol with Circle", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.createCurrentSymbol(WriteTool.Circle, point, DefaultStyle, 42, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = model.currentSymbol as TOIShape
      expect(shape.kind).toBe(ShapeKind.Circle)
    })
    test("should createCurrentSymbol with Parallelogram", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.createCurrentSymbol(WriteTool.Parallelogram, point, DefaultStyle, 42, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = model.currentSymbol as TOIShape
      expect(shape.kind).toBe(ShapeKind.Parallelogram)
    })
    test("should createCurrentSymbol with Triangle", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.createCurrentSymbol(WriteTool.Triangle, point, DefaultStyle, 42, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = model.currentSymbol as TOIShape
      expect(shape.kind).toBe(ShapeKind.Triangle)
    })
    test("should createCurrentSymbol with Line", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.createCurrentSymbol(WriteTool.Line, point, DefaultStyle, 42, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = model.currentSymbol as TOIShape
      expect(shape.kind).toBe(EdgeKind.Line)
    })
    test("should createCurrentSymbol with Arrow", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.createCurrentSymbol(WriteTool.Arrow, point, DefaultStyle, 42, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = model.currentSymbol as TOIShape
      expect(shape.kind).toBe(EdgeKind.Line)
    })
    test("should createCurrentSymbol with DoubleArrow", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.createCurrentSymbol(WriteTool.Arrow, point, DefaultStyle, 42, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = model.currentSymbol as TOIShape
      expect(shape.kind).toBe(EdgeKind.Line)
    })
    test("should write error if symbol type unknow when createCurrentSymbol", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      const style: TStyle = { color: "red", width: 42 }
      //@ts-ignore
      expect(() => model.createCurrentSymbol("unknow", point, style, 42, "mouse")).toThrow("Can't create symbol, tool is unknow: \"unknow\"")
    })
    test("should updateCurrentSymbol", () =>
    {
      const point1: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.createCurrentSymbol(WriteTool.Pencil, point1, DefaultStyle, 42, "mouse")
      const point: TPointer = { t: 15, p: 15, x: 15, y: 15 }
      model.updateCurrentSymbol(point)
      const stroke = model.currentSymbol as OIStroke
      expect(stroke.pointers).toHaveLength(2)
      expect(stroke.pointers[1].x).toBe(point.x)
      expect(stroke.pointers[1].y).toBe(point.y)
      expect(stroke.pointers[1].t).toBe(point.t)
      expect(stroke.pointers[1].p).toBe(point.p)
    })
    test("should endCurrentSymbol", () =>
    {
      expect(model.currentSymbol).toBeDefined()
      const currentSymbol = { ...model.currentSymbol }
      const point: TPointer = { t: 25, p: 25, x: 25, y: 25 }
      expect(model.symbols).toHaveLength(0)
      model.endCurrentSymbol(point)
      expect(model.currentSymbol).toBeUndefined()
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0].id).toEqual(currentSymbol.id)
    })
    test("should throw error when updateCurrentSymbol if currentSymbol undefined", () =>
    {
      expect(model.currentSymbol).toBeUndefined()
      const point: TPointer = { t: 15, p: 15, x: 15, y: 15 }
      expect(() => model.updateCurrentSymbol(point)).toThrow("Can't update current symbol because currentSymbol is undefined")
    })
  })

  describe("symbols", () =>
  {
    const model = new OIModel(27, 5)
    const symb = buildOIStroke()
    test("should addSymbol", () =>
    {
      expect(model.symbols).toHaveLength(0)
      model.addSymbol(symb)
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0]).toEqual(symb)
    })
    test("should updateSymbol", () =>
    {
      const updatedSymb = structuredClone(symb)
      updatedSymb.style.color = "yellow"
      updatedSymb.style.width = 25
      updatedSymb.pointers.push({ p: 1, t: 20, x: 42, y: 31 })
      model.updateSymbol(updatedSymb)
      expect(model.symbols[0]).not.toEqual(symb)
      expect(model.symbols[0]).toEqual(updatedSymb)
    })
    test("should not updateSymbol if id not exist", () =>
    {
      const symb2 = buildOIStroke()
      model.addSymbol(symb2)
      const updatedSymb2 = structuredClone(symb2)
      updatedSymb2.id = "not-exist"
      updatedSymb2.style.color = "yellow"
      updatedSymb2.style.width = 25
      updatedSymb2.pointers.push({ p: 1, t: 20, x: 42, y: 31 })
      model.updateSymbol(updatedSymb2)
      expect(model.symbols[1]).toEqual(symb2)
    })
    test("should removeSymbol", () =>
    {
      expect(model.symbols).toHaveLength(2)
      model.removeSymbol(symb.id)
      expect(model.symbols).toHaveLength(1)
    })
    test("should not removeSymbol if id not exist", () =>
    {
      expect(model.symbols).toHaveLength(1)
      model.removeSymbol("not-exist")
      expect(model.symbols).toHaveLength(1)
    })
    test("should removeSymbol & decorators", () =>
    {
      const stroke = buildOIStroke()
      const highlight = buildOIHighlight([stroke])
      const underline = buildOIUnderline([stroke])
      stroke.decorators.push(highlight)
      stroke.decorators.push(underline)
      model.addSymbol(stroke)
      model.addSymbol(highlight)
      model.addSymbol(underline)
      const nbSymbols = model.symbols.length
      model.removeSymbol(stroke.id)
      expect(model.symbols).toHaveLength(nbSymbols - 3)
    })
  })

  describe("selection", () =>
  {
    const model = new OIModel(27, 5)
    const stroke1 = buildOIStroke({ box: { height: 10, width: 10, x: 0, y: 0 } })
    model.addSymbol(stroke1)
    const stroke2 = buildOIStroke({ box: { height: 10, width: 10, x: 20, y: 0 } })
    model.addSymbol(stroke2)
    test("should select stroke when point on stroke", () =>
    {
      model.selectSymbol(stroke1.id)
      expect(model.selection).toHaveLength(1)
      expect(model.selection[0].id).toEqual(stroke1.id)
    })
    test("should unselect stroke", () =>
    {
      expect(model.selection).toHaveLength(1)
      model.unselectSymbol(stroke1.id)
      expect(model.selection).toHaveLength(0)
    })
    test("should not select the same stroke twice", () =>
    {
      model.selectSymbol(stroke1.id)
      expect(model.selection).toHaveLength(1)
      model.selectSymbol(stroke1.id)
      expect(model.selection).toHaveLength(1)
    })
    test("should reset selection", () =>
    {
      expect(model.selection).toHaveLength(1)
      model.resetSelection()
      expect(model.selection).toHaveLength(0)
    })
    test("should select stroke when point close", () =>
    {
      expect(model.selection).toHaveLength(0)
      const point = JSON.parse(JSON.stringify(stroke1.pointers[0]))
      point.x += 1
      point.y += 1
      model.selectedSymbolsFromPoint(point)
      expect(model.selection).toHaveLength(1)
      expect(model.selection[0].id).toEqual(stroke1.id)
    })
    test("should not select the stroke when the point is far away", () =>
    {
      model.resetSelection()
      expect(model.selection).toHaveLength(0)
      const point = JSON.parse(JSON.stringify(stroke1.pointers[0]))
      point.x += 1000
      point.y += 1000
      model.selectedSymbolsFromPoint(point)
      expect(model.selection).toHaveLength(0)
    })

  })

  describe("positions", () =>
  {
    const model = new OIModel(27, 5)
    model.addSymbol(buildOIStroke())
    model.addSymbol(buildOIStroke())
    test("should positions init with 0", () =>
    {
      expect(model.positions).toEqual({ lastSentPosition: 0, lastReceivedPosition: 0 })
    })

    test("should update position sent", () =>
    {
      model.updatePositionSent()
      expect(model.positions).toEqual({ lastSentPosition: 2, lastReceivedPosition: 0 })
    })
    test("should update received sent", () =>
    {
      model.updatePositionReceived()
      expect(model.positions).toEqual({ lastSentPosition: 2, lastReceivedPosition: 2 })
    })
  })

  describe("extract", () =>
  {
    const model = new OIModel(27, 5)
    model.addSymbol(buildOIStroke())
    model.addSymbol(buildOIStroke())
    test("should extract all traits if nothing is sent", () =>
    {
      expect(model.extractUnsentStrokes()).toEqual(model.symbols)
    })
    test("should extract a stroke if one out of two sent", () =>
    {
      model.positions.lastSentPosition = 1
      expect(model.extractUnsentStrokes()).toEqual([model.symbols[1]])
    })
    test("should not extract anything if all strokes have been sent", () =>
    {
      model.positions.lastSentPosition = 2
      expect(model.extractUnsentStrokes()).toHaveLength(0)
    })

    test("should extract symbol added in second model", () =>
    {
      const newModel = model.getClone()
      const newSymb = buildOIStroke()
      model.addSymbol(newSymb)
      const { added, removed } = model.extractDifferenceSymbols(newModel)
      expect(added).toEqual([newSymb])
      expect(removed).toEqual([])
    })
    test("should extract symbol removed in second model", () =>
    {
      const newModel = model.getClone()
      const newSymb = buildOIStroke()
      model.addSymbol(newSymb)
      const { added, removed } = newModel.extractDifferenceSymbols(model)
      expect(added).toEqual([])
      expect(removed).toEqual([newSymb])
    })
    test("should extract nothing if same model", () =>
    {
      const { added, removed } = model.extractDifferenceSymbols(model)
      expect(added).toEqual([])
      expect(removed).toEqual([])
    })
  })

  describe("export", () =>
  {
    const model = new OIModel(27, 5)
    const e: TExport = { "text/plain": "poney" }
    test("should define export to undefined", () =>
    {
      expect(model.exports).toBeUndefined()
    })
    test("should init export", () =>
    {
      model.mergeExport(e)
      expect(model.exports).toEqual(e)
    })
    test("should merge export", () =>
    {
      const newExport: TExport = {
        "application/vnd.myscript.jiix": {
          "type": "Text",
          "label": "poney",
          "words": [
            {
              "label": "poney",
              "candidates": ["poney", "Poney", "ponay", "ponex", "pony"]
            }
          ],
          "version": "3",
          "id": "MainBlock"
        }
      }

      model.mergeExport(newExport)
      expect(model.exports).toMatchObject(newExport)
      expect(model.exports).toMatchObject(e)
    })
  })

  describe("clone", () =>
  {
    const model = new OIModel(27, 5)
    const stroke = buildOIStroke()
    model.addSymbol(stroke)
    model.createCurrentSymbol(WriteTool.Pencil, { p: 27, t: 5, x: 1989, y: 42 }, DefaultStyle, 42, "mouse")
    model.exports = { "text/plain": "M" }
    test("should getClone", () =>
    {
      const clone = model.getClone()
      expect(clone != model).toBeTruthy()
      expect(clone.currentSymbol).toEqual(model.currentSymbol)
      expect(clone.currentSymbol).not.toBe(model.currentSymbol)

      expect(clone.exports).toEqual(model.exports)
      expect(clone.exports).not.toBe(model.exports)

      expect(clone.height).toEqual(model.height)

      expect(clone.idle).toEqual(model.idle)

      expect(clone.positions).toEqual(model.positions)
      expect(clone.positions).not.toBe(model.positions)

      expect(clone.symbols).toEqual(model.symbols)
      expect(clone.symbols).not.toBe(model.symbols)

      expect(clone.width).toEqual(model.width)
    })
  })

  describe("clear", () =>
  {
    test("should clear model", () =>
    {
      const model = new OIModel(width, height, rowHeight)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 10, x: 10, y: 10 }
      const p3: TPointer = { t: 10, p: 10, x: 10, y: 10 }

      model.createCurrentSymbol(WriteTool.Pencil, p1, DefaultStyle, 42, "mouse")
      model.endCurrentSymbol(p2)
      model.createCurrentSymbol(WriteTool.Pencil, p3, DefaultStyle, 51, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.symbols).toHaveLength(1)

      model.clear()
      expect(model.currentSymbol).toBeUndefined()
      expect(model.symbols).toHaveLength(0)
    })
  })
})
