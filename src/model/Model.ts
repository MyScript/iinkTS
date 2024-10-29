import { LoggerClass, LoggerManager } from "../logger"
import { TPenStyle } from "../style"
import { computeDistance } from "../utils"
import { TExport } from "./Export"
import { IModel } from "./IModel"
import { Stroke, TPoint, TPointer } from "../symbol"

/**
 * @group Model
 */
export type TRecognitionPositions = {
  lastSentPosition: number
  lastReceivedPosition: number
}

/**
 * @group Model
 */
export class Model implements IModel
{
  readonly creationTime: number
  modificationDate: number
  positions: TRecognitionPositions
  currentSymbol?: Stroke
  symbols: Stroke[]
  exports?: TExport
  converts?: TExport
  width: number
  height: number
  rowHeight: number
  idle: boolean
  #logger = LoggerManager.getLogger(LoggerClass.MODEL)

  constructor(width = 100, height = 100, rowHeight = 0, creationDate = Date.now())
  {
    this.#logger.info("constructor", { width, height, creationDate })
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

  protected computePressure(distance: number, globalDistance: number): number
  {
    let ratio = 1.0
    if (distance === globalDistance) {
      ratio = 1.0
    } else if (distance < 10) {
      ratio = 0.2 + Math.pow(0.1 * distance, 0.4)
    } else if (distance > globalDistance - 10) {
      ratio = 0.2 + Math.pow(0.1 * (globalDistance - distance), 0.4)
    }
    const pressure = ratio * Math.max(0.1, 1.0 - (0.1 * Math.sqrt(distance)))
    return isNaN(pressure) ? 0.5 : Math.round(pressure * 100) / 100
  }

  protected filterPointByAcquisitionDelta(stroke: Stroke, point: TPointer, lastPointer?: TPointer): boolean
  {
    const delta: number = (2 + ((stroke.style["-myscript-pen-width"] || 0) / 4))
    return !lastPointer ||
      stroke.pointers.length === 0 ||
      Math.abs(lastPointer.x - point.x) >= delta ||
      Math.abs(lastPointer.y - point.y) >= delta
  }

  getStrokeFromPoint(point: TPoint): Stroke[]
  {
    this.#logger.info("getStrokeFromPoint", { point })
    const isBetween = (val: number, min: number, max: number): boolean => (val >= min && val <= max)

    const _strokeList: Stroke[] = []
    this.symbols.forEach((stroke) =>
    {
      for (let i = 0; i < stroke.pointers.length; i++) {
        const strokePointer = stroke.pointers[i]
        if (
          isBetween(strokePointer.x, point.x - 5, point.x + 5) &&
          isBetween(strokePointer.y, point.y - 5, point.y + 5)
        ) {
          _strokeList.push(stroke)
          break
        }
        else {
          if (computeDistance(point, strokePointer) < 10) {
            _strokeList.push(stroke)
            break
          }
        }
      }
    })
    this.#logger.debug("getStrokeFromPoint", { strokes: _strokeList })
    return _strokeList
  }

  addPoint(stroke: Stroke, pointer: TPointer): void
  {
    this.#logger.debug("addPoint", { stroke, pointer })
    const lastPointer = stroke.pointers.at(-1)
    if (this.filterPointByAcquisitionDelta(stroke, pointer, lastPointer)) {
      const distance = lastPointer ? computeDistance(pointer, lastPointer) : 0
      stroke.length += distance
      pointer.p = this.computePressure(distance, stroke.length)
      stroke.pointers.push(pointer)
      stroke.modificationDate = Date.now()
    }
  }

  addStroke(stroke: Stroke): void
  {
    this.#logger.info("addStroke", { stroke })
    this.symbols.push(stroke)
    this.modificationDate = Date.now()
    this.converts = undefined
    this.exports = undefined
  }

  updateStroke(updatedStroke: Stroke): void
  {
    this.#logger.info("updateStroke", { updatedStroke })
    const strokeIndex = this.symbols.findIndex((s: Stroke): boolean => s.id === updatedStroke.id)
    if (strokeIndex !== -1) {
      updatedStroke.modificationDate = Date.now()
      this.symbols.splice(strokeIndex, 1, updatedStroke)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("updateStroke", this.symbols)
  }

  removeStroke(id: string): void
  {
    this.#logger.info("removeStroke", { id })
    const strokeIndex = this.symbols.findIndex(s => s.id === id)
    if (strokeIndex !== -1) {
      this.positions.lastSentPosition--
      this.positions.lastReceivedPosition--
      this.symbols.splice(strokeIndex, 1)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("removeStroke", this.symbols)
  }

  removeStrokesFromPoint(point: TPoint): string[]
  {
    this.#logger.info("removeStrokesFromPoint", { point })
    const strokes = this.getStrokeFromPoint(point)
    strokes.forEach(strokeToRemove =>
    {
      this.removeStroke(strokeToRemove.id)
    })
    this.#logger.debug("removeStrokesFromPoint", strokes.map(s => s.id))
    return strokes.map(s => s.id)
  }

  extractUnsentStrokes(): Stroke[]
  {
    return this.symbols.slice(this.positions.lastSentPosition)
  }

  initCurrentStroke(point: TPointer, pointerType: string, style: TPenStyle, dpi = 96): void
  {
    this.#logger.info("initCurrentStroke", { point, pointerType, style, dpi })
    if (style["-myscript-pen-width"]) {
      const pxWidth = (style["-myscript-pen-width"] * dpi) / 25.4
      style.width = pxWidth / 2
    }
    this.modificationDate = Date.now()
    this.exports = undefined
    this.currentSymbol = new Stroke(style, pointerType)
    this.#logger.debug("initCurrentStroke", this.currentSymbol)
    this.addPoint(this.currentSymbol, point)
  }

  appendToCurrentStroke(point: TPointer): void
  {
    this.#logger.info("appendToCurrentStroke", { point })
    if (this.currentSymbol) {
      this.addPoint(this.currentSymbol, point)
    }
    this.#logger.debug("appendToCurrentStroke", this.currentSymbol)
  }

  endCurrentStroke(point: TPointer): void
  {
    this.#logger.info("endCurrentStroke", { point })
    if (this.currentSymbol) {
      this.addPoint(this.currentSymbol, point)
      this.addStroke(this.currentSymbol)
      this.currentSymbol = undefined
    }
    this.#logger.debug("endCurrentStroke", this.currentSymbol)
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

  mergeConvert(converts: TExport)
  {
    this.#logger.info("mergeConvert", { converts })
    if (this.converts) {
      Object.assign(this.converts, converts)
    } else {
      this.converts = converts
    }
    this.#logger.debug("mergeConvert", this.converts)
  }

  clone(): Model
  {
    this.#logger.info("clone")
    const clonedModel = new Model(this.width, this.height, this.rowHeight, this.creationTime)
    clonedModel.modificationDate = JSON.parse(JSON.stringify(this.modificationDate))
    clonedModel.currentSymbol = this.currentSymbol ? this.currentSymbol.clone() : undefined
    clonedModel.symbols = this.symbols.map(s => s.clone())
    clonedModel.positions = JSON.parse(JSON.stringify(this.positions))
    clonedModel.exports = this.exports ? JSON.parse(JSON.stringify(this.exports)) : undefined
    clonedModel.converts = this.converts ? JSON.parse(JSON.stringify(this.converts)) : undefined
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
