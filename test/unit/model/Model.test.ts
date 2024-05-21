import { buildStroke, delay } from "../helpers"
import { Model, Stroke, DefaultPenStyle, TExport, TPointer } from "../../../src/iink"

describe("Model.ts", () =>
{
  const width = 100, height = 100, rowHeight = 10
  test("should create", () =>
  {
    const model= new Model(width, height, rowHeight)
    expect(model).toBeDefined()
  })

  describe("mergeExport", () =>
  {
    test("should initialize export if toBeUndefined", () =>
    {
      const model= new Model(width, height, rowHeight)
      const e: TExport = { "text/plain": "poney" }
      expect(model.exports).toBeUndefined()
      model.mergeExport(e)
      expect(model.exports).toEqual(e)
    })
    test("should merge export", () =>
    {
      const model= new Model(width, height, rowHeight)
      const originExport: TExport = {
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
      model.exports = originExport
      const e: TExport = { "text/plain": "poney" }

      model.mergeExport(e)
      expect(model.exports).toMatchObject(originExport)
      expect(model.exports).toMatchObject(e)
    })
  })

  describe("addPoint", () =>
  {
    const model= new Model(width, height, rowHeight)
    test("should add point to x, y, p & t array", () =>
    {
      const stroke = new Stroke(DefaultPenStyle)
      const point: TPointer = {
        t: 1,
        p: 0.5,
        x: 1,
        y: 1
      }
      model.addPoint(stroke, point)

      expect(stroke.pointers).toHaveLength(1)
      expect(stroke.pointers[0].x).toBe(point.x)
      expect(stroke.pointers[0].y).toBe(point.y)
      expect(stroke.pointers[0].p).toBe(point.p)
      expect(stroke.pointers[0].t).toBe(point.t)
    })

    test("should not add point if x is too close", () =>
    {
      const stroke = new Stroke(DefaultPenStyle)
      const point: TPointer = {
        t: 10,
        p: 10,
        x: 1,
        y: 10
      }
      model.addPoint(stroke, point)
      expect(stroke.pointers).toHaveLength(1)
      model.addPoint(stroke, point)
      expect(stroke.pointers).toHaveLength(1)
    })

    test("should not add point if y is too close", () =>
    {
      const stroke = new Stroke(DefaultPenStyle)
      const point: TPointer = {
        t: 10,
        p: 10,
        x: 10,
        y: 1
      }
      model.addPoint(stroke, point)
      expect(stroke.pointers).toHaveLength(1)
      model.addPoint(stroke, point)
      expect(stroke.pointers).toHaveLength(1)
    })
  })

  describe("updateStroke", () =>
  {
    test("should updateStroke", () =>
    {
      const model= new Model(width, height, rowHeight)
      const stroke = new Stroke(DefaultPenStyle)
      for (let index = 0; index < 10; index++) {
        stroke.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke)
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0]).toStrictEqual(stroke)
      const strokeUpdated = new Stroke(DefaultPenStyle)
      strokeUpdated.id = stroke.id
      strokeUpdated.pointers.push({ p: 0.5, t: 0.5, x: 100, y: 27 })
      model.updateStroke(strokeUpdated)
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0]).toStrictEqual(strokeUpdated)
    })
    test("should not updateStroke if id not exist", () =>
    {
      const model= new Model(width, height, rowHeight)
      const stroke = new Stroke(DefaultPenStyle)
      for (let index = 0; index < 10; index++) {
        stroke.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke)
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0]).toStrictEqual(stroke)
      const strokeUpdated = new Stroke(DefaultPenStyle)
      strokeUpdated.id = "pouette"
      strokeUpdated.pointers.push({ p: 0.5, t: 0.5, x: 100, y: 27 })
      model.updateStroke(strokeUpdated)
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0]).not.toStrictEqual(strokeUpdated)
      expect(model.symbols[0]).toStrictEqual(stroke)
    })
  })

  describe("removeStroke", () =>
  {
    test("should removeStroke", () =>
    {
      const model= new Model(width, height, rowHeight)
      const stroke = new Stroke(DefaultPenStyle)
      for (let index = 0; index < 10; index++) {
        stroke.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke)
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0]).toStrictEqual(stroke)
      model.removeStroke(stroke.id)
      expect(model.symbols).toHaveLength(0)
    })
    test("should not removeStroke if id not exist", () =>
    {
      const model= new Model(width, height, rowHeight)
      const stroke = new Stroke(DefaultPenStyle)
      for (let index = 0; index < 10; index++) {
        stroke.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke)
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0]).toStrictEqual(stroke)
      model.removeStroke("pouette")
      expect(model.symbols).toHaveLength(1)
    })
  })

  describe("strokes", () =>
  {
    test("should addStrokes", () =>
    {
      const model= new Model(width, height, rowHeight)
      const stroke = new Stroke(DefaultPenStyle)
      model.addStroke(stroke)
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0]).toStrictEqual(stroke)
    })

    test("should extractUnsentStrokes", () =>
    {
      const model= new Model(width, height, rowHeight)
      const stroke = new Stroke(DefaultPenStyle)
      model.addStroke(stroke)
      expect(model.symbols).toHaveLength(1)
      const extractStroke = model.extractUnsentStrokes()
      expect(extractStroke).toHaveLength(1)
      expect(extractStroke[0]).toStrictEqual(stroke)
      expect(model.symbols).toHaveLength(1)
    })
  })

  describe("currentSymbol", () =>
  {
    const model= new Model(width, height, rowHeight)
    test("should initCurrentStroke", async () =>
    {
      expect(model.currentSymbol).toBeUndefined()
      const point: TPointer = {
        t: 1,
        p: 0.5,
        x: 1,
        y: 1
      }
      expect(model.creationTime).toStrictEqual(model.modificationDate)
      await delay(100)
      model.initCurrentStroke(point, "mouse", DefaultPenStyle)
      expect(model.modificationDate - model.creationTime).toBeGreaterThanOrEqual(100)
      expect(model.currentSymbol).toBeDefined()
      expect(model.currentSymbol?.style["-myscript-pen-fill-color"]).toBe(DefaultPenStyle["-myscript-pen-fill-color"])
      expect(model.currentSymbol?.style["-myscript-pen-fill-style"]).toBe(DefaultPenStyle["-myscript-pen-fill-style"])
      expect(model.currentSymbol?.style["-myscript-pen-width"]).toBe(DefaultPenStyle["-myscript-pen-width"])
      expect(model.currentSymbol?.style.color).toBe(DefaultPenStyle.color)
      expect(model.currentSymbol?.style.width).toBe(DefaultPenStyle.width)
      expect(model.currentSymbol?.pointers).toHaveLength(1)
      expect(model.currentSymbol?.pointers[0].x).toBe(point.x)
      expect(model.currentSymbol?.pointers[0].y).toBe(point.y)
      expect(model.currentSymbol?.pointers[0].t).toBe(point.t)
      expect(model.currentSymbol?.pointers[0].p).toBe(point.p)
    })
    test("should initCurrentStroke with -myscript-pen-width", async () =>
    {
      const _model= new Model(width, height, rowHeight)
      const point: TPointer = {
        t: 1,
        p: 0.5,
        x: 1,
        y: 1
      }
      const style = { ...DefaultPenStyle }
      style["-myscript-pen-width"] = 2
      expect(_model.creationTime).toStrictEqual(_model.modificationDate)
      await delay(101)
      _model.initCurrentStroke(point, "mouse", style)
      expect(_model.modificationDate - _model.creationTime).toBeGreaterThanOrEqual(100)
      expect(_model.currentSymbol).toBeDefined()
      expect(_model.currentSymbol?.style["-myscript-pen-fill-color"]).toBe(style["-myscript-pen-fill-color"])
      expect(_model.currentSymbol?.style["-myscript-pen-fill-style"]).toBe(style["-myscript-pen-fill-style"])
      expect(_model.currentSymbol?.style["-myscript-pen-width"]).toBe(style["-myscript-pen-width"])
      expect(_model.currentSymbol?.style.color).toBe(style.color)
      expect(_model.currentSymbol?.style.width).toBe(style.width)
      expect(model.currentSymbol?.pointers).toHaveLength(1)
      expect(model.currentSymbol?.pointers[0].x).toBe(point.x)
      expect(model.currentSymbol?.pointers[0].y).toBe(point.y)
      expect(model.currentSymbol?.pointers[0].t).toBe(point.t)
      expect(model.currentSymbol?.pointers[0].p).toBe(point.p)
    })

    test("should appendToCurrentStroke", () =>
    {
      expect(model.currentSymbol).toBeDefined()
      const point: TPointer = {
        t: 15,
        p: 15,
        x: 15,
        y: 15
      }
      model.appendToCurrentStroke(point)
      expect(model.currentSymbol?.style["-myscript-pen-fill-color"]).toBe(DefaultPenStyle["-myscript-pen-fill-color"])
      expect(model.currentSymbol?.style["-myscript-pen-fill-style"]).toBe(DefaultPenStyle["-myscript-pen-fill-style"])
      expect(model.currentSymbol?.style["-myscript-pen-width"]).toBe(DefaultPenStyle["-myscript-pen-width"])
      expect(model.currentSymbol?.style.color).toBe(DefaultPenStyle.color)
      expect(model.currentSymbol?.style.width).toBe(DefaultPenStyle.width)
      expect(model.currentSymbol?.pointers).toHaveLength(2)
      expect(model.currentSymbol?.pointers[1].x).toBe(point.x)
      expect(model.currentSymbol?.pointers[1].y).toBe(point.y)
      expect(model.currentSymbol?.pointers[1].t).toBe(point.t)
      expect(model.currentSymbol?.pointers[1].p).toBe(point.p)
    })

    test("should endCurrentStroke", () =>
    {
      model.addPoint = jest.fn()
      model.addStroke = jest.fn()
      expect(model.currentSymbol).toBeDefined()
      const currentSymbol = { ...model.currentSymbol }
      const point: TPointer = {
        t: 25,
        p: 25,
        x: 25,
        y: 25
      }
      model.endCurrentStroke(point)
      expect(model.currentSymbol).toBeUndefined()
      expect(model.addPoint).toBeCalledTimes(1)
      expect(model.addPoint).toBeCalledWith(currentSymbol, point)
      expect(model.addStroke).toBeCalledTimes(1)
      expect(model.addStroke).toBeCalledWith(currentSymbol)
    })
  })

  describe("removeStrokesFromPoint", () =>
  {
    test("shoud remove stroke when point on stroke", () =>
    {
      const model= new Model(27, 5)
      const stroke1 = new Stroke(DefaultPenStyle)
      stroke1.id = "stroke-1"
      for (let index = 0; index < 20; index++) {
        stroke1.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke1)
      const stroke2 = new Stroke(DefaultPenStyle)
      stroke2.id = "stroke-2"
      for (let index = 30; index < 40; index++) {
        stroke2.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke2)
      expect(model.symbols).toHaveLength(2)
      const idsRemoves = model.removeStrokesFromPoint({ x: 1, y: 1 })
      expect(idsRemoves).toHaveLength(1)
      expect(idsRemoves[0]).toEqual("stroke-1")
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0].id).toEqual("stroke-2")
    })
    test("should remove the stroke when the point is at a distance less than 10", () =>
    {
      const model= new Model(27, 5)
      const stroke1 = new Stroke(DefaultPenStyle)
      stroke1.id = "stroke-1"
      for (let index = 0; index < 20; index++) {
        stroke1.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke1)
      const stroke2 = new Stroke(DefaultPenStyle)
      stroke2.id = "stroke-2"
      for (let index = 30; index < 40; index++) {
        stroke2.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke2)
      expect(model.symbols).toHaveLength(2)
      const idsRemoves = model.removeStrokesFromPoint({ x: 36, y: 41 })
      expect(idsRemoves).toHaveLength(1)
      expect(idsRemoves[0]).toEqual("stroke-2")
      expect(model.symbols).toHaveLength(1)
      expect(model.symbols[0].id).toEqual("stroke-1")
    })
    test("should not remove the stroke when the point is at a distance less than 10", () =>
    {
      const model= new Model(27, 5)
      const stroke1 = new Stroke(DefaultPenStyle)
      stroke1.id = "stroke-1"
      for (let index = 0; index < 20; index++) {
        stroke1.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke1)
      const stroke2 = new Stroke(DefaultPenStyle)
      stroke2.id = "stroke-2"
      for (let index = 30; index < 40; index++) {
        stroke2.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke2)
      expect(model.symbols).toHaveLength(2)
      const idsRemoves = model.removeStrokesFromPoint({ x: 56, y: 51 })
      expect(idsRemoves).toHaveLength(0)
      expect(model.symbols).toHaveLength(2)
    })
  })

  describe("position", () =>
  {
    const model= new Model(width, height, rowHeight)
    test("should initialize position", () =>
    {
      expect(model.positions.lastReceivedPosition).toBe(0)
      expect(model.positions.lastSentPosition).toBe(0)
    })
    test("should updatePositionSent", () =>
    {
      model.updatePositionSent(5)
      expect(model.positions.lastSentPosition).toBe(5)
    })
    test("should updatePositionReceived", () =>
    {
      model.updatePositionReceived()
      expect(model.positions.lastReceivedPosition).toBe(model.positions.lastSentPosition)
    })
  })

  describe("clone", () =>
  {
    const model= new Model(27, 5)
    const stroke = buildStroke()
    model.addStroke(stroke)
    model.initCurrentStroke({ p: 27, t: 5, x: 1989, y: 42 }, "pen", DefaultPenStyle)
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
      const model= new Model(width, height, rowHeight)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 10, x: 10, y: 10 }
      const p3: TPointer = { t: 10, p: 10, x: 10, y: 10 }

      model.initCurrentStroke(p1, "mouse", DefaultPenStyle)
      model.endCurrentStroke(p2)
      model.initCurrentStroke(p3, "mouse", DefaultPenStyle)
      expect(model.currentSymbol).toBeDefined()
      expect(model.symbols).toHaveLength(1)

      model.clear()
      expect(model.currentSymbol).toBeUndefined()
      expect(model.symbols).toHaveLength(0)
    })
  })

})
