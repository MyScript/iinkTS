import { TPenStyle } from "../style/PenStyle"
import { TPoint } from "./Point"

export type TSymbol = TPenStyle & {
  elementType?: string
  type: string
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

export type TShapeLineSymbol = TShapeEllipseSymbol & {
  firstPoint: TPoint
  lastPoint: TPoint
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

export type TTextUnderlineDataSymbol = {
  topLeftPoint: TPoint
  height: number
  width: number
  textHeight: number
  justificationType: string
}

export type TTextUnderlineSymbol = TSymbol & {
  label: string,
  data: TTextUnderlineDataSymbol
  underlineList: TUnderLineSymbol[]
}