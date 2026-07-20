import { LoggerCategory, LoggerManager } from "@/logger"
import type { TSymbol } from "@/symbol"
import { cloneSymbol } from "@/symbol"

import type { TExport, TJIIXMathElement, TJIIXTextElement } from "./Export"
import { JIIXElementType } from "./Export"

/**
 * @group Model
 */
export class IIModel {
  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  #symbolsMap = new Map<string, TSymbol>()
  #version = 0
  readonly creationTime: number
  modificationDate: number
  symbols: TSymbol[]
  exports?: TExport
  selectedIds: Set<string>

  constructor(creationDate = Date.now()) {
    this.creationTime = creationDate
    this.modificationDate = creationDate
    this.symbols = []
    this.exports = undefined
    this.selectedIds = new Set()
  }

  /**
   * Synchronize the internal Map with the symbols array
   * Useful when symbols are modified directly (e.g., in tests)
   */
  #syncMap(): void {
    if (this.#symbolsMap.size !== this.symbols.length) {
      this.#symbolsMap.clear()
      this.symbols.forEach((s) => this.#symbolsMap.set(s.id, s))
    }
  }

  get symbolsSelected(): TSymbol[] {
    return this.symbols.filter((s) => this.selectedIds.has(s.id))
  }

  /**
   * Get all Text blocks from JIIX export
   * @returns Array of Text elements from the JIIX export, or empty array if no export available
   */
  get textBlocks(): TJIIXTextElement[] {
    const jiixExport = this.exports?.["application/vnd.myscript.jiix"]
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
    const jiixExport = this.exports?.["application/vnd.myscript.jiix"]
    if (!jiixExport?.elements) {
      return []
    }
    return jiixExport.elements.filter((el): el is TJIIXMathElement => el.type === JIIXElementType.Math)
  }

  selectSymbol(id: string): void {
    this.selectedIds.add(id)
  }

  unselectSymbol(id: string): void {
    this.selectedIds.delete(id)
  }

  resetSelection(): void {
    this.selectedIds.clear()
  }

  getRootSymbol(id: string): TSymbol | undefined {
    this.#syncMap()
    const directMatch = this.#symbolsMap.get(id)
    if (directMatch) {
      return directMatch
    }
    return undefined
  }

  addSymbol(symbol: TSymbol): void {
    this.#logger.info("addSymbol", { symbol })
    if (this.#symbolsMap.has(symbol.id)) {
      throw new Error(`Symbol id already exist: ${symbol.id}`)
    }
    this.symbols.push(symbol)
    this.#symbolsMap.set(symbol.id, symbol)
    this.#markDirty()
    this.#logger.debug("addSymbol", this.symbols)
  }

  updateSymbol(updatedSymbol: TSymbol): void {
    this.#logger.info("updateSymbol", {
      updatedSymbol,
    })
    const sIndex = this.symbols.findIndex((s) => s.id === updatedSymbol.id)
    if (sIndex !== -1) {
      updatedSymbol.modificationDate = Date.now()
      this.symbols.splice(sIndex, 1, updatedSymbol)
      this.#symbolsMap.set(updatedSymbol.id, updatedSymbol)
      this.#markDirty()
    }
    this.#logger.debug("updateSymbol", this.symbols)
  }

  replaceSymbol(id: string, symbols: TSymbol[]): void {
    const sIndex = this.symbols.findIndex((s) => s.id === id)
    if (sIndex !== -1) {
      this.symbols.splice(sIndex, 1, ...symbols)
      this.#symbolsMap.delete(id)
      symbols.forEach((s) => this.#symbolsMap.set(s.id, s))
      this.#markDirty()
    }
  }

  changeOrderSymbol(id: string, position: "first" | "last" | "forward" | "backward") {
    const fromIndex = this.symbols.findIndex((s) => s.id === id)
    if (fromIndex > -1) {
      let toIndex = fromIndex
      switch (position) {
        case "first":
          toIndex = 0
          break
        case "last":
          toIndex = this.symbols.length - 1
          break
        case "forward":
          toIndex = Math.min(toIndex + 1, this.symbols.length - 1)
          break
        case "backward":
          toIndex = Math.max(toIndex - 1, 0)
          break
      }
      const sym = this.symbols.splice(fromIndex, 1)[0]
      this.symbols.splice(toIndex, 0, sym)
    }
  }

  removeSymbol(id: string): void {
    this.#logger.info("removeSymbol", { id })
    this.#syncMap()
    const symbolIndex = this.symbols.findIndex((s) => s.id === id)
    if (symbolIndex !== -1) {
      this.symbols.splice(symbolIndex, 1)
      this.#symbolsMap.delete(id)
      this.#markDirty()
    }
    this.#logger.debug("removeSymbol", this.symbols)
  }

  extractDifferenceSymbols(model: IIModel): {
    added: TSymbol[]
    removed: TSymbol[]
  } {
    const modelKeys = new Set(model.symbols.map((s) => `${s.id}:${s.modificationDate}`))
    const thisKeys = new Set(this.symbols.map((s) => `${s.id}:${s.modificationDate}`))

    return {
      added: this.symbols.filter((s) => !modelKeys.has(`${s.id}:${s.modificationDate}`)),
      removed: model.symbols.filter((s) => !thisKeys.has(`${s.id}:${s.modificationDate}`)),
    }
  }

  /**
   * Bumped on every mutation that invalidates `exports` (add/remove/update/replace/clear).
   * Lets an in-flight export request detect that the model changed while it was waiting
   * for a server response, so a now-stale response isn't cached as if it were current.
   */
  get version(): number {
    return this.#version
  }

  /**
   * Force `exports` to be considered stale (e.g. after a language change), without
   * going through a symbol mutation.
   */
  invalidateExports(): void {
    this.#markDirty()
  }

  #markDirty(): void {
    this.modificationDate = Date.now()
    this.exports = undefined
    this.#version++
  }

  mergeExport(exports: TExport) {
    this.#logger.info("mergeExport", { exports })
    if (this.exports) {
      Object.assign(this.exports, exports)
    } else {
      this.exports = exports
    }
    this.#logger.debug("mergeExport", this.exports)
  }

  clone(): IIModel {
    this.#logger.info("clone")
    const clonedModel = new IIModel(this.creationTime)
    clonedModel.modificationDate = this.modificationDate
    clonedModel.symbols = this.symbols.map((s) => {
      const c = cloneSymbol(s)
      clonedModel.#symbolsMap.set(c.id, c)
      return c
    })
    clonedModel.exports = structuredClone(this.exports)
    this.#logger.debug("clone", { clonedModel })
    return clonedModel
  }

  clear(): void {
    this.#logger.info("clear")
    this.symbols = []
    this.#symbolsMap.clear()
    this.#markDirty()
  }
}
