import { buildIICircle, buildIIStroke } from "../helpers"

import { IIModel, TExport } from "@/iink"

describe("IIModel.ts", () => {
  const rowHeight = 10
  test("should create", () => {
    const model = new IIModel()
    expect(model).toBeDefined()
  })

  describe("crud symbols", () => {
    const model = new IIModel()
    const sym = buildIIStroke()
    test("should addSymbol", () => {
      expect(model.symbols).toHaveLength(0)
      model.addSymbol(sym)
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0]).toEqual(sym)
    })
    test("should updateSymbol", () => {
      const updatedSymb = structuredClone(sym)
      updatedSymb.style.color = "yellow"
      updatedSymb.style.width = 25
      updatedSymb.pointers.push({ p: 1, t: 20, x: 42, y: 31 })
      model.updateSymbol(updatedSymb)
      expect(model.symbols[0]).not.toEqual(sym)
      expect(model.symbols[0]).toEqual(updatedSymb)
    })
    test("should not updateSymbol if id not exist", () => {
      const symb2 = buildIIStroke()
      model.addSymbol(symb2)
      const updatedSymb2 = structuredClone(symb2)
      updatedSymb2.id = "not-exist"
      updatedSymb2.style.color = "yellow"
      updatedSymb2.style.width = 25
      updatedSymb2.pointers.push({ p: 1, t: 20, x: 42, y: 31 })
      model.updateSymbol(updatedSymb2)
      expect(model.symbols[1]).toEqual(symb2)
    })
    test("should replaceSymbol", () => {
      const sym1 = buildIIStroke()
      model.addSymbol(sym1)
      const oldLength = model.symbols.length
      const sym2 = buildIIStroke()
      const sym3 = buildIIStroke()
      model.replaceSymbol(sym1.id, [sym2, sym3])
      expect(oldLength + 1).toEqual(model.symbols.length)
      expect(model.symbols.find((s) => s.id === sym1.id)).toBeUndefined()
      expect(model.symbols.find((s) => s.id === sym2.id)).toEqual(sym2)
      expect(model.symbols.find((s) => s.id === sym3.id)).toEqual(sym3)
    })
    test("should not replaceSymbol if id not exist", () => {
      const sym1 = buildIIStroke()
      model.addSymbol(sym1)
      const oldLength = model.symbols.length
      const sym2 = buildIIStroke()
      const sym3 = buildIIStroke()
      model.replaceSymbol("unknow", [sym2, sym3])
      expect(oldLength).toEqual(model.symbols.length)
      expect(model.symbols.find((s) => s.id === sym1.id)).toEqual(sym1)
      expect(model.symbols.find((s) => s.id === sym2.id)).toBeUndefined()
      expect(model.symbols.find((s) => s.id === sym3.id)).toBeUndefined()
    })
    test("should removeSymbol", () => {
      const oldLength = model.symbols.length
      model.removeSymbol(sym.id)
      expect(model.symbols).toHaveLength(oldLength - 1)
      expect(model.symbols.find((s) => s.id === sym.id)).toBeUndefined()
    })
    test("should not removeSymbol if id not exist", () => {
      const oldLength = model.symbols.length
      model.removeSymbol("not-exist")
      expect(model.symbols).toHaveLength(oldLength)
    })
  })

  describe("change symbol order", () => {
    const model = new IIModel()
    const sym1 = buildIIStroke()
    model.addSymbol(sym1)
    const sym2 = buildIIStroke()
    model.addSymbol(sym2)
    const sym3 = buildIIStroke()
    model.addSymbol(sym3)
    const sym4 = buildIIStroke()
    model.addSymbol(sym4)

    test("should do nothing when change symbol order not in model", () => {
      const symUnknow = buildIIStroke()
      model.changeOrderSymbol(symUnknow.id, "first")
      expect(model.symbols[0].id).toEqual(sym1.id)
      expect(model.symbols[1].id).toEqual(sym2.id)
      expect(model.symbols[2].id).toEqual(sym3.id)
      expect(model.symbols[3].id).toEqual(sym4.id)
    })
    test("should do nothing when change order to first if sym at first position", () => {
      expect(model.symbols[0].id).toEqual(sym1.id)
      model.changeOrderSymbol(sym1.id, "first")
      expect(model.symbols[0].id).toEqual(sym1.id)
    })
    test("should change order to first position", () => {
      expect(model.symbols[0].id).toEqual(sym1.id)
      model.changeOrderSymbol(sym3.id, "first")
      expect(model.symbols[0].id).toEqual(sym3.id)
    })
    test("should do nothing when change order last if sym at last position", () => {
      expect(model.symbols.at(-1)!.id).toEqual(sym4.id)
      model.changeOrderSymbol(sym4.id, "last")
      expect(model.symbols.at(-1)!.id).toEqual(sym4.id)
    })
    test("should change order to at last position", () => {
      expect(model.symbols.at(-1)!.id).toEqual(sym4.id)
      model.changeOrderSymbol(sym2.id, "last")
      expect(model.symbols.at(-1)!.id).toEqual(sym2.id)
    })
    test("should change order to forward", () => {
      expect(model.symbols.at(1)!.id).toEqual(sym1.id)
      model.changeOrderSymbol(sym3.id, "forward")
      expect(model.symbols.at(1)!.id).toEqual(sym3.id)
    })
    test("should do nothing when move last at forward", () => {
      expect(model.symbols.at(-1)!.id).toEqual(sym2.id)
      model.changeOrderSymbol(sym3.id, "forward")
      expect(model.symbols.at(-1)!.id).toEqual(sym2.id)
    })
    test("should move backward", () => {
      expect(model.symbols.at(0)!.id).toEqual(sym1.id)
      model.changeOrderSymbol(sym4.id, "backward")
      expect(model.symbols.at(0)!.id).toEqual(sym4.id)
    })
    test("should do nothing when move last at backward", () => {
      expect(model.symbols.at(0)!.id).toEqual(sym4.id)
      model.changeOrderSymbol(sym4.id, "backward")
      expect(model.symbols.at(0)!.id).toEqual(sym4.id)
    })
  })

  describe("get root symbol", () => {
    const model = new IIModel()

    const stroke1 = buildIIStroke()
    model.addSymbol(stroke1)

    const circle1 = buildIICircle({ center: { x: 200, y: rowHeight * 1.4 }, radius: 5 })
    model.addSymbol(circle1)

    test("shoud get symbol if stroke root", () => {
      expect(model.getRootSymbol(stroke1.id)).toEqual(stroke1)
    })
    test("shoud get symbol if circle root", () => {
      expect(model.getRootSymbol(circle1.id)).toEqual(circle1)
    })
    test("shoud get undefined if child of group root", () => {
      expect(model.getRootSymbol("pouet")).toBeUndefined()
    })
  })

  describe("selection", () => {
    const model = new IIModel()
    const stroke1 = buildIIStroke({ box: { height: 10, width: 10, x: 0, y: 0 } })
    model.addSymbol(stroke1)
    const stroke2 = buildIIStroke({ box: { height: 10, width: 10, x: 20, y: 0 } })
    model.addSymbol(stroke2)
    test("should select stroke when point on stroke", () => {
      model.selectSymbol(stroke1.id)
      expect(model.symbolsSelected).toHaveLength(1)
      expect(model.symbolsSelected[0].id).toEqual(stroke1.id)
    })
    test("should unselect stroke", () => {
      expect(model.symbolsSelected).toHaveLength(1)
      model.unselectSymbol(stroke1.id)
      expect(model.symbolsSelected).toHaveLength(0)
    })
    test("should not select the same stroke twice", () => {
      model.selectSymbol(stroke1.id)
      expect(model.symbolsSelected).toHaveLength(1)
      model.selectSymbol(stroke1.id)
      expect(model.symbolsSelected).toHaveLength(1)
    })
    test("should reset selection", () => {
      expect(model.symbolsSelected).toHaveLength(1)
      model.resetSelection()
      expect(model.symbolsSelected).toHaveLength(0)
    })
  })

  describe("extract", () => {
    const model = new IIModel()
    model.addSymbol(buildIIStroke())
    model.addSymbol(buildIIStroke())

    test("should extract symbol added in second model", () => {
      const newModel = model.clone()
      const newSymb = buildIIStroke()
      model.addSymbol(newSymb)
      const { added, removed } = model.extractDifferenceSymbols(newModel)
      expect(added).toEqual([newSymb])
      expect(removed).toEqual([])
    })
    test("should extract symbol removed in second model", () => {
      const newModel = model.clone()
      const newSymb = buildIIStroke()
      model.addSymbol(newSymb)
      const { added, removed } = newModel.extractDifferenceSymbols(model)
      expect(added).toEqual([])
      expect(removed).toEqual([newSymb])
    })
    test("should extract nothing if same model", () => {
      const { added, removed } = model.extractDifferenceSymbols(model)
      expect(added).toEqual([])
      expect(removed).toEqual([])
    })
  })

  describe("export", () => {
    const model = new IIModel()
    const e: TExport = { "text/plain": "poney" }
    test("should define export to undefined", () => {
      expect(model.exports).toBeUndefined()
    })
    test("should init export", () => {
      model.mergeExport(e)
      expect(model.exports).toEqual(e)
    })
    test("should merge export", () => {
      const newExport: TExport = {
        "application/vnd.myscript.jiix": {
          type: "Text",
          label: "poney",
          words: [
            {
              label: "poney",
              candidates: ["poney", "Poney", "ponay", "ponex", "pony"],
            },
          ],
          version: "3",
          id: "MainBlock",
        },
      }

      model.mergeExport(newExport)
      expect(model.exports).toMatchObject(newExport)
      expect(model.exports).toMatchObject(e)
    })
  })

  describe("clone", () => {
    const model = new IIModel()
    const stroke = buildIIStroke()
    model.addSymbol(stroke)
    model.exports = { "text/plain": "M" }
    test("should clone", () => {
      const clone = model.clone()
      expect(clone).toStrictEqual(model)
      expect(clone).not.toBe(model)
    })
  })

  describe("clear", () => {
    test("should clear model", () => {
      const model = new IIModel()
      model.addSymbol(buildIIStroke())
      expect(model.symbols).toHaveLength(1)

      model.clear()
      expect(model.symbols).toHaveLength(0)
    })
  })
})
