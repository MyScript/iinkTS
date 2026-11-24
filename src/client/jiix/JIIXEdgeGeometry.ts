import type { TPoint } from "@/core"
import { computePointOnEllipse, convertMillimeterToPixel } from "@/core"

import type { TJIIXEdgeElement } from "./JIIX"
import { JIIXEdgeKind } from "./JIIX"

/**
 * Extract an edge JIIX element's own start/end points (in pixels), regardless of
 * whether the edge has been converted to a vector symbol yet. Used to resolve which
 * connected shape binds to which end of the edge, both at sync time and at convert time.
 * @group Client/Export
 */
export function extractEdgeEndpoints(edge: TJIIXEdgeElement): { start: TPoint; end: TPoint } | undefined {
  switch (edge.kind) {
    case JIIXEdgeKind.Line:
      return {
        start: { x: convertMillimeterToPixel(edge.x1), y: convertMillimeterToPixel(edge.y1) },
        end: { x: convertMillimeterToPixel(edge.x2), y: convertMillimeterToPixel(edge.y2) },
      }
    case JIIXEdgeKind.PolyEdge: {
      if (!edge.edges.length) {
        return undefined
      }
      const first = edge.edges[0]
      const last = edge.edges[edge.edges.length - 1]
      return {
        start: { x: convertMillimeterToPixel(first.x1), y: convertMillimeterToPixel(first.y1) },
        end: { x: convertMillimeterToPixel(last.x2), y: convertMillimeterToPixel(last.y2) },
      }
    }
    case JIIXEdgeKind.Arc: {
      const center: TPoint = { x: convertMillimeterToPixel(edge.cx), y: convertMillimeterToPixel(edge.cy) }
      const radiusX = convertMillimeterToPixel(edge.rx)
      const radiusY = convertMillimeterToPixel(edge.ry)
      return {
        start: computePointOnEllipse(center, radiusX, radiusY, edge.phi, edge.startAngle),
        end: computePointOnEllipse(center, radiusX, radiusY, edge.phi, edge.startAngle + edge.sweepAngle),
      }
    }
    default:
      return undefined
  }
}
