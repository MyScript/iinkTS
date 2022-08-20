import { TSymbol } from "../renderer/Symbol"
import { TPenStyle } from "../style/PenStyle"

export type TStrokeJSON = {
  pointerType: string
  x: number[]
  y: number[]
  t: number[]
}

export type TStrokeGroupJSON = {
  penStyle?: string
  strokes: TStrokeJSON[]
}

export type TStroke = TSymbol & TStrokeJSON & {
  pointerId: number
  p: number[]
}


export type TStrokesPenStyle = {
  penStyle: TPenStyle
  strokes: TStroke[]
}

export type TStrokeGroup = {
  penStyle: TPenStyle
  strokes: TStroke[]
}

export interface IStroker {
  drawStroke(context: CanvasRenderingContext2D, stroke: TStroke): void
}