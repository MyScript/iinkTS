import type { TBaseSymbol } from "@/symbol/Symbol"

import type { SymbolUtil } from "./SymbolUtil"

/**
 * @group SymbolUtils
 * @summary Registry for SymbolUtil implementations.
 *
 * Built-in types are registered via `registerBuiltinSymbolUtils()`, which the
 * canvas calls on initialisation. External consumers may register additional
 * types before or after canvas creation:
 *
 * @example
 * import { symbolRegistry } from "iink-ts"
 * symbolRegistry.register(new StickyNoteUtil())
 */
class SymbolRegistryClass {
  readonly #utils = new Map<string, SymbolUtil<TBaseSymbol>>()

  register<T extends TBaseSymbol>(util: SymbolUtil<T>): this {
    this.#utils.set(util.type, util as SymbolUtil<TBaseSymbol>)
    return this
  }

  getUtil<T extends TBaseSymbol>(type: string): SymbolUtil<T> | undefined {
    return this.#utils.get(type) as SymbolUtil<T> | undefined
  }

  has(type: string): boolean {
    return this.#utils.has(type)
  }
}

/**
 * @group SymbolUtils
 */
export const symbolRegistry = new SymbolRegistryClass()

/**
 * @group SymbolUtils
 */
export type { SymbolRegistryClass }
