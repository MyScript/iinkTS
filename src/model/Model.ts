import { LoggerClass } from "../Constants"
import { LoggerManager } from "../logger"
import { TPenStyle } from "../style"
import { TPoint, TPointer, computeDistance } from "../utils"
import { TExport } from "./Export"
import { IModel, TRecognitionPositions } from "./IModel"
import { Stroke, TStroke } from "./Stroke"

/**
 * @group Model
 */
export class Model implements IModel
{
  readonly creationTime: number
  modificationDate: number
  currentStroke?: TStroke
  positions: TRecognitionPositions
  strokes: TStroke[]
  selectedStrokes: TStroke[]
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
    this.strokes = []
    this.selectedStrokes = []
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

  protected filterPointByAcquisitionDelta(stroke: TStroke, point: TPointer, lastPointer: TPointer): boolean
  {
    const delta: number = (2 + ((stroke.style["-myscript-pen-width"] || 0) / 4))
    return !lastPointer ||
      stroke.pointers.length === 0 ||
      Math.abs(lastPointer.x - point.x) >= delta ||
      Math.abs(lastPointer.y - point.y) >= delta
  }

  getStrokeFromPoint(point: TPoint): TStroke[]
  {
    this.#logger.info("getStrokeFromPoint", { point })
    const isBetween = (val: number, min: number, max: number): boolean => (val >= min && val <= max)

    const _strokeList: TStroke[] = []
    this.strokes.forEach((stroke) =>
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

  addPoint(stroke: TStroke, pointer: TPointer): void
  {
    this.#logger.debug("addPoint", { stroke, pointer })
    const lastPointer: TPointer = stroke.pointers.at(-1) || { p: 1, t: 0, x: 0, y: 0 }
    if (this.filterPointByAcquisitionDelta(stroke, pointer, lastPointer)) {
      const distance = computeDistance(pointer, lastPointer)
      stroke.length += distance
      pointer.p = this.computePressure(distance, stroke.length)
      stroke.pointers.push(pointer)
      stroke.modificationDate = Date.now()
    }
  }

  addStroke(stroke: TStroke): void
  {
    this.#logger.info("addStroke", { stroke })
    this.strokes.push(stroke)
    this.modificationDate = Date.now()
    this.converts = undefined
    this.exports = undefined
  }

  updateStroke(updatedStroke: TStroke): void
  {
    this.#logger.info("updateStroke", { updatedStroke })
    const strokeIndex = this.strokes.findIndex((s: TStroke): boolean => s.id === updatedStroke.id)
    if (strokeIndex !== -1) {
      updatedStroke.modificationDate = Date.now()
      this.strokes.splice(strokeIndex, 1, updatedStroke)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("updateStroke", this.strokes)
  }

  removeStroke(id: string): void
  {
    this.#logger.info("removeStroke", { id })
    const strokeIndex = this.strokes.findIndex(s => s.id === id)
    if (strokeIndex !== -1) {
      this.positions.lastSentPosition--
      this.positions.lastReceivedPosition--
      this.strokes.splice(strokeIndex, 1)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("removeStroke", this.strokes)
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

  extractUnsentStrokes(): TStroke[]
  {
    return this.strokes.slice(this.positions.lastSentPosition)
  }

  extractDifferenceStrokes(model: IModel): { newStrokes: TStroke[], deletedStrokes: TStroke[]}
  {
    const newStrokes = this.strokes.filter(s1 => model.strokes.findIndex(s2 => s1.id === s2.id && s1.modificationDate === s2.modificationDate) === -1)
    const deletedStrokes = model.strokes.filter(s1 => this.strokes.findIndex(s2 => s1.id === s2.id && s1.modificationDate === s2.modificationDate) === -1)
    return {
      newStrokes,
      deletedStrokes
    }
  }

  initCurrentStroke(point: TPointer, pointerId: number, pointerType: string, style: TPenStyle, dpi = 96): void
  {
    this.#logger.info("initCurrentStroke", { point, pointerId, pointerType, style, dpi })
    if (style["-myscript-pen-width"]) {
      const pxWidth = (style["-myscript-pen-width"] * dpi) / 25.4
      style.width = pxWidth / 2
    }
    this.modificationDate = Date.now()
    this.exports = undefined
    this.currentStroke = new Stroke(style, pointerId, pointerType)
    this.#logger.debug("initCurrentStroke", this.currentStroke)
    this.addPoint(this.currentStroke, point)
  }

  appendToCurrentStroke(point: TPointer): void
  {
    this.#logger.info("appendToCurrentStroke", { point })
    if (this.currentStroke) {
      this.addPoint(this.currentStroke, point)
    }
    this.#logger.debug("appendToCurrentStroke", this.currentStroke)
  }

  endCurrentStroke(point: TPointer): void
  {
    this.#logger.info("endCurrentStroke", { point })
    if (this.currentStroke) {
      this.addPoint(this.currentStroke, point)
      this.addStroke(this.currentStroke)
      this.currentStroke = undefined
    }
    this.#logger.debug("endCurrentStroke", this.currentStroke)
  }

  updatePositionSent(position: number = this.strokes.length): void
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

  getClone(): Model
  {
    this.#logger.info("getClone")
    const clonedModel = new Model(this.width, this.height, this.rowHeight, this.creationTime)
    clonedModel.modificationDate = JSON.parse(JSON.stringify(this.modificationDate))
    clonedModel.currentStroke = this.currentStroke ? JSON.parse(JSON.stringify(this.currentStroke)) : undefined
    clonedModel.strokes = JSON.parse(JSON.stringify(this.strokes))
    clonedModel.positions = JSON.parse(JSON.stringify(this.positions))
    clonedModel.exports = this.exports ? JSON.parse(JSON.stringify(this.exports)) : undefined
    clonedModel.idle = this.idle
    this.#logger.debug("getClone", { clonedModel })
    return clonedModel
  }

  clear(): void
  {
    this.#logger.info("clear")
    this.modificationDate = Date.now()
    this.currentStroke = undefined
    this.strokes = []
    this.positions.lastSentPosition = 0
    this.positions.lastReceivedPosition = 0
    this.exports = undefined
    this.converts = undefined
    this.idle = true
  }
}
