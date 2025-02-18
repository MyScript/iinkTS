import { Box, IIRecognizedCircle, TBox, SymbolType, RecognizedKind } from "../../../../src/symbol"
import { DefaultStyle, TStyle } from "../../../../src/style"
import { PartialDeep } from "../../../../src/utils"
import { buildOIStroke } from "../../helpers"

describe("IIRecognizedCircle.ts", () =>
{
  describe("instanciate", () =>
  {
    test("should create with default style", () =>
    {
      const stroke = buildOIStroke()
      const recognizedArc = new IIRecognizedCircle([stroke])
      expect(recognizedArc).toBeDefined()
      expect(recognizedArc.creationTime).toBeLessThanOrEqual(Date.now())
      expect(recognizedArc.creationTime).toEqual(recognizedArc.modificationDate)
      expect(recognizedArc.style).toEqual(expect.objectContaining(DefaultStyle))
      expect(recognizedArc.strokes).toEqual([stroke])
    })
    test("should create with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const stroke = buildOIStroke()
      const recognizedArc = new IIRecognizedCircle([stroke], style)
      expect(recognizedArc).toBeDefined()
      expect(recognizedArc.creationTime).toBeLessThanOrEqual(Date.now())
      expect(recognizedArc.creationTime).toEqual(recognizedArc.modificationDate)
      expect(recognizedArc.style).toEqual(expect.objectContaining(style))
      expect(recognizedArc.strokes).toEqual([stroke])
    })
  })

  describe("boundingBox", () =>
  {
    test("should get stroke bounds", () =>
    {
      const stroke = buildOIStroke()
      const recognizedArc = new IIRecognizedCircle([stroke])
      expect(recognizedArc.bounds.height).toEqual(stroke.bounds.height)
      expect(recognizedArc.bounds.width).toEqual(stroke.bounds.width)
      expect(recognizedArc.bounds.x).toEqual(stroke.bounds.x)
      expect(recognizedArc.bounds.y).toEqual(stroke.bounds.y)
    })
    test("should get strokes bounds", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const bounds = Box.createFromBoxes([stroke.bounds, stroke1.bounds])
      const recognizedArc = new IIRecognizedCircle([stroke])
      expect(recognizedArc.bounds.height).toEqual(bounds.height)
      expect(recognizedArc.bounds.width).toEqual(bounds.width)
      expect(recognizedArc.bounds.x).toEqual(bounds.x)
      expect(recognizedArc.bounds.y).toEqual(bounds.y)
    })
  })

  describe("overlaps", () =>
  {
    test("should call overlaps of each strokes", () =>
    {
      const stroke = buildOIStroke()
      stroke.overlaps = jest.fn()
      const stroke1 = buildOIStroke()
      stroke1.overlaps = jest.fn()
      const recognizedArc = new IIRecognizedCircle([stroke, stroke1])
      const boundingBox: TBox = { height: 10, width: 10, x: 1, y: 1 }
      recognizedArc.overlaps(boundingBox)
      expect(stroke.overlaps).toHaveBeenNthCalledWith(1, boundingBox)
      expect(stroke1.overlaps).toHaveBeenNthCalledWith(1, boundingBox)
    })
  })

  describe("containsStroke", () =>
  {
    test("should return true", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const recognizedArc = new IIRecognizedCircle([stroke, stroke1])
      expect(recognizedArc.containsStroke(stroke.id)).toEqual(true)
    })
    test("should return false", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const recognizedArc = new IIRecognizedCircle([stroke, stroke1])
      expect(recognizedArc.containsStroke("fake-id")).toEqual(false)
    })
  })

  describe("removeStrokes", () =>
  {
    test("should remove one stroke", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const recognizedArc = new IIRecognizedCircle([stroke, stroke1])
      recognizedArc.removeStrokes([stroke.id])
      expect(recognizedArc.strokes).toEqual([stroke1])
    })
    test("should remove all strokes", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const recognizedArc = new IIRecognizedCircle([stroke, stroke1])
      recognizedArc.removeStrokes([stroke.id, stroke1.id])
      expect(recognizedArc.strokes).toEqual([])
    })
  })

  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const stroke = buildOIStroke()
      const recognizedArc = new IIRecognizedCircle([stroke], style)

      const clone = recognizedArc.clone()
      expect(clone).toEqual(recognizedArc)
      expect(clone).not.toBe(recognizedArc)
    })
  })

  describe("toJSON", () =>
  {
    test("should get json", () =>
    {
      const stroke = buildOIStroke()
      const recognizedArc = new IIRecognizedCircle([stroke])
      const json = recognizedArc.toJSON()
      expect(json).toEqual({
        id: recognizedArc.id,
        type: SymbolType.Recognized,
        kind: RecognizedKind.Circle,
        strokes: [stroke.toJSON()]
      })
    })
    test("should equal to JSON.parse -> JSON.stringify", () =>
    {
      const stroke = buildOIStroke()
      const recognizedArc = new IIRecognizedCircle([stroke])
      const json = JSON.parse(JSON.stringify(recognizedArc))
      expect(json).toEqual(recognizedArc.toJSON())
    })
  })

  describe("create", () =>
  {
    test("should throw error no strokes", () =>
    {
      const partial: PartialDeep<IIRecognizedCircle> = {
      }
      expect(() => IIRecognizedCircle.create(partial)).toThrow("no strokes")
    })
    test("should create clone from json", () =>
    {
      const stroke = buildOIStroke()
      const recognizedArc = new IIRecognizedCircle([stroke])
      const json = JSON.parse(JSON.stringify(recognizedArc))
      const newRecognizedArc = IIRecognizedCircle.create(json)
      expect(newRecognizedArc.toJSON()).toEqual(recognizedArc.toJSON())
    })
  })
})
