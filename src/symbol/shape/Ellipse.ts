import type { TPoint } from "@/core"
import type { TStyle } from "@/style"

import type { SymbolType, TBaseSymbol } from "../Symbol"
import type { ShapeKind } from "./Shape-enum"

/**
 * @group Symbol
 */
export type TShapeEllipse = TBaseSymbol & {
  type: SymbolType.Shape
  kind: ShapeKind.Ellipse
  style: TStyle
  center: TPoint
  radiusX: number
  radiusY: number
  orientation: number
}

/**
 * @group Symbol
 */
