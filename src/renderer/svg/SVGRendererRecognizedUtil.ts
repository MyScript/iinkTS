import { DecoratorKind, RecognizedKind, TIIRecognized } from "../../symbol"
import { DefaultStyle } from "../../style"
import { SVGRendererDecoratorUtil } from "./SVGRendererDecoratorUtil"
import { SVGRendererStrokeUtil } from "./SVGRendererStrokeUtil"
import { SVGRendererConst } from "./SVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class SVGRendererRecognizedUtil
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
      attrs["filter"] = `url(#${ SVGRendererConst.selectionFilterId })`
    }
    if (recognizedSymbol.deleting) {
      attrs["filter"] = `url(#${ SVGRendererConst.removalFilterId })`
    }

    const groupEl = SVGBuilder.createGroup(attrs)

    recognizedSymbol.strokes.forEach(s =>
    {
      groupEl.append(SVGRendererStrokeUtil.getSVGElement(s))
    })

    if (recognizedSymbol.kind === RecognizedKind.Text) {
      recognizedSymbol.decorators.forEach(d =>
      {
        const deco = SVGRendererDecoratorUtil.getSVGElement(d, recognizedSymbol)
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