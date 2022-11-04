import { TPenStyle } from '../@types/style/PenStyle'
import { TPoint } from '../@types/renderer/Point'
import { TStroke, TStrokeGroup } from '../@types/stroker/Stroker'
import { IModel, TExport, TRawResults } from '../@types/model/Model'
import { TRecognitionPositions } from '../@types/model/RecognitionPositions'
import { Stroke } from './Stroke'

export class Model implements IModel
{
  readonly creationTime: number
  modificationDate: number
  currentStroke?: TStroke
  strokeGroups: TStrokeGroup[]
  positions: TRecognitionPositions
  defaultSymbols: TStroke[]
  rawStrokes: TStroke[]
  recognizedSymbols?: TStroke[]
  rawResults: TRawResults
  exports?: TExport
  width: number
  height: number
  idle: boolean
  isEmpty: boolean

  constructor(width: number, height: number, creationDate: number = new Date().getTime())
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
    this.creationTime = creationDate
    this.modificationDate = creationDate
    this.width = width
    this.height = height
    this.idle = true
    this.isEmpty = true
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
    const delta: number = (2 + (stroke['-myscript-pen-width'] / 4))
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
    this.isEmpty = false
  }

  initCurrentStroke(point: TPoint, pointerId: number, pointerType: string, style: TPenStyle, dpi = 96): void
  {
    if (style['-myscript-pen-width']) {
      const pxWidth = (style['-myscript-pen-width'] * dpi) / 25.4
      style.width = pxWidth / 2
    }
    this.modificationDate = new Date().getTime()
    this.exports = undefined
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
    const clonedModel = new Model(this.width, this.height, this.creationTime)
    clonedModel.modificationDate = JSON.parse(JSON.stringify(this.modificationDate))
    clonedModel.defaultSymbols = JSON.parse(JSON.stringify(this.defaultSymbols))
    clonedModel.currentStroke = this.currentStroke ? JSON.parse(JSON.stringify(this.currentStroke)) : undefined
    clonedModel.rawStrokes = JSON.parse(JSON.stringify(this.rawStrokes))
    clonedModel.strokeGroups = JSON.parse(JSON.stringify(this.strokeGroups))
    clonedModel.positions = JSON.parse(JSON.stringify(this.positions))
    clonedModel.exports = this.exports ? JSON.parse(JSON.stringify(this.exports)) : undefined
    clonedModel.rawResults.convert = this.rawResults.convert ? JSON.parse(JSON.stringify(this.rawResults.convert)) : undefined
    clonedModel.rawResults.exports = this.rawResults.exports ? JSON.parse(JSON.stringify(this.rawResults.exports)) : undefined
    clonedModel.recognizedSymbols = this.recognizedSymbols ? JSON.parse(JSON.stringify(this.recognizedSymbols)) : undefined
    clonedModel.idle = this.idle
    clonedModel.isEmpty = this.isEmpty
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
    this.rawResults.convert = undefined
    this.rawResults.exports = undefined
    this.idle = true
    this.isEmpty = true
  }
}
