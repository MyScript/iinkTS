import
{
  DefaultStyle,
  IISymbolGroup,
  TStyle,
} from "../../../src/iink"
import { buildOICircle, buildOIStroke } from "../helpers"

describe("IISymbolGroup.ts", () =>
{
  describe("constructor", () =>
  {
    test("should create ", () =>
    {
      const symbols = [
        buildOICircle(),
        buildOIStroke(),
      ]
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const group = new IISymbolGroup(symbols, style)
      expect(group).toBeDefined()
      expect(group.style).toEqual(expect.objectContaining(style))
      expect(group.snapPoints).toHaveLength(5)
    })
    test("should create with defautl style", () =>
    {
      const symbols = [
        buildOICircle(),
        buildOIStroke(),
      ]
      const group = new IISymbolGroup(symbols)
      expect(group).toBeDefined()
      expect(group.style).toEqual(DefaultStyle)
    })
  })

  describe("style", () =>
  {
    const circle = buildOICircle()
    const stroke = buildOIStroke()
    const group = new IISymbolGroup([circle, stroke])
    test("should apply width to symbols ", () =>
    {
      expect(circle.style.width).not.toEqual(10)
      expect(stroke.style.width).not.toEqual(10)
      group.style.width = 20
      group.updateChildrenStyle()
      expect(circle.style.width).toEqual(20)
      expect(stroke.style.width).toEqual(20)
    })
    test("should apply color to symbols ", () =>
    {
      expect(circle.style.color).not.toEqual("red")
      expect(stroke.style.color).not.toEqual("red")
      group.style.color = "red"
      group.updateChildrenStyle()
      expect(circle.style.color).toEqual("red")
      expect(stroke.style.color).toEqual("red")
    })
  })

  describe("overlaps", () =>
  {
    const circle = buildOICircle()
    const stroke = buildOIStroke()
    const group = new IISymbolGroup([circle, stroke])
    test("should return true", () =>
    {
      expect(group.overlaps(circle.bounds)).toEqual(true)
    })
    test("should return false", () =>
    {
      expect(group.overlaps({ height: 1, width: 1, x: 1000, y: 1000 })).toEqual(false)
    })
  })

  describe("containsSymbol", () =>
  {
    const circle = buildOICircle()
    const stroke = buildOIStroke()

    const stroke1 = buildOIStroke()
    const groupChild = new IISymbolGroup([stroke1])

    const stroke2 = buildOIStroke()
    const groupSubChild = new IISymbolGroup([new IISymbolGroup([stroke2])])

    const group = new IISymbolGroup([circle, stroke, groupChild, groupSubChild])
    test("should return true when symbol in first level", () =>
    {
      expect(group.containsSymbol(circle.id)).toEqual(true)
    })
    test("should return true when symbol in 2nd level", () =>
    {
      expect(group.containsSymbol(stroke1.id)).toEqual(true)
    })
    test("should return true when symbol in 3rd level", () =>
    {
      expect(group.containsSymbol(stroke2.id)).toEqual(true)
    })
    test("should return false", () =>
    {
      expect(group.containsSymbol("pouet")).toEqual(false)
    })
  })

  describe("containsOnlyStroke", () =>
  {
    test("should return true when only stroke in first level", () =>
    {
      const group = new IISymbolGroup([buildOIStroke()])
      expect(group.containsOnlyStroke()).toEqual(true)
    })
    test("should return false when only circle in first level", () =>
    {
      const group = new IISymbolGroup([buildOICircle()])
      expect(group.containsOnlyStroke()).toEqual(false)
    })
    test("should return true when only stroke in second level", () =>
    {
      const groupChild = new IISymbolGroup([buildOIStroke(), buildOIStroke()])
      const group = new IISymbolGroup([groupChild])
      expect(group.containsOnlyStroke()).toEqual(true)
    })
    test("should return false when stroke and circle in second level", () =>
    {
      const groupChild = new IISymbolGroup([buildOIStroke(), buildOICircle()])
      const group = new IISymbolGroup([groupChild])
      expect(group.containsOnlyStroke()).toEqual(false)
    })
    test("should return false when stroke and circle in third level", () =>
    {
      const groupSubChild = new IISymbolGroup([buildOIStroke(), buildOICircle()])
      const groupChild = new IISymbolGroup([buildOIStroke(), groupSubChild])
      const group = new IISymbolGroup([buildOIStroke(), groupChild])
      expect(group.containsOnlyStroke()).toEqual(false)
    })
    test("should return false when only stroke in third level", () =>
    {
      const groupSubChild = new IISymbolGroup([buildOIStroke(), buildOIStroke()])
      const groupChild = new IISymbolGroup([buildOIStroke(), groupSubChild])
      const group = new IISymbolGroup([buildOIStroke(), groupChild])
      expect(group.containsOnlyStroke()).toEqual(true)
    })
  })

  describe("extractStrokes", () =>
  {
    const circle = buildOICircle()
    const stroke = buildOIStroke()

    const stroke21 = buildOIStroke()
    const stroke22 = buildOIStroke()
    const groupSubChild = new IISymbolGroup([new IISymbolGroup([stroke21, stroke22])])

    const stroke1 = buildOIStroke()
    const groupChild = new IISymbolGroup([stroke1, groupSubChild])

    const group = new IISymbolGroup([circle, stroke, groupChild])
    test("should return true when symbol in first level", () =>
    {
      expect(group.extractStrokes()).toEqual([
        stroke,
        stroke1,
        stroke21,
        stroke22
      ])
    })
  })

  describe("removeChilds", () =>
  {
    const circle = buildOICircle()
    circle.id = "circle"
    const stroke = buildOIStroke()
    stroke.id = "stroke"

    const stroke21 = buildOIStroke()
    stroke21.id = "stroke-21"
    const stroke22 = buildOIStroke()
    stroke22.id = "stroke-22"
    const groupSubChild = new IISymbolGroup([stroke21, stroke22])
    groupSubChild.id = "sub-sub-group"

    const stroke1 = buildOIStroke()
    stroke1.id = "stroke-1"
    const groupChild = new IISymbolGroup([stroke1, groupSubChild])
    groupChild.id = "sub-group"

    const group = new IISymbolGroup([circle, stroke, groupChild])
    test("should remove stroke at first level", () =>
    {
      expect(group.children).toContain(stroke)
      group.removeChilds([stroke.id])
      expect(group.children).not.toContain(stroke)
    })
    test("should remove stroke at second level", () =>
    {
      expect(group.children).toHaveLength(2)
      group.removeChilds([stroke1.id])
      expect(group.children).toHaveLength(2)
      const subGroup = group.children.find(s => s.id === groupChild.id)
      expect(subGroup).toBeDefined()
      expect(subGroup).toBe(groupChild)
      expect(groupChild.children).toContain(groupSubChild)
      expect(groupChild.children).not.toContain(stroke1)
    })
    test("should remove stroke at second level", () =>
    {
      expect(group.children).toHaveLength(2)
      expect(groupSubChild.children).toContain(stroke21)
      group.removeChilds([stroke21.id])
      expect(group.children).toHaveLength(2)
      expect(groupSubChild.children).not.toContain(stroke21)
      expect(groupSubChild.children).toContain(stroke22)
    })
    test("should remove group if empty cause by sub group empty", () =>
    {
      expect(group.children).toHaveLength(2)
      expect(groupSubChild.children).toContain(stroke22)
      group.removeChilds([stroke22.id])
      expect(group.children).toHaveLength(1)
      expect(groupSubChild.children).not.toContain(stroke22)
      expect(groupChild.children).not.toContain(groupSubChild)
    })
    test("should remove last symbol", () =>
    {
      expect(group.children).toHaveLength(1)
      expect(group.children).toContain(circle)
      expect(group.removeChilds([circle.id]).children).toHaveLength(0)
      expect(group.children).toHaveLength(0)
    })
  })

  describe("clone", () =>
  {
    const circle = buildOICircle()
    const stroke = buildOIStroke()
    const group = new IISymbolGroup([circle, stroke])
    test("should return true", () =>
    {
      const clone = group.clone()
      expect(clone).toEqual(group)
      expect(clone).not.toBe(group)
    })
  })

})
