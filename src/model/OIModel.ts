import { LoggerClass, WriteTool } from "../Constants"
import { LoggerManager } from "../logger"
import
{
  OIEdgeLine,
  OIShapeCircle,
  OIShapeParallelogram,
  OIShapeRectangle,
  OIShapeTriangle,
  OIStroke,
  ShapeKind,
  SymbolType,
  TOIEdge,
  TOISymbol,
  TPoint,
  TPointer,
  TOIShape,
  EdgeDecoration,
  EdgeKind,
  OIShapeEllipse,
  TOIDecorator,
  TOISymbolDecorable,
} from "../primitive"
import { TStyle } from "../style"
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
  currentSymbolOrigin?: TPoint
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
    this.idle = true
  }

  get symbolsSelected(): TOISymbol[]
  {
    return this.symbols.filter(s => s.selected)
  }

  get symbolsToDelete(): TOISymbol[]
  {
    return this.symbols.filter(s => s.toDelete)
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
        s.toDelete = true
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

  createCurrentSymbol(tool: WriteTool, pointer: TPointer, style: TStyle, pointerId: number, pointerType: string): TOISymbol
  {
    this.#logger.info("initCurrentStroke", { tool, pointer, style, pointerId, pointerType })
    this.currentSymbolOrigin = pointer
    switch (tool) {
      case WriteTool.Pencil:
        this.currentSymbol = new OIStroke(style, pointerId, pointerType)
        break
      case WriteTool.Rectangle:
        this.currentSymbol = OIShapeRectangle.createFromLine(style, pointer, pointer)
        break
      case WriteTool.Circle:
        this.currentSymbol = OIShapeCircle.createFromLine(style, pointer, pointer)
        break
      case WriteTool.Ellipse:
        this.currentSymbol = OIShapeEllipse.createFromLine(style, pointer, pointer)
        break
      case WriteTool.Triangle:
        this.currentSymbol = OIShapeTriangle.createFromLine(style, pointer, pointer)
        break
      case WriteTool.Parallelogram:
        this.currentSymbol = OIShapeParallelogram.createFromLine(style, pointer, pointer)
        break
      case WriteTool.Line:
      case WriteTool.Arrow:
      case WriteTool.DoubleArrow: {
        let startDecoration, endDecoration
        if (tool === WriteTool.Arrow) {
          endDecoration = EdgeDecoration.Arrow
        }
        else if (tool === WriteTool.DoubleArrow) {
          startDecoration = EdgeDecoration.Arrow
          endDecoration = EdgeDecoration.Arrow
        }
        this.currentSymbol = new OIEdgeLine(style, pointer, pointer, startDecoration, endDecoration)
        break
      }
      default:
        throw new Error(`Can't create symbol, tool is unknow: "${ tool }"`)
        break
    }
    return this.updateCurrentSymbol(pointer)
  }

  updateCurrentSymbolShape(pointer: TPointer): void
  {
    if (!this.currentSymbol) {
      throw new Error("Can't update current symbol because currentSymbol is undefined")
    }
    const shape = this.currentSymbol as TOIShape
    switch (shape.kind) {
      case ShapeKind.Rectangle:
        OIShapeRectangle.updateFromLine(shape as OIShapeRectangle, this.currentSymbolOrigin!, pointer)
        break
      case ShapeKind.Circle:
        OIShapeCircle.updateFromLine(shape as OIShapeCircle, this.currentSymbolOrigin!, pointer)
        break
      case ShapeKind.Ellipse:
        OIShapeEllipse.updateFromLine(shape as OIShapeEllipse, this.currentSymbolOrigin!, pointer)
        break
      case ShapeKind.Triangle:
        OIShapeTriangle.updateFromLine(shape as OIShapeTriangle, this.currentSymbolOrigin!, pointer)
        break
      case ShapeKind.Parallelogram:
        OIShapeParallelogram.updateFromLine(shape as OIShapeParallelogram, this.currentSymbolOrigin!, pointer)
        break
      default:
        break
    }
  }

  updateCurrentSymbolEdge(pointer: TPointer): void
  {
    if (!this.currentSymbol) {
      throw new Error("Can't update current symbol because currentSymbol is undefined")
    }
    const edge = this.currentSymbol as TOIEdge
    switch (edge.kind) {
      case EdgeKind.Line:
        (this.currentSymbol as OIEdgeLine).end = pointer
        break
      default:
        break
    }
  }

  updateCurrentSymbol(pointer: TPointer): TOISymbol
  {
    this.#logger.info("updateCurrentSymbol", { pointer })
    if (!this.currentSymbol) {
      throw new Error("Can't update current symbol because currentSymbol is undefined")
    }

    switch (this.currentSymbol.type) {
      case SymbolType.Stroke:
        (this.currentSymbol as OIStroke).addPointer(pointer)
        break
      case SymbolType.Shape:
        this.updateCurrentSymbolShape(pointer)
        break
      case SymbolType.Edge:
        this.updateCurrentSymbolEdge(pointer)
        break
    }
    this.modificationDate = Date.now()
    this.exports = undefined
    return this.currentSymbol
  }

  getSymbolRowIndex(symbol: TOISymbol): number
  {
    return Math.round(symbol.boundingBox.yMiddle / this.rowHeight)
  }

  getSymbolInRowOrdered(rowIndex: number): TOISymbol[]
  {
    return this.symbols.filter(s => this.getSymbolRowIndex(s) === rowIndex)
      .sort((s1, s2) => s1.boundingBox.xMiddle - s2.boundingBox.xMiddle)
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
      r.symbols.sort((s1, s2) => s1.boundingBox.xMiddle - s2.boundingBox.xMiddle)
    })
    return rows.sort((r1, r2) => r1.index - r2.index)
  }

  getLastSymbolInRow(rowIndex: number): TOISymbol | undefined
  {
    return this.getSymbolInRowOrdered(rowIndex).at(-1)
  }

  endCurrentSymbol(pointer: TPointer): TOISymbol
  {
    this.#logger.info("endCurrentStroke", { pointer })
    const symbol = this.updateCurrentSymbol(pointer)
    this.currentSymbol = undefined
    this.currentSymbolOrigin = undefined
    return symbol
  }

  addSymbol(symbol: TOISymbol): void
  {
    this.#logger.info("addSymbol", { symbol })
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

  removeSymbol(id: string): string[]
  {
    this.#logger.info("removeSymbol", { id })
    const idsDeleted: string[] = []
    const symbolIndex = this.symbols.findIndex(s => s.id === id)
    if (symbolIndex !== -1) {
      idsDeleted.push(id)
      const sym = this.symbols.at(symbolIndex) as TOISymbol
      if ([SymbolType.Stroke.toString(), SymbolType.Text.toString()].includes(sym.type)) {
        const stroke = sym as OIStroke
        stroke.decorators.forEach(d =>
        {
          const decIndex = this.symbols.findIndex(s => s.id === d.id)
          if (decIndex > -1) {
            idsDeleted.push(d.id)
            this.symbols.splice(decIndex, 1)
          }
        })
      }
      else if (sym.type === SymbolType.Decorator.toString()) {
        const deco = sym as TOIDecorator
        deco.parents.forEach(p =>
        {
          const decorable = p as TOISymbolDecorable
          const decIndex = decorable.decorators.findIndex(s => s.id === deco.id)
          if (decIndex > -1) {
            decorable.decorators.splice(decIndex, 1)
            this.updateSymbol(p)
          }
        })
      }
      this.positions.lastSentPosition--
      this.positions.lastReceivedPosition--
      this.symbols.splice(symbolIndex, 1)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("removeSymbol", this.symbols)
    return idsDeleted
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
    clonedModel.currentSymbol = this.currentSymbol ? this.currentSymbol.clone() : undefined
    clonedModel.symbols = this.symbols.map(s => s.clone())
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
    this.currentSymbol = undefined
    this.symbols = []
    this.positions.lastSentPosition = 0
    this.positions.lastReceivedPosition = 0
    this.exports = undefined
    this.converts = undefined
    this.idle = true

  }
}
