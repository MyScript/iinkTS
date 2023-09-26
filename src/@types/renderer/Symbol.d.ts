import { TPenStyle } from "../style/PenStyle"
import { TPoint } from "../math"

export type TSymbol = {
  elementType?: string
  type: string
  style: TPenStyle
}

export type TShapeSymbol = TSymbol & {
  candidates: TSymbol[]
  selectedCandidateIndex: number
}

export type TShapeEllipseSymbol = TSymbol & {
  centerPoint: TPoint
  maxRadius: number
  minRadius: number
  orientation: number
  startAngle: number
  sweepAngle: number
  beginDecoration?: string
  endDecoration?: string
  beginTangentAngle: number
  endTangentAngle: number
}

export type TShapeLineSymbol = TSymbol & {
  firstPoint: TPoint
  lastPoint: TPoint
  beginDecoration?: string
  endDecoration?: string
  beginTangentAngle: number
  endTangentAngle: number
}

export type TLineSymbol = TSymbol & {
  data: {
    p1: TPoint
    p2: TPoint
  }
}

export type TShapeTableSymbol = TSymbol & {
  lines: TShapeLineSymbol[]
}

export type TShapeRecognizedSymbol = TSymbol & {
  primitives: TSymbol[]
}

export type TUnderLineSymbol = TSymbol & {
  data: {
    firstCharacter: number
    lastCharacter: number
  }
}

export type TTextDataSymbol = {
  topLeftPoint: TPoint
  height: number
  width: number
  textHeight: number
  justificationType: string
}

export type TTextSymbol = TSymbol & {
  label: string,
  data: TTextDataSymbol
}

export type TTextUnderlineSymbol = TTextSymbol & {
  underlineList: TUnderLineSymbol[]
}
