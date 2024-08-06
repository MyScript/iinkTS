import { DecoratorKind, OIEraser, OISymbolGroup, SymbolType, TOISymbol } from "../../primitive"
import { DefaultStyle } from "../../style"
import { OISVGRendererDecoratorUtil } from "./OISVGRendererDecoratorUtil"
import { OISVGRendererEdgeUtil } from "./OISVGRendererEdgeUtil"
import { OISVGRendererShapeUtil } from "./OISVGRendererShapeUtil"
import { OISVGRendererStrokeUtil } from "./OISVGRendererStrokeUtil"
import { OISVGRendererConst } from "./OISVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"
import { OISVGRendererTextUtil } from "./OISVGRendererTextUtil"

/**
 * @group Renderer
 */
export class OISVGRendererGroupUtil
{

  static getChildElement(symbol: TOISymbol | OIEraser): SVGGraphicsElement | undefined
  {
    let element: SVGGraphicsElement | undefined
    switch (symbol.type) {
      case SymbolType.Stroke:
        element = OISVGRendererStrokeUtil.getSVGElement(symbol)
        break
      case SymbolType.Shape:
        element = OISVGRendererShapeUtil.getSVGElement(symbol)
        break
      case SymbolType.Edge:
        element = OISVGRendererEdgeUtil.getSVGElement(symbol)
        break
      case SymbolType.Text:
        element = OISVGRendererTextUtil.getSVGElement(symbol)
        break
      case SymbolType.Group:
        element = OISVGRendererGroupUtil.getSVGElement(symbol)
        break
    }
    return element
  }

  static getSVGElement(symbolGroup: OISymbolGroup): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": symbolGroup.id,
      "type": "group",
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": symbolGroup.style.color || DefaultStyle.color!,
      "stroke-width": (symbolGroup.style.width || DefaultStyle.width!).toString(),
      "opacity": (symbolGroup.style.opacity || DefaultStyle.opacity!).toString(),
    }
    if (symbolGroup.selected) {
      attrs["filter"] = `url(#${ OISVGRendererConst.selectionFilterId })`
    }
    if (symbolGroup.deleting) {
      attrs["filter"] = `url(#${ OISVGRendererConst.removalFilterId })`
    }

    const groupEl = SVGBuilder.createGroup(attrs)

    symbolGroup.children.forEach(sym =>
    {
      groupEl.append(OISVGRendererGroupUtil.getChildElement(sym)!)
    })

    symbolGroup.decorators.forEach(d =>
    {
      const deco = OISVGRendererDecoratorUtil.getSVGElement(d, symbolGroup)
      if (deco) {
        if (d.kind === DecoratorKind.Highlight) {
          groupEl.prepend(deco)
        }
        else {
          groupEl.append(deco)
        }
      }
    })

    return groupEl
  }

}
