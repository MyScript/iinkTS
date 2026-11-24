import type { TPartialDeep, TPointer } from "@/core"
import { createUUID, MatrixTransform, resolvePointerDelta, type TMatrixTransform } from "@/core"
import type { TPenStyle } from "@/style"
import { DefaultPenStyle } from "@/style"

import type { TStrokeCapture } from "../stroke"
import type { TBaseSymbol } from "../Symbol"
import { SymbolType } from "../Symbol"

/**
 * @group Symbol
 * @deprecated Use {@link TStroke} from stroke/ for new code
 */
export type TLegacyStroke = TBaseSymbol &
  TStrokeCapture & {
    style: TPenStyle
  }

/**
 * @group Symbol
 * @deprecated Use {@link TStroke} from stroke/ for new code
 */
export class Stroke implements TLegacyStroke {
  type = SymbolType.Stroke
  id: string
  creationTime: number
  modificationDate: number
  style: TPenStyle
  pointerType: string
  pointers: TPointer[]
  transform: TMatrixTransform

  constructor(style: TPenStyle, pointerType = "pen") {
    this.id = `${this.type}-${createUUID()}`
    this.creationTime = Date.now()
    this.modificationDate = this.creationTime
    this.style = style
    this.pointerType = pointerType
    this.pointers = []
    this.transform = MatrixTransform.identity()
  }

  clone(): Stroke {
    const clone = new Stroke(this.style, this.pointerType)
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.pointers = structuredClone(this.pointers)
    clone.transform = { ...this.transform }
    return clone
  }
}

/**
 * @group Symbol
 * @deprecated Use {@link StrokeUtil.createFromPartial} from stroke/ for new code
 */
export function convertPartialStrokesToStrokes(json: TPartialDeep<TLegacyStroke>[]): Stroke[] {
  const errors: string[] = []
  const strokes: Stroke[] = []
  json.forEach((j, ji) => {
    let flag = true
    const stroke = new Stroke(j.style || DefaultPenStyle, j.pointerType)
    if (j.id) {
      stroke.id = j.id
    }
    if (!j.pointers?.length) {
      errors.push(`stroke ${ji + 1} has not pointers`)
      flag = false
      return
    }
    const sourcePointers = j.pointers ?? []
    sourcePointers.forEach((pp, pIndex) => {
      if (!pp) {
        errors.push(`stroke ${ji + 1} has no pointer at ${pIndex}`)
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
        errors.push(`stroke ${ji + 1} has no x at pointer at ${pIndex}`)
        flag = false
        return
      } else {
        pointer.x = pp.x
      }
      if (pp?.y == undefined || pp?.y == null) {
        errors.push(`stroke ${ji + 1} has no y at pointer at ${pIndex}`)
        flag = false
        return
      } else {
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
