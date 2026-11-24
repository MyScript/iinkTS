import type { TPartialDeep, TPointer, TPointerImport } from "@/core"
import type { TStyle } from "@/style"

import type { DecoratorKind } from "../decorator/Decorator"
import type { TAnchor } from "../edge/Anchor"
import type { TBaseSymbol } from "../Symbol"
import { SymbolType } from "../Symbol"
/**
 * @group Symbol
 */
export type TStrokeCapture = {
  id: string
  pointerType: string
  pointers: TPointer[]
}

/**
 * @group Symbol
 */
export type TStroke = TBaseSymbol &
  TStrokeCapture & {
    readonly type: SymbolType.Stroke
    style: TStyle

    // JIIX Block metadata
    jiixBlockId?: string
    jiixBlockType?: "Text" | "Math" | "Node" | "Edge" | "Decorator"

    // Connection metadata — pre-convert: symbolId holds a jiixBlockId (target shape block).
    // Populated by IISynchronizerManager from JIIX connected/ports, always overwritten on sync.
    startAnchor?: TAnchor
    endAnchor?: TAnchor

    // Computation metadata
    isSolverOutput?: boolean

    // Decorator metadata
    decoratorKind?: DecoratorKind
  }

/**
 * A stroke as read from a document. Identical to a deep-partial {@link TStroke} except that its
 * pointers may still carry the absolute `t` written before pointers stored a delta — which is what
 * lets {@link StrokeUtil.createFromPartial} open a document saved by an earlier version.
 * @group Symbol
 */
export type TStrokeImport = Omit<TPartialDeep<TStroke>, "pointers"> & { pointers?: (TPointerImport | undefined)[] }

/**
 * @group Symbol
 * @summary Check if symbol is a stroke
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke
 */
export function isStroke(symbol: TBaseSymbol): symbol is TStroke {
  return symbol.type === SymbolType.Stroke
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Math JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Math JIIX block type
 */
export function isRecognizedMath(symbol: TBaseSymbol): symbol is TStroke {
  return isStroke(symbol) && symbol.jiixBlockType === "Math"
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Solver Output JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Solver Output JIIX block type
 */
export function isStrokeSolverOutput(symbol: TBaseSymbol): symbol is TStroke {
  return isStroke(symbol) && symbol.isSolverOutput === true
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Text JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Text JIIX block type
 */
export function isRecognizedText(symbol: TBaseSymbol): symbol is TStroke {
  return isStroke(symbol) && symbol.jiixBlockType === "Text"
}

/**
 * @group Symbol
 */
