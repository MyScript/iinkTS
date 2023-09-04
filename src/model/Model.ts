import { TPenStyle } from "../@types/style/PenStyle"
import { TPoint, TPointer } from "../@types/geometry"
import { TStroke } from "../@types/model/Stroke"
import { IModel, TExport } from "../@types/model/Model"
import { TRecognitionPositions } from "../@types/model/RecognitionPositions"

import { computeDistance } from "../utils/geometricHelper"
import { Stroke } from "./Stroke"

export class Model implements IModel
{
  readonly creationTime: number
  modificationDate: number
  currentStroke?: TStroke
  positions: TRecognitionPositions
  rawStrokes: TStroke[]
  selectedStrokes: TStroke[]
  exports?: TExport
  converts?: TExport
  width: number
  height: number
  idle: boolean

  constructor(width = 100, height = 100, creationDate: number = Date.now())
  {
    this.creationTime = creationDate
    this.modificationDate = creationDate
    this.width = width
    this.height = height
    this.rawStrokes = []
    this.selectedStrokes = []
    this.positions = {
      lastSentPosition: -1,
      lastReceivedPosition: -1
    }
    this.idle = true
  }

  mergeExport(exports: TExport)
  {
    if (this.exports) {
      Object.assign(this.exports, exports)
    } else {
      this.exports = exports
    }
  }

  mergeConvert(converts: TExport)
  {
    if (this.converts) {
      Object.assign(this.converts, converts)
    } else {
      this.converts = converts
    }
  }

  private computePressure(distance: number, globalDistance: number): number
  {
    let ratio = 1.0
    if (globalDistance === 0) {
      ratio = 0.5
    } else if (distance === globalDistance) {
      ratio = 1.0
    } else if (distance < 10) {
      ratio = 0.2 + Math.pow(0.1 * distance, 0.4)
    } else if (distance > globalDistance - 10) {
      ratio = 0.2 + Math.pow(0.1 * (globalDistance - distance), 0.4)
    }
    const pressure = ratio * Math.max(0.1, 1.0 - (0.1 * Math.sqrt(distance)))
    return isNaN(pressure) ? 0.5 : Math.round(pressure * 100) / 100
  }

  private filterPointByAcquisitionDelta(stroke: TStroke, point: TPointer, lastPointer: TPointer): boolean
  {
    const delta: number = (2 + ((stroke.style["-myscript-pen-width"] || 0) / 4))
    return !lastPointer ||
      stroke.pointers.length === 0 ||
      Math.abs(lastPointer.x - point.x) >= delta ||
      Math.abs(lastPointer.y - point.y) >= delta
  }

  addPoint(stroke: TStroke, pointer: TPointer): void
  {
    const lastPointer: TPointer = stroke.pointers.at(-1) || { p: 1, t: 0, x: 0, y: 0 }
    if (this.filterPointByAcquisitionDelta(stroke, pointer, lastPointer)) {
      const distance = computeDistance(pointer, lastPointer)
      stroke.length += distance
      pointer.p = this.computePressure(distance, stroke.length)
      stroke.pointers.push(pointer)
    }
  }

  addStroke(stroke: TStroke): void
  {
    this.rawStrokes.push(stroke)
  }

  extractUnsentStrokes(): TStroke[]
  {
    return this.rawStrokes.slice(this.positions.lastSentPosition)
  }

  initCurrentStroke(point: TPointer, pointerId: number, pointerType: string, style: TPenStyle, dpi = 96): void
  {
    if (style["-myscript-pen-width"]) {
      const pxWidth = (style["-myscript-pen-width"] * dpi) / 25.4
      style.width = pxWidth / 2
    }
    this.modificationDate = Date.now()
    this.exports = undefined
    this.converts = undefined
    this.currentStroke = new Stroke(style, pointerId, pointerType)
    this.addPoint(this.currentStroke, point)
  }

  appendToCurrentStroke(point: TPointer): void
  {
    if (this.currentStroke) {
      this.addPoint(this.currentStroke, point)
    }
  }

  endCurrentStroke(point: TPointer): void
  {
    if (this.currentStroke) {
      this.addPoint(this.currentStroke, point)
      this.addStroke(this.currentStroke)
      this.currentStroke = undefined
    }
  }

  #getStrokeFromPoint(point: TPoint): TStroke[]
  {
    const isBetween = (val: number, min: number, max: number): boolean => (val >= min && val <= max)

    const _strokeList: TStroke[] = []
    this.rawStrokes.forEach((stroke) =>
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
    return _strokeList
  }

  resetSelectedStrokes(): void
  {
    this.selectedStrokes = []
  }

  appendSelectedStrokesFromPoint(point: TPoint): void
  {
    this.#getStrokeFromPoint(point)
      .forEach(s =>
      {
        if (!this.selectedStrokes.includes(s)) {
          this.selectedStrokes.push(s)
        }
      })
  }

  updateStroke(updatedStroke: TStroke): void
  {
    const strokeIndex = this.rawStrokes.findIndex((s: TStroke): boolean => s.id === updatedStroke.id)
    if (strokeIndex !== -1) {
      this.rawStrokes.splice(strokeIndex, 1, updatedStroke)
    }
  }

  removeStroke(id: string): void
  {
    const strokeIndex = this.rawStrokes.findIndex((s: TStroke): boolean => s.id === id)
    if (strokeIndex !== -1) {
      this.rawStrokes.splice(strokeIndex, 1)
    }
  }

  removeStrokesFromPoint(point: TPoint): string[]
  {
    const strokes = this.#getStrokeFromPoint(point)
    strokes.forEach(strokeToRemove =>
    {
      this.removeStroke(strokeToRemove.id)
    })
    return strokes.map(s => s.id)
  }

  updatePositionSent(position: number = this.rawStrokes.length - 1): void
  {
    this.positions.lastSentPosition = position
  }

  updatePositionReceived(): void
  {
    this.positions.lastReceivedPosition = this.positions.lastSentPosition
  }

  resetPositions(): void
  {
    this.positions.lastSentPosition = -1
    this.positions.lastReceivedPosition = -1
  }

  getClone(): IModel
  {
    const clonedModel = new Model(this.width, this.height, this.creationTime)
    clonedModel.modificationDate = JSON.parse(JSON.stringify(this.modificationDate))
    clonedModel.currentStroke = this.currentStroke ? JSON.parse(JSON.stringify(this.currentStroke)) : undefined
    clonedModel.rawStrokes = JSON.parse(JSON.stringify(this.rawStrokes))
    clonedModel.positions = JSON.parse(JSON.stringify(this.positions))
    clonedModel.exports = this.exports ? JSON.parse(JSON.stringify(this.exports)) : undefined
    clonedModel.converts = this.converts ? JSON.parse(JSON.stringify(this.converts)) : undefined
    clonedModel.idle = this.idle
    return clonedModel
  }

  clear(): void
  {
    this.modificationDate = Date.now()
    this.currentStroke = undefined
    this.rawStrokes = []
    this.positions.lastSentPosition = -1
    this.positions.lastReceivedPosition = -1
    this.exports = undefined
    this.converts = undefined
    this.idle = true
  }
}
