import type { TPoint } from "@/core"
import type { TStyle } from "@/style"

import type { SymbolType, TBaseSymbol } from "../Symbol"
import type { ShapeKind } from "./Shape-enum"

/**
 * @group Symbol
 */
export type TShapePolygon = TBaseSymbol & {
  type: SymbolType.Shape
  kind: ShapeKind.Polygon
  style: TStyle
  points: TPoint[]
}

/**
 * @group Symbol
 */
