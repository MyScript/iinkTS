import { TPoint } from "./Point"
import { TSymbol } from "./Symbol"

/**
 * @group Symbol
 */
export type TCanvasShapeEllipseSymbol = TSymbol & {
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
 * @group Symbol
 */
export type TCanvasShapeLineSymbol = TSymbol & {
  firstPoint: TPoint
  lastPoint: TPoint
  beginDecoration?: string
  endDecoration?: string
  beginTangentAngle: number
  endTangentAngle: number
}

/**
 * @group Symbol
 */
export type TCanvasShapeTableLineSymbol = {
  p1: TPoint
  p2: TPoint
}

/**
 * @group Symbol
 */
export type TCanvasShapeTableSymbol = TSymbol & {
  lines: TCanvasShapeTableLineSymbol[]
}

/**
 * @group Symbol
 */
export type TCanvasUnderLineSymbol = TSymbol & {
  data: {
    firstCharacter: number
    lastCharacter: number
  }
}

/**
 * @group Symbol
 */
export type TCanvasTextSymbol = TSymbol & {
  label: string,
  data: {
    topLeftPoint: TPoint
    height: number
    width: number
    textHeight: number
    justificationType: string
  }
}

/**
 * @group Symbol
 */
export type TCanvasTextUnderlineSymbol = TCanvasTextSymbol & {
  underlineList: TCanvasUnderLineSymbol[]
}
