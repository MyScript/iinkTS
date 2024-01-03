import { DecoratorKind, OISVGDecoratorUtil, SymbolType, TStyle } from "../../../src/iink"
import { buildOIHighlight, buildOIStrikethrough, buildOIStroke, buildOISurround, buildOIUnderline } from "../helpers"


describe("OISVGDecoratorUtil.ts", () =>
{
  test("should instanciate", () =>
  {
    const selectionFilterId = "selectionFilterId"
    const renderer = new OISVGDecoratorUtil(selectionFilterId)
    expect(renderer).toBeDefined()
  })

  describe("getSVGElement", () =>
  {
    const selectionFilterId = "selectionFilterId"
    const renderer = new OISVGDecoratorUtil(selectionFilterId)
    test("should get Highlight", () =>
    {
      const sym = buildOIStroke()
      const style: TStyle = {
        color: "red",
      }
      const decorator = buildOIHighlight([sym], style)
      const el = renderer.getSVGElement(decorator)
      expect(el).toBeDefined()
      expect(el?.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el?.getAttribute("kind")).toEqual(DecoratorKind.Highlight)
      expect(el?.getAttribute("opacity")).toEqual("0.4")
      expect(el?.getAttribute("stroke")).toEqual("transparent")
      expect(el?.getAttribute("fill")).toEqual(style.color!)
    })
    test("should get Surround", () =>
    {
      const sym = buildOIStroke()
      const style: TStyle = {
        color: "red",
        opacity: 0.5,
        width: 4
      }
      const decorator = buildOISurround([sym], style)
      const el = renderer.getSVGElement(decorator)
      expect(el).toBeDefined()
      expect(el?.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el?.getAttribute("kind")).toEqual(DecoratorKind.Surround)
      expect(el?.getAttribute("fill")).toEqual("transparent")
      expect(el?.getAttribute("stroke")).toEqual(style.color!)
      expect(el?.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should get Strikethrough", () =>
    {
      const sym = buildOIStroke()
      const style: TStyle = {
        color: "red",
        opacity: 0.5,
        width: 4
      }
      const decorator = buildOIStrikethrough([sym], style)
      const el = renderer.getSVGElement(decorator)
      expect(el).toBeDefined()
      expect(el?.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el?.getAttribute("kind")).toEqual(DecoratorKind.Strikethrough)
      expect(el?.getAttribute("fill")).toEqual("transparent")
      expect(el?.getAttribute("stroke")).toEqual(style.color!)
      expect(el?.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should get Underline", () =>
    {
      const sym = buildOIStroke()
      const style: TStyle = {
        color: "red",
        opacity: 0.5,
        width: 4
      }
      const decorator = buildOIUnderline([sym], style)
      const el = renderer.getSVGElement(decorator)
      expect(el).toBeDefined()
      expect(el?.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el?.getAttribute("kind")).toEqual(DecoratorKind.Underline)
      expect(el?.getAttribute("fill")).toEqual("transparent")
      expect(el?.getAttribute("stroke")).toEqual(style.color!)
      expect(el?.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
  })

})
