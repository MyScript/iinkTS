import { DecoratorKind, RecognizedKind, TIIRecognized } from "../../symbol"
import { DefaultStyle } from "../../style"
import { IISVGRendererDecoratorUtil } from "./IISVGRendererDecoratorUtil"
import { IISVGRendererStrokeUtil } from "./IISVGRendererStrokeUtil"
import { IISVGRendererConst } from "./IISVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class IISVGRendererRecognizedUtil
{
  static getSVGElement(recognizedSymbol: TIIRecognized): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": recognizedSymbol.id,
      "type": recognizedSymbol.type,
      "kind": recognizedSymbol.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": recognizedSymbol.style.color || DefaultStyle.color,
      "stroke-width": (recognizedSymbol.style.width || DefaultStyle.width).toString(),
    }
    if (recognizedSymbol.style.opacity) {
      attrs["opacity"] = recognizedSymbol.style.opacity.toString()
    }
    if (recognizedSymbol.selected) {
      attrs["filter"] = `url(#${ IISVGRendererConst.selectionFilterId })`
    }
    if (recognizedSymbol.deleting) {
      attrs["filter"] = `url(#${ IISVGRendererConst.removalFilterId })`
    }

    const groupEl = SVGBuilder.createGroup(attrs)

    recognizedSymbol.strokes.forEach(s =>
    {
      groupEl.append(IISVGRendererStrokeUtil.getSVGElement(s))
    })

    if (recognizedSymbol.kind === RecognizedKind.Text) {
      recognizedSymbol.decorators.forEach(d =>
      {
        const deco = IISVGRendererDecoratorUtil.getSVGElement(d, recognizedSymbol)
        if (deco) {
          if (d.kind === DecoratorKind.Highlight) {
            groupEl.prepend(deco)
          }
          else {
            groupEl.append(deco)
          }
        }
      })
    }

    return groupEl
  }

}