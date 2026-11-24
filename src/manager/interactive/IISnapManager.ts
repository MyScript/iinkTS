import type { TInteractiveInkCanvas } from "@/canvas"
import type { TPartialDeep, TPoint, TSegment } from "@/core"
import { BoxOps } from "@/core"
import { LoggerCategory } from "@/logger"
import { SVGRendererConst } from "@/renderer"
import { SymbolGeometry, symbolRegistry } from "@/symbol-utils"

import { IIAbstractManager } from "./IIAbstractManager"

/**
 * @group Manager
 */
export type TSnapConfiguration = {
  guide: boolean
  symbol: boolean
  angle: number
}

/**
 * @group Manager
 * @source
 */
export const DefaultSnapConfiguration: TSnapConfiguration = {
  guide: true,
  symbol: true,
  angle: 0,
}

/**
 * @group Manager
 */
export class SnapConfiguration implements TSnapConfiguration {
  guide: boolean
  symbol: boolean
  angle: number

  constructor(config?: TPartialDeep<TSnapConfiguration>) {
    this.symbol = config?.symbol !== undefined ? config.symbol : DefaultSnapConfiguration.symbol
    this.guide = config?.guide !== undefined ? config.guide : DefaultSnapConfiguration.guide
    this.angle = config?.angle !== undefined ? config.angle : DefaultSnapConfiguration.angle
  }
}

/**
 * @group Manager
 */
export type TSnapNudge = TPoint

/**
 * @group Manager
 */
export type TSnapLineInfos = {
  nudge: TSnapNudge
  verticales: TSegment[]
  horizontales: TSegment[]
}

/**
 * @group Manager
 */
export class IISnapManager extends IIAbstractManager {
  protected managerName = "IISnapManager"

  snapConfiguration: SnapConfiguration
  #otherSnapPointsCache: TPoint[] = []
  #selectionSnapPointsCache: TPoint[] = []
  /**
   * `(content version, selection version)` the two caches above were built from. Both getters are
   * read on every `pointermove` of every drag and neither of their inputs can change during a
   * gesture: `continue()` moves DOM elements, the model is written at commit.
   */
  #cacheVersion = -1
  #cacheSelectionVersion = -1

  constructor(canvas: TInteractiveInkCanvas, config?: TPartialDeep<TSnapConfiguration>) {
    super(canvas, LoggerCategory.SNAP)
    this.logger.info("constructor")
    this.snapConfiguration = new SnapConfiguration(config)
  }

  /**
   * Snap points of the selection's own bounding box. Rebuilt only when the model content or the
   * selection changed — reading it lists the whole document to filter the selection out of it, and
   * a drag asks for it once per pointermove.
   */
  get selectionSnapPoints(): TPoint[] {
    this.#refreshCaches()
    return this.#selectionSnapPointsCache
  }

  /**
   * Snap points of every non-selected symbol, rebuilt only when the model content or the
   * selection actually changed. Called on every pointermove while drawing/resizing/translating —
   * neither `model.version` (content) nor selection changes mid-drag, so this reuses the cache
   * for the whole gesture instead of re-scanning every symbol per move.
   */
  get otherSnapPoints(): TPoint[] {
    this.#refreshCaches()
    return this.#otherSnapPointsCache
  }

  /**
   * Rebuilds both snap point sets if either the document content or the selection moved on.
   *
   * The previous validity check built its selection key as `Array.from(selectedIds).sort().join()`.
   * On a drag of the whole document that is a 4419-entry array, a sort and a ~180 kB string per
   * pointermove — the check cost more than the work it was guarding. `model.selectionVersion` is an
   * integer maintained by the model instead.
   */
  #refreshCaches(): void {
    const version = this.model.version
    const selectionVersion = this.model.selectionVersion
    if (this.#cacheVersion === version && this.#cacheSelectionVersion === selectionVersion) {
      return
    }
    this.#cacheVersion = version
    this.#cacheSelectionVersion = selectionVersion

    const selectedIds = this.model.selectedIds
    const other: TPoint[] = []
    const selectedSnapPoints: TPoint[] = []
    // One pass over the document rather than one per getter: `symbols` and `symbolsSelected` each
    // list the whole store, and the two sets partition it. An unregistered custom type is skipped
    // silently rather than let `SymbolGeometry.snapPointsOf` throw and abort the whole pass.
    this.model.symbols.forEach((symbol) => {
      if (!symbolRegistry.has(symbol.type)) {
        return
      }
      ;(selectedIds.has(symbol.id) ? selectedSnapPoints : other).push(...SymbolGeometry.snapPointsOf(symbol))
    })
    this.#otherSnapPointsCache = other
    this.#selectionSnapPointsCache = BoxOps.getSnapPoints(BoxOps.createFromPoints(selectedSnapPoints))
  }

  get snapThreshold(): number {
    return this.canvas.configuration.rendering.guides.gap / 2
  }

  protected getNearestVerticalGuide(x: number): number {
    if (this.renderer.verticalGuides.length) {
      return this.renderer.verticalGuides.reduce((prev, curr) => {
        return Math.abs(curr - x) < Math.abs(prev - x) ? curr : prev
      })
    }
    return x
  }

  protected getNearestHorizontalGuide(y: number): number {
    if (this.renderer.horizontalGuides.length) {
      return this.renderer.horizontalGuides.reduce((prev, curr) => {
        return Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev
      })
    }
    return y
  }

  protected getGuidePointToSnap(point: TPoint): TPoint {
    return {
      x: this.getNearestVerticalGuide(point.x),
      y: this.getNearestHorizontalGuide(point.y),
    }
  }

  drawSnapToElementLines(lines: TSegment[]): void {
    const attrs = {
      role: "snap-to-element",
      fill: "transparent",
      stroke: "blue",
      "stroke-width": "2",
      style: SVGRendererConst.noSelection,
      "marker-start": `url(#${SVGRendererConst.crossMarker})`,
      "marker-end": `url(#${SVGRendererConst.crossMarker})`,
    }
    lines.forEach((seg) => {
      this.renderer.drawLine(seg.p1, seg.p2, attrs)
    })
  }

  clearSnapToElementLines(): void {
    this.renderer.clearElements({
      attrs: { role: "snap-to-element" },
    })
  }

  protected buildXBuckets(points: TPoint[], bucketSize: number): Map<number, TPoint[]> {
    const buckets = new Map<number, TPoint[]>()
    for (const p of points) {
      const key = Math.floor(p.x / bucketSize)
      const bucket = buckets.get(key)
      if (bucket) {
        bucket.push(p)
      } else {
        buckets.set(key, [p])
      }
    }
    return buckets
  }

  protected buildYBuckets(points: TPoint[], bucketSize: number): Map<number, TPoint[]> {
    const buckets = new Map<number, TPoint[]>()
    for (const p of points) {
      const key = Math.floor(p.y / bucketSize)
      const bucket = buckets.get(key)
      if (bucket) {
        bucket.push(p)
      } else {
        buckets.set(key, [p])
      }
    }
    return buckets
  }

  protected getSnapLinesInfos(sourcePoints: TPoint[], targetPoints: TPoint[]): TSnapLineInfos {
    const infos: TSnapLineInfos = {
      nudge: { x: Infinity, y: Infinity },
      verticales: [],
      horizontales: [],
    }
    if (!sourcePoints.length || !targetPoints.length) {
      return infos
    }

    const threshold = this.snapThreshold
    const xBuckets = this.buildXBuckets(targetPoints, threshold)
    const yBuckets = this.buildYBuckets(targetPoints, threshold)

    for (const p1 of sourcePoints) {
      const xKey = Math.floor(p1.x / threshold)
      for (const bKey of [xKey - 1, xKey, xKey + 1]) {
        for (const p2 of xBuckets.get(bKey) ?? []) {
          if (threshold > Math.abs(p2.x - p1.x)) {
            if (Math.abs(infos.nudge.x) > Math.abs(p2.x - p1.x)) {
              infos.nudge.x = p2.x - p1.x
              infos.verticales = [{ p1: { ...p1 }, p2 }]
            } else if (infos.nudge.x === p2.x - p1.x) {
              infos.verticales.push({
                p1: { ...p1 },
                p2,
              })
            }
          }
        }
      }

      const yKey = Math.floor(p1.y / threshold)
      for (const bKey of [yKey - 1, yKey, yKey + 1]) {
        for (const p2 of yBuckets.get(bKey) ?? []) {
          if (threshold > Math.abs(p2.y - p1.y)) {
            if (Math.abs(infos.nudge.y) > Math.abs(p2.y - p1.y)) {
              infos.nudge.y = p2.y - p1.y
              infos.horizontales = [{ p1: { ...p1 }, p2 }]
            } else if (infos.nudge.y === p2.y - p1.y) {
              infos.horizontales.push({
                p1: { ...p1 },
                p2,
              })
            }
          }
        }
      }
    }

    return infos
  }

  snapResize(point: TPoint, horizontal = true, vertical = true): TPoint {
    this.clearSnapToElementLines()
    if (!this.snapConfiguration.symbol && !this.snapConfiguration.guide) {
      return point
    }

    let localPoint: TPoint = {
      x: Infinity,
      y: Infinity,
    }
    if (this.snapConfiguration.guide) {
      localPoint = this.getGuidePointToSnap(point)
    }
    const snapLines: TSegment[] = []

    if (this.snapConfiguration.symbol) {
      const snapLinesInfos = this.getSnapLinesInfos([point], this.otherSnapPoints)
      if (horizontal && Math.abs(snapLinesInfos.nudge.x) <= Math.abs(point.x - localPoint.x)) {
        localPoint.x = point.x + snapLinesInfos.nudge.x
        snapLines.push(...snapLinesInfos.verticales)
      }
      if (vertical && Math.abs(snapLinesInfos.nudge.y) <= Math.abs(point.y - localPoint.y)) {
        localPoint.y = point.y + snapLinesInfos.nudge.y
        snapLines.push(...snapLinesInfos.horizontales)
      }
    }

    if (localPoint.x === Infinity) {
      localPoint.x = point.x
    }
    if (localPoint.y === Infinity) {
      localPoint.y = point.y
    }

    snapLines.forEach((s) => (s.p1 = localPoint))
    this.drawSnapToElementLines(snapLines)
    return localPoint
  }

  snapTranslate(tx: number, ty: number): TSnapNudge {
    this.clearSnapToElementLines()
    const nudge: TSnapNudge = { x: tx, y: ty }
    if (!this.snapConfiguration.symbol && !this.snapConfiguration.guide) {
      return nudge
    }

    const selectionSymbolPoints = this.selectionSnapPoints.map((p) => ({
      x: p.x + tx,
      y: p.y + ty,
    }))

    let lastDeltaX = Infinity
    let lastDeltaY = Infinity

    if (this.snapConfiguration.guide) {
      selectionSymbolPoints.forEach((p) => {
        const gridPoint = this.getGuidePointToSnap(p)
        if (lastDeltaX > Math.abs(gridPoint.x - p.x)) {
          nudge.x = gridPoint.x - p.x + tx
          lastDeltaX = Math.abs(gridPoint.x - p.x)
        }
        if (lastDeltaY > Math.abs(gridPoint.y - p.y)) {
          nudge.y = gridPoint.y - p.y + ty
          lastDeltaY = Math.abs(gridPoint.y - p.y)
        }
      })
    }

    const snapLines: TSegment[] = []
    if (this.snapConfiguration.symbol) {
      const snapLinesInfos = this.getSnapLinesInfos(selectionSymbolPoints, this.otherSnapPoints)
      if (lastDeltaX >= Math.abs(snapLinesInfos.nudge.x) && snapLinesInfos.verticales.length) {
        nudge.x = snapLinesInfos.nudge.x + tx
        snapLines.push(...snapLinesInfos.verticales)
      }
      if (lastDeltaY >= Math.abs(snapLinesInfos.nudge.y) && snapLinesInfos.horizontales.length) {
        nudge.y = snapLinesInfos.nudge.y + ty
        snapLines.push(...snapLinesInfos.horizontales)
      }
    }
    if (snapLines.length) {
      snapLines.forEach((l) => {
        l.p1.x += nudge.x - tx
        l.p1.y += nudge.y - ty
      })
      this.drawSnapToElementLines(snapLines)
    }
    return nudge
  }

  snapRotation(angleDegree: number): number {
    if (this.snapConfiguration.angle > 0) {
      return this.snapConfiguration.angle * Math.round(angleDegree / this.snapConfiguration.angle)
    }
    return angleDegree
  }
}
