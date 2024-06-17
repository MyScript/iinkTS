import { EdgeDecoration, EdgeKind, OIEdgeArc, OIEdgeLine, OIEdgePolyLine, TOIEdge } from "../../primitive"
import { DefaultStyle } from "../../style"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class OISVGEdgeUtil
{
  selectionFilterId: string
  removalFilterId: string
  arrowStartDecoration: string
  arrowEndDecoration: string

  constructor(selectionFilterId: string, removalFilterId: string, arrowStartDecoration: string, arrowEndDecoration: string)
  {
    this.selectionFilterId = selectionFilterId
    this.removalFilterId = removalFilterId
    this.arrowStartDecoration = arrowStartDecoration
    this.arrowEndDecoration = arrowEndDecoration
  }

  getLinePath(line: OIEdgeLine): string
  {
    return `M ${ line.start.x } ${ line.start.y } L ${ line.end.x } ${ line.end.y }`
  }

  getPolyLinePath(line: OIEdgePolyLine): string
  {
    return `M ${ line.vertices[0].x } ${ line.vertices[0].y } ${ line.vertices.map(p => `L ${ p.x } ${ p.y }`).join(" ") }`
  }

  getArcPath(arc: OIEdgeArc): string
  {
    return `M ${ arc.vertices[0].x } ${ arc.vertices[0].y } Q ${ arc.vertices.map(p => `${p.x} ${p.y}`).join(" ") }`
  }

  getSVGPath(edge: TOIEdge): string
  {
    switch (edge.kind) {
      case EdgeKind.Line:
        return this.getLinePath(edge as OIEdgeLine)
      case EdgeKind.PolyEdge:
        return this.getPolyLinePath(edge as OIEdgePolyLine)
      case EdgeKind.Arc:
        return this.getArcPath(edge as OIEdgeArc)
      default:
        throw new Error(`Can't getSVGPath for edge cause kind is unknow: "${ edge.kind }"`)
    }
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
      "d": this.getSVGPath(edge),
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
    if (edge.deleting) {
      attrs["filter"] = `url(#${ this.removalFilterId })`
    }

    return SVGBuilder.createPath(attrs)
  }

}
