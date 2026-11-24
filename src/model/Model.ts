import type { TExport } from "@/client"
import type { TPoint, TPointer } from "@/core"
import { computeDistanceSquared, isBetween, mergeExports } from "@/core"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { TPenStyle } from "@/style"
import { Stroke } from "@/symbol"

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
export class Model {
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
  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)

  constructor(width = 100, height = 100, rowHeight = 0, creationDate = Date.now()) {
    this.#logger.info("constructor", {
      width,
      height,
      creationDate,
    })
    this.creationTime = creationDate
    this.modificationDate = creationDate
    this.width = width
    this.height = height
    this.rowHeight = rowHeight
    this.symbols = []
    this.positions = {
      lastSentPosition: 0,
      lastReceivedPosition: 0,
    }
  }

  protected filterPointByAcquisitionDelta(stroke: Stroke, point: TPointer, lastPointer?: TPointer): boolean {
    const delta: number = 2 + (stroke.style["-myscript-pen-width"] || 0) / 4
    return (
      !lastPointer ||
      stroke.pointers.length === 0 ||
      Math.abs(lastPointer.x - point.x) >= delta ||
      Math.abs(lastPointer.y - point.y) >= delta
    )
  }

  getStrokeFromPoint(point: TPoint): Stroke[] {
    this.#logger.info("getStrokeFromPoint", {
      point,
    })
    const _strokeList: Stroke[] = []
    this.symbols.forEach((stroke) => {
      for (let i = 0; i < stroke.pointers.length; i++) {
        const strokePointer = stroke.pointers[i]
        if (
          isBetween(strokePointer.x, point.x - 5, point.x + 5) &&
          isBetween(strokePointer.y, point.y - 5, point.y + 5)
        ) {
          _strokeList.push(stroke)
          break
        } else {
          if (computeDistanceSquared(point, strokePointer) < 100) {
            // 10^2 = 100
            _strokeList.push(stroke)
            break
          }
        }
      }
    })
    this.#logger.debug("getStrokeFromPoint", {
      strokes: _strokeList,
    })
    return _strokeList
  }

  addPoint(stroke: Stroke, pointer: TPointer): void {
    this.#logger.debug("addPoint", {
      stroke,
      pointer,
    })
    const lastPointer = stroke.pointers.at(-1)
    if (this.filterPointByAcquisitionDelta(stroke, pointer, lastPointer)) {
      // `p` stays as the device reported it — see `StrokeUtil.addPointer` for why deriving it from
      // the gap to the previous pointer made thickness depend on the sampling rate.
      stroke.pointers.push(pointer)
      stroke.modificationDate = Date.now()
    }
  }

  addStroke(stroke: Stroke): void {
    this.#logger.info("addStroke", { stroke })
    if (this.symbols.some((s) => s.id === stroke.id)) {
      throw new Error(`Stroke id already exist: ${stroke.id}`)
    }
    this.symbols.push(stroke)
    this.modificationDate = Date.now()
    this.converts = undefined
    this.exports = undefined
  }

  updateStroke(updatedStroke: Stroke): void {
    this.#logger.info("updateStroke", {
      updatedStroke,
    })
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

  removeStroke(id: string): void {
    this.#logger.info("removeStroke", { id })
    const strokeIndex = this.symbols.findIndex((s) => s.id === id)
    if (strokeIndex !== -1) {
      if (strokeIndex < this.positions.lastSentPosition) {
        this.positions.lastSentPosition = Math.max(0, this.positions.lastSentPosition - 1)
      }
      if (strokeIndex < this.positions.lastReceivedPosition) {
        this.positions.lastReceivedPosition = Math.max(0, this.positions.lastReceivedPosition - 1)
      }
      this.symbols.splice(strokeIndex, 1)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("removeStroke", this.symbols)
  }

  removeStrokesFromPoint(point: TPoint): string[] {
    this.#logger.info("removeStrokesFromPoint", {
      point,
    })
    const strokes = this.getStrokeFromPoint(point)
    strokes.forEach((strokeToRemove) => {
      this.removeStroke(strokeToRemove.id)
    })
    this.#logger.debug(
      "removeStrokesFromPoint",
      strokes.map((s) => s.id)
    )
    return strokes.map((s) => s.id)
  }

  extractUnsentStrokes(): Stroke[] {
    return this.symbols.slice(this.positions.lastSentPosition)
  }

  initCurrentStroke(point: TPointer, pointerType: string, style: TPenStyle, dpi = 96): void {
    this.#logger.info("initCurrentStroke", {
      point,
      pointerType,
      style,
      dpi,
    })
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

  appendToCurrentStroke(point: TPointer): void {
    this.#logger.info("appendToCurrentStroke", {
      point,
    })
    if (this.currentSymbol) {
      this.addPoint(this.currentSymbol, point)
    }
    this.#logger.debug("appendToCurrentStroke", this.currentSymbol)
  }

  endCurrentStroke(point: TPointer): void {
    this.#logger.info("endCurrentStroke", {
      point,
    })
    if (this.currentSymbol) {
      this.addPoint(this.currentSymbol, point)
      this.addStroke(this.currentSymbol)
      this.currentSymbol = undefined
    }
    this.#logger.debug("endCurrentStroke", this.currentSymbol)
  }

  updatePositionSent(position: number = this.symbols.length): void {
    this.#logger.info("updatePositionSent", {
      position,
    })
    this.positions.lastSentPosition = position
    this.#logger.debug("updatePositionSent", this.positions.lastSentPosition)
  }

  updatePositionReceived(): void {
    this.#logger.info("updatePositionReceived")
    this.positions.lastReceivedPosition = this.positions.lastSentPosition
    this.#logger.debug("updatePositionReceived", this.positions.lastReceivedPosition)
  }

  mergeExport(exports: TExport) {
    this.#logger.info("mergeExport", { exports })
    this.exports = mergeExports(this.exports, exports)
    this.#logger.debug("mergeExport", this.exports)
  }

  mergeConvert(converts: TExport) {
    this.#logger.info("mergeConvert", {
      converts,
    })
    this.converts = mergeExports(this.converts, converts)
    this.#logger.debug("mergeConvert", this.converts)
  }

  clone(): Model {
    this.#logger.info("clone")
    const clonedModel = new Model(this.width, this.height, this.rowHeight, this.creationTime)
    clonedModel.modificationDate = structuredClone(this.modificationDate)
    clonedModel.currentSymbol = this.currentSymbol ? this.currentSymbol.clone() : undefined
    clonedModel.symbols = this.symbols.map((s) => s.clone())
    clonedModel.positions = structuredClone(this.positions)
    clonedModel.exports = this.exports ? structuredClone(this.exports) : undefined
    clonedModel.converts = this.converts ? structuredClone(this.converts) : undefined
    this.#logger.debug("clone", { clonedModel })
    return clonedModel
  }

  clear(): void {
    this.#logger.info("clear")
    this.modificationDate = Date.now()
    this.currentSymbol = undefined
    this.symbols = []
    this.positions.lastSentPosition = 0
    this.positions.lastReceivedPosition = 0
    this.exports = undefined
    this.converts = undefined
  }
}
