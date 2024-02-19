import { DecoratorKind, OIText, OIDecorator } from "../../primitive"
import { OISVGDecoratorUtil } from "./OISVGDecoratorUtil"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class OISVGTextUtil
{
  selectionFilterId: string
  removalFilterId: string
  decoratorUtil: OISVGDecoratorUtil

  constructor(selectionFilterId: string, removalFilterId: string)
  {
    this.selectionFilterId = selectionFilterId
    this.removalFilterId = removalFilterId
    this.decoratorUtil = new OISVGDecoratorUtil(this.selectionFilterId, this.removalFilterId)
  }

  getSVGElement(text: OIText): SVGGraphicsElement
  {
    const groupAttrs: { [key: string]: string } = {
      "id": text.id,
      "type": text.type,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "style": "-webkit-user-select: none; -ms-user-select: none; user-select: none;"
    }
    if (text.rotation) {
      groupAttrs.transform = `rotate(${ text.rotation.degree }, ${ text.rotation.center.x }, ${ text.rotation.center.y })`
    }
    if (text.deleting) {
      groupAttrs["filter"] = `url(#${ this.removalFilterId })`
    }

    const textGroup = SVGBuilder.createGroup(groupAttrs)

    const textAttrs: { [key: string]: string } = { }
    if (text.selected) {
      textAttrs["filter"] = `url(#${ this.selectionFilterId })`
    }
    const textElement = SVGBuilder.createText(text.point, "", textAttrs)

    text.chars.forEach(c =>
    {
      const attrs: { [key: string]: string } = {
        id: c.id,
        fill: c.color,
        "font-size": `${ c.fontSize }px`,
        "font-weight": c.fontWeight.toString(),
      }
      const span = SVGBuilder.createTSpan(c.label, attrs)

      textElement.appendChild(span)
    })
    textGroup.append(textElement)

    text.decorators.forEach(d =>
    {
      const deco = this.decoratorUtil.getSVGElement(d as OIDecorator)
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
