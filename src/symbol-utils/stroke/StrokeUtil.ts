import type { TPartialDeep, TPoint, TPointer } from "@/core"
import {
  computeAngleAxeRadian,
  computeLinksPointers,
  computeMiddlePointer,
  createUUID,
  getClosestPoint,
  MatrixTransform,
  mergeSymbolTransform,
  OBBOps,
  PointSet2d,
  resolvePointerDelta,
  resolveStrokeOrigin,
} from "@/core"
import type { TStyle } from "@/style"
import { computeOutlinePointers, DefaultStyle, mergeSymbolStyle, readNibOverrides } from "@/style"
import type { TStroke, TStrokeImport } from "@/symbol"
import { SymbolType } from "@/symbol"

import { PathSymbolUtil } from "../PathSymbolUtil"
import { SymbolGeometry } from "../SymbolGeometry"

/**
 * @group SymbolUtils
 */
export class StrokeUtil extends PathSymbolUtil<TStroke> {
  readonly type = SymbolType.Stroke

  create(partial: TPartialDeep<TStroke>): TStroke {
    return StrokeUtil.createFromPartial(partial)
  }

  /**
   * A stroke is the run of points the pen left, and {@link PointSet2d} is exactly that shape: its
   * path, length and box all come from the same samples, and it is caught by a query holding one of
   * them rather than by the drawn line crossing it — which is what a stroke's selection has always
   * meant.
   */
  getGeometry(stroke: TStroke): PointSet2d {
    return new PointSet2d(stroke.pointers)
  }

  /**
   * The geometry answers, so this no longer explains what a stroke's overlap means — {@link PointSet2d}
   * does, once, for anything shaped like a run of samples.
   *
   * It also drops the apparatus this type used to need: that mapped the query *backwards*
   * through the symbol's inverse matrix and needed a second, exact callback for the rotated case,
   * because the raw geometry could not be moved. A `Geometry2d` can, so the symbol goes forwards
   * instead and the axis-aligned query is tested as it stands — the same answer, without an inverse
   * to guard against, a determinant to check, or a quad to special-case.
   */
  /**
   * A stroke snaps on its box, not on the samples themselves: an ink trace has no corner anything
   * would want to land on.
   */
  getSnapPoints(stroke: TStroke): TPoint[] {
    return OBBOps.getSnapPoints(SymbolGeometry.of(stroke).bounds)
  }

  protected getPathData(stroke: TStroke): string {
    return StrokeUtil.getSVGPath(stroke)
  }

  /**
   * Filled, not stroked: a stroke's path is the outline of the ink, so the colour goes on `fill` and
   * there is no stroke colour at all. `stroke-width` still carries the nominal width, which the
   * outline was built from.
   */
  protected getPathAttributes(stroke: TStroke): Record<string, string> {
    const attributes: Record<string, string> = {
      fill: stroke.style.color || DefaultStyle.color!,
      "stroke-width": stroke.style.width.toString(),
    }
    if (stroke.style.opacity) {
      attributes.opacity = stroke.style.opacity.toString()
    }
    return attributes
  }

  /**
   * @param creationTime - Epoch instant the stroke began, defaulting to now. Pass the instant the
   * capture actually started: it is the origin the `dt` field of every {@link TPointer} counts from, so
   * it is what turns them back into the absolute times the recognizer orders strokes by.
   */
  static createEmpty(style?: TPartialDeep<TStyle>, pointerType = "pen", creationTime?: number): TStroke {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const pointers: TPointer[] = []
    return {
      type: SymbolType.Stroke,
      id: `${SymbolType.Stroke}-${createUUID()}`,
      style: mergedStyle,
      creationTime: creationTime ?? now,
      modificationDate: now,
      pointerType,
      pointers,
      transform: MatrixTransform.identity(),
    }
  }

  /**
   * Whether the stroke reads as bold: wider than 2px. The rule the conversion uses to pick a text's
   * font weight, and the one the thicken gesture toggles on.
   */
  static isBold(stroke: TStroke): boolean {
    return (stroke.style.width || 1) > 2
  }

  static #filterPointByAcquisitionDelta(stroke: TStroke, point: TPointer): boolean {
    if (stroke.pointers.length === 0) {
      return true
    }
    const lastPointer = stroke.pointers.at(-1)!
    const delta: number = 2 + (stroke.style.width || 1) / 4
    return Math.abs(lastPointer.x - point.x) >= delta || Math.abs(lastPointer.y - point.y) >= delta
  }

  static addPointer(stroke: TStroke, pointer: TPointer): void {
    if (StrokeUtil.#filterPointByAcquisitionDelta(stroke, pointer)) {
      // `p` is left exactly as the device reported it. It used to be overwritten here with a value
      // derived from the gap to the previous pointer, which made the drawn thickness depend on how
      // densely the stroke happened to be sampled - so the same gesture rendered differently under
      // main-thread load. The renderer derives width from speed instead, at draw time.
      stroke.pointers.push(pointer)
      stroke.modificationDate = Date.now()
    }
  }

  static split(strokeToSplit: TStroke, i: number): { before: TStroke; after: TStroke } {
    // Both halves keep the origin of the stroke they came from. Their pointers still carry the
    // `dt` they were captured with, which counts from that origin - give a half a fresh
    // `creationTime` and every one of its points would claim to have been drawn just now.
    const { style, pointerType, creationTime } = strokeToSplit
    const before = StrokeUtil.createEmpty(style, pointerType, creationTime)
    before.pointers.push(...strokeToSplit.pointers.slice(0, i))

    const after = StrokeUtil.createEmpty(style, pointerType, creationTime)
    after.pointers.push(...strokeToSplit.pointers.slice(i))

    return { before, after }
  }

  static substract(stroke: TStroke, partStroke: TStroke): { before?: TStroke; after?: TStroke } {
    // The geometry owns length now, so this degenerate-eraser guard asks it rather than keeping a
    // second definition of what a stroke's length is.
    if (!new PointSet2d(partStroke.pointers).length) {
      return { before: stroke }
    }
    const result: {
      before?: TStroke
      after?: TStroke
    } = {}
    const lastPointBeforeStroke = {
      x: partStroke.pointers[0].x,
      y: partStroke.pointers[0].y,
    }
    const closestLastPointBeforeStroke = getClosestPoint(stroke.pointers, lastPointBeforeStroke)
    if (closestLastPointBeforeStroke.index > -1) {
      const newStrokes = StrokeUtil.split(stroke, closestLastPointBeforeStroke.index)
      result.before = newStrokes.before
      result.after = newStrokes.after
    }
    const strokeAfter = result.after || stroke
    const firstPointAfterStroke = {
      x: partStroke.pointers.at(-1)!.x,
      y: partStroke.pointers.at(-1)!.y,
    }
    const closestFirstPointStrokeAfter = getClosestPoint(strokeAfter.pointers, firstPointAfterStroke)
    if (closestFirstPointStrokeAfter.index > -1) {
      const newStrokes = StrokeUtil.split(strokeAfter, closestFirstPointStrokeAfter.index)
      result.after = newStrokes.after
    }
    if (!result.before?.pointers.length) {
      result.before = undefined
    }
    if (!result.after?.pointers.length) {
      result.after = undefined
    }
    return result
  }

  static createFromPartial(partial: TStrokeImport): TStroke {
    if (!partial.pointers?.length) {
      throw new Error(`not pointers`)
    }
    // Keeping the original origin matters as much as keeping the pointers: it is what places this
    // stroke against the others on the timeline. Dropped, every imported stroke would look like it
    // was written the instant the document was opened, all at once.
    const stroke = StrokeUtil.createEmpty(
      partial.style,
      partial.pointerType,
      resolveStrokeOrigin(partial.pointers ?? [], partial.creationTime)
    )
    if (partial.id) {
      stroke.id = partial.id
    }
    stroke.transform = mergeSymbolTransform(partial.transform)
    stroke.isSolverOutput = partial.isSolverOutput
    stroke.jiixBlockId = partial.jiixBlockId
    const errors: string[] = []
    let flag = true
    const sourcePointers = partial.pointers ?? []
    sourcePointers.forEach((pp, pIndex) => {
      if (!pp) {
        errors.push(`no pointer at ${pIndex}`)
        flag = false
        return
      }
      const pointer: TPointer = {
        p: pp.p || 1,
        dt: resolvePointerDelta(sourcePointers, pIndex),
        x: 0,
        y: 0,
      }
      if (pp?.x == undefined || pp?.x == null) {
        errors.push(`no x at pointer at ${pIndex}`)
        flag = false
        return
      } else {
        pointer.x = pp.x
      }
      if (pp?.y == undefined || pp?.y == null) {
        errors.push(`no y at pointer at ${pIndex}`)
        flag = false
        return
      } else {
        pointer.y = pp.y
      }
      if (flag) {
        StrokeUtil.addPointer(stroke, pointer)
      }
    })
    if (errors.length) {
      throw new Error(errors.join(" and "))
    }
    return stroke
  }

  static #getArcPath(center: TPointer, radius: number): string {
    return [
      `M ${center.x} ${center.y}`,
      `m ${-radius} 0`,
      `a ${radius} ${radius} 0 1 0 ${radius * 2} 0`,
      `a ${radius} ${radius} 0 1 0 ${-(radius * 2)} 0`,
    ].join(" ")
  }

  static #getLinePath(begin: TPointer, end: TPointer, width: number): string {
    const linkPoints1 = computeLinksPointers(begin, computeAngleAxeRadian(begin, end), width)
    const linkPoints2 = computeLinksPointers(end, computeAngleAxeRadian(begin, end), width)
    return [
      `M ${linkPoints1[0].x} ${linkPoints1[0].y}`,
      `L ${linkPoints2[0].x} ${linkPoints2[0].y}`,
      `L ${linkPoints2[1].x} ${linkPoints2[1].y}`,
      `L ${linkPoints1[1].x} ${linkPoints1[1].y}`,
    ].join(" ")
  }

  static #getFinalPath(begin: TPointer, end: TPointer, width: number): string {
    const ARCSPLIT = 6
    const angle = computeAngleAxeRadian(begin, end)
    const linkPoints = computeLinksPointers(end, angle, width)
    const parts = [`M ${linkPoints[0].x} ${linkPoints[0].y}`]
    for (let i = 1; i <= ARCSPLIT; i++) {
      const newAngle = angle - i * (Math.PI / ARCSPLIT)
      const x = +(end.x - end.p * width * Math.sin(newAngle)).toFixed(3)
      const y = +(end.y + end.p * width * Math.cos(newAngle)).toFixed(3)
      parts.push(`L ${x} ${y}`)
    }
    return parts.join(" ")
  }

  static #getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string {
    const linkPoints1 = computeLinksPointers(begin, computeAngleAxeRadian(begin, central), width)
    const linkPoints2 = computeLinksPointers(end, computeAngleAxeRadian(central, end), width)
    const linkPoints3 = computeLinksPointers(central, computeAngleAxeRadian(begin, end), width)
    return [
      `M ${linkPoints1[0].x} ${linkPoints1[0].y}`,
      `Q ${linkPoints3[0].x} ${linkPoints3[0].y} ${linkPoints2[0].x} ${linkPoints2[0].y}`,
      `L ${linkPoints2[1].x} ${linkPoints2[1].y}`,
      `Q ${linkPoints3[1].x} ${linkPoints3[1].y} ${linkPoints1[1].x} ${linkPoints1[1].y}`,
    ].join(" ")
  }

  static getSVGPath(stroke: TStroke): string {
    const STROKE_LENGTH = stroke.pointers.length
    if (!STROKE_LENGTH) {
      return ""
    }
    const STROKE_WIDTH = stroke.style.width
    const NB_QUADRATICS = STROKE_LENGTH - 2
    // Width comes from the pen's speed, computed here rather than read off the stored pointers:
    // `p` on a stored pointer is what the device measured, not a drawing instruction.
    const pointers = computeOutlinePointers(
      stroke.pointers,
      stroke.pointerType,
      stroke.style.pen,
      readNibOverrides(stroke.style)
    )
    const firstPoint = pointers[0]
    const parts = []
    if (STROKE_LENGTH < 3) {
      parts.push(StrokeUtil.#getArcPath(firstPoint, STROKE_WIDTH * 0.6))
    } else {
      parts.push(StrokeUtil.#getArcPath(firstPoint, STROKE_WIDTH * firstPoint.p))
      parts.push(StrokeUtil.#getLinePath(firstPoint, computeMiddlePointer(firstPoint, pointers[1]), STROKE_WIDTH))
      for (let i = 0; i < NB_QUADRATICS; i++) {
        const begin = computeMiddlePointer(pointers[i], pointers[i + 1])
        const end = computeMiddlePointer(pointers[i + 1], pointers[i + 2])
        const central = pointers[i + 1]
        parts.push(StrokeUtil.#getQuadraticPath(begin, end, central, STROKE_WIDTH))
      }
      const beforeLastPoint = pointers[STROKE_LENGTH - 2]
      const lastPoint = pointers[STROKE_LENGTH - 1]
      parts.push(StrokeUtil.#getLinePath(computeMiddlePointer(beforeLastPoint, lastPoint), lastPoint, STROKE_WIDTH))
      parts.push(StrokeUtil.#getFinalPath(beforeLastPoint, lastPoint, STROKE_WIDTH))
    }
    return parts.join(" ")
  }
}
