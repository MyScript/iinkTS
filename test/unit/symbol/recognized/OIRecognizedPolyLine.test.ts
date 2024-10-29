import { Box, OIRecognizedPolyLine, TBox, SymbolType, RecognizedKind } from "../../../../src/symbol"
import { DefaultStyle, TStyle } from "../../../../src/style"
import { PartialDeep } from "../../../../src/utils"
import { buildOIStroke } from "../../helpers"

describe("OIRecognizedPolyLine.ts", () =>
{
  describe("instanciate", () =>
  {
    test("should create with default style", () =>
    {
      const stroke = buildOIStroke()
      const symbol = new OIRecognizedPolyLine([stroke])
      expect(symbol).toBeDefined()
      expect(symbol.creationTime).toBeLessThanOrEqual(Date.now())
      expect(symbol.creationTime).toEqual(symbol.modificationDate)
      expect(symbol.style).toEqual(expect.objectContaining(DefaultStyle))
      expect(symbol.strokes).toEqual([stroke])
    })
    test("should create with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const stroke = buildOIStroke()
      const symbol = new OIRecognizedPolyLine([stroke], style)
      expect(symbol).toBeDefined()
      expect(symbol.creationTime).toBeLessThanOrEqual(Date.now())
      expect(symbol.creationTime).toEqual(symbol.modificationDate)
      expect(symbol.style).toEqual(expect.objectContaining(style))
      expect(symbol.strokes).toEqual([stroke])
    })
  })

  describe("boundingBox", () =>
  {
    test("should get stroke bounds", () =>
    {
      const stroke = buildOIStroke()
      const symbol = new OIRecognizedPolyLine([stroke])
      expect(symbol.bounds.height).toEqual(stroke.bounds.height)
      expect(symbol.bounds.width).toEqual(stroke.bounds.width)
      expect(symbol.bounds.x).toEqual(stroke.bounds.x)
      expect(symbol.bounds.y).toEqual(stroke.bounds.y)
    })
    test("should get strokes bounds", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const bounds = Box.createFromBoxes([stroke.bounds, stroke1.bounds])
      const symbol = new OIRecognizedPolyLine([stroke])
      expect(symbol.bounds.height).toEqual(bounds.height)
      expect(symbol.bounds.width).toEqual(bounds.width)
      expect(symbol.bounds.x).toEqual(bounds.x)
      expect(symbol.bounds.y).toEqual(bounds.y)
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
      const symbol = new OIRecognizedPolyLine([stroke, stroke1])
      const boundingBox: TBox = { height: 10, width: 10, x: 1, y: 1 }
      symbol.overlaps(boundingBox)
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
      const symbol = new OIRecognizedPolyLine([stroke, stroke1])
      expect(symbol.containsStroke(stroke.id)).toEqual(true)
    })
    test("should return false", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const symbol = new OIRecognizedPolyLine([stroke, stroke1])
      expect(symbol.containsStroke("fake-id")).toEqual(false)
    })
  })

  describe("removeStrokes", () =>
  {
    test("should remove one stroke", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const symbol = new OIRecognizedPolyLine([stroke, stroke1])
      symbol.removeStrokes([stroke.id])
      expect(symbol.strokes).toEqual([stroke1])
    })
    test("should remove all strokes", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const symbol = new OIRecognizedPolyLine([stroke, stroke1])
      symbol.removeStrokes([stroke.id, stroke1.id])
      expect(symbol.strokes).toEqual([])
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
      const symbol = new OIRecognizedPolyLine([stroke], style)

      const clone = symbol.clone()
      expect(clone).toEqual(symbol)
      expect(clone).not.toBe(symbol)
    })
  })

  describe("toJSON", () =>
  {
    test("should get json", () =>
    {
      const stroke = buildOIStroke()
      const symbol = new OIRecognizedPolyLine([stroke])
      const json = symbol.toJSON()
      expect(json).toEqual({
        id: symbol.id,
        type: SymbolType.Recognized,
        kind: RecognizedKind.PolyEdge,
        strokes: [stroke.toJSON()]
      })
    })
    test("should equal to JSON.parse -> JSON.stringify", () =>
    {
      const stroke = buildOIStroke()
      const symbol = new OIRecognizedPolyLine([stroke])
      const json = JSON.parse(JSON.stringify(symbol))
      expect(json).toEqual(symbol.toJSON())
    })
  })

  describe("create", () =>
  {
    test("should throw error no strokes", () =>
    {
      const partial: PartialDeep<OIRecognizedPolyLine> = {
      }
      expect(() => OIRecognizedPolyLine.create(partial)).toThrow("no strokes")
    })
    test("should create clone from json", () =>
    {
      const stroke = buildOIStroke()
      const symbol = new OIRecognizedPolyLine([stroke])
      const json = JSON.parse(JSON.stringify(symbol))
      const newRecognizedArc = OIRecognizedPolyLine.create(json)
      expect(newRecognizedArc.toJSON()).toEqual(symbol.toJSON())
    })
  })
})
