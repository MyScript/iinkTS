import { TPoint } from "../utils"
import { TSymbol } from "./Symbol"

/**
 * @group Model/Canvas
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
 * @group Model/Canvas
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
 * @group Model/Canvas
 */
export type TCanvasShapeTableLineSymbol = {
  p1: TPoint
  p2: TPoint
}

/**
 * @group Model/Canvas
 */
export type TCanvasShapeTableSymbol = TSymbol & {
  lines: TCanvasShapeTableLineSymbol[]
}

/**
 * @group Model/Canvas
 */
export type TCanvasUnderLineSymbol = TSymbol & {
  data: {
    firstCharacter: number
    lastCharacter: number
  }
}

/**
 * @group Model/Canvas
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
 * @group Model/Canvas
 */
export type TCanvasTextUnderlineSymbol = TCanvasTextSymbol & {
  underlineList: TCanvasUnderLineSymbol[]
}
