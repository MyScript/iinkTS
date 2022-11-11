import { TSymbol } from "../renderer/Symbol"
import { TPenStyle } from "../style/PenStyle"

export type TStrokeJSON = {
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

export type TStroke = TSymbol & TStrokeJSON & {
  id?: string
  pointerId: number
  l: number[]
}


export type TStrokesPenStyle = {
  penStyle: TPenStyle
  strokes: TStroke[]
}

export type TStrokeGroup = {
  penStyle: TPenStyle
  strokes: TStroke[]
}
