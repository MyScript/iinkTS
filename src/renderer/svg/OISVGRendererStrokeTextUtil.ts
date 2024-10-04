import { DecoratorKind, OIStrokeText } from "../../primitive"
import { DefaultStyle } from "../../style"
import { OISVGRendererDecoratorUtil } from "./OISVGRendererDecoratorUtil"
import { OISVGRendererStrokeUtil } from "./OISVGRendererStrokeUtil"
import { OISVGRendererConst } from "./OISVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class OISVGRendererStrokeTextUtil
{
  static getSVGElement(strokeText: OIStrokeText): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": strokeText.id,
      "type": strokeText.type,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": strokeText.style.color || DefaultStyle.color!,
      "stroke-width": (strokeText.style.width || DefaultStyle.width!).toString(),
      "opacity": (strokeText.style.opacity || DefaultStyle.opacity!).toString(),
    }
    if (strokeText.selected) {
      attrs["filter"] = `url(#${ OISVGRendererConst.selectionFilterId })`
    }
    if (strokeText.deleting) {
      attrs["filter"] = `url(#${ OISVGRendererConst.removalFilterId })`
    }

    const groupEl = SVGBuilder.createGroup(attrs)

    strokeText.strokes.forEach(s =>
    {
      groupEl.append(OISVGRendererStrokeUtil.getSVGElement(s))
    })

    strokeText.decorators.forEach(d =>
    {
      const deco = OISVGRendererDecoratorUtil.getSVGElement(d, strokeText)
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
