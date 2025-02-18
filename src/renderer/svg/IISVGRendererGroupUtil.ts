import { DecoratorKind, IIEraser, IISymbolGroup, SymbolType, TIISymbol } from "../../symbol"
import { DefaultStyle } from "../../style"
import { IISVGRendererDecoratorUtil } from "./IISVGRendererDecoratorUtil"
import { IISVGRendererEdgeUtil } from "./IISVGRendererEdgeUtil"
import { IISVGRendererShapeUtil } from "./IISVGRendererShapeUtil"
import { IISVGRendererStrokeUtil } from "./IISVGRendererStrokeUtil"
import { IISVGRendererConst } from "./IISVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"
import { IISVGRendererTextUtil } from "./IISVGRendererTextUtil"
import { IISVGRendererRecognizedUtil } from "./IISVGRendererRecognizedUtil"

/**
 * @group Renderer
 */
export class IISVGRendererGroupUtil
{

  static getChildElement(symbol: TIISymbol | IIEraser): SVGGraphicsElement | undefined
  {
    let element: SVGGraphicsElement | undefined
    switch (symbol.type) {
      case SymbolType.Stroke:
        element = IISVGRendererStrokeUtil.getSVGElement(symbol)
        break
      case SymbolType.Shape:
        element = IISVGRendererShapeUtil.getSVGElement(symbol)
        break
      case SymbolType.Edge:
        element = IISVGRendererEdgeUtil.getSVGElement(symbol)
        break
      case SymbolType.Text:
        element = IISVGRendererTextUtil.getSVGElement(symbol)
        break
      case SymbolType.Group:
        element = IISVGRendererGroupUtil.getSVGElement(symbol)
        break
      case SymbolType.Recognized:
        element = IISVGRendererRecognizedUtil.getSVGElement(symbol)
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
      attrs["filter"] = `url(#${ IISVGRendererConst.selectionFilterId })`
    }
    if (symbolGroup.deleting) {
      attrs["filter"] = `url(#${ IISVGRendererConst.removalFilterId })`
    }

    const groupEl = SVGBuilder.createGroup(attrs)

    symbolGroup.children.forEach(sym =>
    {
      groupEl.append(IISVGRendererGroupUtil.getChildElement(sym)!)
    })

    symbolGroup.decorators.forEach(d =>
    {
      const deco = IISVGRendererDecoratorUtil.getSVGElement(d, symbolGroup)
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