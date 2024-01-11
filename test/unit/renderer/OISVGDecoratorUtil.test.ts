import { DecoratorKind, DefaultStyle, OISVGDecoratorUtil, SymbolType, TStyle } from "../../../src/iink"
import { buildOIHighlight, buildOIStrikethrough, buildOIStroke, buildOISurround, buildOIUnderline } from "../helpers"


describe("OISVGDecoratorUtil.ts", () =>
{
  test("should instanciate", () =>
  {
    const selectionFilterId = "selectionFilterId"
    const removalFilterId = "removalFilterId"
    const renderer = new OISVGDecoratorUtil(selectionFilterId, removalFilterId)
    expect(renderer).toBeDefined()
  })

  describe("getSVGElement", () =>
  {
    const selectionFilterId = "selectionFilterId"
    const removalFilterId = "removalFilterId"
    const renderer = new OISVGDecoratorUtil(selectionFilterId, removalFilterId)
    test("should get Highlight", () =>
    {
      const sym = buildOIStroke()
      const style: TStyle = {
        color: "red",
      }
      const decorator = buildOIHighlight([sym], style)
      const el = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Highlight)
      expect(el.getAttribute("opacity")).toEqual("0.5")
      expect(el.getAttribute("stroke")).toEqual("transparent")
      expect(el.getAttribute("fill")).toEqual(style.color!)
    })
    test("should get Highlight with DefaultStyle", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOIHighlight([sym], {})
      const el = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Highlight)
      expect(el.getAttribute("opacity")).toEqual("0.5")
      expect(el.getAttribute("stroke")).toEqual("transparent")
      expect(el.getAttribute("fill")).toEqual(DefaultStyle.color!)
    })
    test("should Highlight selected", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOIHighlight([sym])
      const elNotSelected = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      decorator.selected = true
      const elSelected = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
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
      const el = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Surround)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(style.color!)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      expect(el.getAttribute("opacity")).toEqual(style.opacity?.toString())
    })
    test("should get Surround with DefaultStyle", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOISurround([sym], {})
      const el = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Surround)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color!)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
      expect(el.getAttribute("opacity")).toEqual(DefaultStyle.opacity?.toString())
    })
    test("should Surround selected", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOISurround([sym])
      const elNotSelected = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      decorator.selected = true
      const elSelected = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
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
      const el = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Strikethrough)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(style.color!)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      expect(el.getAttribute("opacity")).toEqual(style.opacity?.toString())
    })
    test("should get Strikethrough with DefaultStyle", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOIStrikethrough([sym], {})
      const el = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Strikethrough)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color!)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
      expect(el.getAttribute("opacity")).toEqual(DefaultStyle.opacity?.toString())
    })
    test("should Strikethrough selected", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOIStrikethrough([sym])
      const elNotSelected = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      decorator.selected = true
      const elSelected = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
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
      const el = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Underline)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(style.color!)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      expect(el.getAttribute("opacity")).toEqual(style.opacity?.toString())
    })
    test("should get Underline with DefaultStyle", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOIUnderline([sym], {})
      const el = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("type")).toEqual(SymbolType.Decorator)
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Underline)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color!)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
      expect(el.getAttribute("opacity")).toEqual(DefaultStyle.opacity?.toString())
    })
    test("should Underline selected", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOIUnderline([sym])
      const elNotSelected = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      decorator.selected = true
      const elSelected = renderer.getSVGElement(decorator) as SVGGeometryElement
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
    })
  })

})
