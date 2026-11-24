import type { TBaseSymbol } from "@/symbol"

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

  /**
   * The util that owns a symbol, or a throw naming what is registered.
   *
   * Unlike {@link getUtil} this does not return `undefined`. It serves the paths that ask a symbol
   * for its own behaviour — deriving fields after a transform, for instance — where carrying on
   * without a util would silently skip the work and leave stale geometry behind a symbol that looks
   * fine. A missing registration is a setup bug and should say so.
   */
  getUtilFor<T extends TBaseSymbol>(symbol: T): SymbolUtil<T> {
    const util = this.getUtil<T>(symbol.type)
    if (!util) {
      throw new Error(
        `No util is registered for type "${symbol.type}". ` +
          `Registered types: ${this.registeredTypes().join(", ") || "none"}.`
      )
    }
    return util
  }

  has(type: string): boolean {
    return this.#utils.has(type)
  }

  /**
   * Every registered type. Exists so a failed lookup can say what *is* registered — the difference
   * between "you spelled the type wrong" and "registerBuiltinSymbolUtils never ran".
   */
  registeredTypes(): string[] {
    return [...this.#utils.keys()]
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
