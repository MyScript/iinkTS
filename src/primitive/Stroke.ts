import { LoggerClass } from "../Constants"
import { LoggerManager } from "../logger"
import { DefaultPenStyle, TPenStyle } from "../style"
import { PartialDeep } from "../utils"
import { TPointer } from "./Point"
import { AbstractSymbol, SymbolType, TSymbol } from "./Symbol"

/**
 * @group Primitive
 */
export type TStrokeToSend = {
  id: string
  pointerType: string
  x: number[]
  y: number[]
  t: number[]
  p: number[]
}

/**
 * @group Primitive
 */
export type TStrokeGroupToSend = {
  penStyle?: string
  strokes: TStrokeToSend[]
}

/**
 * @group Primitive
 */
export type TStroke = TSymbol & {
  pointerId: number
  pointerType: string
  pointers: TPointer[]
  length: number
}

/**
 * @group Primitive
 */
export type TStrokeGroup = {
  penStyle: TPenStyle
  strokes: Stroke[]
}

/**
 * @group Primitive
 */
export class Stroke extends AbstractSymbol implements TStroke
{
  #logger = LoggerManager.getLogger(LoggerClass.STROKE)

  pointerId: number
  pointerType: string
  pointers: TPointer[]
  length: number
  style: TPenStyle

  constructor(style: TPenStyle, pointerId: number, pointerType = "pen")
  {
    super(SymbolType.Stroke, style)
    this.#logger.info("constructor", { style, pointerId, pointerType })

    this.style = style
    this.pointerId = pointerId
    this.pointerType = pointerType
    this.pointers = []
    this.length = 0
  }

  getClone(): Stroke
  {
    const clone = new Stroke(this.style, this.pointerId, this.pointerType)
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.pointers = structuredClone(this.pointers)
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
    this.pointers.forEach(p => {
      json.p.push(p.p)
      json.t.push(p.t)
      json.x.push(p.x)
      json.y.push(p.y)
    })
    return json
  }
}

/**
 * @group Primitive
 * @group Utils
 */
export function convertPartialStrokesToStrokes(json: PartialDeep<TStroke>[]): Stroke[]
{
  const errors: string[] = []
  const strokes: Stroke[] = []
  json.forEach((j, ji) => {
    let flag = true
    const stroke = new Stroke(j.style || DefaultPenStyle, j.pointerId || 1)
    if (j.id) stroke.id = j.id
    if (!j.pointers?.length) {
      errors.push(`stroke ${ji + 1} has not pointers`)
      flag = false
      return
    }
    j.pointers?.forEach((pp, pIndex) => {
      if (!pp) {
        errors.push(`stroke ${ji + 1} has no pointer at ${pIndex}`)
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
        errors.push(`stroke ${ji + 1} has no x at pointer at ${pIndex}`)
        flag = false
        return
      }
      else {
        pointer.x = pp.x
      }
      if (pp?.y == undefined || pp?.y == null) {
        errors.push(`stroke ${ji + 1} has no y at pointer at ${pIndex}`)
        flag = false
        return
      }
      else {
        pointer.y = pp.y
      }
      if (flag) {
        stroke.pointers.push(pointer)
      }
    })
    if (flag) {
      strokes.push(stroke)
    }
  })

  if (errors.length) {
    throw new Error(errors.join("\n"))
  }

  return strokes
}
