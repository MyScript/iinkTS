import { EdgeDecoration, EdgeKind, OIEdgeArc, OIEdgeLine, OIEdgePolyLine, TOIEdge } from "../../primitive"
import { DefaultStyle } from "../../style"
import { computeDistance } from "../../utils"
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
    return `M ${ line.start.x } ${ line.start.y } ${ line.middles.map(p => `L ${ p.x } ${ p.y }`)} L ${ line.end.x } ${ line.end.y }`
  }

  getArcPath(arc: OIEdgeArc): string
  {
    const dist12 = computeDistance(arc.middle, arc.start)
    const dist23 = computeDistance(arc.end, arc.middle)
    const dist13 = computeDistance(arc.start, arc.middle)

    const angle = Math.acos((Math.pow(dist23, 2) + Math.pow(dist12, 2) - Math.pow(dist13, 2)) / (2 * dist23 * dist12))

    const K = dist23 * dist12 * Math.sin(angle) / 2
    const r = Math.round(dist23 * dist12 * dist13 / 4 / K * 1000) / 1000
    const laf = +(Math.PI / 2 > angle)
    const saf = +((arc.end.x - arc.start.x) * (arc.middle.y - arc.start.y) - (arc.end.y - arc.start.y) * (arc.middle.x - arc.start.x) < 0)

    return `M ${ arc.start.x } ${ arc.start.y } A ${ r } ${ r } 0 ${ laf } ${ saf } ${ arc.end.x } ${ arc.end.y }`
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
