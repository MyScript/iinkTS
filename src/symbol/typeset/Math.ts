import type { TPoint } from "@/core"
import { type TOBB } from "@/core"
import type { TStyle } from "@/style"

import type { TDecorator } from "../decorator/Decorator"
import type { TBaseSymbol } from "../Symbol"
import { SymbolType } from "../Symbol"
import type { TTypesetChild } from "./Typeset"
/**
 * @group Symbol
 * @remarks Individual math element (number, operator, variable, etc.)
 */
export type TMathElement = TTypesetChild & {
  fontFamily: string
  position?: "superscript" | "subscript" | "normal"
}

/**
 * @group Symbol
 * @remarks Represents a converted mathematical expression with native rendering
 */
export type TMath = TBaseSymbol & {
  type: SymbolType.Math
  style: TStyle
  point: TPoint
  elements: TMathElement[]
  decorators: TDecorator[]
  bounds: TOBB
}

/**
 * @group Symbol
 * @summary Check if symbol is math
 * @param symbol - Symbol to check
 * @returns True if symbol is math
 */
export function isMath(symbol: TBaseSymbol): symbol is TMath {
  return symbol.type === SymbolType.Math
}

/**
 * @group Symbol
 */
