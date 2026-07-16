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
  readonly creationTime: number
  modificationDate: number
  symbols: TSymbol[]
  exports?: TExport
  rowHeight: number
  selectedIds: Set<string>

  constructor(rowHeight = 0, creationDate = Date.now()) {
    this.creationTime = creationDate
    this.modificationDate = creationDate
    this.rowHeight = rowHeight
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

  getSymbolRowIndex(symbol: TSymbol): number {
    // Use symbol bounds yMid for row calculation
    return Math.round(symbol.bounds.center.y / this.rowHeight)
  }

  getSymbolsByRowOrdered(): {
    rowIndex: number
    symbols: TSymbol[]
  }[] {
    const rowsMap = new Map<number, TSymbol[]>()

    for (const s of this.symbols) {
      const rowIndex = this.getSymbolRowIndex(s)
      const row = rowsMap.get(rowIndex)
      if (row) {
        row.push(s)
      } else {
        rowsMap.set(rowIndex, [s])
      }
    }

    const rows: {
      rowIndex: number
      symbols: TSymbol[]
    }[] = []
    rowsMap.forEach((symbols, rowIndex) => {
      symbols.sort((s1, s2) => s1.bounds.center.x - s2.bounds.center.x)
      rows.push({ rowIndex, symbols })
    })

    return rows.sort((r1, r2) => r1.rowIndex - r2.rowIndex)
  }

  roundToLineGuide(y: number): number {
    return Math.round(y / this.rowHeight) * this.rowHeight
  }

  isSymbolAbove(source: TSymbol, target: TSymbol): boolean {
    return this.getSymbolRowIndex(source) > this.getSymbolRowIndex(target)
  }

  isSymbolInRow(source: TSymbol, target: TSymbol): boolean {
    return this.getSymbolRowIndex(source) === this.getSymbolRowIndex(target)
  }

  isSymbolBelow(source: TSymbol, target: TSymbol): boolean {
    return this.getSymbolRowIndex(source) < this.getSymbolRowIndex(target)
  }

  getFirstSymbol(symbols: TSymbol[]): TSymbol | undefined {
    if (!symbols.length) {
      return
    }
    return symbols.reduce((previous, current) => {
      if (previous) {
        if (this.getSymbolRowIndex(previous) < this.getSymbolRowIndex(current)) {
          return previous
        } else if (
          this.getSymbolRowIndex(previous) == this.getSymbolRowIndex(current) &&
          previous.bounds.center.x < current.bounds.center.x
        ) {
          return previous
        }
      }
      return current
    })
  }

  getLastSymbol(symbols: TSymbol[]): TSymbol | undefined {
    if (!symbols.length) {
      return
    }
    return symbols.reduce((previous, current) => {
      if (previous) {
        if (this.getSymbolRowIndex(previous) > this.getSymbolRowIndex(current)) {
          return previous
        }
        if (this.getSymbolRowIndex(previous) < this.getSymbolRowIndex(current)) {
          return current
        } else if (previous.bounds.center.x > current.bounds.center.x) {
          return previous
        }
      }
      return current
    })
  }

  addSymbol(symbol: TSymbol): void {
    this.#logger.info("addSymbol", { symbol })
    if (this.#symbolsMap.has(symbol.id)) {
      throw new Error(`Symbol id already exist: ${symbol.id}`)
    }
    this.symbols.push(symbol)
    this.#symbolsMap.set(symbol.id, symbol)
    this.modificationDate = Date.now()
    this.exports = undefined
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
      this.modificationDate = Date.now()
      this.exports = undefined
    }
    this.#logger.debug("updateSymbol", this.symbols)
  }

  replaceSymbol(id: string, symbols: TSymbol[]): void {
    const sIndex = this.symbols.findIndex((s) => s.id === id)
    if (sIndex !== -1) {
      this.symbols.splice(sIndex, 1, ...symbols)
      this.#symbolsMap.delete(id)
      symbols.forEach((s) => this.#symbolsMap.set(s.id, s))
      this.modificationDate = Date.now()
      this.exports = undefined
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
      this.modificationDate = Date.now()
      this.exports = undefined
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
    const clonedModel = new IIModel(this.rowHeight, this.creationTime)
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
    this.modificationDate = Date.now()
    this.symbols = []
    this.#symbolsMap.clear()
    this.exports = undefined
  }
}
