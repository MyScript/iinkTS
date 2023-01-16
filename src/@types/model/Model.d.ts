import { TPoint } from "../renderer/Point"
import { TStroke, TStrokeGroup } from "./Stroke"
import { TPenStyle } from "../style/PenStyle"
import { TRecognitionPositions } from "./RecognitionPositions"

export type TWordExport = {
  id?: string
  label: string,
  candidates?: string[]
}

export type TJIIXExport = {
  id: string,
  label: string,
  version: string,
  words: TWordExport[]
}

export type TExport = {
  // // TEXT | Raw Content
  "application/vnd.myscript.jiix"?: TJIIXExport
  // // TEXT
  "text/plain"? : string
  // // MATH
  "application/x-latex"?: string
  "application/mathml+xml"?: string
  // // DIAGRAM
  "image/svg+xml"?: string
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"?: Blob
  [key: string]: TJIIXExport | string | Blob
}

export interface IModel
{
  readonly creationTime: number
  modificationDate: number
  currentStroke?: TStroke
  strokeGroups: TStrokeGroup[]
  positions: TRecognitionPositions
  defaultSymbols: TStroke[]
  rawStrokes: TStroke[]
  recognizedSymbols?: TUpdatePatch[]
  converts?: TExport
  exports?: TExport
  width: number
  height: number
  idle: boolean
  isEmpty: boolean

  addPoint(stroke: TStroke, point: TPoint): void
  addStroke(stroke: TStroke): void
  addStrokeToGroup(stroke: TStroke, strokePenStyle: TPenStyle): void
  extractPendingStrokes(position?: number): TStroke[]
  initCurrentStroke(point: TPoint, pointerId: number, pointerType: string, style: TPenStyle, dpi: number = 96): void
  appendToCurrentStroke(point: TPoint): void
  endCurrentStroke(point: TPoint, penStyle: TPenStyle): void
  extractPendingRecognizedSymbols (position: number = this.positions.lastRenderedPosition + 1): TUpdatePatch[]

  updatePositionSent(position: number = this.model.rawStrokes.length - 1): void
  updatePositionReceived(): void
  updatePositionRendered(position: number = this.model.recognizedSymbols ? this.model.recognizedSymbols.length - 1 : -1): void
  resetPositionRenderer(): void
  resetPositions(): void

  getClone(): IModel

  clear(): void
}