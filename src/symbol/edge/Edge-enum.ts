import { HIT_TOLERANCE } from "@/constants"
import type { TPoint } from "@/core"
import { BoxOps, OBBOps, type TOBB } from "@/core"
import type { TStyle } from "@/style"

/**
 * @group Symbol
 */
export enum EdgeKind {
  Line = "line",
  PolyEdge = "polyedge",
  Arc = "arc",
}

/**
 * How an edge's end is drawn, and how the recognizer reports it in JIIX.
 * @group Symbol
 */
export enum EdgeDecoration {
  Arrow = "arrow-head",
}

/**
 * @group Symbol
 */
export function computeEdgeBounds(
  vertices: TPoint[],
  style: TStyle,
  startDecoration?: EdgeDecoration,
  endDecoration?: EdgeDecoration
): TOBB {
  const bb = BoxOps.createFromPoints(vertices)
  bb.x -= HIT_TOLERANCE
  bb.y -= HIT_TOLERANCE
  bb.height += 2 * HIT_TOLERANCE
  bb.width += 2 * HIT_TOLERANCE
  if (startDecoration || endDecoration) {
    bb.x -= (style.width || 1) * 2.5
    bb.y -= (style.width || 1) * 2.5
    bb.height += (style.width || 1) * 5
    bb.width += (style.width || 1) * 5
  }
  return OBBOps.fromBox(bb)
}
