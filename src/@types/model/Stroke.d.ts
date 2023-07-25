import { TPointer } from "../geometry"
import { TSymbol } from "../renderer/Symbol"
import { TPenStyle } from "../style/PenStyle"

export type TStrokeJSON = {
  id: string
  pointerType: string
  x: number[]
  y: number[]
  t: number[]
  p: number[]
}

export type TStrokeGroupJSON = {
  penStyle?: string
  strokes: TStrokeJSON[]
}

export type TStroke = TSymbol & {
  id: string
  pointerId: number
  pointerType: string
  pointers: TPointer[]
  length: number
}

export type TStrokeGroup = {
  penStyle: TPenStyle
  strokes: TStroke[]
}
