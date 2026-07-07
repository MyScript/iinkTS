import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import type { DecoratorKind } from "@/symbol/decorator/Decorator"
import type { TBox } from "@/symbol/primitives/Box"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"
import type { TPointer } from "@/symbol/primitives/Point"
import type { TPoint, TSegment } from "@/symbol/primitives/Point"
import type { TBaseSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"
import type { TPartialDeep } from "@/utils"
import {
  computeAngleAxeRadian,
  computeDistance,
  computeLinksPointers,
  computeMiddlePointer,
  createUUID,
  getClosestPoint,
} from "@/utils"

/**
 * @group Symbol
 */
export type TStrokeMinimal = {
  id: string
  pointerType: string
  pointers: TPointer[]
}

/**
 * @group Symbol
 */
export type TStroke = TBaseSymbol &
  TStrokeMinimal & {
    readonly type: SymbolType.Stroke
    style: TStyle
    length: number
    bounds: TOBB
    snapPoints: TPoint[]
    vertices: TPointer[]
    edges: TSegment[]

    // JIIX Block metadata
    jiixBlockId?: string
    jiixBlockType?: "Text" | "Math" | "Node" | "Edge" | "Decorator"

    // Computation metadata
    isSolverOutput?: boolean

    // Decorator metadata
    decoratorKind?: DecoratorKind
  }

/**
 * @group Symbol
 * @summary Check if symbol is a stroke
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke
 */
export function isStroke(symbol: TBaseSymbol): symbol is TStroke {
  return symbol.type === SymbolType.Stroke
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Math JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Math JIIX block type
 */
export function isRecognizedMath(symbol: TBaseSymbol): symbol is TStroke {
  return isStroke(symbol) && symbol.jiixBlockType === "Math"
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Solver Output JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Solver Output JIIX block type
 */
export function isStrokeSolverOutput(symbol: TBaseSymbol): symbol is TStroke {
  return isStroke(symbol) && symbol.isSolverOutput === true
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Text JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Text JIIX block type
 */
export function isRecognizedText(symbol: TBaseSymbol): symbol is TStroke {
  return isStroke(symbol) && symbol.jiixBlockType === "Text"
}

/**
 * @group Symbol
 */
export const StrokeOps = {
  create(style?: TPartialDeep<TStyle>, pointerType = "pen"): TStroke {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) {
      mergedStyle.opacity = +mergedStyle.opacity
    }
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const pointers: TPointer[] = []
    return {
      type: SymbolType.Stroke,
      id: `${SymbolType.Stroke}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      pointerType,
      pointers,
      length: 0,
      bounds: OBBOps.create({ x: 0, y: 0 }, 0, 0),
      snapPoints: [],
      vertices: pointers,
      edges: [],
    }
  },

  updateBounds(stroke: TStroke): void {
    stroke.bounds = OBBOps.createFromPoints(stroke.pointers)
    stroke.snapPoints = OBBOps.getSnapPoints(stroke.bounds)
    stroke.edges = stroke.pointers.slice(0, -1).map((p, i) => ({
      p1: p,
      p2: stroke.pointers[i + 1],
    }))
  },

  _computePressure(stroke: TStroke, distance: number): number {
    let ratio = 1.0
    if (distance === stroke.length) {
      ratio = 1.0
    } else if (distance < 10) {
      ratio = 0.2 + Math.pow(0.1 * distance, 0.4)
    } else if (distance > stroke.length - 10) {
      ratio = 0.2 + Math.pow(0.1 * (stroke.length - distance), 0.4)
    }
    const pressure = ratio * Math.max(0.1, 1.0 - 0.1 * Math.sqrt(distance))
    return isNaN(pressure) ? 0.5 : Math.round(pressure * 100) / 100
  },

  _filterPointByAcquisitionDelta(stroke: TStroke, point: TPointer): boolean {
    if (stroke.pointers.length === 0) {
      return true
    }
    const lastPointer = stroke.pointers.at(-1)!
    const delta: number = 2 + (stroke.style.width || 1) / 4
    return Math.abs(lastPointer.x - point.x) >= delta || Math.abs(lastPointer.y - point.y) >= delta
  },

  addPointer(stroke: TStroke, pointer: TPointer): void {
    if (StrokeOps._filterPointByAcquisitionDelta(stroke, pointer)) {
      const lastPointer = stroke.pointers.at(-1)
      const distance = lastPointer ? computeDistance(pointer, lastPointer) : 0
      stroke.length += distance
      pointer.p = StrokeOps._computePressure(stroke, distance)
      stroke.pointers.push(pointer)
      stroke.modificationDate = Date.now()
      StrokeOps.updateBounds(stroke)
    }
  },

  overlaps(stroke: TStroke, box: TBox): boolean {
    return stroke.pointers.some(
      (p) => p.x >= box.x && p.x <= box.x + box.width && p.y >= box.y && p.y <= box.y + box.height
    )
  },

  split(strokeToSplit: TStroke, i: number): { before: TStroke; after: TStroke } {
    const before = StrokeOps.create(strokeToSplit.style, strokeToSplit.pointerType)
    before.pointers.push(...strokeToSplit.pointers.slice(0, i))
    before.length = before.pointers.reduce(
      (sum, ptr, idx, arr) => (idx === 0 ? 0 : sum + computeDistance(ptr, arr[idx - 1])),
      0
    )
    StrokeOps.updateBounds(before)

    const after = StrokeOps.create(strokeToSplit.style, strokeToSplit.pointerType)
    after.pointers.push(...strokeToSplit.pointers.slice(i))
    after.length = after.pointers.reduce(
      (sum, ptr, idx, arr) => (idx === 0 ? 0 : sum + computeDistance(ptr, arr[idx - 1])),
      0
    )
    StrokeOps.updateBounds(after)

    return { before, after }
  },

  substract(stroke: TStroke, partStroke: TStroke): { before?: TStroke; after?: TStroke } {
    if (!partStroke.length) {
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
      const newStrokes = StrokeOps.split(stroke, closestLastPointBeforeStroke.index)
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
      const newStrokes = StrokeOps.split(strokeAfter, closestFirstPointStrokeAfter.index)
      result.after = newStrokes.after
    }
    if (!result.before?.pointers.length) {
      result.before = undefined
    }
    if (!result.after?.pointers.length) {
      result.after = undefined
    }
    return result
  },

  createFromPartial(partial: TPartialDeep<TStroke>): TStroke {
    if (!partial.pointers?.length) {
      throw new Error(`not pointers`)
    }
    const stroke = StrokeOps.create(partial.style, partial.pointerType)
    if (partial.id) {
      stroke.id = partial.id
    }
    stroke.isSolverOutput = partial.isSolverOutput
    stroke.jiixBlockId = partial.jiixBlockId
    const errors: string[] = []
    let flag = true
    partial.pointers?.forEach((pp, pIndex) => {
      if (!pp) {
        errors.push(`no pointer at ${pIndex}`)
        flag = false
        return
      }
      const pointer: TPointer = {
        p: pp.p || 1,
        t: pp.t || pIndex,
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
        StrokeOps.addPointer(stroke, pointer)
      }
    })
    if (errors.length) {
      throw new Error(errors.join(" and "))
    }
    return stroke
  },

  _getArcPath(center: TPointer, radius: number): string {
    return [
      `M ${center.x} ${center.y}`,
      `m ${-radius} 0`,
      `a ${radius} ${radius} 0 1 0 ${radius * 2} 0`,
      `a ${radius} ${radius} 0 1 0 ${-(radius * 2)} 0`,
    ].join(" ")
  },

  _getLinePath(begin: TPointer, end: TPointer, width: number): string {
    const linkPoints1 = computeLinksPointers(begin, computeAngleAxeRadian(begin, end), width)
    const linkPoints2 = computeLinksPointers(end, computeAngleAxeRadian(begin, end), width)
    return [
      `M ${linkPoints1[0].x} ${linkPoints1[0].y}`,
      `L ${linkPoints2[0].x} ${linkPoints2[0].y}`,
      `L ${linkPoints2[1].x} ${linkPoints2[1].y}`,
      `L ${linkPoints1[1].x} ${linkPoints1[1].y}`,
    ].join(" ")
  },

  _getFinalPath(begin: TPointer, end: TPointer, width: number): string {
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
  },

  _getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string {
    const linkPoints1 = computeLinksPointers(begin, computeAngleAxeRadian(begin, central), width)
    const linkPoints2 = computeLinksPointers(end, computeAngleAxeRadian(central, end), width)
    const linkPoints3 = computeLinksPointers(central, computeAngleAxeRadian(begin, end), width)
    return [
      `M ${linkPoints1[0].x} ${linkPoints1[0].y}`,
      `Q ${linkPoints3[0].x} ${linkPoints3[0].y} ${linkPoints2[0].x} ${linkPoints2[0].y}`,
      `L ${linkPoints2[1].x} ${linkPoints2[1].y}`,
      `Q ${linkPoints3[1].x} ${linkPoints3[1].y} ${linkPoints1[1].x} ${linkPoints1[1].y}`,
    ].join(" ")
  },

  getSVGPath(stroke: TStroke): string {
    const STROKE_LENGTH = stroke.pointers.length
    if (!STROKE_LENGTH) {
      return ""
    }
    const STROKE_WIDTH = stroke.style.width
    const NB_QUADRATICS = STROKE_LENGTH - 2
    const firstPoint = stroke.pointers[0]
    const parts = []
    if (STROKE_LENGTH < 3) {
      parts.push(StrokeOps._getArcPath(firstPoint, STROKE_WIDTH * 0.6))
    } else {
      parts.push(StrokeOps._getArcPath(firstPoint, STROKE_WIDTH * firstPoint.p))
      parts.push(StrokeOps._getLinePath(firstPoint, computeMiddlePointer(firstPoint, stroke.pointers[1]), STROKE_WIDTH))
      for (let i = 0; i < NB_QUADRATICS; i++) {
        const begin = computeMiddlePointer(stroke.pointers[i], stroke.pointers[i + 1])
        const end = computeMiddlePointer(stroke.pointers[i + 1], stroke.pointers[i + 2])
        const central = stroke.pointers[i + 1]
        parts.push(StrokeOps._getQuadraticPath(begin, end, central, STROKE_WIDTH))
      }
      const beforeLastPoint = stroke.pointers[STROKE_LENGTH - 2]
      const lastPoint = stroke.pointers[STROKE_LENGTH - 1]
      parts.push(StrokeOps._getLinePath(computeMiddlePointer(beforeLastPoint, lastPoint), lastPoint, STROKE_WIDTH))
      parts.push(StrokeOps._getFinalPath(beforeLastPoint, lastPoint, STROKE_WIDTH))
    }
    return parts.join(" ")
  },

  formatToSend(stroke: TStrokeMinimal): {
    id: string
    pointerType: string
    p: number[]
    t: number[]
    x: number[]
    y: number[]
  } {
    const json: {
      id: string
      pointerType: string
      p: number[]
      t: number[]
      x: number[]
      y: number[]
    } = {
      id: stroke.id,
      pointerType: stroke.pointerType,
      p: [],
      t: [],
      x: [],
      y: [],
    }
    stroke.pointers.forEach((p) => {
      json.p.push(p.p)
      json.t.push(p.t)
      json.x.push(p.x)
      json.y.push(p.y)
    })
    return json
  },
}
