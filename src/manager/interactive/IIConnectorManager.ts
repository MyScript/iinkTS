import type { TInteractiveInkCanvas } from "@/canvas"
import type { MatrixTransform, TDraft, TPoint } from "@/core"
import {
  applyInverseMatrixToPoint,
  applyMatrixToPoint,
  BoxOps,
  computeDistance,
  findIntersectionBetween2Segment,
  isIdentityMatrix,
  isPointInsidePolygon,
  OBBOps,
  type TOBB,
  type TPartialDeep,
} from "@/core"
import { LoggerCategory } from "@/logger"
import type { TAnchor, TEdge, TStroke, TSymbol } from "@/symbol"
import { cloneSymbol, computeNormalizedAnchor, isStroke, resolveAnchorPoint, stretchArcEndpoint } from "@/symbol"
import { EdgeUtil, ShapeUtil, SVGBuilder, SymbolGeometry, symbolRegistry } from "@/symbol-utils"

import { IIAbstractManager } from "./IIAbstractManager"

const ANCHOR_HINT_ROLE = "anchor-hint"
const ANCHOR_HINT_COLOR = "#3e68ff"
const ANCHOR_HINT_PATTERN_ID = "ms-anchor-hint-pattern"

/**
 * A pre-convert edge stroke that should follow a transform of the moving set, and how:
 * "rigid" when both of its connected shapes are moving together (nothing shifts relatively),
 * "gradient" when only one is — `movingAnchor` identifies which one to follow toward.
 * @group Manager
 */
export type TFollowedStroke = { symbol: TStroke; mode: "rigid" | "gradient"; movingAnchor?: TAnchor }

/**
 * Result of committing the anchored-edges update pass (both pre-convert strokes and converted
 * Line/PolyEdge/Arc symbols).
 * `rigidStrokeIds` moved by a single uniform matrix — safe to fold into the caller's own
 * matrix-replay history entry (translate/scale/rotate), since re-applying the inverse matrix
 * correctly undoes a uniform transform.
 * `oldSymbols`/`newSymbols` are everything else: gradient-followed raw strokes, and converted
 * edges (their anchor position is *recomputed* from the target's new bounds, not transformed by
 * a matrix relative to their own prior state, so there's no inverse to replay either way). All
 * of these need their pre-mutation snapshot restored directly on undo via the `updated` history
 * entry, not re-derived.
 * @group Manager
 */
export type TAnchoredEdgesUpdateResult = { rigidStrokeIds: string[]; oldSymbols: TSymbol[]; newSymbols: TSymbol[] }

/**
 * @group Manager
 */
export type TConnectorConfiguration = {
  /** Whether moving/resizing/rotating a connected shape reshapes its anchored edges (stroke or
   * converted Line/PolyEdge/Arc) to follow it. Existing anchors and connection tracking (sync,
   * survival across Convert) are unaffected either way — this only gates the visual/commit
   * follow-on-move behavior. */
  followConnectedEdges: boolean
}

/**
 * @group Manager
 * @source
 */
export const DefaultConnectorConfiguration: TConnectorConfiguration = {
  followConnectedEdges: true,
}

/**
 * @group Manager
 */
export class ConnectorConfiguration implements TConnectorConfiguration {
  followConnectedEdges: boolean

  constructor(config?: TPartialDeep<TConnectorConfiguration>) {
    this.followConnectedEdges =
      config?.followConnectedEdges !== undefined
        ? config.followConnectedEdges
        : DefaultConnectorConfiguration.followConnectedEdges
  }
}

/**
 * Manages anchored edges — edges whose endpoints are bound to other symbols.
 * When an anchored symbol moves, `updateAnchoredEdges` recomputes the
 * corresponding edge endpoints from their stored normalized anchor coordinates.
 * @group Manager
 */
export class IIConnectorManager extends IIAbstractManager {
  protected managerName = "IIConnectorManager"
  connectorConfiguration: ConnectorConfiguration
  #anchoredEdgesCache: TEdge[] = []
  #anchoredEdgesCacheVersion = -1

  constructor(canvas: TInteractiveInkCanvas, config?: TPartialDeep<TConnectorConfiguration>) {
    super(canvas, LoggerCategory.MANAGER)
    this.connectorConfiguration = new ConnectorConfiguration(config)
  }

  /**
   * Edges that have at least one anchor, rebuilt only when the model actually changed.
   * `drawAnchoredEdgesForMatrix` is called on every pointermove of a drag, but the model
   * itself only mutates on commit — scanning all symbols per move (as opposed to just the
   * handful of anchored edges) was the O(n) cost this cache removes.
   */
  #getAnchoredEdges(): TEdge[] {
    const currentVersion = this.model.version
    if (this.#anchoredEdgesCacheVersion !== currentVersion) {
      this.#anchoredEdgesCacheVersion = currentVersion
      this.#anchoredEdgesCache = this.model.symbols.filter(
        (s): s is TEdge => EdgeUtil.isEdge(s) && (!!s.startAnchor || !!s.endAnchor)
      )
    }
    return this.#anchoredEdgesCache
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
      if (EdgeUtil.isEdge(s)) {
        return false
      }
      // Whole-document scan on every anchor-hint hover (see showAnchorHint) — one bad symbol
      // (unregistered type) must not abort hit-testing the rest of the document.
      if (!symbolRegistry.has(s.type)) {
        return false
      }
      if (ShapeUtil.isShape(s)) {
        return isPointInsidePolygon(point, SymbolGeometry.verticesOf(s))
      }
      return OBBOps.containsPoint(SymbolGeometry.boundsOf(s), point)
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
      const bounds = OBBOps.toBox(SymbolGeometry.boundsOf(target))
      // Tagging the pattern with the same role as the rect lets clearAnchorHint's single
      // clearElements() sweep remove both together.
      const pattern = SVGBuilder.createPattern(
        ANCHOR_HINT_PATTERN_ID,
        { x: 0, y: 0, width: 8, height: 8 },
        { role: ANCHOR_HINT_ROLE, patternTransform: "rotate(45)" }
      )
      pattern.appendChild(
        SVGBuilder.createLine(
          { x: 0, y: 0 },
          { x: 0, y: 8 },
          { stroke: ANCHOR_HINT_COLOR, "stroke-width": "2", opacity: "0.35" }
        )
      )
      this.canvas.renderer.appendElement(pattern)
      this.canvas.renderer.drawRect(bounds, {
        role: ANCHOR_HINT_ROLE,
        fill: `url(#${ANCHOR_HINT_PATTERN_ID})`,
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
   * `computeEntryPoint`, with both sides brought into the same frame and the answer returned in
   * `edge`'s own.
   *
   * Three frames meet here and used to be mixed. `from`/`to` are the edge's stored coordinates, which
   * are raw; a target shape's vertices come from `SymbolGeometry` in document coordinates, the
   * target's own matrix already applied; and the result is stored on the anchor, from where
   * `PolyLine.getSVGPath` and `Arc.getSVGPath` put it straight into path data — so it has to be raw
   * again, because the element's `transform` attribute is what applies the edge's matrix.
   *
   * The edge's two points are carried forward into document space rather than the target's vertices
   * being carried back: that is two mappings and one return trip whatever the shape's vertex count,
   * and this runs on every anchored-edge update of a drag.
   */
  #entryPointInEdgeFrame(edge: TEdge, from: TPoint, to: TPoint, targetVertices: TPoint[]): TPoint | undefined {
    if (isIdentityMatrix(edge.transform)) {
      return this.computeEntryPoint(from, to, targetVertices)
    }
    const worldEntry = this.computeEntryPoint(
      applyMatrixToPoint(from, edge.transform),
      applyMatrixToPoint(to, edge.transform),
      targetVertices
    )
    return worldEntry ? applyInverseMatrixToPoint(worldEntry, edge.transform) : undefined
  }

  /**
   * Recompute `entryPoint` on every anchor currently set on `edge`.
   * Must be called after the edge endpoints and anchor target shape are in their final positions.
   */
  private recomputeAllEntryPoints(edge: TEdge): void {
    if (EdgeUtil.isLineEdge(edge)) {
      if (edge.startAnchor) {
        const target = this.model.getSymbol(edge.startAnchor.symbolId)
        edge.startAnchor.entryPoint =
          target && ShapeUtil.isShape(target)
            ? this.#entryPointInEdgeFrame(edge, edge.start, edge.end, SymbolGeometry.verticesOf(target))
            : undefined
      }
      if (edge.endAnchor) {
        const target = this.model.getSymbol(edge.endAnchor.symbolId)
        edge.endAnchor.entryPoint =
          target && ShapeUtil.isShape(target)
            ? this.#entryPointInEdgeFrame(edge, edge.end, edge.start, SymbolGeometry.verticesOf(target))
            : undefined
      }
    } else if (EdgeUtil.isPolyEdge(edge)) {
      const n = edge.points.length
      if (edge.startAnchor && n >= 2) {
        const target = this.model.getSymbol(edge.startAnchor.symbolId)
        edge.startAnchor.entryPoint =
          target && ShapeUtil.isShape(target)
            ? this.#entryPointInEdgeFrame(edge, edge.points[0], edge.points[1], SymbolGeometry.verticesOf(target))
            : undefined
      }
      if (edge.endAnchor && n >= 2) {
        const target = this.model.getSymbol(edge.endAnchor.symbolId)
        edge.endAnchor.entryPoint =
          target && ShapeUtil.isShape(target)
            ? this.#entryPointInEdgeFrame(
                edge,
                edge.points[n - 1],
                edge.points[n - 2],
                SymbolGeometry.verticesOf(target)
              )
            : undefined
      }
    } else if (EdgeUtil.isArcEdge(edge)) {
      // `edge` is always a draft here (every caller passes one mid-edit), so this never hits the
      // geometry cache — one verticesOf call shared by both branches instead of the three separate
      // reads (`.length`, `[0]`/`[1]`, `[n-1]`/`[n-2]`) the field-access version used to make.
      // Raw, not document: `#entryPointInEdgeFrame` expects the edge's own frame and carries
      // these forward itself. Reading them already-transformed would apply the matrix twice.
      const vertices = SymbolGeometry.rawOf(edge).vertices
      const n = vertices.length
      if (edge.startAnchor && n >= 2) {
        const target = this.model.getSymbol(edge.startAnchor.symbolId)
        edge.startAnchor.entryPoint =
          target && ShapeUtil.isShape(target)
            ? this.#entryPointInEdgeFrame(edge, vertices[0], vertices[1], SymbolGeometry.verticesOf(target))
            : undefined
      }
      if (edge.endAnchor && n >= 2) {
        const target = this.model.getSymbol(edge.endAnchor.symbolId)
        edge.endAnchor.entryPoint =
          target && ShapeUtil.isShape(target)
            ? this.#entryPointInEdgeFrame(edge, vertices[n - 1], vertices[n - 2], SymbolGeometry.verticesOf(target))
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
  applyEndpointAnchor(edge: TDraft<TEdge>, pointIndex: number, point: TPoint): void {
    if (!EdgeUtil.isLineEdge(edge) && !EdgeUtil.isPolyEdge(edge) && !EdgeUtil.isArcEdge(edge)) {
      return
    }
    const isStart = pointIndex === 0
    const isEnd = pointIndex === SymbolGeometry.verticesOf(edge).length - 1
    if (!isStart && !isEnd) {
      return
    }

    const target = this.findSymbolAtPoint(point, edge.id)

    if (target !== undefined) {
      // The target's centre comes back in document coordinates — its own matrix already applied —
      // and is about to be written into `edge`'s raw `start`/`end`/`points`, which the edge's matrix
      // places. Mapped into the edge's frame first, or anchoring an already-moved edge to a shape
      // would drop its endpoint off by that matrix.
      const center = applyInverseMatrixToPoint(SymbolGeometry.boundsOf(target).center, edge.transform)
      if (!center) {
        // The edge is flattened to nothing on some axis, so it has no frame to anchor into.
        return
      }
      const anchor: TAnchor = {
        symbolId: target.id,
        normalizedX: 0.5,
        normalizedY: 0.5,
      }
      if (EdgeUtil.isLineEdge(edge)) {
        if (isStart) {
          edge.start = center
          edge.startAnchor = anchor
        }
        if (isEnd) {
          edge.end = center
          edge.endAnchor = anchor
        }
      } else if (EdgeUtil.isPolyEdge(edge)) {
        if (isStart) {
          edge.points[0] = center
          edge.startAnchor = anchor
        }
        if (isEnd) {
          edge.points[edge.points.length - 1] = center
          edge.endAnchor = anchor
        }
      } else if (EdgeUtil.isArcEdge(edge)) {
        // An arc has no independent start/end coordinate to overwrite directly — stretch the
        // ellipse (keeping the other endpoint fixed) so the anchored endpoint lands exactly on
        // the target's center, same as a manual endpoint drag.
        if (isStart) {
          Object.assign(edge, stretchArcEndpoint(edge, "start", center))
          edge.startAnchor = anchor
        }
        if (isEnd) {
          Object.assign(edge, stretchArcEndpoint(edge, "end", center))
          edge.endAnchor = anchor
        }
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
    if (symbolIds.length === 0 || !this.connectorConfiguration.followConnectedEdges) {
      return
    }
    const idSet = new Set(symbolIds)

    // Always recompute both anchor entry points using final endpoint positions —
    // even when only one shape is moving, the other endpoint's exit angle changes.
    // `from`/`to` are in `edge`'s own frame, like the stored points the preview clone carries.
    const recomputeAnchor = (edge: TEdge, anchor: TAnchor, from: TPoint, to: TPoint): TAnchor => {
      const target = this.model.getSymbol(anchor.symbolId)
      if (!target || !ShapeUtil.isShape(target)) {
        return anchor
      }
      const vertices = idSet.has(anchor.symbolId)
        ? SymbolGeometry.verticesOf(target).map((v) => matrix.applyToPoint(v))
        : SymbolGeometry.verticesOf(target)
      return {
        ...anchor,
        entryPoint: this.#entryPointInEdgeFrame(edge, from, to, vertices),
      }
    }

    // Where the anchor lands once its moving target is transformed by `matrix`, mapped back into
    // `edge`'s raw frame: the renderer applies `edge.transform` on top, so writing the document
    // point as-is shifted the preview by that matrix — the edge then jumped on pointer-up, where
    // the commit path (resolveAndUpdateAnchor) already maps it back.
    const resolveMovedAnchor = (edge: TEdge, anchor: TAnchor | undefined): TPoint | undefined => {
      if (!anchor || !idSet.has(anchor.symbolId)) {
        return undefined
      }
      const target = this.model.getSymbol(anchor.symbolId)
      if (!target) {
        return undefined
      }
      const worldPoint = matrix.applyToPoint(resolveAnchorPoint(anchor, OBBOps.toBox(SymbolGeometry.boundsOf(target))))
      return applyInverseMatrixToPoint(worldPoint, edge.transform)
    }

    this.#getAnchoredEdges().forEach((symbol) => {
      const startPoint = resolveMovedAnchor(symbol, symbol.startAnchor)
      const endPoint = resolveMovedAnchor(symbol, symbol.endAnchor)
      if (!startPoint && !endPoint) {
        return
      }

      if (EdgeUtil.isArcEdge(symbol)) {
        // No `isShape` filter on the target here: neither the Line/PolyEdge preview branches
        // below nor the commit path (resolveAndUpdateAnchor) apply one, and a preview that
        // skips what the commit path moves makes the arc jump on pointer-up.
        let clone = symbol
        if (startPoint) {
          clone = { ...clone, ...stretchArcEndpoint(clone, "start", startPoint) }
        }
        if (endPoint) {
          clone = { ...clone, ...stretchArcEndpoint(clone, "end", endPoint) }
        }
        // Entry points must be refreshed from the STRETCHED geometry's own vertices, or they
        // go stale the instant the anchored shape moves — same "M ... Q ..." spike bug as an
        // un-recomputed entry point, just self-inflicted on every subsequent move instead of
        // only at first anchoring. Raw vertices: recomputeAnchor expects the edge's own frame.
        const vertices = SymbolGeometry.rawOf(clone).vertices
        const n = vertices.length
        if (clone.startAnchor && n >= 2) {
          clone.startAnchor = recomputeAnchor(clone, clone.startAnchor, vertices[0], vertices[1])
        }
        if (clone.endAnchor && n >= 2) {
          clone.endAnchor = recomputeAnchor(clone, clone.endAnchor, vertices[n - 1], vertices[n - 2])
        }
        this.canvas.renderer.drawSymbol(clone)
        return
      }

      if (EdgeUtil.isLineEdge(symbol)) {
        const start = startPoint ?? symbol.start
        const end = endPoint ?? symbol.end
        this.canvas.renderer.drawSymbol({
          ...symbol,
          start,
          end,
          startAnchor: symbol.startAnchor && recomputeAnchor(symbol, symbol.startAnchor, start, end),
          endAnchor: symbol.endAnchor && recomputeAnchor(symbol, symbol.endAnchor, end, start),
        })
      } else if (EdgeUtil.isPolyEdge(symbol)) {
        const points = symbol.points.map((p) => ({ ...p }))
        const n = points.length
        if (startPoint && n > 0) {
          points[0] = startPoint
        }
        if (endPoint && n > 0) {
          points[n - 1] = endPoint
        }
        this.canvas.renderer.drawSymbol({
          ...symbol,
          points,
          startAnchor:
            symbol.startAnchor && n >= 2
              ? recomputeAnchor(symbol, symbol.startAnchor, points[0], points[1])
              : symbol.startAnchor,
          endAnchor:
            symbol.endAnchor && n >= 2
              ? recomputeAnchor(symbol, symbol.endAnchor, points[n - 1], points[n - 2])
              : symbol.endAnchor,
        })
      }
    })

    this.#followConnectedStrokes(idSet, matrix, /* commit */ false)
  }

  /**
   * Resolve an anchor to a point in `edge`'s own coordinate frame, optionally using pre-transform
   * bounds + matrix. When matrix and preTransformBoundsById are provided (rotation case), resolves
   * in the pre-transform AABB then applies the matrix — this preserves the physical point on
   * the shape regardless of AABB size change. Also updates normalizedXY on the anchor
   * so subsequent transforms resolve correctly in the new AABB.
   *
   * The anchor is resolved against the *target's* geometry, which `SymbolGeometry` reports in
   * document coordinates — the target's own matrix already applied. The result is then written into
   * `edge`'s stored `start`/`end`/`points`, which are raw: the edge's matrix is what places them. So
   * the point is mapped back through that matrix here rather than at each of the six call sites,
   * which is what keeps an already-moved edge from jumping when the shape it is anchored to moves.
   *
   * Returns `undefined` when the edge's matrix cannot be inverted, alongside the existing
   * missing-target case: callers already skip the write on `undefined`.
   */
  private resolveAndUpdateAnchor(
    anchor: TAnchor,
    edge: TEdge,
    matrix: MatrixTransform | undefined,
    preTransformBoundsById: Map<string, TOBB> | undefined
  ): { x: number; y: number } | undefined {
    const target = this.model.getSymbol(anchor.symbolId)
    if (!target) {
      return undefined
    }
    const targetBox = OBBOps.toBox(SymbolGeometry.boundsOf(target))
    if (matrix && preTransformBoundsById) {
      const preBounds = preTransformBoundsById.get(anchor.symbolId)
      if (preBounds) {
        const worldPoint = matrix.applyToPoint(resolveAnchorPoint(anchor, OBBOps.toBox(preBounds)))
        // Normalized against the target's document-space box, so it stays a world point here.
        const { normalizedX, normalizedY } = computeNormalizedAnchor(worldPoint, targetBox)
        anchor.normalizedX = normalizedX
        anchor.normalizedY = normalizedY
        return applyInverseMatrixToPoint(worldPoint, edge.transform)
      }
    }
    return applyInverseMatrixToPoint(resolveAnchorPoint(anchor, targetBox), edge.transform)
  }

  /**
   * Clear anchors from any edges in `symbols` that are being directly translated.
   * An anchored edge that the user explicitly moves becomes a free edge.
   * Covers all three anchor-carrying edge kinds (Line, PolyLine, Arc).
   */
  clearAnchoredEdgesFor(symbols: TSymbol[]): void {
    symbols.forEach((committed) => {
      if (!EdgeUtil.isEdge(committed)) {
        return
      }
      if (!EdgeUtil.isLineEdge(committed) && !EdgeUtil.isPolyEdge(committed) && !EdgeUtil.isArcEdge(committed)) {
        return
      }
      if (!committed.startAnchor && !committed.endAnchor) {
        return
      }
      // Drafted only once the guards above say this edge is actually losing its anchors. Callers
      // pass their own symbols here, which are not always in the document — same fallback as
      // `applyAndDraw`, so a caller-owned edge is still detached rather than silently skipped.
      const symbol = (this.model.draftSymbol(committed.id) as TDraft<TEdge> | undefined) ?? committed
      symbol.startAnchor = undefined
      symbol.endAnchor = undefined
      // `updateSymbol` and not `commitSymbol`: the fallback above widens the type back to a plain
      // symbol, and typing it as a draft would be a lie while that branch exists.
      this.model.updateSymbol(symbol)
      this.canvas.renderer.drawSymbol(symbol)
    })
  }

  /**
   * Recompute endpoints of all edges anchored to any of the given symbol IDs.
   * Called by transform managers after translate / resize / rotate.
   * Pass `matrix` and `preTransformBoundsById` when called from rotation so that
   * anchor resolution uses the pre-transform AABB rather than the post-rotation AABB.
   * @returns ids of the pre-convert edge strokes rigidly moved by this call — callers must add
   * them to their history entry and to their backend transform message.
   */
  updateAnchoredEdges(
    symbolIds: string[],
    matrix?: MatrixTransform,
    preTransformBoundsById?: Map<string, TOBB>
  ): TAnchoredEdgesUpdateResult {
    if (symbolIds.length === 0 || !this.connectorConfiguration.followConnectedEdges) {
      return { rigidStrokeIds: [], oldSymbols: [], newSymbols: [] }
    }
    this.logger.info("updateAnchoredEdges", {
      symbolIds,
    })

    const idSet = new Set(symbolIds)
    // Converted Line/PolyEdge/Arc anchors are recomputed from the target's new bounds, not
    // transformed by a matrix relative to their own prior position — there's no "inverse" of
    // that to replay on undo, so every mutation here needs its own pre-mutation snapshot,
    // same as a gradient-followed raw stroke.
    const oldSymbols: TSymbol[] = []
    const newSymbols: TSymbol[] = []

    /** True when at least one of the edge's anchors points at a symbol that just moved. */
    const isAnchoredToMoved = (e: { startAnchor?: TAnchor; endAnchor?: TAnchor }): boolean =>
      (!!e.startAnchor && idSet.has(e.startAnchor.symbolId)) || (!!e.endAnchor && idSet.has(e.endAnchor.symbolId))

    this.model.symbols.forEach((committed) => {
      // Guarded on the committed record, so only the edges that can actually move get drafted —
      // drafting every edge on every pass would put back the per-frame copy this epic removes.
      if (!EdgeUtil.isEdge(committed) || !isAnchoredToMoved(committed)) {
        return
      }
      const symbol = this.model.draftSymbol(committed.id) as TDraft<TEdge> | undefined
      if (!symbol) {
        return
      }

      if (EdgeUtil.isArcEdge(symbol)) {
        let changed = false
        const oldSymbol = cloneSymbol(symbol)
        if (symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.startAnchor, symbol, matrix, preTransformBoundsById)
          if (point) {
            Object.assign(symbol, stretchArcEndpoint(symbol, "start", point))
            changed = true
          }
        }
        if (symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.endAnchor, symbol, matrix, preTransformBoundsById)
          if (point) {
            Object.assign(symbol, stretchArcEndpoint(symbol, "end", point))
            changed = true
          }
        }
        if (changed) {
          this.recomputeAllEntryPoints(symbol)
          this.canvas.renderer.drawSymbol(symbol)
          this.model.commitSymbol(symbol)
          oldSymbols.push(oldSymbol)
          newSymbols.push(symbol)
        }
        return
      }

      if (!EdgeUtil.isLineEdge(symbol) && !EdgeUtil.isPolyEdge(symbol)) {
        return
      }

      let changed = false
      const oldSymbol = cloneSymbol(symbol)

      if (EdgeUtil.isLineEdge(symbol)) {
        if (symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.startAnchor, symbol, matrix, preTransformBoundsById)
          if (point) {
            symbol.start = point
            changed = true
          }
        }
        if (symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.endAnchor, symbol, matrix, preTransformBoundsById)
          if (point) {
            symbol.end = point
            changed = true
          }
        }
        if (changed) {
          this.recomputeAllEntryPoints(symbol)
        }
      } else if (EdgeUtil.isPolyEdge(symbol)) {
        if (symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.startAnchor, symbol, matrix, preTransformBoundsById)
          if (point && symbol.points.length > 0) {
            symbol.points[0] = point
            changed = true
          }
        }
        if (symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.endAnchor, symbol, matrix, preTransformBoundsById)
          if (point && symbol.points.length > 0) {
            symbol.points[symbol.points.length - 1] = point
            changed = true
          }
        }
        if (changed) {
          this.recomputeAllEntryPoints(symbol)
        }
      }

      if (changed) {
        this.canvas.renderer.drawSymbol(symbol)
        this.model.commitSymbol(symbol)
        oldSymbols.push(oldSymbol)
        newSymbols.push(symbol)
      }
    })

    // Raw-stroke follow only has a transform to apply when the caller supplies one —
    // Arc/Line/PolyEdge branches above don't need it (they reproject from the target's
    // already-updated model bounds), but freehand strokes have no per-point anchor formula.
    const strokeFollowResult = matrix
      ? this.#followConnectedStrokes(idSet, matrix, /* commit */ true, preTransformBoundsById)
      : { rigidStrokeIds: [], oldSymbols: [], newSymbols: [] }

    return {
      rigidStrokeIds: strokeFollowResult.rigidStrokeIds,
      oldSymbols: [...oldSymbols, ...strokeFollowResult.oldSymbols],
      newSymbols: [...newSymbols, ...strokeFollowResult.newSymbols],
    }
  }

  /**
   * Ids of the pre-convert edge strokes that would rigidly follow a transform of `symbolIds`.
   * Read-only counterpart of the follow pass, for transform managers that need the list *before*
   * mutating anything (history snapshots, backend stroke ids).
   */
  getFollowedStrokeIds(symbolIds: string[]): string[] {
    if (symbolIds.length === 0) {
      return []
    }
    return this.#collectFollowedStrokes(new Set(symbolIds)).map((f) => f.symbol.id)
  }

  /**
   * Like `getFollowedStrokeIds`, but only the rigidly-followed ones (both connected shapes
   * moving together — safe to fold into a uniform matrix-replay transform). Gradient-followed
   * strokes are excluded: their shift isn't uniform, so callers must snapshot and undo them via
   * `updateAnchoredEdges`'s `oldSymbols`/`newSymbols` instead, and must send their new content to
   * the backend via `client.replaceStrokes` rather than a uniform transform call.
   */
  getRigidFollowedStrokeIds(symbolIds: string[]): string[] {
    if (symbolIds.length === 0) {
      return []
    }
    return this.#collectFollowedStrokes(new Set(symbolIds))
      .filter((f) => f.mode === "rigid")
      .map((f) => f.symbol.id)
  }

  /**
   * Single source of truth for the pre-convert follow predicate: a raw ink stroke classified as
   * an Edge, anchored to exactly one shape block that is part of the moving set.
   * Dual-anchor edge strokes are skipped — independent per-endpoint repositioning isn't possible
   * on freehand ink without warping; they wait for Convert.
   * Strokes already in `idSet` are skipped too: the caller's own transform path owns them, and
   * following them as well would apply the matrix twice.
   */
  #collectFollowedStrokes(idSet: Set<string>): TFollowedStroke[] {
    if (!this.connectorConfiguration.followConnectedEdges) {
      return []
    }
    const isAnchorTargetMoving = (anchor: TAnchor): boolean => {
      const blockStrokeIds = this.canvas.jiix.getStrokesForElement(anchor.symbolId)
      return blockStrokeIds.some((id) => idSet.has(id)) || idSet.has(anchor.symbolId)
    }

    const followed: TFollowedStroke[] = []
    this.model.symbols.forEach((symbol) => {
      if (!isStroke(symbol) || symbol.jiixBlockType !== "Edge" || idSet.has(symbol.id)) {
        return
      }
      const anchors = [symbol.startAnchor, symbol.endAnchor].filter((a): a is TAnchor => !!a)
      if (anchors.length === 0) {
        return
      }
      const movingAnchors = anchors.filter(isAnchorTargetMoving)
      if (movingAnchors.length === 0) {
        return
      }
      if (anchors.length === 2 && movingAnchors.length === 2) {
        // Both connected shapes are moving together (same matrix) — nothing shifts
        // relatively, so the whole stroke can move as one rigid body.
        followed.push({ symbol, mode: "rigid" })
      } else {
        // Exactly one connected shape is moving — reposition points on a gradient
        // instead of translating the whole stroke, since rigidly moving it would
        // drag the end anchored to the shape that ISN'T moving (or the free end of
        // a single-anchor edge) along for no reason.
        followed.push({ symbol, mode: "gradient", movingAnchor: movingAnchors[0] })
      }
    })
    return followed
  }

  /**
   * Pre-convert rigid-follow: every point of each followed edge stroke gets the same matrix as
   * the block it is anchored to.
   * @returns the ids of the strokes mutated in the model (empty for the preview pass).
   */
  #followConnectedStrokes(
    idSet: Set<string>,
    matrix: MatrixTransform,
    commit: boolean,
    preTransformBoundsById?: Map<string, TOBB>
  ): TAnchoredEdgesUpdateResult {
    const followed = this.#collectFollowedStrokes(idSet)
    const rigidStrokeIds: string[] = []
    const oldSymbols: TStroke[] = []
    const newSymbols: TStroke[] = []

    // Gradient-mode strokes are grouped by their edge's own jiixBlockId so a multi-stroke edge
    // (e.g. a line's bar plus its arrowhead chevron) shares ONE near/far distance range instead
    // of each stroke computing its own in isolation — a short chevron has no reliable "own"
    // direction, but it does have a position relative to the rest of its block.
    const rigidEntries: TFollowedStroke[] = []
    const gradientGroups = new Map<string, TFollowedStroke[]>()
    followed.forEach((entry) => {
      if (entry.mode === "rigid") {
        rigidEntries.push(entry)
        return
      }
      const blockId = entry.symbol.jiixBlockId ?? entry.symbol.id
      const group = gradientGroups.get(blockId) ?? []
      group.push(entry)
      gradientGroups.set(blockId, group)
    })

    const newPointsByStrokeId = new Map<string, TPoint[]>()
    rigidEntries.forEach(({ symbol }) => {
      newPointsByStrokeId.set(
        symbol.id,
        symbol.pointers.map((p) => matrix.applyToPoint(p))
      )
    })
    gradientGroups.forEach((entries) => {
      const groupPoints = this.#computeGroupGradientPoints(
        entries.map((entry) => entry.symbol),
        matrix,
        entries[0].movingAnchor!,
        preTransformBoundsById
      )
      groupPoints.forEach((points, strokeId) => newPointsByStrokeId.set(strokeId, points))
    })

    followed.forEach(({ symbol: committed, mode }) => {
      const newPoints = newPointsByStrokeId.get(committed.id)!

      if (commit) {
        // Drafted here rather than at the top of the loop: the preview branch below reads the
        // committed record and builds its own throwaway clone, so it needs no draft at all.
        const symbol = (this.model.draftSymbol(committed.id) as TDraft<TStroke> | undefined) ?? committed
        // A rigid (uniform matrix) move is safe to undo by re-applying the inverse matrix, so it
        // can ride along in the caller's own matrix-replay history entry. A gradient move is NOT
        // uniform — undoing it requires restoring this pre-mutation snapshot directly instead.
        const oldSymbol = mode === "gradient" ? (cloneSymbol(symbol) as TStroke) : undefined

        symbol.pointers.forEach((p, i) => {
          p.x = +newPoints[i].x.toFixed(3)
          p.y = +newPoints[i].y.toFixed(3)
        })
        this.canvas.renderer.drawSymbol(symbol)
        this.model.updateSymbol(symbol)

        if (mode === "rigid") {
          rigidStrokeIds.push(symbol.id)
        } else {
          oldSymbols.push(oldSymbol!)
          newSymbols.push(symbol)
        }
      } else {
        const symbol = committed
        const clone = {
          ...symbol,
          pointers: symbol.pointers.map((p, i) => ({
            ...p,
            x: +newPoints[i].x.toFixed(3),
            y: +newPoints[i].y.toFixed(3),
          })),
        }
        this.canvas.renderer.drawSymbol(clone)
      }
    })

    return commit ? { rigidStrokeIds, oldSymbols, newSymbols } : { rigidStrokeIds: [], oldSymbols: [], newSymbols: [] }
  }

  /**
   * Center of a pre-convert shape block, from the union of its raw strokes' bounds.
   * Used as the reference point for gradient-follow direction — there's no single
   * symbol to read `.bounds` from pre-convert, only a block of strokes sharing a jiixBlockId.
   */
  #resolveBlockCenter(blockId: string, preTransformBoundsById?: Map<string, TOBB>): TPoint | undefined {
    // Pre-convert stroke ids only (see class doc above) — always a TStroke, so boundsOf never
    // throws for an unregistered type here.
    const boxes = this.canvas.jiix
      .getStrokesForElement(blockId)
      .map((id) => {
        const preBounds = preTransformBoundsById?.get(id)
        if (preBounds) {
          return preBounds
        }
        const target = this.model.getSymbol(id)
        return target ? SymbolGeometry.boundsOf(target) : undefined
      })
      .filter((b): b is TOBB => !!b)
      .map((b) => OBBOps.toBox(b))
    if (boxes.length === 0) {
      return undefined
    }
    const box = BoxOps.createFromBoxes(boxes)
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }

  // All points of all strokes sharing the same jiixBlockId share one near/far distance range,
  // computed against the moving target's center — a lone short stroke (e.g. an arrowhead
  // chevron) has no reliable "own" direction, but a position relative to its whole block.
  #computeGroupGradientPoints(
    strokes: TStroke[],
    matrix: MatrixTransform,
    movingAnchor: TAnchor,
    preTransformBoundsById?: Map<string, TOBB>
  ): Map<string, TPoint[]> {
    const identity = (): Map<string, TPoint[]> =>
      new Map(strokes.map((s) => [s.id, s.pointers.map((p) => matrix.applyToPoint(p))]))

    const allPoints = strokes.flatMap((s) => s.pointers)
    // Must resolve the target's PRE-transform center: by commit time the target has usually
    // already been mutated to its final position (applyAndDraw runs before updateAnchoredEdges),
    // so resolving from live model bounds here would use a different reference point than the
    // preview pass did (which runs before the target moves) — same final matrix, different
    // target center, different weights, so the committed shape would visibly snap to a
    // different form than what was just shown while dragging.
    const targetCenter = this.#resolveBlockCenter(movingAnchor.symbolId, preTransformBoundsById)
    if (allPoints.length <= 1 || !targetCenter) {
      return identity()
    }

    const distances = allPoints.map((p) => computeDistance(p, targetCenter))
    const groupMin = Math.min(...distances)
    const groupMax = Math.max(...distances)
    const range = groupMax - groupMin

    const weightOf = (point: TPoint): number => {
      if (range <= 0) {
        return 1
      }
      return 1 - (computeDistance(point, targetCenter) - groupMin) / range
    }

    return new Map(
      strokes.map((s) => [
        s.id,
        s.pointers.map((p) => {
          const weight = weightOf(p)
          const transformed = matrix.applyToPoint(p)
          return {
            x: p.x + weight * (transformed.x - p.x),
            y: p.y + weight * (transformed.y - p.y),
          }
        }),
      ])
    )
  }
}
