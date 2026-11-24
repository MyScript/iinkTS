import type { TPartialDeep } from "@/core"
import type { TSymbol } from "@/symbol"

import { symbolRegistry } from "./SymbolRegistry"

/**
 * @group SymbolUtils
 * @summary Create any TSymbol from partial data, by asking the registry which util owns the type.
 *
 * There used to be a `switch` here with a branch per built-in type, calling each family's `Ops`
 * directly and falling back to the registry only for unknown types. That made the registry a
 * second-class path: `ShapeUtil.create` and `EdgeUtil.create` were never reached, so the `switch`
 * on `kind` inside them was dead code kept alive by a contract nobody called.
 *
 * Requires {@link registerBuiltinSymbolUtils} to have run. Both canvases that create symbols from
 * partials call it in `initialize()`, and the error below says so rather than letting a missing
 * registration surface as a `TypeError`.
 */
export function createSymbolFromPartial(partial: TPartialDeep<TSymbol>): TSymbol {
  const type = partial.type as string | undefined
  const util = type === undefined ? undefined : symbolRegistry.getUtil(type)
  if (!util) {
    const kind = (partial as { kind?: string }).kind
    throw new Error(
      `Unable to create symbol: no util is registered for type "${type}"` +
        (kind ? ` (kind "${kind}")` : "") +
        `. Registered types: ${symbolRegistry.registeredTypes().join(", ") || "none"}.`
    )
  }
  return util.create(partial as TPartialDeep<TSymbol>) as TSymbol
}

/**
 * @group SymbolUtils
 * @summary Create multiple TSymbols from partial data — accumulates errors.
 */
export function createSymbolsFromPartial(partials: TPartialDeep<TSymbol>[]): TSymbol[] {
  const errors: string[] = []
  const symbols: TSymbol[] = []
  partials.forEach((partial, index) => {
    try {
      symbols.push(createSymbolFromPartial(partial))
    } catch (error) {
      errors.push(`Symbol ${index}: ${(error as Error).message || error}`)
    }
  })
  if (errors.length) {
    throw new Error(`Failed to create ${errors.length} symbol(s):\n${errors.join("\n")}`)
  }
  return symbols
}
