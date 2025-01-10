import { DecoratorKind, RecognizedKind, TOIRecognized } from "../../symbol"
import { DefaultStyle } from "../../style"
import { OISVGRendererDecoratorUtil } from "./OISVGRendererDecoratorUtil"
import { OISVGRendererStrokeUtil } from "./OISVGRendererStrokeUtil"
import { OISVGRendererConst } from "./OISVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class OISVGRendererRecognizedUtil
{
  static getSVGElement(recognizedSymbol: TOIRecognized): SVGGraphicsElement
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
      attrs["filter"] = `url(#${ OISVGRendererConst.selectionFilterId })`
    }
    if (recognizedSymbol.deleting) {
      attrs["filter"] = `url(#${ OISVGRendererConst.removalFilterId })`
    }

    const groupEl = SVGBuilder.createGroup(attrs)

    recognizedSymbol.strokes.forEach(s =>
    {
      groupEl.append(OISVGRendererStrokeUtil.getSVGElement(s))
    })

    if (recognizedSymbol.kind === RecognizedKind.Text) {
      recognizedSymbol.decorators.forEach(d =>
      {
        const deco = OISVGRendererDecoratorUtil.getSVGElement(d, recognizedSymbol)
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
