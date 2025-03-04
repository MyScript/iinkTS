import { DecoratorKind, IIEraser, IISymbolGroup, SymbolType, TIISymbol } from "../../symbol"
import { DefaultStyle } from "../../style"
import { SVGRendererDecoratorUtil } from "./SVGRendererDecoratorUtil"
import { SVGRendererEdgeUtil } from "./SVGRendererEdgeUtil"
import { SVGRendererShapeUtil } from "./SVGRendererShapeUtil"
import { SVGRendererStrokeUtil } from "./SVGRendererStrokeUtil"
import { SVGRendererConst } from "./SVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"
import { SVGRendererTextUtil } from "./SVGRendererTextUtil"
import { SVGRendererRecognizedUtil } from "./SVGRendererRecognizedUtil"

/**
 * @group Renderer
 */
export class SVGRendererGroupUtil
{

  static getChildElement(symbol: TIISymbol | IIEraser): SVGGraphicsElement | undefined
  {
    let element: SVGGraphicsElement | undefined
    switch (symbol.type) {
      case SymbolType.Stroke:
        element = SVGRendererStrokeUtil.getSVGElement(symbol)
        break
      case SymbolType.Shape:
        element = SVGRendererShapeUtil.getSVGElement(symbol)
        break
      case SymbolType.Edge:
        element = SVGRendererEdgeUtil.getSVGElement(symbol)
        break
      case SymbolType.Text:
        element = SVGRendererTextUtil.getSVGElement(symbol)
        break
      case SymbolType.Group:
        element = SVGRendererGroupUtil.getSVGElement(symbol)
        break
      case SymbolType.Recognized:
        element = SVGRendererRecognizedUtil.getSVGElement(symbol)
        break
    }
    return element
  }

  static getSVGElement(symbolGroup: IISymbolGroup): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": symbolGroup.id,
      "type": "group",
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": symbolGroup.style.color || DefaultStyle.color!,
      "stroke-width": (symbolGroup.style.width || DefaultStyle.width).toString(),
    }
    if (symbolGroup.style.opacity) {
      attrs["opacity"] = symbolGroup.style.opacity.toString()
    }
    if (symbolGroup.selected) {
      attrs["filter"] = `url(#${ SVGRendererConst.selectionFilterId })`
    }
    if (symbolGroup.deleting) {
      attrs["filter"] = `url(#${ SVGRendererConst.removalFilterId })`
    }

    const groupEl = SVGBuilder.createGroup(attrs)

    symbolGroup.children.forEach(sym =>
    {
      groupEl.append(SVGRendererGroupUtil.getChildElement(sym)!)
    })

    symbolGroup.decorators.forEach(d =>
    {
      const deco = SVGRendererDecoratorUtil.getSVGElement(d, symbolGroup)
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