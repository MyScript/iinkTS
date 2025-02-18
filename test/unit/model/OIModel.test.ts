import { buildOICircle, buildOIGroup, buildOIStroke } from "../helpers"

import { IIModel, TExport, } from "../../../src/iink"

describe("IIModel.ts", () =>
{
  const width = 100, height = 100, rowHeight = 10
  test("should create", () =>
  {
    const model = new IIModel(width, height, rowHeight)
    expect(model).toBeDefined()
  })

  describe("crud symbols", () =>
  {
    const model = new IIModel(width, height, rowHeight)
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
  })

  describe("change symbol order", () =>
  {
    const model = new IIModel(width, height, rowHeight)
    const sym1 = buildOIStroke()
    model.addSymbol(sym1)
    const sym2 = buildOIStroke()
    model.addSymbol(sym2)
    const sym3 = buildOIStroke()
    model.addSymbol(sym3)
    const sym4 = buildOIStroke()
    model.addSymbol(sym4)

    test("should do nothing when change symbol order not in model", () =>
    {
      const symUnknow = buildOIStroke()
      model.changeOrderSymbol(symUnknow.id, "first")
      expect(model.symbols[0].id).toEqual(sym1.id)
      expect(model.symbols[1].id).toEqual(sym2.id)
      expect(model.symbols[2].id).toEqual(sym3.id)
      expect(model.symbols[3].id).toEqual(sym4.id)
    })
    test("should do nothing when change order to first if sym at first position", () =>
    {
      expect(model.symbols[0].id).toEqual(sym1.id)
      model.changeOrderSymbol(sym1.id, "first")
      expect(model.symbols[0].id).toEqual(sym1.id)
    })
    test("should change order to first position", () =>
    {
      expect(model.symbols[0].id).toEqual(sym1.id)
      model.changeOrderSymbol(sym3.id, "first")
      expect(model.symbols[0].id).toEqual(sym3.id)
    })
    test("should do nothing when change order last if sym at last position", () =>
    {
      expect(model.symbols.at(-1)!.id).toEqual(sym4.id)
      model.changeOrderSymbol(sym4.id, "last")
      expect(model.symbols.at(-1)!.id).toEqual(sym4.id)
    })
    test("should change order to at last position", () =>
    {
      expect(model.symbols.at(-1)!.id).toEqual(sym4.id)
      model.changeOrderSymbol(sym2.id, "last")
      expect(model.symbols.at(-1)!.id).toEqual(sym2.id)
    })
    test("should change order to forward", () =>
    {
      expect(model.symbols.at(1)!.id).toEqual(sym1.id)
      model.changeOrderSymbol(sym3.id, "forward")
      expect(model.symbols.at(1)!.id).toEqual(sym3.id)
    })
    test("should do nothing when move last at forward", () =>
    {
      expect(model.symbols.at(-1)!.id).toEqual(sym2.id)
      model.changeOrderSymbol(sym3.id, "forward")
      expect(model.symbols.at(-1)!.id).toEqual(sym2.id)
    })
    test("should move backward", () =>
    {
      expect(model.symbols.at(0)!.id).toEqual(sym1.id)
      model.changeOrderSymbol(sym4.id, "backward")
      expect(model.symbols.at(0)!.id).toEqual(sym4.id)
    })
    test("should do nothing when move last at backward", () =>
    {
      expect(model.symbols.at(0)!.id).toEqual(sym4.id)
      model.changeOrderSymbol(sym4.id, "backward")
      expect(model.symbols.at(0)!.id).toEqual(sym4.id)
    })
  })

  describe("get symbols with row index", () =>
  {
    const model = new IIModel(width, height, rowHeight)

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
    test("shoud get symbols group by row and ordered", () =>
    {
      const rows = model.getSymbolsByRowOrdered()
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

  describe("get root symbol", () =>
  {
    const model = new IIModel(width, height, rowHeight)

    const stroke1 = buildOIStroke()
    model.addSymbol(stroke1)

    const group1 = buildOIGroup()
    model.addSymbol(group1)

    const circle1 = buildOICircle({ center: { x: 200, y: rowHeight * 1.4 }, radius: 5 })
    model.addSymbol(circle1)

    const group2 = buildOIGroup()
    const group21 = buildOIGroup()
    group2.children.push(group21)
    model.addSymbol(group2)

    test("shoud get symbol if stroke root", () =>
    {
      expect(model.getRootSymbol(stroke1.id)).toEqual(stroke1)
    })
    test("shoud get symbol if group root", () =>
    {
      expect(model.getRootSymbol(group1.id)).toEqual(group1)
    })
    test("shoud get symbol if circle root", () =>
    {
      expect(model.getRootSymbol(circle1.id)).toEqual(circle1)
    })
    test("shoud get symbol if child of group root", () =>
    {
      expect(model.getRootSymbol(group1.children[0].id)).toEqual(group1)
    })
    test("shoud get symbol if sub-child of group root", () =>
    {
      expect(model.getRootSymbol(group21.children[0].id)).toEqual(group2)
    })
    test("shoud get undefined if child of group root", () =>
    {

      expect(model.getRootSymbol("pouet")).toBeUndefined()
    })
  })

  describe("roundToLineGuide", () =>
  {
    const model = new IIModel(width, height, rowHeight)
    test("should return row height", () => {
      expect(model.roundToLineGuide(1.4 * rowHeight)).toEqual(rowHeight)
    })
    test("should return 2 row height", () => {
      expect(model.roundToLineGuide(1.6 * rowHeight)).toEqual(2 * rowHeight)
    })
  })

  describe("isSymbol", () =>
  {
    const model = new IIModel(width, height, rowHeight)
    const s11 = buildOIStroke({ box: { height: rowHeight / 2, width: 5, x: 5, y: rowHeight }})
    const s12 = buildOIStroke({ box: { height: rowHeight / 2, width: 5, x: 50, y: rowHeight }})
    const s21 = buildOIStroke({ box: { height: rowHeight * 2, width: 5, x: 5, y: rowHeight }})
    const s22 = buildOIStroke({ box: { height: rowHeight * 2, width: 5, x: 50, y: rowHeight }})
    test("above should return false", () => {
      expect(model.isSymbolAbove(s11, s12)).toEqual(false)
    })
    test("above should return false", () => {
      expect(model.isSymbolAbove(s11, s21)).toEqual(false)
    })
    test("above should return false", () => {
      expect(model.isSymbolAbove(s12, s21)).toEqual(false)
    })
    test("above should return true", () => {
      expect(model.isSymbolAbove(s21, s12)).toEqual(true)
    })
    test("above should return false", () => {
      expect(model.isSymbolAbove(s21, s22)).toEqual(false)
    })
    test("in row should return false", () => {
      expect(model.isSymbolInRow(s11, s12)).toEqual(true)
    })
    test("in row should return false", () => {
      expect(model.isSymbolInRow(s11, s21)).toEqual(false)
    })
    test("in row should return false", () => {
      expect(model.isSymbolInRow(s12, s21)).toEqual(false)
    })
    test("in row should return true", () => {
      expect(model.isSymbolInRow(s21, s12)).toEqual(false)
    })
    test("in row should return false", () => {
      expect(model.isSymbolInRow(s21, s22)).toEqual(true)
    })
    test("below should return false", () => {
      expect(model.isSymbolBelow(s11, s12)).toEqual(false)
    })
    test("below should return false", () => {
      expect(model.isSymbolBelow(s11, s21)).toEqual(true)
    })
    test("below should return false", () => {
      expect(model.isSymbolBelow(s12, s21)).toEqual(true)
    })
    test("below should return true", () => {
      expect(model.isSymbolBelow(s21, s12)).toEqual(false)
    })
    test("below should return false", () => {
      expect(model.isSymbolBelow(s21, s22)).toEqual(false)
    })
  })

  describe("get first/last symbol", () =>
  {
    const model = new IIModel(width, height, rowHeight)
    const s11 = buildOIStroke({ box: { height: rowHeight / 2, width: 5, x: 5, y: rowHeight }})
    const s21 = buildOIStroke({ box: { height: rowHeight * 2, width: 5, x: 5, y: rowHeight }})
    const s22 = buildOIStroke({ box: { height: rowHeight * 2, width: 5, x: 50, y: rowHeight }})
    const s23 = buildOIStroke({ box: { height: rowHeight * 2, width: 5, x: 150, y: rowHeight }})
    const s31 = buildOIStroke({ box: { height: rowHeight * 3, width: 5, x: 5, y: rowHeight }})
    test("should return first symbol when different rows", () => {
      expect(model.getFirstSymbol([s11, s21, s31])).toEqual(s11)
    })
    test("should return first symbol when in same row", () => {
      expect(model.getFirstSymbol([s21, s22, s23])).toEqual(s21)
    })
    test("should return first symbol when only 1 symbol", () => {
      expect(model.getFirstSymbol([s21])).toEqual(s21)
    })
    test("should return last symbol when different rows", () => {
      expect(model.getLastSymbol([s11, s21, s31])).toEqual(s31)
    })
    test("should return last symbol when in same row", () => {
      expect(model.getLastSymbol([s21, s22, s23])).toEqual(s23)
    })
    test("should return last symbol when only 1 symbol", () => {
      expect(model.getLastSymbol([s21])).toEqual(s21)
    })
  })

  describe("selection", () =>
  {
    const model = new IIModel(width, height, rowHeight)
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

  describe("extract", () =>
  {
    const model = new IIModel(width, height, rowHeight)
    model.addSymbol(buildOIStroke())
    model.addSymbol(buildOIStroke())

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
    const model = new IIModel(width, height, rowHeight)
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
    const model = new IIModel(width, height, rowHeight)
    const stroke = buildOIStroke()
    model.addSymbol(stroke)
    model.exports = { "text/plain": "M" }
    test("should clone", () =>
    {
      const clone = model.clone()
      expect(clone).toStrictEqual(model)
      expect(clone).not.toBe(model)
    })
  })

  describe("clear", () =>
  {
    test("should clear model", () =>
    {
      const model = new IIModel(width, height, rowHeight)
      model.currentSymbol = buildOIStroke()
      model.addSymbol(buildOIStroke())
      expect(model.currentSymbol).toBeDefined()
      expect(model.symbols).toHaveLength(1)

      model.clear()
      expect(model.currentSymbol).toBeUndefined()
      expect(model.symbols).toHaveLength(0)
    })
  })
})
