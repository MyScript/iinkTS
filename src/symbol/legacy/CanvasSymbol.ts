import type { TPoint } from "@/core"

import type { TBaseSymbol } from "../Symbol"

/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
export type TCanvasShapeEllipseSymbol = TBaseSymbol & {
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
 * @deprecated Legacy v1 canvas symbol types
 */
export type TCanvasShapeLineSymbol = TBaseSymbol & {
  firstPoint: TPoint
  lastPoint: TPoint
  beginDecoration?: string
  endDecoration?: string
  beginTangentAngle: number
  endTangentAngle: number
}

/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
export type TCanvasShapeTableLineSymbol = {
  p1: TPoint
  p2: TPoint
}

/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
export type TCanvasShapeTableSymbol = TBaseSymbol & {
  lines: TCanvasShapeTableLineSymbol[]
}

/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
export type TCanvasUnderLineSymbol = TBaseSymbol & {
  data: {
    firstCharacter: number
    lastCharacter: number
  }
}

/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
export type TCanvasTextSymbol = TBaseSymbol & {
  label: string
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
 * @deprecated Legacy v1 canvas symbol types
 */
export type TCanvasTextUnderlineSymbol = TCanvasTextSymbol & {
  underlineList: TCanvasUnderLineSymbol[]
}
