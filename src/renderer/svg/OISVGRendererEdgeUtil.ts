import { EdgeDecoration, EdgeKind, OIEdgeArc, OIEdgeLine, OIEdgePolyLine, TOIEdge } from "../../symbol"
import { DefaultStyle } from "../../style"
import { OISVGRendererConst } from "./OISVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class OISVGRendererEdgeUtil
{
  static getLinePath(line: OIEdgeLine): string
  {
    return `M ${ line.start.x } ${ line.start.y } L ${ line.end.x } ${ line.end.y }`
  }

  static getPolyLinePath(line: OIEdgePolyLine): string
  {
    return `M ${ line.vertices[0].x } ${ line.vertices[0].y } ${ line.vertices.map(p => `L ${ p.x } ${ p.y }`).join(" ") }`
  }

  static getArcPath(arc: OIEdgeArc): string
  {
    return `M ${ arc.vertices[0].x } ${ arc.vertices[0].y } Q ${ arc.vertices.map(p => `${ p.x } ${ p.y }`).join(" ") }`
  }

  static getSVGPath(edge: TOIEdge): string
  {
    switch (edge.kind) {
      case EdgeKind.Line:
        return OISVGRendererEdgeUtil.getLinePath(edge)
      case EdgeKind.PolyEdge:
        return OISVGRendererEdgeUtil.getPolyLinePath(edge)
      case EdgeKind.Arc:
        return OISVGRendererEdgeUtil.getArcPath(edge)
      default:
        throw new Error(`Can't getSVGPath for edge cause kind is unknow: "${ JSON.stringify(edge) }"`)
    }
  }

  static getSVGElement(edge: TOIEdge): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": edge.id,
      "type": edge.type,
      "kind": edge.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    if (edge.selected) {
      attrs["filter"] = `url(#${ OISVGRendererConst.selectionFilterId })`
    }
    if (edge.deleting) {
      attrs["filter"] = `url(#${ OISVGRendererConst.removalFilterId })`
    }
    const group = SVGBuilder.createGroup(attrs)

    const pathAttrs: { [key: string]: string } = {
      "fill": "transparent",
      "stroke": edge.style.color || DefaultStyle.color!,
      "stroke-width": (edge.style.width || DefaultStyle.width).toString(),
      "d": OISVGRendererEdgeUtil.getSVGPath(edge),
    }
    if (edge.style.opacity) {
      pathAttrs["opacity"] = edge.style.opacity.toString()
    }

    if (edge.startDecoration === EdgeDecoration.Arrow) {
      pathAttrs["marker-start"] = `url(#${ OISVGRendererConst.arrowHeadStartMarker })`
    }
    if (edge.endDecoration === EdgeDecoration.Arrow) {
      pathAttrs["marker-end"] = `url(#${ OISVGRendererConst.arrowHeadEndMaker })`
    }
    group.appendChild(SVGBuilder.createPath(pathAttrs))
    return group
  }


}
