import { DecoratorKind, IIText } from "../../symbol"
import { SVGRendererDecoratorUtil } from "./SVGRendererDecoratorUtil"
import { SVGRendererConst } from "./SVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class SVGRendererTextUtil
{
  static getSVGElement(text: IIText): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": text.id,
      "type": text.type,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "style": SVGRendererConst.noSelection,
    }
    if (text.style.opacity) {
      attrs.opacity = text.style.opacity.toString()
    }
    if (text.rotation) {
      attrs.transform = `rotate(${ text.rotation.degree }, ${ text.rotation.center.x }, ${ text.rotation.center.y })`
    }
    if (text.selected) {
      attrs["filter"] = `url(#${ SVGRendererConst.selectionFilterId })`
    }
    if (text.deleting) {
      attrs["filter"] = `url(#${ SVGRendererConst.removalFilterId })`
    }

    const textGroup = SVGBuilder.createGroup(attrs)

    const textElement = SVGBuilder.createText(text.point, "")

    text.chars.forEach(c =>
    {
      const attrs: { [key: string]: string } = {
        id: c.id,
        fill: c.color,
        "font-size": `${ c.fontSize }px`,
        "font-weight": c.fontWeight.toString(),
      }
      textElement.appendChild(SVGBuilder.createTSpan(c.label, attrs))
    })
    textGroup.append(textElement)

    text.decorators.forEach(d =>
    {
      const deco = SVGRendererDecoratorUtil.getSVGElement(d, text)
      if (deco) {
        if (d.kind === DecoratorKind.Highlight) {
          textGroup.prepend(deco)
        }
        else {
          textGroup.append(deco)
        }
      }
    })

    return textGroup
  }
}