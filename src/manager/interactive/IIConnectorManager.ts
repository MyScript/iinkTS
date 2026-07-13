import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { LoggerCategory } from "@/logger"
import type { TEdge, TPoint, TShape, TSymbol } from "@/symbol"
import type { TAnchor } from "@/symbol/edge/Anchor"
import { computeNormalizedAnchor, resolveAnchorPoint } from "@/symbol/edge/Anchor"
import { EdgeOps } from "@/symbol/edge/Edge"
import { EdgeLineOps } from "@/symbol/edge/Line"
import { EdgePolyLineOps } from "@/symbol/edge/PolyLine"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"
import { ShapeOps } from "@/symbol/shape/Shape"
import type { MatrixTransform } from "@/transform"
import { findIntersectionBetween2Segment, isPointInsidePolygon } from "@/utils/geometry"

import { IIAbstractManager } from "./IIAbstractManager"

const ANCHOR_HINT_ROLE = "anchor-hint"
const ANCHOR_HINT_COLOR = "#3e68ff"

/**
 * Manages anchored edges — edges whose endpoints are bound to other symbols.
 * When an anchored symbol moves, `updateAnchoredEdges` recomputes the
 * corresponding edge endpoints from their stored normalized anchor coordinates.
 * @group Manager
 */
export class IIConnectorManager extends IIAbstractManager {
  protected managerName = "IIConnectorManager"

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.MANAGER)
  }

  /**
   * Find the first non-edge symbol whose bounds contain the given point.
   * `excludeId` prevents matching the edge being dragged.
   */
  findSymbolAtPoint(point: TPoint, excludeId: string): TSymbol | undefined {
    return this.model.symbols.find((s) => {
      if (s.id === excludeId) {
        return false
      }
      if (EdgeOps.isEdge(s)) {
        return false
      }
      if (ShapeOps.isShape(s)) {
        return isPointInsidePolygon(point, (s as TShape).vertices)
      }
      return OBBOps.containsPoint((s as unknown as { bounds: TOBB }).bounds, point)
    })
  }

  /**
   * Draw a dashed highlight rect around a symbol's bounds to indicate an
   * active anchor snap target. Clears any previously shown hint first.
   */
  showAnchorHint(point: TPoint, excludeId: string): TSymbol | undefined {
    this.clearAnchorHint()
    const target = this.findSymbolAtPoint(point, excludeId)
    if (target) {
      const bounds = OBBOps.toBox((target as unknown as { bounds: TOBB }).bounds)
      this.canvas.renderer.drawRect(bounds, {
        role: ANCHOR_HINT_ROLE,
        fill: "none",
        stroke: ANCHOR_HINT_COLOR,
        "stroke-width": "2",
        "stroke-dasharray": "6 3",
        "pointer-events": "none",
        style: "pointer-events:none",
      })
    }
    return target
  }

  /** Remove the anchor snap hint from the interaction layer. */
  clearAnchorHint(): void {
    this.canvas.renderer.clearElements({
      attrs: { role: ANCHOR_HINT_ROLE },
    })
  }

  /**
   * Find where the ray from `anchoredPoint` toward `otherPoint` exits the polygon
   * defined by `shapeVertices`. Using a ray (not a segment) ensures a result even when
   * shapes overlap and `otherPoint` is inside the polygon.
   */
  private computeEntryPoint(
    anchoredPoint: TPoint,
    otherPoint: TPoint,
    shapeVertices: TPoint[]
  ): { x: number; y: number } | undefined {
    const dx = otherPoint.x - anchoredPoint.x
    const dy = otherPoint.y - anchoredPoint.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) {
      return undefined
    }
    const FAR = 100000
    const edgeSeg = {
      p1: anchoredPoint,
      p2: {
        x: anchoredPoint.x + (dx / len) * FAR,
        y: anchoredPoint.y + (dy / len) * FAR,
      },
    }
    for (let i = 0; i < shapeVertices.length; i++) {
      const shapeSeg = {
        p1: shapeVertices[i],
        p2: shapeVertices[(i + 1) % shapeVertices.length],
      }
      const hit = findIntersectionBetween2Segment(edgeSeg, shapeSeg)
      if (hit) {
        return hit
      }
    }
    return undefined
  }

  /**
   * Recompute `entryPoint` on every anchor currently set on `edge`.
   * Must be called after the edge endpoints and anchor target shape are in their final positions.
   */
  private recomputeAllEntryPoints(edge: TEdge): void {
    if (EdgeOps.isLineEdge(edge)) {
      if (edge.startAnchor) {
        const target = this.model.getRootSymbol(edge.startAnchor.symbolId)
        edge.startAnchor.entryPoint =
          target && ShapeOps.isShape(target)
            ? this.computeEntryPoint(edge.start, edge.end, (target as TShape).vertices)
            : undefined
      }
      if (edge.endAnchor) {
        const target = this.model.getRootSymbol(edge.endAnchor.symbolId)
        edge.endAnchor.entryPoint =
          target && ShapeOps.isShape(target)
            ? this.computeEntryPoint(edge.end, edge.start, (target as TShape).vertices)
            : undefined
      }
    } else if (EdgeOps.isPolyEdge(edge)) {
      const n = edge.points.length
      if (edge.startAnchor && n >= 2) {
        const target = this.model.getRootSymbol(edge.startAnchor.symbolId)
        edge.startAnchor.entryPoint =
          target && ShapeOps.isShape(target)
            ? this.computeEntryPoint(edge.points[0], edge.points[1], (target as TShape).vertices)
            : undefined
      }
      if (edge.endAnchor && n >= 2) {
        const target = this.model.getRootSymbol(edge.endAnchor.symbolId)
        edge.endAnchor.entryPoint =
          target && ShapeOps.isShape(target)
            ? this.computeEntryPoint(edge.points[n - 1], edge.points[n - 2], (target as TShape).vertices)
            : undefined
      }
    }
  }

  /**
   * Assign or clear the start/end anchor on a Line or PolyLine edge endpoint.
   * When a target shape is found, snaps the endpoint to the shape center and
   * computes `entryPoint` (intersection with shape border) for split rendering.
   * Called after the user releases an edge endpoint drag.
   */
  applyEndpointAnchor(edge: TEdge, pointIndex: number, point: TPoint): void {
    if (!EdgeOps.isLineEdge(edge) && !EdgeOps.isPolyEdge(edge)) {
      return
    }
    const isStart = pointIndex === 0
    const isEnd = pointIndex === edge.vertices.length - 1
    if (!isStart && !isEnd) {
      return
    }

    const target = this.findSymbolAtPoint(point, edge.id)

    if (target !== undefined) {
      const center: TPoint = {
        ...(target as unknown as { bounds: TOBB }).bounds.center,
      }
      const anchor: TAnchor = {
        symbolId: target.id,
        normalizedX: 0.5,
        normalizedY: 0.5,
      }
      if (EdgeOps.isLineEdge(edge)) {
        if (isStart) {
          edge.start = center
          edge.startAnchor = anchor
        }
        if (isEnd) {
          edge.end = center
          edge.endAnchor = anchor
        }
        EdgeLineOps.updateDerivedFields(edge)
      } else if (EdgeOps.isPolyEdge(edge)) {
        if (isStart) {
          edge.points[0] = center
          edge.startAnchor = anchor
        }
        if (isEnd) {
          edge.points[edge.points.length - 1] = center
          edge.endAnchor = anchor
        }
        EdgePolyLineOps.updateDerivedFields(edge)
      }
    } else {
      if (isStart) {
        edge.startAnchor = undefined
      }
      if (isEnd) {
        edge.endAnchor = undefined
      }
    }

    this.recomputeAllEntryPoints(edge)
  }

  /**
   * Visually reposition anchored edge endpoints by applying `matrix` to the
   * stored anchor point (original position) — no model update.
   * Call from transform `continue()` for real-time edge following.
   */
  drawAnchoredEdgesForMatrix(symbolIds: string[], matrix: MatrixTransform): void {
    if (symbolIds.length === 0) {
      return
    }
    const idSet = new Set(symbolIds)

    // Always recompute both anchor entry points using final endpoint positions —
    // even when only one shape is moving, the other endpoint's exit angle changes.
    const recomputeAnchor = (anchor: TAnchor, from: TPoint, to: TPoint): TAnchor => {
      const target = this.model.getRootSymbol(anchor.symbolId)
      if (!target || !ShapeOps.isShape(target)) {
        return anchor
      }
      const vertices = idSet.has(anchor.symbolId)
        ? (target as TShape).vertices.map((v) => matrix.applyToPoint(v))
        : (target as TShape).vertices
      return {
        ...anchor,
        entryPoint: this.computeEntryPoint(from, to, vertices),
      }
    }

    this.model.symbols.forEach((symbol) => {
      if (!EdgeOps.isEdge(symbol)) {
        return
      }
      if (!EdgeOps.isLineEdge(symbol) && !EdgeOps.isPolyEdge(symbol)) {
        return
      }

      let changed = false

      if (EdgeOps.isLineEdge(symbol)) {
        let start = symbol.start
        let end = symbol.end
        const startTargetSymbol =
          symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)
            ? this.model.getRootSymbol(symbol.startAnchor.symbolId)
            : undefined
        const endTargetSymbol =
          symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)
            ? this.model.getRootSymbol(symbol.endAnchor.symbolId)
            : undefined

        if (startTargetSymbol) {
          start = matrix.applyToPoint(
            resolveAnchorPoint(
              symbol.startAnchor!,
              OBBOps.toBox(
                (
                  startTargetSymbol as {
                    bounds: TOBB
                  }
                ).bounds
              )
            )
          )
          changed = true
        }
        if (endTargetSymbol) {
          end = matrix.applyToPoint(
            resolveAnchorPoint(
              symbol.endAnchor!,
              OBBOps.toBox(
                (
                  endTargetSymbol as {
                    bounds: TOBB
                  }
                ).bounds
              )
            )
          )
          changed = true
        }
        if (changed) {
          const cloneStartAnchor = symbol.startAnchor
            ? recomputeAnchor(symbol.startAnchor, start, end)
            : symbol.startAnchor
          const cloneEndAnchor = symbol.endAnchor ? recomputeAnchor(symbol.endAnchor, end, start) : symbol.endAnchor
          const clone = {
            ...symbol,
            start,
            end,
            startAnchor: cloneStartAnchor,
            endAnchor: cloneEndAnchor,
          }
          EdgeLineOps.updateDerivedFields(clone)
          this.canvas.renderer.drawSymbol(clone)
        }
      } else if (EdgeOps.isPolyEdge(symbol)) {
        const points = symbol.points.map((p) => ({
          ...p,
        }))
        const startTargetSymbol =
          symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)
            ? this.model.getRootSymbol(symbol.startAnchor.symbolId)
            : undefined
        const endTargetSymbol =
          symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)
            ? this.model.getRootSymbol(symbol.endAnchor.symbolId)
            : undefined

        if (startTargetSymbol) {
          points[0] = matrix.applyToPoint(
            resolveAnchorPoint(
              symbol.startAnchor!,
              OBBOps.toBox(
                (
                  startTargetSymbol as {
                    bounds: TOBB
                  }
                ).bounds
              )
            )
          )
          changed = true
        }
        if (endTargetSymbol) {
          points[points.length - 1] = matrix.applyToPoint(
            resolveAnchorPoint(
              symbol.endAnchor!,
              OBBOps.toBox(
                (
                  endTargetSymbol as {
                    bounds: TOBB
                  }
                ).bounds
              )
            )
          )
          changed = true
        }
        if (changed) {
          const n = points.length
          const cloneStartAnchor =
            symbol.startAnchor && n >= 2
              ? recomputeAnchor(symbol.startAnchor, points[0], points[1])
              : symbol.startAnchor
          const cloneEndAnchor =
            symbol.endAnchor && n >= 2
              ? recomputeAnchor(symbol.endAnchor, points[n - 1], points[n - 2])
              : symbol.endAnchor
          const clone = {
            ...symbol,
            points,
            startAnchor: cloneStartAnchor,
            endAnchor: cloneEndAnchor,
          }
          EdgePolyLineOps.updateDerivedFields(clone)
          this.canvas.renderer.drawSymbol(clone)
        }
      }
    })
  }

  /**
   * Resolve an anchor to a world point, optionally using pre-transform bounds + matrix.
   * When matrix and preTransformBoundsById are provided (rotation case), resolves in the
   * pre-transform AABB then applies the matrix — this preserves the physical point on
   * the shape regardless of AABB size change. Also updates normalizedXY on the anchor
   * so subsequent transforms resolve correctly in the new AABB.
   */
  private resolveAndUpdateAnchor(
    anchor: TAnchor,
    matrix: MatrixTransform | undefined,
    preTransformBoundsById: Map<string, TOBB> | undefined
  ): { x: number; y: number } | undefined {
    const target = this.model.getRootSymbol(anchor.symbolId) as { bounds: TOBB } | undefined
    if (!target) {
      return undefined
    }
    const targetBox = OBBOps.toBox(target.bounds)
    if (matrix && preTransformBoundsById) {
      const preBounds = preTransformBoundsById.get(anchor.symbolId)
      if (preBounds) {
        const worldPoint = matrix.applyToPoint(resolveAnchorPoint(anchor, OBBOps.toBox(preBounds)))
        const { normalizedX, normalizedY } = computeNormalizedAnchor(worldPoint, targetBox)
        anchor.normalizedX = normalizedX
        anchor.normalizedY = normalizedY
        return worldPoint
      }
    }
    return resolveAnchorPoint(anchor, targetBox)
  }

  /**
   * Clear anchors from any edges in `symbols` that are being directly translated.
   * An anchored edge that the user explicitly moves becomes a free edge.
   */
  clearAnchoredEdgesFor(symbols: TSymbol[]): void {
    symbols.forEach((symbol) => {
      if (!EdgeOps.isEdge(symbol)) {
        return
      }
      if (!EdgeOps.isLineEdge(symbol) && !EdgeOps.isPolyEdge(symbol)) {
        return
      }
      if (!symbol.startAnchor && !symbol.endAnchor) {
        return
      }
      symbol.startAnchor = undefined
      symbol.endAnchor = undefined
      if (EdgeOps.isLineEdge(symbol)) {
        EdgeLineOps.updateDerivedFields(symbol)
      } else {
        EdgePolyLineOps.updateDerivedFields(symbol)
      }
      this.model.updateSymbol(symbol)
      this.canvas.renderer.drawSymbol(symbol)
    })
  }

  /**
   * Recompute endpoints of all edges anchored to any of the given symbol IDs.
   * Called by transform managers after translate / resize / rotate.
   * Pass `matrix` and `preTransformBoundsById` when called from rotation so that
   * anchor resolution uses the pre-transform AABB rather than the post-rotation AABB.
   */
  updateAnchoredEdges(symbolIds: string[], matrix?: MatrixTransform, preTransformBoundsById?: Map<string, TOBB>): void {
    if (symbolIds.length === 0) {
      return
    }
    this.logger.info("updateAnchoredEdges", {
      symbolIds,
    })

    const idSet = new Set(symbolIds)

    this.model.symbols.forEach((symbol) => {
      if (!EdgeOps.isEdge(symbol)) {
        return
      }
      if (!EdgeOps.isLineEdge(symbol) && !EdgeOps.isPolyEdge(symbol)) {
        return
      }

      let changed = false

      if (EdgeOps.isLineEdge(symbol)) {
        if (symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.startAnchor, matrix, preTransformBoundsById)
          if (point) {
            symbol.start = point
            changed = true
          }
        }
        if (symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.endAnchor, matrix, preTransformBoundsById)
          if (point) {
            symbol.end = point
            changed = true
          }
        }
        if (changed) {
          EdgeLineOps.updateDerivedFields(symbol)
          this.recomputeAllEntryPoints(symbol)
        }
      } else if (EdgeOps.isPolyEdge(symbol)) {
        if (symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.startAnchor, matrix, preTransformBoundsById)
          if (point && symbol.points.length > 0) {
            symbol.points[0] = point
            changed = true
          }
        }
        if (symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.endAnchor, matrix, preTransformBoundsById)
          if (point && symbol.points.length > 0) {
            symbol.points[symbol.points.length - 1] = point
            changed = true
          }
        }
        if (changed) {
          EdgePolyLineOps.updateDerivedFields(symbol)
          this.recomputeAllEntryPoints(symbol)
        }
      }

      if (changed) {
        this.canvas.renderer.drawSymbol(symbol)
        this.model.updateSymbol(symbol)
      }
    })
  }
}
