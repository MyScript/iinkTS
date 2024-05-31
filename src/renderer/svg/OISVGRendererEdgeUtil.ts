import { EdgeKind, OIEdgeArc, OIEdgeLine, OIEdgePolyLine, TOIEdge } from "../../primitive"

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
    return `M ${ arc.vertices[0].x } ${ arc.vertices[0].y } Q ${ arc.vertices.map(p => `${p.x} ${p.y}`).join(" ") }`
  }

  static getSVGPath(edge: TOIEdge): string
  {
    switch (edge.kind) {
      case EdgeKind.Line:
        return OISVGRendererEdgeUtil.getLinePath(edge as OIEdgeLine)
      case EdgeKind.PolyEdge:
        return OISVGRendererEdgeUtil.getPolyLinePath(edge as OIEdgePolyLine)
      case EdgeKind.Arc:
        return OISVGRendererEdgeUtil.getArcPath(edge as OIEdgeArc)
      default:
        throw new Error(`Can't getSVGPath for edge cause kind is unknow: "${ edge.kind }"`)
    }
  }


}
