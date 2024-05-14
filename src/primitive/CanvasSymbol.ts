import { TPoint } from "./Point"
import { TSymbol } from "./Symbol"

/**
 * @group Primitive
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
 * @group Primitive
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
 * @group Primitive
 */
export type TCanvasShapeTableLineSymbol = {
  p1: TPoint
  p2: TPoint
}

/**
 * @group Primitive
 */
export type TCanvasShapeTableSymbol = TSymbol & {
  lines: TCanvasShapeTableLineSymbol[]
}

/**
 * @group Primitive
 */
export type TCanvasUnderLineSymbol = TSymbol & {
  data: {
    firstCharacter: number
    lastCharacter: number
  }
}

/**
 * @group Primitive
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
 * @group Primitive
 */
export type TCanvasTextUnderlineSymbol = TCanvasTextSymbol & {
  underlineList: TCanvasUnderLineSymbol[]
}
