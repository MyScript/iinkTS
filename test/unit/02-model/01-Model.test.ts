import { buildStroke, delay } from "../utils/helpers"
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
      const stroke = new Stroke(DefaultPenStyle, 1)
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
      const stroke = new Stroke(DefaultPenStyle, 1)
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
      const stroke = new Stroke(DefaultPenStyle, 1)
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
      const stroke = new Stroke(DefaultPenStyle, 1)
      for (let index = 0; index < 10; index++) {
        stroke.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke)
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0]).toStrictEqual(stroke)
      const strokeUpdated = new Stroke(DefaultPenStyle, 1)
      strokeUpdated.id = stroke.id
      strokeUpdated.pointers.push({ p: 0.5, t: 0.5, x: 100, y: 27 })
      model.updateStroke(strokeUpdated)
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0]).toStrictEqual(strokeUpdated)
    })
    test("should not updateStroke if id not exist", () =>
    {
      const model= new Model(width, height, rowHeight)
      const stroke = new Stroke(DefaultPenStyle, 1)
      for (let index = 0; index < 10; index++) {
        stroke.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke)
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0]).toStrictEqual(stroke)
      const strokeUpdated = new Stroke(DefaultPenStyle, 1)
      strokeUpdated.id = "pouette"
      strokeUpdated.pointers.push({ p: 0.5, t: 0.5, x: 100, y: 27 })
      model.updateStroke(strokeUpdated)
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0]).not.toStrictEqual(strokeUpdated)
      expect(model.strokes[0]).toStrictEqual(stroke)
    })
  })

  describe("removeStroke", () =>
  {
    test("should removeStroke", () =>
    {
      const model= new Model(width, height, rowHeight)
      const stroke = new Stroke(DefaultPenStyle, 1)
      for (let index = 0; index < 10; index++) {
        stroke.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke)
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0]).toStrictEqual(stroke)
      model.removeStroke(stroke.id)
      expect(model.strokes).toHaveLength(0)
    })
    test("should not removeStroke if id not exist", () =>
    {
      const model= new Model(width, height, rowHeight)
      const stroke = new Stroke(DefaultPenStyle, 1)
      for (let index = 0; index < 10; index++) {
        stroke.pointers.push({
          p: 1,
          t: index,
          x: index,
          y: index
        })
      }
      model.addStroke(stroke)
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0]).toStrictEqual(stroke)
      model.removeStroke("pouette")
      expect(model.strokes).toHaveLength(1)
    })
  })

  describe("strokes", () =>
  {
    test("should addStrokes", () =>
    {
      const model= new Model(width, height, rowHeight)
      const stroke = new Stroke(DefaultPenStyle, 1)
      model.addStroke(stroke)
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0]).toStrictEqual(stroke)
    })

    test("should extractUnsentStrokes", () =>
    {
      const model= new Model(width, height, rowHeight)
      const stroke = new Stroke(DefaultPenStyle, 1)
      model.addStroke(stroke)
      expect(model.strokes).toHaveLength(1)
      const extractStroke = model.extractUnsentStrokes()
      expect(extractStroke).toHaveLength(1)
      expect(extractStroke[0]).toStrictEqual(stroke)
      expect(model.strokes).toHaveLength(1)
    })

    test("should extractDifferenceStrokes", async () =>
    {
      const model1= new Model(width, height, rowHeight)
      const strokeNotModified = new Stroke(DefaultPenStyle, 1)
      strokeNotModified.id = "stroke-not-modified"
      model1.addPoint(strokeNotModified, { p: 5, t: 5, x: 5, y: 5 })
      model1.addStroke(strokeNotModified)

      const strokeModified = new Stroke(DefaultPenStyle, 1)
      strokeModified.id = "stroke-modified"
      model1.addPoint(strokeModified, { p: 5, t: 5, x: 5, y: 5 })
      model1.addStroke(strokeModified)

      const stroke1 = new Stroke(DefaultPenStyle, 1)
      stroke1.id = "stroke-1"
      model1.addPoint(stroke1, { p: 1, t: 1, x: 1, y: 1 })
      model1.addStroke(stroke1)

      const model2 = model1.getClone()
      const stroke2 = new Stroke(DefaultPenStyle, 1)
      stroke2.id = "stroke-2"
      model2.addPoint(stroke2, { p: 2, t: 2, x: 2, y: 2 })
      model2.addStroke(stroke2)
      model2.removeStroke(stroke1.id)

      await delay(50)
      model1.addPoint(strokeModified, { p: 3, t: 3, x: 3, y: 3 })
      model1.updateStroke(strokeModified)

      expect(model1.strokes).toHaveLength(3)
      expect(model2.strokes).toHaveLength(3)
      const extractStroke = model1.extractDifferenceStrokes(model2)
      expect(extractStroke.newStrokes).toHaveLength(2)
      expect(extractStroke.newStrokes.find(s => s.id === stroke1.id)).toEqual(stroke1)
      expect(extractStroke.newStrokes.find(s => s.id === strokeModified.id)).toEqual(strokeModified)
      expect(extractStroke.deletedStrokes).toHaveLength(2)
      expect(extractStroke.deletedStrokes.find(s => s.id === stroke2.id)).toEqual(stroke2)
      expect(extractStroke.deletedStrokes.find(s => s.id === strokeModified.id)).toBeDefined()
    })
  })

  describe("currentStroke", () =>
  {
    const model= new Model(width, height, rowHeight)
    test("should initCurrentStroke", async () =>
    {
      expect(model.currentStroke).toBeUndefined()
      const point: TPointer = {
        t: 1,
        p: 0.5,
        x: 1,
        y: 1
      }
      expect(model.creationTime).toStrictEqual(model.modificationDate)
      await delay(100)
      model.initCurrentStroke(point, 42, "mouse", DefaultPenStyle)
      expect(model.modificationDate - model.creationTime).toBeGreaterThanOrEqual(100)
      expect(model.currentStroke).toBeDefined()
      expect(model.currentStroke?.style["-myscript-pen-fill-color"]).toBe(DefaultPenStyle["-myscript-pen-fill-color"])
      expect(model.currentStroke?.style["-myscript-pen-fill-style"]).toBe(DefaultPenStyle["-myscript-pen-fill-style"])
      expect(model.currentStroke?.style["-myscript-pen-width"]).toBe(DefaultPenStyle["-myscript-pen-width"])
      expect(model.currentStroke?.style.color).toBe(DefaultPenStyle.color)
      expect(model.currentStroke?.style.width).toBe(DefaultPenStyle.width)
      expect(model.currentStroke?.pointers).toHaveLength(1)
      expect(model.currentStroke?.pointers[0].x).toBe(point.x)
      expect(model.currentStroke?.pointers[0].y).toBe(point.y)
      expect(model.currentStroke?.pointers[0].t).toBe(point.t)
      expect(model.currentStroke?.pointers[0].p).toBe(point.p)
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
      _model.initCurrentStroke(point, 42, "mouse", style)
      expect(_model.modificationDate - _model.creationTime).toBeGreaterThanOrEqual(100)
      expect(_model.currentStroke).toBeDefined()
      expect(_model.currentStroke?.style["-myscript-pen-fill-color"]).toBe(style["-myscript-pen-fill-color"])
      expect(_model.currentStroke?.style["-myscript-pen-fill-style"]).toBe(style["-myscript-pen-fill-style"])
      expect(_model.currentStroke?.style["-myscript-pen-width"]).toBe(style["-myscript-pen-width"])
      expect(_model.currentStroke?.style.color).toBe(style.color)
      expect(_model.currentStroke?.style.width).toBe(style.width)
      expect(model.currentStroke?.pointers).toHaveLength(1)
      expect(model.currentStroke?.pointers[0].x).toBe(point.x)
      expect(model.currentStroke?.pointers[0].y).toBe(point.y)
      expect(model.currentStroke?.pointers[0].t).toBe(point.t)
      expect(model.currentStroke?.pointers[0].p).toBe(point.p)
    })

    test("should appendToCurrentStroke", () =>
    {
      expect(model.currentStroke).toBeDefined()
      const point: TPointer = {
        t: 15,
        p: 15,
        x: 15,
        y: 15
      }
      model.appendToCurrentStroke(point)
      expect(model.currentStroke?.style["-myscript-pen-fill-color"]).toBe(DefaultPenStyle["-myscript-pen-fill-color"])
      expect(model.currentStroke?.style["-myscript-pen-fill-style"]).toBe(DefaultPenStyle["-myscript-pen-fill-style"])
      expect(model.currentStroke?.style["-myscript-pen-width"]).toBe(DefaultPenStyle["-myscript-pen-width"])
      expect(model.currentStroke?.style.color).toBe(DefaultPenStyle.color)
      expect(model.currentStroke?.style.width).toBe(DefaultPenStyle.width)
      expect(model.currentStroke?.pointers).toHaveLength(2)
      expect(model.currentStroke?.pointers[1].x).toBe(point.x)
      expect(model.currentStroke?.pointers[1].y).toBe(point.y)
      expect(model.currentStroke?.pointers[1].t).toBe(point.t)
      expect(model.currentStroke?.pointers[1].p).toBe(point.p)
    })

    test("should endCurrentStroke", () =>
    {
      model.addPoint = jest.fn()
      model.addStroke = jest.fn()
      expect(model.currentStroke).toBeDefined()
      const currentStroke = { ...model.currentStroke }
      const point: TPointer = {
        t: 25,
        p: 25,
        x: 25,
        y: 25
      }
      model.endCurrentStroke(point)
      expect(model.currentStroke).toBeUndefined()
      expect(model.addPoint).toBeCalledTimes(1)
      expect(model.addPoint).toBeCalledWith(currentStroke, point)
      expect(model.addStroke).toBeCalledTimes(1)
      expect(model.addStroke).toBeCalledWith(currentStroke)
    })
  })

  describe("removeStrokesFromPoint", () =>
  {
    test("shoud remove stroke when point on stroke", () =>
    {
      const model= new Model(27, 5)
      const stroke1 = new Stroke(DefaultPenStyle, 1)
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
      const stroke2 = new Stroke(DefaultPenStyle, 1)
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
      expect(model.strokes).toHaveLength(2)
      const idsRemoves = model.removeStrokesFromPoint({ x: 1, y: 1 })
      expect(idsRemoves).toHaveLength(1)
      expect(idsRemoves[0]).toEqual("stroke-1")
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0].id).toEqual("stroke-2")
    })
    test("should remove the stroke when the point is at a distance less than 10", () =>
    {
      const model= new Model(27, 5)
      const stroke1 = new Stroke(DefaultPenStyle, 1)
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
      const stroke2 = new Stroke(DefaultPenStyle, 1)
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
      expect(model.strokes).toHaveLength(2)
      const idsRemoves = model.removeStrokesFromPoint({ x: 36, y: 41 })
      expect(idsRemoves).toHaveLength(1)
      expect(idsRemoves[0]).toEqual("stroke-2")
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0].id).toEqual("stroke-1")
    })
    test("should not remove the stroke when the point is at a distance less than 10", () =>
    {
      const model= new Model(27, 5)
      const stroke1 = new Stroke(DefaultPenStyle, 1)
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
      const stroke2 = new Stroke(DefaultPenStyle, 1)
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
      expect(model.strokes).toHaveLength(2)
      const idsRemoves = model.removeStrokesFromPoint({ x: 56, y: 51 })
      expect(idsRemoves).toHaveLength(0)
      expect(model.strokes).toHaveLength(2)
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
    model.initCurrentStroke({ p: 27, t: 5, x: 1989, y: 42 }, 666, "pen", DefaultPenStyle)
    model.exports = { "text/plain": "M" }
    test("should getClone", () =>
    {
      const clone = model.getClone()
      expect(clone != model).toBeTruthy()
      expect(clone.currentStroke).toEqual(model.currentStroke)
      expect(clone.currentStroke).not.toBe(model.currentStroke)

      expect(clone.exports).toEqual(model.exports)
      expect(clone.exports).not.toBe(model.exports)

      expect(clone.height).toEqual(model.height)

      expect(clone.idle).toEqual(model.idle)

      expect(clone.positions).toEqual(model.positions)
      expect(clone.positions).not.toBe(model.positions)

      expect(clone.strokes).toEqual(model.strokes)
      expect(clone.strokes).not.toBe(model.strokes)

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

      model.initCurrentStroke(p1, 42, "mouse", DefaultPenStyle)
      model.endCurrentStroke(p2)
      model.initCurrentStroke(p3, 51, "mouse", DefaultPenStyle)
      expect(model.currentStroke).toBeDefined()
      expect(model.strokes).toHaveLength(1)

      model.clear()
      expect(model.currentStroke).toBeUndefined()
      expect(model.strokes).toHaveLength(0)
    })
  })

})
