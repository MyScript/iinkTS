import { buildOIDecorator, buildOIStroke } from "../helpers"
import { DecoratorKind, DefaultStyle, OISVGRendererDecoratorUtil, TStyle } from "../../../src/iink"

describe("OISVGRendererDecoratorUtil.ts", () =>
{

  describe("getSVGElement", () =>
  {
    test("should get Highlight", () =>
    {
      const sym = buildOIStroke()
      const style: TStyle = {
        color: "red",
        width: 42
      }
      const decorator = buildOIDecorator(DecoratorKind.Highlight, style)
      const el = OISVGRendererDecoratorUtil.getSVGElement(decorator, sym) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Highlight)
      expect(el.getAttribute("opacity")).toEqual("0.5")
      expect(el.getAttribute("stroke")).toEqual("transparent")
      expect(el.getAttribute("fill")).toEqual(style.color)
    })
    test("should get Highlight with DefaultStyle", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOIDecorator(DecoratorKind.Highlight, {})
      const el = OISVGRendererDecoratorUtil.getSVGElement(decorator, sym) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Highlight)
      expect(el.getAttribute("opacity")).toEqual("0.5")
      expect(el.getAttribute("stroke")).toEqual("transparent")
      expect(el.getAttribute("fill")).toEqual(DefaultStyle.color)
    })
    test("should Highlight to delete", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOIDecorator(DecoratorKind.Highlight)
      const elNotToDelete = OISVGRendererDecoratorUtil.getSVGElement(decorator, sym) as SVGGeometryElement
      expect(elNotToDelete.getAttribute("opacity")).toEqual(`0.5`)
      sym.deleting = true
      const elToDelete = OISVGRendererDecoratorUtil.getSVGElement(decorator, sym) as SVGGeometryElement
      expect(elToDelete.getAttribute("opacity")).toEqual(`0.25`)
    })
    test("should get Surround", () =>
    {
      const sym = buildOIStroke()
      const style: TStyle = {
        color: "red",
        opacity: 0.5,
        width: 4
      }
      const decorator = buildOIDecorator(DecoratorKind.Surround, style)
      const el = OISVGRendererDecoratorUtil.getSVGElement(decorator, sym) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Surround)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(style.color!)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      expect(el.getAttribute("opacity")).toEqual(style.opacity?.toString())
    })
    test("should get Surround with DefaultStyle", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOIDecorator(DecoratorKind.Surround, {})
      const el = OISVGRendererDecoratorUtil.getSVGElement(decorator, sym) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Surround)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color!)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should get Strikethrough", () =>
    {
      const sym = buildOIStroke()
      const style: TStyle = {
        color: "red",
        opacity: 0.5,
        width: 4
      }
      const decorator = buildOIDecorator(DecoratorKind.Strikethrough, style)
      const el = OISVGRendererDecoratorUtil.getSVGElement(decorator, sym) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Strikethrough)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(style.color!)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      expect(el.getAttribute("opacity")).toEqual(style.opacity?.toString())
    })
    test("should get Strikethrough with DefaultStyle", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOIDecorator(DecoratorKind.Strikethrough, {})
      const el = OISVGRendererDecoratorUtil.getSVGElement(decorator, sym) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Strikethrough)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color!)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should get Underline", () =>
    {
      const sym = buildOIStroke()
      const style: TStyle = {
        color: "red",
        opacity: 0.5,
        width: 4
      }
      const decorator = buildOIDecorator(DecoratorKind.Underline, style)
      const el = OISVGRendererDecoratorUtil.getSVGElement(decorator, sym) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Underline)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(style.color!)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      expect(el.getAttribute("opacity")).toEqual(style.opacity?.toString())
    })
    test("should get Underline with DefaultStyle", () =>
    {
      const sym = buildOIStroke()
      const decorator = buildOIDecorator(DecoratorKind.Underline, {})
      const el = OISVGRendererDecoratorUtil.getSVGElement(decorator, sym) as SVGGeometryElement
      expect(el).toBeDefined()
      expect(el.getAttribute("kind")).toEqual(DecoratorKind.Underline)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color!)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
  })

})
