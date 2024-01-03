import { EdgeDecoration, TOIEdge } from "../../primitive"
import { DefaultStyle } from "../../style"
import { MatrixTransform } from "../../transform"
import { createPath } from "./SVGElementBuilder"

/**
 * @group Renderer
 */
export class OISVGEdgeUtil
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
      "opacity": (edge.style.opacity || DefaultStyle.opacity!).toString(),
      "transform": MatrixTransform.toCssString(edge.transform),
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
