import { LoggerClass, LoggerManager } from "../logger"
import
{
  SymbolType,
  TOISymbol,
  TPoint,
} from "../primitive"
import { TExport } from "./Export"
import { IModel } from "./IModel"

/**
 * @group Model
 */
export class OIModel implements IModel
{
  #logger = LoggerManager.getLogger(LoggerClass.MODEL)
  readonly creationTime: number
  modificationDate: number
  currentSymbol?: TOISymbol
  symbols: TOISymbol[]
  exports?: TExport
  converts?: TExport
  width: number
  height: number
  rowHeight: number
  idle: boolean

  constructor(width = 100, height = 100, rowHeight = 0, creationDate = Date.now())
  {
    this.creationTime = creationDate
    this.modificationDate = creationDate
    this.width = width
    this.height = height
    this.rowHeight = rowHeight
    this.symbols = []
    this.exports = undefined
    this.converts = undefined
    this.idle = true
  }

  get symbolsSelected(): TOISymbol[]
  {
    return this.symbols.filter(s => s.selected)
  }

  get symbolsToDelete(): TOISymbol[]
  {
    return this.symbols.filter(s => s.deleting)
  }

  selectSymbol(id: string): void
  {
    const symbol = this.symbols.find(s => s.id === id || (s.type === SymbolType.Group && s.containsSymbol(id)))
    if (symbol) {
      symbol.selected = true
    }
  }

  setToDeleteSymbolsFromPoint(point: TPoint): void
  {
    this.#logger.info("appendSelectedStrokesFromPoint", { point })
    this.symbols.forEach(s =>
    {
      if (s.isCloseToPoint(point)) {
        s.deleting = true
      }
    })
  }

  unselectSymbol(id: string): void
  {
    const symbol = this.symbols.find(s => s.id === id)
    if (symbol) {
      symbol.selected = false
    }
  }

  resetSelection(): void
  {
    this.symbols.forEach(s => s.selected = false)
  }

  getRootSymbol(id: string): TOISymbol | undefined
  {
    return this.symbols.find(s =>
    {
      if (s.id === id) return s
      if (s.type === SymbolType.Group && s.containsSymbol(id)) {
        return s
      }
      return
    })
  }

  getSymbolRowIndex(symbol: TOISymbol): number
  {
    return Math.round(symbol.bounds.yMid / this.rowHeight)
  }

  getSymbolsByRowOrdered(): { rowIndex: number, symbols: TOISymbol[] }[]
  {
    const rows: { rowIndex: number, symbols: TOISymbol[] }[] = []
    this.symbols.forEach(s =>
    {
      const rowIndex = this.getSymbolRowIndex(s)
      const row = rows.find(r => r.rowIndex === rowIndex)
      if (row) {
        row.symbols.push(s)
      }
      else {
        rows.push({ rowIndex, symbols: [s] })
      }
    })
    rows.forEach(r =>
    {
      r.symbols.sort((s1, s2) => s1.bounds.xMid - s2.bounds.xMid)
    })
    return rows.sort((r1, r2) => r1.rowIndex - r2.rowIndex)
  }

  roundToLineGuide(y: number): number
  {
    return Math.round(y / this.rowHeight) * this.rowHeight
  }

  isSymbolAbove(source: TOISymbol, target: TOISymbol): boolean
  {
    return source.bounds.yMid - this.rowHeight / 2 > target.bounds.yMid
  }

  isSymbolInRow(source: TOISymbol, target: TOISymbol): boolean
  {
    return Math.abs(source.bounds.yMid - target.bounds.yMid) <= this.rowHeight / 2
  }

  isSymbolBelow(source: TOISymbol, target: TOISymbol): boolean
  {
    return source.bounds.yMid + this.rowHeight / 2 < target.bounds.yMid
  }

  getFirstSymbol(symbols: TOISymbol[]): TOISymbol | undefined
  {
    if (!symbols.length) return
    return symbols.reduce((previous, current) =>
    {
      if (previous) {
        if (Math.round(previous.bounds.yMid / this.rowHeight) < Math.round(current.bounds.yMid / this.rowHeight)) {
          return previous
        }
        else if (Math.round(previous.bounds.yMid / this.rowHeight) == Math.round(current.bounds.yMid / this.rowHeight) && previous.bounds.xMid < current.bounds.xMid) {
          return previous
        }
      }
      return current
    })
  }

  getLastSymbol(symbols: TOISymbol[]): TOISymbol | undefined
  {
    if (!symbols.length) return
    return symbols.reduce((previous, current) =>
    {
      if (previous) {
        if (previous.bounds.yMid - current.bounds.yMid > this.rowHeight / 2) {
          return previous
        }
        if (previous.bounds.yMid - current.bounds.yMid < this.rowHeight / 2) {
          return current
        }
        else if (previous.bounds.xMid > current.bounds.xMid) {
          return previous
        }
      }
      return current
    })
  }

  addSymbol(symbol: TOISymbol): void
  {
    this.#logger.info("addSymbol", { symbol })
    const sIndex = this.symbols.findIndex(s => s.id === symbol.id)
    if (sIndex > -1) {
      throw new Error(`Symbol id already exist: ${ symbol.id }`)
    }
    this.symbols.push(symbol)
    this.modificationDate = Date.now()
    this.converts = undefined
    this.exports = undefined
    this.#logger.debug("addSymbol", this.symbols)
  }

  updateSymbol(updatedSymbol: TOISymbol): void
  {
    this.#logger.info("updateSymbol", { updatedSymbol })
    const sIndex = this.symbols.findIndex(s => s.id === updatedSymbol.id)
    if (sIndex !== -1) {
      updatedSymbol.modificationDate = Date.now()
      this.symbols.splice(sIndex, 1, updatedSymbol)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("updateSymbol", this.symbols)
  }

  replaceSymbol(id: string, symbols: TOISymbol[]): void
  {
    const sIndex = this.symbols.findIndex(s => s.id === id)
    if (sIndex !== -1) {
      this.symbols.splice(sIndex, 1, ...symbols)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
  }

  changeOrderSymbol(id: string, position: "first" | "last" | "forward" | "backward")
  {
    const fromIndex = this.symbols.findIndex(s => s.id === id)
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

  removeSymbol(id: string): void
  {
    this.#logger.info("removeSymbol", { id })
    const symbolIndex = this.symbols.findIndex(s => s.id === id)
    if (symbolIndex !== -1) {
      this.symbols.splice(symbolIndex, 1)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("removeSymbol", this.symbols)
  }

  extractDifferenceSymbols(model: OIModel): { added: TOISymbol[], removed: TOISymbol[] }
  {
    return {
      added: this.symbols.filter(s1 => model.symbols.findIndex(s2 => s1.id === s2.id && s1.modificationDate === s2.modificationDate) === -1),
      removed: model.symbols.filter(s1 => this.symbols.findIndex(s2 => s1.id === s2.id && s1.modificationDate === s2.modificationDate) === -1)
    }
  }

  mergeExport(exports: TExport)
  {
    this.#logger.info("mergeExport", { exports })
    if (this.exports) {
      Object.assign(this.exports, exports)
    } else {
      this.exports = exports
    }
    this.#logger.debug("mergeExport", this.exports)
  }

  clone(): OIModel
  {
    this.#logger.info("clone")
    const clonedModel = new OIModel(this.width, this.height, this.rowHeight, this.creationTime)
    clonedModel.modificationDate = this.modificationDate
    clonedModel.symbols = this.symbols.map(s =>
    {
      const c = s.clone()
      c.selected = false
      return c
    })
    clonedModel.exports = structuredClone(this.exports)
    clonedModel.idle = this.idle
    this.#logger.debug("clone", { clonedModel })
    return clonedModel
  }

  clear(): void
  {
    this.#logger.info("clear")
    this.modificationDate = Date.now()
    this.symbols = []
    this.currentSymbol = undefined
    this.exports = undefined
    this.converts = undefined
    this.idle = true

  }
}
