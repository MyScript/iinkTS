import { type TPoint } from "@/core"
import { type TStyle } from "@/style"

import type { SymbolType } from "../Symbol"
import { type TBaseSymbol } from "../Symbol"
import type { ShapeKind } from "./Shape-enum"

/**
 * @group Symbol
 */
export type TShapeCircle = TBaseSymbol & {
  type: SymbolType.Shape
  kind: ShapeKind.Circle
  style: TStyle
  center: TPoint
  radius: number
}

/**
 * @group Symbol
 */
