

import { TPenStyle } from '../@types/style/PenStyle'
import { TPoint } from '../@types/renderer/Point'
import { TStroke, TStrokeGroup } from '../@types/stroker/Stroker'
import { IModel, TExport, TRawResults } from '../@types/model/Model'
import { TRecognitionPositions } from '../@types/model/RecognitionPositions'
import { Stroke } from './Stroke'

export class Model implements IModel
{
  readonly creationTime: number
  modificationTime?: number
  currentStroke?: TStroke
  strokeGroups: TStrokeGroup[]
  positions: TRecognitionPositions
  defaultSymbols: TStroke[]
  rawStrokes: TStroke[]
  recognizedSymbols?: TStroke[]
  rawResults: TRawResults
  exports?: TExport
  width?: number
  height?: number
  idle: boolean


  constructor(width?: number, height?: number)
  {
    this.rawStrokes = []
    this.strokeGroups = []
    this.positions = {
      lastSentPosition: -1,
      lastReceivedPosition: -1,
      lastRenderedPosition: -1
    }
    this.defaultSymbols = []
    this.rawResults = {
      convert: undefined,
      exports: undefined
    }
    this.creationTime = new Date().getTime()
    this.width = width
    this.height = height
    this.idle = true
  }

  private filterPointByAcquisitionDelta(stroke: TStroke, point: TPoint): boolean
  {
    const delta: number = (2 + (stroke['-myscript-pen-width'] / 4))
    return stroke.x.length === 0 || stroke.y.length === 0 ||
      Math.abs(stroke.x[stroke.x.length - 1] - point.x) >= delta ||
      Math.abs(stroke.y[stroke.y.length - 1] - point.y) >= delta
  }

  addPoint(stroke: TStroke, point: TPoint): void
  {
    if (this.filterPointByAcquisitionDelta(stroke, point)) {
      stroke.x.push(point.x)
      stroke.y.push(point.y)
      stroke.t.push(point.t)
      stroke.p.push(point.p)
    }
  }

  addStroke(stroke: TStroke): void
  {
    this.rawStrokes.push(stroke)
  }

  extractPendingStrokes(position?: number): TStroke[]
  {
    position = position || this.positions.lastReceivedPosition + 1
    return this.rawStrokes.slice(position)
  }

  addStrokeToGroup(stroke: TStroke, strokePenStyle: TPenStyle): void
  {
    const lastGroup = this.strokeGroups.length - 1

    const isPenStyleEqual = (ps1: TPenStyle, ps2: TPenStyle) => {
      return ps1['-myscript-pen-fill-color'] === ps2['-myscript-pen-fill-color'] &&
        ps1['-myscript-pen-fill-style'] === ps2['-myscript-pen-fill-style'] &&
        ps1['-myscript-pen-width'] === ps2['-myscript-pen-width'] &&
        ps1.color === ps2.color &&
        ps1.width === ps2.width
    }

    if (this.strokeGroups[lastGroup] && isPenStyleEqual(this.strokeGroups[lastGroup].penStyle, strokePenStyle)) {
      this.strokeGroups[lastGroup].strokes.push(stroke)
    } else {
      const newStrokeGroup: TStrokeGroup = {
        penStyle: strokePenStyle,
        strokes: [stroke]
      }
      this.strokeGroups.push(newStrokeGroup)
    }
  }

  initCurrentStroke(point: TPoint, pointerId: number, pointerType: string, style: TPenStyle, dpi = 96): void
  {
    if (style['-myscript-pen-width']) {
      const pxWidth = (style['-myscript-pen-width'] * dpi) / 25.4
      style.width = pxWidth / 2
    }
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
    const clonedModel = new Model(this.width, this.height)
    clonedModel.defaultSymbols = [...this.defaultSymbols]
    clonedModel.currentStroke = this.currentStroke ? Object.assign({}, this.currentStroke) : undefined
    clonedModel.rawStrokes = [...this.rawStrokes]
    clonedModel.strokeGroups = [...this.strokeGroups]
    clonedModel.positions = Object.assign({}, this.positions)
    clonedModel.exports = this.exports ? Object.assign({}, this.exports) : undefined
    clonedModel.rawResults = Object.assign({}, this.rawResults)
    clonedModel.recognizedSymbols = this.recognizedSymbols ? [...this.recognizedSymbols] : undefined
    clonedModel.height = this.height
    clonedModel.width = this.width
    return clonedModel
  }

  clear(): void
  {
    this.currentStroke = undefined
    this.rawStrokes = []
    this.strokeGroups = []
    this.positions.lastSentPosition = -1
    this.positions.lastReceivedPosition = -1
    this.positions.lastRenderedPosition = -1
    this.recognizedSymbols = undefined
    this.exports = undefined
    this.rawResults.convert = undefined
    this.rawResults.exports = undefined
  }
}
