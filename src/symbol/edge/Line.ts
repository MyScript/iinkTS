import { type TPoint } from "@/core"
import type { TStyle } from "@/style"

import type { SymbolType } from "../Symbol"
import { type TBaseSymbol } from "../Symbol"
import type { TAnchor } from "./Anchor"
import type { EdgeDecoration, EdgeKind } from "./Edge-enum"

/**
 * @group Symbol
 */
export type TEdgeLine = TBaseSymbol & {
  type: SymbolType.Edge
  kind: EdgeKind.Line
  style: TStyle
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  startAnchor?: TAnchor
  endAnchor?: TAnchor
  start: TPoint
  end: TPoint
}

/**
 * @group Symbol
 */
