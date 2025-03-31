import { buildStrokeV2 } from "../helpers"
import { IModel, IIStroke, DefaultPenStyle, TExportV2 } from "../../../src/iink"

describe("IModel.ts", () =>
{
  const width = 100, height = 100, rowHeight = 10
  test("should create", () =>
  {
    const model= new IModel(width, height, rowHeight)
    expect(model).toBeDefined()
  })

  describe("mergeExport", () =>
  {
    test("should initialize export if toBeUndefined", () =>
    {
      const model= new IModel(width, height, rowHeight)
      const e: TExportV2 = { "text/plain": "poney" }
      expect(model.exports).toBeUndefined()
      model.mergeExport(e)
      expect(model.exports).toEqual(e)
    })
  })

  describe("updateStroke", () =>
  {
    test("should updateStroke", () =>
    {
      const model= new IModel(width, height, rowHeight)
      const stroke = new IIStroke(DefaultPenStyle)
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
      const strokeUpdated = new IIStroke(DefaultPenStyle)
      strokeUpdated.id = stroke.id
      strokeUpdated.pointers.push({ p: 0.5, t: 0.5, x: 100, y: 27 })
      model.updateStroke(strokeUpdated)
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0]).toStrictEqual(strokeUpdated)
    })
    test("should not updateStroke if id not exist", () =>
    {
      const model= new IModel(width, height, rowHeight)
      const stroke = new IIStroke(DefaultPenStyle)
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
      const strokeUpdated = new IIStroke(DefaultPenStyle)
      strokeUpdated.id = "pouette"
      strokeUpdated.pointers.push({ p: 0.5, t: 0.5, x: 100, y: 27 })
      model.updateStroke(strokeUpdated)
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0]).not.toStrictEqual(strokeUpdated)
      expect(model.strokes[0]).toStrictEqual(stroke)
    })
  })

  describe("strokes", () =>
  {
    test("should addStrokes", () =>
    {
      const model= new IModel(width, height, rowHeight)
      const stroke = new IIStroke(DefaultPenStyle)
      model.addStroke(stroke)
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes[0]).toStrictEqual(stroke)
    })

    test("should extractUnsentStrokes", () =>
    {
      const model= new IModel(width, height, rowHeight)
      const stroke = new IIStroke(DefaultPenStyle)
      model.addStroke(stroke)
      expect(model.strokes).toHaveLength(1)
      expect(model.strokes).toHaveLength(1)
    })
  })

  describe("clone", () =>
  {
    const model= new IModel(27, 5)
    const stroke = buildStrokeV2()
    model.addStroke(stroke)
    model.currentStroke = stroke
    model.exports = { "text/plain": "M" }
    test("should clone", () =>
    {
      const clone = model.clone()
      expect(clone != model).toBeTruthy()
      expect(clone.currentStroke).not.toBe(model.currentStroke)

      expect(clone.exports).toEqual(model.exports)
      expect(clone.exports).not.toBe(model.exports)

      expect(clone.height).toEqual(model.height)

      expect(clone.idle).toEqual(model.idle)

      expect(clone.strokes).toEqual(model.strokes)
      expect(clone.strokes).not.toBe(model.strokes)

      expect(clone.width).toEqual(model.width)
    })
  })

  describe("clear", () =>
  {
    test("should clear model", () =>
    {
      const model= new IModel(width, height, rowHeight)
      const stroke = buildStrokeV2()
      model.addStroke(stroke)

      model.currentStroke = stroke
      expect(model.currentStroke).toBeDefined()
      expect(model.strokes).toHaveLength(1)

      model.clear()
      expect(model.currentStroke).toBeUndefined()
      expect(model.strokes).toHaveLength(0)
    })
  })

})
