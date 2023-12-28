import { EdgeDecoration, TOIEdge } from "../../primitive"
import { DefaultStyle } from "../../style"
import { createPath } from "./SVGElementBuilder"

export class OISVGRendererEdge
{
  selectionFilterId: string
  arrowStartDecoration: string
  arrowEndDecoration: string

  constructor(selectionFilterId: string, arrowStartDecoration: string, arrowEndDecoration: string)
  {
    this.selectionFilterId = selectionFilterId
    this.arrowStartDecoration = arrowStartDecoration
    this.arrowEndDecoration = arrowEndDecoration
  }

  getSVGElement(edge: TOIEdge): SVGPathElement
  {
    const attrs: { [key: string]: string } = {
      "id": edge.id,
      "type": edge.type,
      "kind": edge.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": "transparent",
      "stroke": edge.style.color || DefaultStyle.color!,
      "stroke-width": (edge.style.width || DefaultStyle.width!).toString(),
      "d": `M ${edge.start.x} ${edge.start.y} L ${edge.end.x} ${edge.end.y}`,
    }

    if (edge.startDecoration === EdgeDecoration.Arrow) {
      attrs["marker-start"] = `url(#${ this.arrowStartDecoration })`
    }
    if (edge.endDecoration === EdgeDecoration.Arrow) {
      attrs["marker-end"] = `url(#${ this.arrowEndDecoration })`
    }
    if (edge.selected) {
      attrs["filter"] = `url(#${ this.selectionFilterId })`
    }

    return createPath(attrs)
  }

}
