import { TPenStyle } from "../@types/style/PenStyle"
import { TPoint } from "../@types/renderer/Point"
import { TStroke, TStrokeGroup } from "../@types/model/Stroke"
import { IModel, TExport } from "../@types/model/Model"
import { TRecognitionPositions } from "../@types/model/RecognitionPositions"
import { TUpdatePatch } from "../@types/recognizer/WSRecognizer"

import { Stroke } from "./Stroke"

export class Model implements IModel
{
  readonly creationTime: number
  modificationDate: number
  currentStroke?: TStroke
  strokeGroups: TStrokeGroup[]
  positions: TRecognitionPositions
  defaultSymbols: TStroke[]
  rawStrokes: TStroke[]
  selectedStrokes: TStroke[]
  recognizedSymbols?: TUpdatePatch[]
  exports?: TExport
  converts?: TExport
  width: number
  height: number
  idle: boolean

  constructor(width: number, height: number, creationDate: number = new Date().getTime())
  {
    this.rawStrokes = []
    this.strokeGroups = []
    this.selectedStrokes = []
    this.positions = {
      lastSentPosition: -1,
      lastReceivedPosition: -1,
      lastRenderedPosition: -1
    }
    this.defaultSymbols = []
    this.creationTime = creationDate
    this.modificationDate = creationDate
    this.width = width
    this.height = height
    this.idle = true
  }

  mergeExport(exports: TExport) {
    if (this.exports) {
      Object.assign(this.exports, exports)
    } else {
      this.exports = exports
    }
  }

  private computeDistance (point1: TPoint, point2: TPoint): number {
    const distance = Math.sqrt(Math.pow((point1.y - point2.y), 2) + Math.pow((point1.x - point2.x), 2))
    return isNaN(distance) ? 0 : distance
  }

  private computeLength (point1: TPoint, point2: TPoint, lastDistance: number): number {
    const length = lastDistance + this.computeDistance(point1, point2)
    return isNaN(length) ? 0 : length
  }

  private computePressure (point1: TPoint, point2: TPoint, lastDistance: number): number {
    let ratio = 1.0
    const distance = this.computeDistance(point1, point2)
    const length = this.computeLength(point1, point2, lastDistance)

    if (length === 0) {
      ratio = 0.5
    } else if (distance === length) {
      ratio = 1.0
    } else if (distance < 10) {
      ratio = 0.2 + Math.pow(0.1 * distance, 0.4)
    } else if (distance > length - 10) {
      ratio = 0.2 + Math.pow(0.1 * (length - distance), 0.4)
    }
    const pressure = ratio * Math.max(0.1, 1.0 - (0.1 * Math.sqrt(distance)))
    return isNaN(pressure) ? 0.5 : Math.round(pressure * 100) / 100
  }

  private filterPointByAcquisitionDelta(stroke: TStroke, point: TPoint): boolean
  {
    const delta: number = (2 + ((stroke["-myscript-pen-width"] || 0) / 4))
    return stroke.x.length === 0 || stroke.y.length === 0 ||
      Math.abs(stroke.x[stroke.x.length - 1] - point.x) >= delta ||
      Math.abs(stroke.y[stroke.y.length - 1] - point.y) >= delta
  }

  addPoint(stroke: TStroke, point: TPoint): void
  {
    if (this.filterPointByAcquisitionDelta(stroke, point)) {
      const lastPoint: TPoint = {
        x: stroke.x[stroke.x.length -1],
        y: stroke.y[stroke.y.length -1],
        p: stroke.p[stroke.p.length -1],
        t: stroke.t[stroke.t.length -1],
      }
      const lastDistance: number = stroke.l[stroke.l.length - 1]
      stroke.x.push(point.x)
      stroke.y.push(point.y)
      stroke.t.push(point.t)
      stroke.p.push(this.computePressure(point, lastPoint, lastDistance))
      stroke.l.push(this.computeLength(point, lastPoint, lastDistance))
    }
  }

  addStroke(stroke: TStroke): void
  {
    stroke.id = stroke.id || `${new Date().getTime().toString()}-${this.rawStrokes.length}`
    this.rawStrokes.push(stroke)
  }

  extractUnsentStrokes(): TStroke[]
  {
    return this.rawStrokes.slice(this.positions.lastSentPosition)
  }

  addStrokeToGroup(stroke: TStroke, strokePenStyle: TPenStyle): void
  {
    const lastGroup = this.strokeGroups.length - 1

    const isPenStyleEqual = (ps1: TPenStyle, ps2: TPenStyle) => {
      return ps1["-myscript-pen-fill-color"] === ps2["-myscript-pen-fill-color"] &&
        ps1["-myscript-pen-fill-style"] === ps2["-myscript-pen-fill-style"] &&
        ps1["-myscript-pen-width"] === ps2["-myscript-pen-width"] &&
        ps1.color === ps2.color &&
        ps1.width === ps2.width
    }

    if (this.strokeGroups[lastGroup] && isPenStyleEqual(this.strokeGroups[lastGroup].penStyle, strokePenStyle)) {
      stroke.id = stroke.id || `${new Date().getTime().toString()}-${this.strokeGroups[lastGroup].strokes.length}`
      this.strokeGroups[lastGroup].strokes.push(stroke)
    } else {
      stroke.id = stroke.id || `${new Date().getTime().toString()}-0`
      const newStrokeGroup: TStrokeGroup = {
        penStyle: strokePenStyle,
        strokes: [stroke]
      }
      this.strokeGroups.push(newStrokeGroup)
    }
  }

  initCurrentStroke(point: TPoint, pointerId: number, pointerType: string, style: TPenStyle, dpi = 96): void
  {
    if (style["-myscript-pen-width"]) {
      const pxWidth = (style["-myscript-pen-width"] * dpi) / 25.4
      style.width = pxWidth / 2
    }
    this.modificationDate = new Date().getTime()
    this.exports = undefined
    this.converts = undefined
    this.currentStroke = new Stroke(style, pointerId, pointerType)
    this.addPoint(this.currentStroke, point)
  }

  appendToCurrentStroke(point: TPoint): void
  {
    if (this.currentStroke) {
      this.addPoint(this.currentStroke, point)
    }
  }

  endCurrentStroke(point: TPoint, penStyle: TPenStyle): void
  {
    if (this.currentStroke) {
      this.addPoint(this.currentStroke, point)
      // Mutating pending strokes
      this.addStroke(this.currentStroke)
      this.addStrokeToGroup(this.currentStroke, penStyle)
      // Resetting the current stroke to an undefined one
      this.currentStroke = undefined
    }
  }

  #getStrokeFromPoint(point: TPoint): TStroke[]
  {
    const isBetween = (val: number, min: number, max: number): boolean => (val >= min && val <= max)

    const _strokeList: TStroke[] = []
    const x0 = point.x
    const y0 = point.y
    this.rawStrokes.forEach((stroke) => {
      if (_strokeList.some(s => s.id === stroke.id)) {
        return
      }
      for (let i = 0; i < stroke.x.length; i++) {
        if (
          isBetween(stroke.x[i], x0 - 5, x0 + 5) &&
          isBetween(stroke.y[i], y0 - 5, y0 + 5)
        ) {
          _strokeList.push(stroke)
          break
        }
        else {
          const x1 = stroke.x[i - 1]
          const y1 = stroke.y[i - 1]
          const x2 = stroke.x[i]
          const y2 = stroke.y[i]
          const xAlpha = (x0 - x1) / (x2 - x1)
          const yAlpha = (y0 - y1) / (y2 - y1)
          if (isBetween(xAlpha, 0, 1) && isBetween(yAlpha, 0, 1)) {
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
      .forEach(s => {
        if (!this.selectedStrokes.includes(s)) {
          this.selectedStrokes.push(s)
        }
      })
  }

  removeStrokesFromPoint(point: TPoint): number
  {
    const strokes = this.#getStrokeFromPoint(point)
    strokes.forEach(strokeToRemove => {
      this.strokeGroups.forEach((group) => {
        const strokeIndex = group.strokes.findIndex((s: TStroke): boolean => s.id === strokeToRemove.id)
        if (strokeIndex !== -1) {
          group.strokes.splice(strokeIndex, 1)
        }
      })
      const strokeIndex = this.rawStrokes.findIndex((s: TStroke): boolean => s.id === strokeToRemove.id)
      if (strokeIndex !== -1) {
        this.rawStrokes.splice(strokeIndex, 1)
      }
    })
    return strokes.length
  }

  extractPendingRecognizedSymbols (position: number = this.positions.lastRenderedPosition + 1): TUpdatePatch[]
  {
    return this.recognizedSymbols ? this.recognizedSymbols.slice(position) : []
  }

  updatePositionSent(position: number = this.rawStrokes.length - 1): void
  {
    this.positions.lastSentPosition = position
  }

  updatePositionReceived(): void
  {
    this.positions.lastReceivedPosition = this.positions.lastSentPosition
  }

  updatePositionRendered(position: number = this.recognizedSymbols ? this.recognizedSymbols.length - 1 : -1): void
  {
    this.positions.lastRenderedPosition = position
  }

  resetPositionRenderer(): void
  {
    this.positions.lastRenderedPosition = -1
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
    clonedModel.defaultSymbols = JSON.parse(JSON.stringify(this.defaultSymbols))
    clonedModel.currentStroke = this.currentStroke ? JSON.parse(JSON.stringify(this.currentStroke)) : undefined
    clonedModel.rawStrokes = JSON.parse(JSON.stringify(this.rawStrokes))
    clonedModel.strokeGroups = JSON.parse(JSON.stringify(this.strokeGroups))
    clonedModel.positions = JSON.parse(JSON.stringify(this.positions))
    clonedModel.exports = this.exports ? JSON.parse(JSON.stringify(this.exports)) : undefined
    clonedModel.converts = this.converts ? JSON.parse(JSON.stringify(this.converts)) : undefined
    clonedModel.recognizedSymbols = this.recognizedSymbols ? JSON.parse(JSON.stringify(this.recognizedSymbols)) : undefined
    clonedModel.idle = this.idle
    return clonedModel
  }

  clear(): void
  {
    this.modificationDate = new Date().getTime()
    this.currentStroke = undefined
    this.rawStrokes = []
    this.strokeGroups = []
    this.positions.lastSentPosition = -1
    this.positions.lastReceivedPosition = -1
    this.positions.lastRenderedPosition = -1
    this.recognizedSymbols = undefined
    this.exports = undefined
    this.converts = undefined
    this.idle = true
  }
}
