import { type TPoint } from "@/core"
import type { TStyle } from "@/style"

import type { SymbolType } from "../Symbol"
import { type TBaseSymbol } from "../Symbol"
import type { TAnchor } from "./Anchor"
import type { EdgeDecoration, EdgeKind } from "./Edge-enum"
/**
 * @group Symbol
 */
export type TEdgePolyLine = TBaseSymbol & {
  type: SymbolType.Edge
  kind: EdgeKind.PolyEdge
  style: TStyle
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  startAnchor?: TAnchor
  endAnchor?: TAnchor
  points: TPoint[]
}

/**
 * @group Symbol
 */
