import type { TExport, TJIIXMathElement, TJIIXTextElement } from "@/client"
import { JIIXElementType } from "@/client"
import { mergeExports, type TDraft } from "@/core"
import { LoggerCategory, LoggerManager } from "@/logger"
import { SymbolStore, type TSymbolOrder } from "@/store"
import type { TSymbol } from "@/symbol"
import { isDecorator } from "@/symbol"

/** Held at module level so it is a stable cache key for {@link SymbolStore.listBy}. */
const targetIdsOf = (symbol: TSymbol): string[] => (isDecorator(symbol) ? symbol.targetIds : [])

/**
 * @group Model
 */
export class IIModel {
  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  #store = new SymbolStore<TSymbol>()
  #selectedIds = new Set<string>()
  #selectionVersion = 0
  #modificationDate: number
  #exports?: TExport
  readonly creationTime: number

  constructor(creationDate = Date.now()) {
    this.creationTime = creationDate
    this.#modificationDate = creationDate
  }

  /**
   * Bumped on every mutation that invalidates `exports` (add/remove/update/replace/order/clear).
   * Lets an in-flight export request detect that the model changed while it was waiting
   * for a server response, so a now-stale response isn't cached as if it were current.
   */
  get version(): number {
    return this.#store.version
  }

  get modificationDate(): number {
    return this.#modificationDate
  }

  get exports(): TExport | undefined {
    return this.#exports
  }

  /**
   * Bumped whenever the selection changes. `selectedIds` is a live `Set` whose identity never
   * changes, so a reader that caches per-selection work has no way to notice a mutation — and
   * building a key out of the ids costs a sort and a string over the whole selection, on every
   * `pointermove` of every drag. Compare this integer instead.
   */
  get selectionVersion(): number {
    return this.#selectionVersion
  }

  /** The ids of the selected symbols. Change the selection through {@link selectSymbol} and friends. */
  get selectedIds(): ReadonlySet<string> {
    return this.#selectedIds
  }

  /** How many symbols the document holds, without building — and cloning — the list to count it. */
  get symbolCount(): number {
    return this.#store.size
  }

  /**
   * The document's symbols, in stacking order.
   *
   * These are the stored records themselves, not copies: the store freezes them at commit, so a
   * reader cannot corrupt the document by holding one. To change a symbol, ask for a
   * {@link draftSymbol} and commit it back.
   */
  get symbols(): TSymbol[] {
    return this.#store.list()
  }

  get symbolsSelected(): TSymbol[] {
    return this.#store.list().filter((s) => this.#selectedIds.has(s.id))
  }

  /**
   * Get all Text blocks from JIIX export
   * @returns Array of Text elements from the JIIX export, or empty array if no export available
   */
  get textBlocks(): TJIIXTextElement[] {
    const jiixExport = this.#exports?.["application/vnd.myscript.jiix"]
    if (!jiixExport?.elements) {
      return []
    }
    return jiixExport.elements.filter((el): el is TJIIXTextElement => el.type === JIIXElementType.Text)
  }

  /**
   * Get all Math blocks from JIIX export
   * @returns Array of Math elements from the JIIX export, or empty array if no export available
   */
  get mathBlocks(): TJIIXMathElement[] {
    const jiixExport = this.#exports?.["application/vnd.myscript.jiix"]
    if (!jiixExport?.elements) {
      return []
    }
    return jiixExport.elements.filter((el): el is TJIIXMathElement => el.type === JIIXElementType.Math)
  }

  selectSymbol(id: string): void {
    const before = this.#selectedIds.size
    this.#selectedIds.add(id)
    if (this.#selectedIds.size !== before) {
      this.#selectionVersion++
    }
  }

  unselectSymbol(id: string): void {
    if (this.#selectedIds.delete(id)) {
      this.#selectionVersion++
    }
  }

  resetSelection(): void {
    if (this.#selectedIds.size > 0) {
      this.#selectedIds.clear()
      this.#selectionVersion++
    }
  }

  /**
   * The decorators claiming each target id, memoized against {@link version}.
   *
   * Transform paths need this per `pointermove`; scanning the document for it was a full pass — and,
   * before IIC-1968, a full deep clone — on every frame.
   */
  get decoratorsByTargetId(): ReadonlyMap<string, TSymbol[]> {
    return this.#store.listBy(targetIdsOf)
  }

  getSymbol(id: string): TSymbol | undefined {
    return this.#store.get(id)
  }

  /**
   * A mutable copy of a committed symbol, yours to change until you {@link commitSymbol} it.
   *
   * This is the replacement for the read-a-clone-then-mutate-it pattern: same cost, but the type
   * says which side of the commit boundary you are on, so IIC-1974 can freeze committed records
   * without every caller having to be re-read to find out whether it writes.
   */
  draftSymbol(id: string): TDraft<TSymbol> | undefined {
    return this.#store.draft(id)
  }

  /** Stores a draft back into the document, in the position the symbol already held. */
  commitSymbol(draft: TDraft<TSymbol>, markDirty: boolean = true): void {
    this.updateSymbol(draft, markDirty)
  }

  addSymbol(symbol: TSymbol): void {
    this.#logger.info("addSymbol", { symbol })
    this.#commit(() => this.#store.add(symbol))
  }

  updateSymbol(updatedSymbol: TSymbol, markDirty: boolean = true): void {
    this.#logger.info("updateSymbol", { updatedSymbol, markDirty })
    if (markDirty && this.#store.has(updatedSymbol.id)) {
      updatedSymbol.modificationDate = Date.now()
    }
    this.#commit(() => this.#store.update(updatedSymbol, markDirty))
  }

  replaceSymbol(id: string, symbols: TSymbol[]): void {
    this.#commit(() => this.#store.replace(id, symbols))
  }

  changeOrderSymbol(id: string, position: TSymbolOrder): void {
    this.#commit(() => this.#store.changeOrder(id, position))
  }

  removeSymbol(id: string): void {
    this.#logger.info("removeSymbol", { id })
    this.#commit(() => this.#store.remove(id))
  }

  /**
   * Stamps the model as changed without going through a mutator.
   *
   * Its one caller mutates committed records in place and needs the change to be visible downstream.
   * That pattern is what IIC-1970 converts to draft-then-commit and IIC-1974 makes impossible, and
   * this method goes with it.
   */
  touch(): void {
    this.#modificationDate = Date.now()
  }

  /**
   * Force `exports` to be considered stale (e.g. after a language change), without
   * going through a symbol mutation.
   */
  invalidateExports(): void {
    this.#modificationDate = Date.now()
    this.#exports = undefined
  }

  mergeExport(exports: TExport) {
    this.#logger.info("mergeExport", { exports })
    this.#exports = mergeExports(this.#exports, exports)
    this.#logger.debug("mergeExport", this.#exports)
  }

  clear(): void {
    this.#logger.info("clear")
    this.#commit(() => this.#store.clear())
  }

  /**
   * Runs a store mutation and applies the model-level consequences — but only if the store says
   * something actually changed. The store's version is the single source of truth for that, so a
   * no-op (an unknown id, a move that was already at the edge) does not invalidate an export.
   */
  #commit(mutate: () => void): void {
    const before = this.#store.version
    mutate()
    if (this.#store.version !== before) {
      this.#modificationDate = Date.now()
      this.#exports = undefined
    }
  }
}
