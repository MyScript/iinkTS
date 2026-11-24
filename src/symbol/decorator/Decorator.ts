import { type TOBB } from "@/core"
import type { TStyle } from "@/style"

import type { TBaseSymbol } from "../Symbol"
import { SymbolType } from "../Symbol"
/**
 * @group Symbol
 */
export enum DecoratorKind {
  Highlight = "highlight",
  Surround = "surround",
  Underline = "underline",
  Strikethrough = "strikethrough",
}

/**
 * Standalone decorator symbol that references the strokes or text it decorates.
 * When standalone (in model.symbols): `targetIds` holds the referenced stroke ids and
 * `targetBounds` the box to draw across. When embedded (in `TText.decorators[]`): `targetIds` is
 * empty and `targetBounds` unset — the parent symbol's bounds are used at render time.
 * @group Symbol
 */
export type TDecorator = TBaseSymbol & {
  type: SymbolType.Decorator
  style: TStyle
  kind: DecoratorKind
  targetIds: string[]
  /**
   * The box this decorator is drawn across — an **input**, not a derived value, which is why it
   * survived the removal of every computable field and why it is named for where it comes from.
   *
   * A decorator holds no coordinates of its own: it is placed over other symbols. Its box arrives
   * from outside, either as the recognizer's own word box (JIIX, which is not the union of the
   * strokes' boxes and cannot be recomputed from them) or as that union when JIIX has not answered
   * yet. `DecoratorUtil.getGeometry` therefore reads this field rather than deriving anything. It is
   * in the decorator's local frame: when its targets are transformed together the decorator takes
   * their matrix in `transform` and this box is left alone; only a partial move refits it — see
   * `IIAbstractTransformManager.updateDecoratorsForTargets`.
   *
   * Unset is the "no box of its own" case, and it is the only flag: the `hasBounds` boolean that
   * used to shadow a zero-size box is gone, so presence cannot disagree with itself.
   */
  targetBounds?: TOBB
  baseline?: number
  xHeight?: number
}

/**
 * @group Symbol
 * @summary Check if symbol is a standalone decorator
 */
export function isDecorator(symbol: TBaseSymbol): symbol is TDecorator {
  return symbol.type === SymbolType.Decorator
}

/**
 * @group Symbol
 */
