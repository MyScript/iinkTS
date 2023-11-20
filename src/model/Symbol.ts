import { TPenStyle } from "../style"
import { TPoint } from "../utils"

/**
 * @group Model
 */
export type TSymbol = {
  type: string
  style: TPenStyle
}

/**
 * @group Model
 */
export type TShapeSymbol = TSymbol & {
  candidates: TSymbol[]
  selectedCandidateIndex: number
}

/**
 * @group Model
 */
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

/**
 * @group Model
 */
export type TShapeLineSymbol = TSymbol & {
  firstPoint: TPoint
  lastPoint: TPoint
  beginDecoration?: string
  endDecoration?: string
  beginTangentAngle: number
  endTangentAngle: number
}

/**
 * @group Model
 */
export type TShapeTableLineSymbol = TSymbol & {
  p1: TPoint
  p2: TPoint
}

/**
 * @group Model
 */
export type TShapeTableSymbol = TSymbol & {
  lines: TShapeTableLineSymbol[]
}

/**
 * @group Model
 */
export type TShapeRecognizedSymbol = TSymbol & {
  primitives: TSymbol[]
}

/**
 * @group Model
 */
export type TUnderLineSymbol = TSymbol & {
  data: {
    firstCharacter: number
    lastCharacter: number
  }
}

/**
 * @group Model
 */
export type TTextDataSymbol = {
  topLeftPoint: TPoint
  height: number
  width: number
  textHeight: number
  justificationType: string
}

/**
 * @group Model
 */
export type TTextSymbol = TSymbol & {
  label: string,
  data: TTextDataSymbol
}

/**
 * @group Model
 */
export type TTextUnderlineSymbol = TTextSymbol & {
  underlineList: TUnderLineSymbol[]
}
