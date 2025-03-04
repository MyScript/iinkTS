import { EdgeDecoration, EdgeKind, IIEdgeArc, IIEdgeLine, IIEdgePolyLine, TIIEdge } from "../../symbol"
import { DefaultStyle } from "../../style"
import { SVGRendererConst } from "./SVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class SVGRendererEdgeUtil
{
  static getLinePath(line: IIEdgeLine): string
  {
    return `M ${ line.start.x } ${ line.start.y } L ${ line.end.x } ${ line.end.y }`
  }

  static getPolyLinePath(line: IIEdgePolyLine): string
  {
    return `M ${ line.vertices[0].x } ${ line.vertices[0].y } ${ line.vertices.map(p => `L ${ p.x } ${ p.y }`).join(" ") }`
  }

  static getArcPath(arc: IIEdgeArc): string
  {
    return `M ${ arc.vertices[0].x } ${ arc.vertices[0].y } Q ${ arc.vertices.map(p => `${ p.x } ${ p.y }`).join(" ") }`
  }

  static getSVGPath(edge: TIIEdge): string
  {
    switch (edge.kind) {
      case EdgeKind.Line:
        return SVGRendererEdgeUtil.getLinePath(edge)
      case EdgeKind.PolyEdge:
        return SVGRendererEdgeUtil.getPolyLinePath(edge)
      case EdgeKind.Arc:
        return SVGRendererEdgeUtil.getArcPath(edge)
      default:
        throw new Error(`Can't getSVGPath for edge cause kind is unknow: "${ JSON.stringify(edge) }"`)
    }
  }

  static getSVGElement(edge: TIIEdge): SVGGraphicsElement
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
      attrs["filter"] = `url(#${ SVGRendererConst.selectionFilterId })`
    }
    if (edge.deleting) {
      attrs["filter"] = `url(#${ SVGRendererConst.removalFilterId })`
    }
    const group = SVGBuilder.createGroup(attrs)

    const pathAttrs: { [key: string]: string } = {
      "fill": "transparent",
      "stroke": edge.style.color || DefaultStyle.color!,
      "stroke-width": (edge.style.width || DefaultStyle.width).toString(),
      "d": SVGRendererEdgeUtil.getSVGPath(edge),
    }
    if (edge.style.opacity) {
      pathAttrs["opacity"] = edge.style.opacity.toString()
    }

    if (edge.startDecoration === EdgeDecoration.Arrow) {
      pathAttrs["marker-start"] = `url(#${ SVGRendererConst.arrowHeadStartMarker })`
    }
    if (edge.endDecoration === EdgeDecoration.Arrow) {
      pathAttrs["marker-end"] = `url(#${ SVGRendererConst.arrowHeadEndMaker })`
    }
    group.appendChild(SVGBuilder.createPath(pathAttrs))
    return group
  }


}