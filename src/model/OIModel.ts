import { LoggerClass } from "../Constants"
import { LoggerManager } from "../logger"
import
{
  OIStroke,
  SymbolType,
  TOISymbol,
  TPoint,
} from "../primitive"
import { TExport } from "./Export"
import { IModel, TRecognitionPositions } from "./IModel"

/**
 * @group Model
 */
export class OIModel implements IModel
{
  #logger = LoggerManager.getLogger(LoggerClass.MODEL)
  readonly creationTime: number
  modificationDate: number
  positions: TRecognitionPositions
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
    this.positions = {
      lastSentPosition: 0,
      lastReceivedPosition: 0
    }
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
    const symbol = this.symbols.find(s => s.id === id)
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

  getSymbolRowIndex(symbol: TOISymbol): number
  {
    return Math.round(symbol.boundingBox.yMid / this.rowHeight)
  }

  getSymbolInRowOrdered(rowIndex: number): TOISymbol[]
  {
    return this.symbols.filter(s => this.getSymbolRowIndex(s) === rowIndex)
      .sort((s1, s2) => s1.boundingBox.xMid - s2.boundingBox.xMid)
  }

  getSymbolsByRowOrdered(): { index: number, symbols: TOISymbol[] }[]
  {
    const rows: { index: number, symbols: TOISymbol[] }[] = []
    this.symbols.forEach(s =>
    {
      const rowIndex = this.getSymbolRowIndex(s)
      const row = rows.find(r => r.index === rowIndex)
      if (row) {
        row.symbols.push(s)
      }
      else {
        rows.push({ index: rowIndex, symbols: [s] })
      }
    })
    rows.forEach(r =>
    {
      r.symbols.sort((s1, s2) => s1.boundingBox.xMid - s2.boundingBox.xMid)
    })
    return rows.sort((r1, r2) => r1.index - r2.index)
  }

  addSymbol(symbol: TOISymbol): void
  {
    this.#logger.info("addSymbol", { symbol })
    const sIndex = this.symbols.findIndex(s => s.id === symbol.id)
    if (sIndex > -1) {
      throw new Error(`Symbol id already exist: ${symbol.id}`)
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
      this.positions.lastSentPosition--
      this.positions.lastReceivedPosition--
      this.symbols.splice(symbolIndex, 1)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("removeSymbol", this.symbols)
  }

  updatePositionSent(position: number = this.symbols.length): void
  {
    this.#logger.info("updatePositionSent", { position })
    this.positions.lastSentPosition = position
    this.#logger.debug("updatePositionSent", this.positions.lastSentPosition)
  }

  updatePositionReceived(): void
  {
    this.#logger.info("updatePositionReceived")
    this.positions.lastReceivedPosition = this.positions.lastSentPosition
    this.#logger.debug("updatePositionReceived", this.positions.lastReceivedPosition)
  }

  extractUnsentStrokes(): OIStroke[]
  {
    return this.symbols.slice(this.positions.lastSentPosition).filter(s => s.type === SymbolType.Stroke) as OIStroke[]
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
    clonedModel.symbols = this.symbols.map(s => {
      const c = s.clone()
      c.selected = false
      return c
    })
    clonedModel.positions = structuredClone(this.positions)
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
    this.positions.lastSentPosition = 0
    this.positions.lastReceivedPosition = 0
    this.currentSymbol = undefined
    this.exports = undefined
    this.converts = undefined
    this.idle = true

  }
}
