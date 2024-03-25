import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { LoggerManager } from "../logger"
import { DefaultStyle, TStyle } from "../style"
import { PartialDeep, computeDistance, getClosestPoint} from "../utils"
import { TStroke, TStrokeToSend } from "./Stroke"
import { TPoint, TPointer } from "./Point"
import { TBoundingBox } from "./Box"
import { SymbolType } from "./Symbol"
import { OIDecorator } from "./OIDecorator"
import { OISymbol } from "./OISymbol"

/**
 * @group Primitive
 */
export class OIStroke extends OISymbol implements TStroke
{
  #logger = LoggerManager.getLogger(LoggerClass.STROKE)
  pointerId: number
  pointerType: string
  pointers: TPointer[]
  length: number
  decorators: OIDecorator[]

  constructor(style: TStyle, pointerId: number, pointerType = "pen")
  {
    super(SymbolType.Stroke, style)
    this.#logger.info("constructor", { style, pointerId, pointerType })

    this.pointerId = pointerId
    this.pointerType = pointerType
    this.pointers = []
    this.decorators = []
    this.length = 0
  }

  static split(strokeToSplit: OIStroke, i: number): { before: OIStroke, after: OIStroke }
  {
    const before = new OIStroke(strokeToSplit.style, strokeToSplit.pointerId, strokeToSplit.pointerType)
    before.pointers = strokeToSplit.pointers.slice(0, i)

    const after = new OIStroke(strokeToSplit.style, strokeToSplit.pointerId, strokeToSplit.pointerType)
    after.pointers = strokeToSplit.pointers.slice(i)

    return { before, after }
  }

  static substract(stroke: OIStroke, partStroke: OIStroke): { before?: OIStroke, after?: OIStroke }
  {
    if (!partStroke.length) return { before: stroke }
    const result: { before?: OIStroke, after?: OIStroke } = {}
    const lastPointBeforeStroke = {
      x: partStroke.pointers[0].x as number,
      y: partStroke.pointers[0].y as number
    }
    const closestLastPointBeforeStroke = getClosestPoint(stroke.pointers, lastPointBeforeStroke)
    if (closestLastPointBeforeStroke.index > -1) {
      const newStrokes = OIStroke.split(stroke, closestLastPointBeforeStroke.index)
      result.before = newStrokes.before
      result.after = newStrokes.after
    }
    const strokeAfter = result.after || stroke
    const firstPointAfterStroke = {
      x: partStroke.pointers.at(-1)!.x as number,
      y: partStroke.pointers.at(-1)!.y as number
    }
    const closestFirstPointStrokeAfter = getClosestPoint(strokeAfter.pointers, firstPointAfterStroke)
    if (closestFirstPointStrokeAfter.index > -1) {
      const newStrokes = OIStroke.split(strokeAfter, closestFirstPointStrokeAfter.index)
      result.after = newStrokes.after
    }
    if (!result.before?.pointers.length) result.before = undefined
    if (!result.after?.pointers.length) result.after = undefined
    return result
  }

  get snapPoints(): TPoint[]
  {
    return this.boundingBox.snapPoints
  }

  get vertices(): TPoint[]
  {
    return this.pointers
  }

  protected computePressure(distance: number): number
  {
    let ratio = 1.0
    if (distance === this.length) {
      ratio = 1.0
    } else if (distance < 10) {
      ratio = 0.2 + Math.pow(0.1 * distance, 0.4)
    } else if (distance > this.length - 10) {
      ratio = 0.2 + Math.pow(0.1 * (this.length - distance), 0.4)
    }
    const pressure = ratio * Math.max(0.1, 1.0 - (0.1 * Math.sqrt(distance)))
    return isNaN(pressure) ? 0.5 : Math.round(pressure * 100) / 100
  }

  protected filterPointByAcquisitionDelta(point: TPointer): boolean
  {
    const lastPointer = this.pointers.at(-1)
    const delta: number = (2 + ((this.style.width || 1) / 4))
    return !lastPointer ||
      Math.abs(lastPointer.x - point.x) >= delta ||
      Math.abs(lastPointer.y - point.y) >= delta
  }

  addPointer(pointer: TPointer): void
  {
    this.#logger.debug("addPoint", { pointer })
    if (this.filterPointByAcquisitionDelta(pointer)) {
      const lastPointer = this.pointers.at(-1)
      const distance = lastPointer ? computeDistance(pointer, lastPointer) : 0
      this.length += distance
      pointer.p = this.computePressure(distance)
      this.pointers.push(pointer)
      this.modificationDate = Date.now()
    }
  }

  overlaps(box: TBoundingBox): boolean
  {
    return this.pointers.some(p =>
    {
      return p.x >= box.x && p.x <= box.x + box.width
        && p.y >= box.y && p.y <= box.y + box.height
    })
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return this.pointers.some(pointer =>
    {
      return computeDistance(point, pointer) < SELECTION_MARGIN
    })
  }

  clone(): OIStroke
  {
    const clone = new OIStroke(this.style, this.pointerId, this.pointerType)
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.pointers = structuredClone(this.pointers)
    clone.decorators = this.decorators.map(d => d.clone())
    clone.length = this.length
    return clone
  }

  formatToSend(): TStrokeToSend
  {
    const json: TStrokeToSend = {
      id: this.id,
      pointerType: this.pointerType,
      p: [],
      t: [],
      x: [],
      y: []
    }
    this.pointers.forEach(p =>
    {
      json.p.push(p.p)
      json.t.push(p.t)
      json.x.push(p.x)
      json.y.push(p.y)
    })
    return json
  }

  toJSON(): PartialDeep<OIStroke>
  {
    return {
      id: this.id,
      type: this.type,
      pointers: this.pointers,
      style: this.style,
      decorators: this.decorators.length ? this.decorators : undefined
    }
  }

  static create(partial: PartialDeep<OIStroke>): OIStroke
  {
    if (!partial.pointers?.length) {
      throw new Error(`not pointers`)
    }
    const stroke = new OIStroke(partial.style || DefaultStyle, partial.pointerId || 1)
    if (partial.id) stroke.id = partial.id
    const errors: string[] = []
    let flag = true
    partial.pointers?.forEach((pp, pIndex) =>
    {
      if (!pp) {
        errors.push(`no pointer at ${ pIndex }`)
        flag = false
        return
      }
      const pointer: TPointer = {
        p: pp.p || 1,
        t: pp.t || pIndex,
        x: 0,
        y: 0
      }
      if (pp?.x == undefined || pp?.x == null) {
        errors.push(`no x at pointer at ${ pIndex }`)
        flag = false
        return
      }
      else {
        pointer.x = pp.x
      }
      if (pp?.y == undefined || pp?.y == null) {
        errors.push(`no y at pointer at ${ pIndex }`)
        flag = false
        return
      }
      else {
        pointer.y = pp.y
      }
      if (flag) {
        stroke.addPointer(pointer)
      }
    })

    if (errors.length) {
      throw new Error(errors.join(" and "))
    }
    return stroke
  }
}

/**
 * @group Primitive
 * @group Utils
 */
export function convertPartialStrokesToOIStrokes(json: PartialDeep<TStroke>[]): OIStroke[]
{
  const errors: string[] = []
  const strokes: OIStroke[] = []
  json.forEach((j, i) =>
  {
    try {
      strokes.push(OIStroke.create(j as PartialDeep<OIStroke>))
    } catch (e) {
      errors.push(`stroke ${i + 1} has ${(e as Error).message}`)
    }
  })

  if (errors.length) {
    throw new Error(errors.join("\n"))
  }

  return strokes
}
