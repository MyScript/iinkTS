import { TPoint } from "./Point"
import { TSymbol } from "./Symbol"

/**
 * @group Primitive/Canvas
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
 * @group Primitive/Canvas
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
 * @group Primitive/Canvas
 */
export type TCanvasShapeTableLineSymbol = {
  p1: TPoint
  p2: TPoint
}

/**
 * @group Primitive/Canvas
 */
export type TCanvasShapeTableSymbol = TSymbol & {
  lines: TCanvasShapeTableLineSymbol[]
}

/**
 * @group Primitive/Canvas
 */
export type TCanvasUnderLineSymbol = TSymbol & {
  data: {
    firstCharacter: number
    lastCharacter: number
  }
}

/**
 * @group Primitive/Canvas
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
 * @group Primitive/Canvas
 */
export type TCanvasTextUnderlineSymbol = TCanvasTextSymbol & {
  underlineList: TCanvasUnderLineSymbol[]
}
