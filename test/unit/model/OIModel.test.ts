import { buildOICircle, buildOIHighlight, buildOIStroke, buildOIUnderline, delay } from "../helpers"

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
  EdgeKind,
  OIEdgeLine
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
    test("should createCurrentSymbol with Ellipse", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.createCurrentSymbol(WriteTool.Ellipse, point, DefaultStyle, 42, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = model.currentSymbol as TOIShape
      expect(shape.kind).toBe(ShapeKind.Ellipse)
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
      const shape = model.currentSymbol as OIEdgeLine
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toBeUndefined()
      expect(shape.endDecoration).toBeUndefined()
    })
    test("should createCurrentSymbol with Arrow", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.createCurrentSymbol(WriteTool.Arrow, point, DefaultStyle, 42, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = model.currentSymbol as OIEdgeLine
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toBeUndefined()
      expect(shape.endDecoration).toBeDefined()
    })
    test("should createCurrentSymbol with DoubleArrow", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.createCurrentSymbol(WriteTool.DoubleArrow, point, DefaultStyle, 42, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = model.currentSymbol as OIEdgeLine
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toBeDefined()
      expect(shape.endDecoration).toBeDefined()
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
      const point: TPointer = { t: 25, p: 25, x: 25, y: 25 }
      expect(model.symbols).toHaveLength(0)
      model.endCurrentSymbol(point)
      expect(model.currentSymbol).toBeUndefined()
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
    const model = new OIModel(width, height, rowHeight)
    const sym = buildOIStroke()
    test("should addSymbol", () =>
    {
      expect(model.symbols).toHaveLength(0)
      model.addSymbol(sym)
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0]).toEqual(sym)
    })
    test("should updateSymbol", () =>
    {
      const updatedSymb = structuredClone(sym)
      updatedSymb.style.color = "yellow"
      updatedSymb.style.width = 25
      updatedSymb.pointers.push({ p: 1, t: 20, x: 42, y: 31 })
      model.updateSymbol(updatedSymb)
      expect(model.symbols[0]).not.toEqual(sym)
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
    test("should replaceSymbol", () =>
    {
      const sym1 = buildOIStroke()
      model.addSymbol(sym1)
      const oldLength = model.symbols.length
      const sym2 = buildOIStroke()
      const sym3 = buildOIStroke()
      model.replaceSymbol(sym1.id, [sym2, sym3])
      expect(oldLength + 1).toEqual(model.symbols.length)
      expect(model.symbols.find(s => s.id === sym1.id)).toBeUndefined()
      expect(model.symbols.find(s => s.id === sym2.id)).toEqual(sym2)
      expect(model.symbols.find(s => s.id === sym3.id)).toEqual(sym3)
    })
    test("should not replaceSymbol if id not exist", () =>
    {
      const sym1 = buildOIStroke()
      model.addSymbol(sym1)
      const oldLength = model.symbols.length
      const sym2 = buildOIStroke()
      const sym3 = buildOIStroke()
      model.replaceSymbol("unknow", [sym2, sym3])
      expect(oldLength).toEqual(model.symbols.length)
      expect(model.symbols.find(s => s.id === sym1.id)).toEqual(sym1)
      expect(model.symbols.find(s => s.id === sym2.id)).toBeUndefined()
      expect(model.symbols.find(s => s.id === sym3.id)).toBeUndefined()
    })
    test("should removeSymbol", () =>
    {
      const oldLength = model.symbols.length
      model.removeSymbol(sym.id)
      expect(model.symbols).toHaveLength(oldLength - 1)
      expect(model.symbols.find(s => s.id === sym.id)).toBeUndefined()
    })
    test("should not removeSymbol if id not exist", () =>
    {
      const oldLength = model.symbols.length
      model.removeSymbol("not-exist")
      expect(model.symbols).toHaveLength(oldLength)
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
      expect(model.removeSymbol(stroke.id)).toHaveLength(3)
      expect(model.symbols).toHaveLength(nbSymbols - 3)
    })
  })

  describe("get symbols", () =>
  {
    const model = new OIModel(width, height, rowHeight)

    const stroke51 = buildOIStroke({ box: { height: 9, width: 10, x: 0, y: 4.6 * rowHeight } })
    model.addSymbol(stroke51)

    const stroke12 = buildOIStroke({ box: { height: 9, width: 100, x: 50, y: rowHeight / 2 } })
    model.addSymbol(stroke12)

    const circle13 = buildOICircle({ center: { x: 200, y: rowHeight * 1.4 }, radius: 5 })
    model.addSymbol(circle13)

    const circle22 = buildOICircle({ center: { x: 200, y: rowHeight * 2.25 }, radius: 5 })
    model.addSymbol(circle22)

    const stroke21 = buildOIStroke({ box: { height: 9, width: 10, x: 0, y: 1.6 * rowHeight } })
    model.addSymbol(stroke21)

    const stroke11 = buildOIStroke({ box: { height: 9, width: 10, x: 0, y: rowHeight / 2 } })
    model.addSymbol(stroke11)

    const stroke31 = buildOIStroke({ box: { height: 9, width: 10, x: 0, y: 2.6 * rowHeight } })
    model.addSymbol(stroke31)

    test("shoud get rowIndex for each symbols", () =>
    {
      expect(model.getSymbolRowIndex(stroke11)).toEqual(1)
      expect(model.getSymbolRowIndex(stroke12)).toEqual(1)
      expect(model.getSymbolRowIndex(circle13)).toEqual(1)
      expect(model.getSymbolRowIndex(circle22)).toEqual(2)
      expect(model.getSymbolRowIndex(stroke21)).toEqual(2)
      expect(model.getSymbolRowIndex(stroke31)).toEqual(3)
      expect(model.getSymbolRowIndex(stroke51)).toEqual(5)
    })
    test("shoud get symbols orderered for each row", () =>
    {
      expect(model.getSymbolInRowOrdered(0)).toEqual([])
      expect(model.getSymbolInRowOrdered(1)).toEqual([stroke11, stroke12, circle13])
      expect(model.getSymbolInRowOrdered(2)).toEqual([stroke21, circle22])
      expect(model.getSymbolInRowOrdered(3)).toEqual([stroke31])
      expect(model.getSymbolInRowOrdered(4)).toEqual([])
      expect(model.getSymbolInRowOrdered(5)).toEqual([stroke51])
    })
    test("shoud get symbols group by row and ordered", () =>
    {
      const rows = model.getSymbolsByRowOrdered()
      expect(rows[0].index).toEqual(1)
      expect(rows[0].symbols).toEqual([stroke11, stroke12, circle13])
      expect(rows[1].index).toEqual(2)
      expect(rows[1].symbols).toEqual([stroke21, circle22])
      expect(rows[2].index).toEqual(3)
      expect(rows[2].symbols).toEqual([stroke31])
      expect(rows[3].index).toEqual(5)
      expect(rows[3].symbols).toEqual([stroke51])
    })
  })

  describe("selection", () =>
  {
    const model = new OIModel(width, height, rowHeight)
    const stroke1 = buildOIStroke({ box: { height: 10, width: 10, x: 0, y: 0 } })
    model.addSymbol(stroke1)
    const stroke2 = buildOIStroke({ box: { height: 10, width: 10, x: 20, y: 0 } })
    model.addSymbol(stroke2)
    test("should select stroke when point on stroke", () =>
    {
      model.selectSymbol(stroke1.id)
      expect(model.symbolsSelected).toHaveLength(1)
      expect(model.symbolsSelected[0].id).toEqual(stroke1.id)
    })
    test("should unselect stroke", () =>
    {
      expect(model.symbolsSelected).toHaveLength(1)
      model.unselectSymbol(stroke1.id)
      expect(model.symbolsSelected).toHaveLength(0)
    })
    test("should not select the same stroke twice", () =>
    {
      model.selectSymbol(stroke1.id)
      expect(model.symbolsSelected).toHaveLength(1)
      model.selectSymbol(stroke1.id)
      expect(model.symbolsSelected).toHaveLength(1)
    })
    test("should reset selection", () =>
    {
      expect(model.symbolsSelected).toHaveLength(1)
      model.resetSelection()
      expect(model.symbolsSelected).toHaveLength(0)
    })
  })

  describe("toDelete", () =>
  {
    const model = new OIModel(width, height, rowHeight)
    const stroke1 = buildOIStroke({ box: { height: 10, width: 10, x: 0, y: 0 } })
    model.addSymbol(stroke1)
    const stroke2 = buildOIStroke({ box: { height: 10, width: 10, x: 20, y: 0 } })
    model.addSymbol(stroke2)
    test("should set stroke.toDelete = true when point close", () =>
    {
      expect(model.symbolsToDelete).toHaveLength(0)
      const point = JSON.parse(JSON.stringify(stroke1.pointers[0]))
      point.x += 1
      point.y += 1
      model.setToDeleteSymbolsFromPoint(point)
      expect(model.symbolsToDelete).toHaveLength(1)
      expect(model.symbolsToDelete[0].id).toEqual(stroke1.id)
    })
    test("should not set stroke.toDelete = true when the point is far away", () =>
    {
      model.symbols.forEach(s => s.toDelete = false)
      expect(model.symbolsToDelete).toHaveLength(0)
      const point = JSON.parse(JSON.stringify(stroke1.pointers[0]))
      point.x += 1000
      point.y += 1000
      model.setToDeleteSymbolsFromPoint(point)
      expect(model.symbolsToDelete).toHaveLength(0)
    })
  })

  describe("positions", () =>
  {
    const model = new OIModel(width, height, rowHeight)
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
    const model = new OIModel(width, height, rowHeight)
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
      const newModel = model.clone()
      const newSymb = buildOIStroke()
      model.addSymbol(newSymb)
      const { added, removed } = model.extractDifferenceSymbols(newModel)
      expect(added).toEqual([newSymb])
      expect(removed).toEqual([])
    })
    test("should extract symbol removed in second model", () =>
    {
      const newModel = model.clone()
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
    const model = new OIModel(width, height, rowHeight)
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
    const model = new OIModel(width, height, rowHeight)
    const stroke = buildOIStroke()
    model.addSymbol(stroke)
    model.createCurrentSymbol(WriteTool.Pencil, { p: 27, t: 5, x: 1989, y: 42 }, DefaultStyle, 42, "mouse")
    model.exports = { "text/plain": "M" }
    test("should clone", () =>
    {
      const clone = model.clone()
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
      model.addSymbol(model.endCurrentSymbol(p2))
      model.createCurrentSymbol(WriteTool.Pencil, p3, DefaultStyle, 51, "mouse")
      expect(model.currentSymbol).toBeDefined()
      expect(model.symbols).toHaveLength(1)

      model.clear()
      expect(model.currentSymbol).toBeUndefined()
      expect(model.symbols).toHaveLength(0)
    })
  })
})
