import type { TDraft } from "@/core"
import type { TBaseSymbol } from "@/symbol"

/**
 * Where a symbol sits relative to its neighbours, for {@link SymbolStore.changeOrder}.
 * @group Store
 */
export type TSymbolOrder = "first" | "last" | "forward" | "backward"

/**
 * The document's records, keyed by id and kept in stacking order.
 *
 * Generic on purpose: the constraint is {@link TBaseSymbol} because that is the type carrying `id`,
 * so the same store serves the full `TSymbol` union and any narrower record set.
 *
 * The store hands out **the records themselves**, never copies. Callers read them; to change one,
 * ask for a draft and commit it back.
 * @group Store
 */
export class SymbolStore<T extends TBaseSymbol> {
  #records = new Map<string, T>()
  #version = 0
  #indexes = new WeakMap<(record: T) => string[], { version: number; byKey: Map<string, T[]> }>()

  /**
   * Bumped by every change to the document. Lets a derived value — a cache, an index, an in-flight
   * export — tell whether what it was computed from is still current.
   */
  get version(): number {
    return this.#version
  }

  get size(): number {
    return this.#records.size
  }

  /** The records in stacking order. */
  list(): T[] {
    return Array.from(this.#records.values())
  }

  /**
   * The records grouped by whatever keys `selector` claims for each of them, memoized against
   * {@link version} so a caller on a hot path can ask every frame and only pay when the document
   * actually changed.
   *
   * `selector` must be a stable reference — a module-level or field-held function, not an inline
   * closure — because it is the cache key. An inline arrow is a new key on every call and would
   * recompute every time, which is the cost this exists to remove.
   */
  listBy(selector: (record: T) => string[]): ReadonlyMap<string, T[]> {
    const cached = this.#indexes.get(selector)
    if (cached?.version === this.#version) {
      return cached.byKey
    }
    const byKey = new Map<string, T[]>()
    for (const record of this.#records.values()) {
      for (const key of selector(record)) {
        const bucket = byKey.get(key)
        if (bucket) {
          bucket.push(record)
        } else {
          byKey.set(key, [record])
        }
      }
    }
    this.#indexes.set(selector, { version: this.#version, byKey })
    return byKey
  }

  get(id: string): T | undefined {
    return this.#records.get(id)
  }

  has(id: string): boolean {
    return this.#records.has(id)
  }

  add(record: T): void {
    if (this.#records.has(record.id)) {
      throw new Error(`Symbol id already exist: ${record.id}`)
    }
    this.#records.set(record.id, this.#freeze(record))
    this.#bump()
  }

  /**
   * Replaces the record stored under `record.id`. Unknown ids are ignored rather than inserted, so a
   * stale caller cannot resurrect a deleted symbol.
   */
  update(record: T, markDirty = true): void {
    if (!this.#records.has(record.id)) {
      return
    }
    this.#records.set(record.id, this.#freeze(record))
    if (markDirty) {
      this.#bump()
    }
  }

  /**
   * A mutable copy of the committed record, yours to change until you {@link commit} it.
   *
   * The copy is what makes the contract honest: the stored record is handed to readers as-is, so
   * mutating it in place would change what every other reader sees, mid-frame and without a version
   * bump. Ask for a draft, change it, commit it.
   */
  draft(id: string): TDraft<T> | undefined {
    const record = this.#records.get(id)
    return record ? (structuredClone(record) as TDraft<T>) : undefined
  }

  /** Stores a draft back under its own id, in the position the record already held. */
  commit(draft: TDraft<T>, markDirty = true): void {
    this.update(draft as T, markDirty)
  }

  /** Swaps one record for several, in the position the original held. */
  replace(id: string, records: T[]): void {
    if (!this.#records.has(id)) {
      return
    }
    this.#records.delete(id)
    records.forEach((r) => this.#records.set(r.id, this.#freeze(r)))
    this.#bump()
  }

  remove(id: string): void {
    if (this.#records.delete(id)) {
      this.#bump()
    }
  }

  /**
   * Moves a record within the stacking order. A `Map` has no reordering primitive, so the entries are
   * rebuilt in the new order — which is also why order has to be maintained here rather than by a
   * caller splicing a list it was handed.
   */
  changeOrder(id: string, position: TSymbolOrder): void {
    const entries = Array.from(this.#records.entries())
    const fromIndex = entries.findIndex(([key]) => key === id)
    if (fromIndex === -1) {
      return
    }
    const last = entries.length - 1
    const toIndex = {
      first: 0,
      last,
      forward: Math.min(fromIndex + 1, last),
      backward: Math.max(fromIndex - 1, 0),
    }[position]
    if (toIndex === fromIndex) {
      return
    }
    const [entry] = entries.splice(fromIndex, 1)
    entries.splice(toIndex, 0, entry)
    this.#records = new Map(entries)
    this.#bump()
  }

  clear(): void {
    this.#records.clear()
    this.#bump()
  }

  #bump(): void {
    this.#version++
  }

  /**
   * Freezes a record on the way in, deeply.
   *
   * This is what lets {@link list} and {@link get} hand out the stored records themselves instead of
   * copying the whole document on every read: a caller cannot corrupt what it was given. The cost is
   * paid once per commit rather than once per read, and reads outnumber commits by a wide margin.
   */
  #freeze<TValue>(value: TValue): TValue {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
      return value
    }
    Object.freeze(value)
    for (const key of Object.getOwnPropertyNames(value)) {
      this.#freeze((value as Record<string, unknown>)[key])
    }
    return value
  }
}
