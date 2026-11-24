import type { TMatrixTransform, TPartialDeep, TPoint } from "@/core"
import type { TStyle } from "@/style"

import type { TDecorator } from "./decorator/Decorator"
import type { TEdge } from "./edge/Edge"
import type { TShape } from "./shape/Shape"
import type { TStroke } from "./stroke/Stroke"
import type { TMath } from "./typeset/Math"
import type { TText } from "./typeset/Text"

/**
 * @group Symbol
 */
export enum SymbolType {
  Stroke = "stroke",
  Shape = "shape",
  Edge = "edge",
  Text = "text",
  Math = "math",
  Eraser = "eraser",
  Decorator = "decorator",
}

/**
 * A handle a symbol offers for vertex-level resizing, and which of its vertices the handle moves.
 *
 * The shape was written out inline in four places before IIC-2009.
 *
 * @group Symbol
 */
export type TResizePoint = { point: TPoint; vertexIndex: number }

/**
 * @group Symbol
 */
export type TBaseSymbol = {
  id: string
  creationTime: number
  modificationDate: number
  type: string
  style: TPartialDeep<TStyle>
  /**
   * Where this symbol sits, relative to the coordinates it stores.
   *
   * A transform writes here and nowhere else: the raw coordinates are what the symbol was created
   * with and never move again. That is what lets the renderer apply a change by rewriting one
   * attribute instead of rebuilding the element, and what keeps undo exact — re-applying an inverse
   * matrix restores the value bit for bit, where re-transforming coordinates accumulated rounding.
   */
  transform: TMatrixTransform
}

/**
 * @group Symbol
 */
export type TSymbol = TEdge | TShape | TStroke | TText | TMath | TDecorator
