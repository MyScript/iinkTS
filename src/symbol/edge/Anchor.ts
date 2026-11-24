import type { TBox, TPoint } from "@/core"
import { computeDistance } from "@/core"
/**
 * Anchor point on a symbol, expressed as normalized 0-1 coordinates within the symbol's bounds.
 * (0,0) = top-left, (1,1) = bottom-right.
 * Stored as normalized values so the anchor remains valid when the target symbol moves or resizes.
 * @group Symbol
 */
export type TAnchor = {
  symbolId: string
  normalizedX: number
  normalizedY: number
  /** Intersection of the edge with the shape border, in world coordinates. */
  entryPoint?: { x: number; y: number }
}

/**
 * Resolve a normalized anchor to an absolute TPoint given the target symbol's bounding box.
 * @group Symbol
 */
export function resolveAnchorPoint(
  anchor: TAnchor,
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
): { x: number; y: number } {
  return {
    x: bounds.x + anchor.normalizedX * bounds.width,
    y: bounds.y + anchor.normalizedY * bounds.height,
  }
}

/**
 * Compute normalized anchor coordinates from an absolute point and target bounds.
 * Result is clamped to [0, 1].
 * @group Symbol
 */
export function computeNormalizedAnchor(
  point: { x: number; y: number },
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
): { normalizedX: number; normalizedY: number } {
  const w = bounds.width || 1
  const h = bounds.height || 1
  return {
    normalizedX: Math.max(0, Math.min(1, (point.x - bounds.x) / w)),
    normalizedY: Math.max(0, Math.min(1, (point.y - bounds.y) / h)),
  }
}

/**
 * Assign each candidate connection to whichever of an edge's own endpoints (start/end) is
 * nearest (by distance to the target box's center), then compute a normalized anchor point
 * for each assigned connection (nearest point on the target box's boundary to the edge's
 * endpoint). Used both pre-convert (targetId = jiixBlockId) and post-convert (targetId = real
 * symbol id) — the caller decides what targetId means.
 * @group Symbol
 */
export function resolveConnectionAnchors(
  ownStart: TPoint,
  ownEnd: TPoint,
  connections: { targetId: string; box: TBox }[]
): { startAnchor?: TAnchor; endAnchor?: TAnchor } {
  if (connections.length === 0) {
    return {}
  }

  const boxCenter = (box: TBox): TPoint => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 })

  type TSlot = { key: "start" | "end"; point: TPoint }
  let remainingSlots: TSlot[] = [
    { key: "start", point: ownStart },
    { key: "end", point: ownEnd },
  ]
  const remainingConnections = [...connections]
  const anchors: { startAnchor?: TAnchor; endAnchor?: TAnchor } = {}

  const pickGlobalBestPair = (): { slotIndex: number; connectionIndex: number } | undefined => {
    if (remainingConnections.length === 0) {
      return undefined
    }
    let best: { slotIndex: number; connectionIndex: number; distance: number } | undefined
    remainingSlots.forEach((slot, slotIndex) => {
      remainingConnections.forEach((connection, connectionIndex) => {
        const distance = computeDistance(slot.point, boxCenter(connection.box))
        if (!best || distance < best.distance) {
          best = { slotIndex, connectionIndex, distance }
        }
      })
    })
    return best
  }

  // Round 1: the single globally-nearest (endpoint, connection) pair across everything remaining.
  // Round 2 (if anything is left): whatever's left in the pool goes to whichever endpoint is left.
  for (let round = 0; round < 2; round++) {
    const best = pickGlobalBestPair()
    if (!best) {
      break
    }
    const slot = remainingSlots[best.slotIndex]
    const [connection] = remainingConnections.splice(best.connectionIndex, 1)
    remainingSlots = remainingSlots.filter((_, i) => i !== best.slotIndex)
    // To anchor at a point along the edge of the shape
    // const nearestPoint = BoxOps.nearestBoundaryPoint(connection.box, slot.point)
    // const { normalizedX, normalizedY } = computeNormalizedAnchor(nearestPoint, connection.box)
    // const anchor: TAnchor = { symbolId: connection.targetId, normalizedX, normalizedY }
    // Always anchor at the target's center
    const anchor: TAnchor = { symbolId: connection.targetId, normalizedX: 0.5, normalizedY: 0.5 }
    if (slot.key === "start") {
      anchors.startAnchor = anchor
    } else {
      anchors.endAnchor = anchor
    }
  }

  return anchors
}
