import type { TStroke } from "./stroke"
import { isStroke } from "./stroke"
import type { TSymbol } from "./Symbol"

/**
 * @group Symbol
 * @summary Clone any TSymbol — all types are now plain objects, use structuredClone.
 */
export function cloneSymbol(symbol: TSymbol): TSymbol {
  return structuredClone(symbol)
}

/**
 * @group Symbol
 * @summary Filter the stroke symbols out of a list that may contain other symbol types (text, math, shapes, ...).
 */
export function extractStrokes(symbols: TSymbol[] | undefined): TStroke[] {
  if (!symbols?.length) {
    return []
  }
  return symbols.filter(isStroke)
}
