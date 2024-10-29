import { DecoratorKind, OIDecorator, OIText, SymbolType, TBox, TOISymbolChar, TPoint } from "../../../src/symbol"
import { OISVGRendererConst, OISVGRendererTextUtil } from "../../../src/renderer"

describe("teOISVGRendererTextUtilxt", () =>
  {
    const chars: TOISymbolChar[] = [
      {
        color: "blue",
        fontSize: 18,
        fontWeight: "normal",
        id: 'id-1',
        label: "first",
        bounds: {
          height: 10,
          width: 5,
          x: 0,
          y: 10
        }
      },
      {
        color: "red",
        fontSize: 12,
        fontWeight: "normal",
        id: 'id-2',
        label: "second",
        bounds: {
          height: 10,
          width: 5,
          x: 5,
          y: 10
        }
      },
    ]
    const point: TPoint = { x: 0, y: 0 }
    const boundingBox: TBox = { height: 100, width: 100, x: 0, y: 0 }
    const text = new OIText(chars, point, boundingBox)

    test("should getSymbolElement with style for each char", () =>
    {
      const el = OISVGRendererTextUtil.getSVGElement(text)!
      expect(el.getAttribute("id")).toEqual(text.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Text)
      const spans = el.querySelectorAll("tspan")

      expect(spans).toHaveLength(2)
      expect(spans[0].id).toEqual(chars[0].id)
      expect(spans[0].getAttribute("fill")).toEqual(chars[0].color)
      expect(spans[0].getAttribute("font-size")).toEqual(`${ chars[0].fontSize }px`)
      expect(spans[0].getAttribute("font-weight")).toEqual(`${ chars[0].fontWeight }`)
      expect(spans[0].textContent).toEqual(chars[0].label)

      expect(spans[1].id).toEqual(chars[1].id)
      expect(spans[1].getAttribute("fill")).toEqual(chars[1].color)
      expect(spans[1].getAttribute("font-size")).toEqual(`${ chars[1].fontSize }px`)
      expect(spans[1].getAttribute("font-weight")).toEqual(`${ chars[1].fontWeight }`)
      expect(spans[1].textContent).toEqual(chars[1].label)
    })
    test("should getSymbolElement with selected filter", () =>
    {
      const elNotSelected = OISVGRendererTextUtil.getSVGElement(text)!
      expect(elNotSelected.getAttribute("id")).toEqual(text.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Text)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()

      text.selected = true
      const elSelected = OISVGRendererTextUtil.getSVGElement(text)!
      expect(elSelected.getAttribute("id")).toEqual(text.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Text)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.selectionFilterId })`)
    })
    test("should getSymbolElement with removal filter", () =>
    {
      text.selected = false
      const elNotDeleting = OISVGRendererTextUtil.getSVGElement(text)!
      expect(elNotDeleting.getAttribute("id")).toEqual(text.id)
      expect(elNotDeleting.getAttribute("type")).toEqual(SymbolType.Text)
      expect(elNotDeleting.getAttribute("filter")).toBeFalsy()

      text.deleting = true
      const elDeleting = OISVGRendererTextUtil.getSVGElement(text)!
      expect(elDeleting.getAttribute("id")).toEqual(text.id)
      expect(elDeleting.getAttribute("type")).toEqual(SymbolType.Text)
      expect(elDeleting.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.removalFilterId })`)
    })
    test("should getSymbolElement with transform rotate", () =>
    {
      const elNotRotate = OISVGRendererTextUtil.getSVGElement(text)!
      expect(elNotRotate.getAttribute("id")).toEqual(text.id)
      expect(elNotRotate.getAttribute("type")).toEqual(SymbolType.Text)
      expect(elNotRotate.getAttribute("transform")).toBeFalsy()

      text.rotation = { center: { x: 12, y: 25 }, degree: 45 }
      const elRotating = OISVGRendererTextUtil.getSVGElement(text)!
      expect(elRotating.getAttribute("id")).toEqual(text.id)
      expect(elRotating.getAttribute("type")).toEqual(SymbolType.Text)
      expect(elRotating.getAttribute("transform")).toEqual(`rotate(${ text.rotation.degree }, ${ text.rotation.center.x }, ${ text.rotation.center.y })`)
    })
    test("should getSymbolElement with decorators", () =>
    {
      const elWithoutDecorator = OISVGRendererTextUtil.getSVGElement(text)!
      expect(elWithoutDecorator.getAttribute("id")).toEqual(text.id)
      expect(elWithoutDecorator.querySelectorAll("[type=decorator]")).toHaveLength(0)

      text.decorators.push(new OIDecorator(DecoratorKind.Highlight, { color: "red"}))
      text.decorators.push(new OIDecorator(DecoratorKind.Underline, { color: "blue", width: 12}))

      const elDecorated = OISVGRendererTextUtil.getSVGElement(text)!
      expect(elDecorated.getAttribute("id")).toEqual(text.id)
      expect(elDecorated.querySelectorAll("[type=decorator]")).toHaveLength(2)

      const highlight = elDecorated.querySelector(`[kind=${DecoratorKind.Highlight}]`)
      expect(highlight?.getAttribute("fill")).toEqual("red")

      const underline = elDecorated.querySelector(`[kind=${DecoratorKind.Underline}]`)
      expect(underline?.getAttribute("stroke")).toEqual("blue")
      expect(underline?.getAttribute("stroke-width")).toEqual("12")
    })
  })
