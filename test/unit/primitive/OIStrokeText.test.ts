import { Box, DecoratorKind, OIDecorator, OIStroke, OIStrokeText, TBoundingBox } from "../../../src/primitive"
import { DefaultStyle, TStyle } from "../../../src/style"
import { PartialDeep } from "../../../src/utils"
import { buildOIStroke } from "../helpers"

describe("OIStrokeText.ts", () =>
{
  describe("instanciate", () =>
  {
    test("should create with default style", () =>
    {
      const stroke = buildOIStroke()
      const strokeText = new OIStrokeText([stroke], { baseline: 10, xHeight: 12 })
      expect(strokeText).toBeDefined()
      expect(strokeText.creationTime).toBeLessThanOrEqual(Date.now())
      expect(strokeText.creationTime).toEqual(strokeText.modificationDate)
      expect(strokeText.style).toEqual(expect.objectContaining(DefaultStyle))
      expect(strokeText.strokes).toEqual([stroke])
    })
    test("should create with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const stroke = buildOIStroke()
      const strokeText = new OIStrokeText([stroke], { baseline: 10, xHeight: 12 }, style)
      expect(strokeText).toBeDefined()
      expect(strokeText.creationTime).toBeLessThanOrEqual(Date.now())
      expect(strokeText.creationTime).toEqual(strokeText.modificationDate)
      expect(strokeText.style).toEqual(expect.objectContaining(style))
      expect(strokeText.strokes).toEqual([stroke])
    })
  })

  describe("boundingBox", () =>
  {
    test("should get stroke bounds", () =>
    {
      const stroke = buildOIStroke()
      const strokeText = new OIStrokeText([stroke], { baseline: 10, xHeight: 12 })
      expect(strokeText.bounds.height).toEqual(stroke.bounds.height)
      expect(strokeText.bounds.width).toEqual(stroke.bounds.width)
      expect(strokeText.bounds.x).toEqual(stroke.bounds.x)
      expect(strokeText.bounds.y).toEqual(stroke.bounds.y)
    })
    test("should get strokes bounds", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const bounds = Box.createFromBoxes([stroke.bounds, stroke1.bounds])
      const strokeText = new OIStrokeText([stroke], { baseline: 10, xHeight: 12 })
      expect(strokeText.bounds.height).toEqual(bounds.height)
      expect(strokeText.bounds.width).toEqual(bounds.width)
      expect(strokeText.bounds.x).toEqual(bounds.x)
      expect(strokeText.bounds.y).toEqual(bounds.y)
    })
  })

  describe("updateChildrenStyle", () =>
  {
    test("should update style of each strokes", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const strokeText = new OIStrokeText([stroke, stroke1], { baseline: 10, xHeight: 12 })
      expect(stroke.style).toEqual(DefaultStyle)
      expect(stroke1.style).toEqual(DefaultStyle)
      strokeText.style = style
      strokeText.updateChildrenStyle()
      expect(stroke.style).toEqual(expect.objectContaining(style))
      expect(stroke1.style).toEqual(expect.objectContaining(style))
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
      const strokeText = new OIStrokeText([stroke, stroke1], { baseline: 10, xHeight: 12 })
      const boundingBox: TBoundingBox = { height: 10, width: 10, x: 1, y: 1 }
      strokeText.overlaps(boundingBox)
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
      const strokeText = new OIStrokeText([stroke, stroke1], { baseline: 10, xHeight: 12 })
      expect(strokeText.containsStroke(stroke.id)).toEqual(true)
    })
    test("should return false", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const strokeText = new OIStrokeText([stroke, stroke1], { baseline: 10, xHeight: 12 })
      expect(strokeText.containsStroke("fake-id")).toEqual(false)
    })
  })

  describe("removeStrokes", () =>
  {
    test("should remove one stroke", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const strokeText = new OIStrokeText([stroke, stroke1], { baseline: 10, xHeight: 12 })
      strokeText.removeStrokes([stroke.id])
      expect(strokeText.strokes).toEqual([stroke1])
    })
    test("should remove all strokes", () =>
    {
      const stroke = buildOIStroke()
      const stroke1 = buildOIStroke()
      const strokeText = new OIStrokeText([stroke, stroke1], { baseline: 10, xHeight: 12 })
      strokeText.removeStrokes([stroke.id, stroke1.id])
      expect(strokeText.strokes).toEqual([])
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
      const strokeText = new OIStrokeText([stroke], { baseline: 10, xHeight: 12 }, style)

      const clone = strokeText.clone()
      expect(clone).toEqual(strokeText)
      expect(clone).not.toBe(strokeText)
    })
  })

  describe("create", () =>
  {
    test("should throw error no strokes", () =>
    {
      OIStroke.create = jest.fn()
      const partial: PartialDeep<OIStrokeText> = {
      }
      expect(() => OIStrokeText.create(partial)).toThrow("no strokes")
    })
    test("should call OIStroke.create", () =>
    {
      OIStroke.create = jest.fn()
      const pStroke: PartialDeep<OIStroke> = {
        id: "test-id",
        pointers: [
          { p: 1, t: 1, x: 1, y: 1}
        ]
      }
      const partial: PartialDeep<OIStrokeText> = {
        strokes: [
          pStroke
        ]
      }
      const strokeText = OIStrokeText.create(partial)

      expect(strokeText).toBeDefined()
      expect(OIStroke.create).toHaveBeenNthCalledWith(1, pStroke)
    })
    test("should create with decorators", () =>
    {
      OIStroke.create = jest.fn()
      const pStroke: PartialDeep<OIStroke> = {
        id: "test-id",
        pointers: [
          { p: 1, t: 1, x: 1, y: 1}
        ]
      }
      const pHighlight: PartialDeep<OIDecorator> = {
        kind: DecoratorKind.Highlight,
        style: {
          color: "red",
          width: 2
        }
      }
      const partial: PartialDeep<OIStrokeText> = {
        strokes: [
          pStroke
        ],
        decorators: [
          pHighlight
        ]
      }
      const strokeText = OIStrokeText.create(partial)

      expect(strokeText).toBeDefined()
      expect(strokeText.decorators).toHaveLength(1)
      expect(strokeText.decorators[0].kind).toEqual(pHighlight.kind)
      expect(strokeText.decorators[0].style).toEqual(expect.objectContaining(pHighlight.style))
    })
  })
})
