import { TPoint } from "../renderer/Point"
import { TStroke, TStrokeGroup } from "./Stroke"
import { TPenStyle } from "../style/PenStyle"
import { TRecognitionPositions } from "./RecognitionPositions"
import { TUpdatePatch } from "../recognizer/WSRecognizer"

export type TWordExport = {
  id?: string
  label: string,
  candidates?: string[]
}

export type TJIIXExport = {
  type: string,
  id: string,
  label: string,
  version: string,
  words: TWordExport[]
}

/**
 * List all supported MIME types for export.
 * Attention, the MIME types supported depend on the {@link TRecognitionType | type of recognition}
 */
export type TExport = {
  /** @hidden */
  [key: string]: TJIIXExport | string | Blob
  /**
   * vnd.myscript.jiix is used for text and raw-content exports
   */
  "application/vnd.myscript.jiix"?: TJIIXExport
  /**
   * text/plain is only use for text export
   */
  "text/plain"? : string
  /**
   * x-latex is only use for math export
   * @see {@link https://katex.org/docs/browser.html | katex} to render
   */
  "application/x-latex"?: string
  /**
   * mathml+xml is only use for math export
   * @see {@link https://www.w3.org/Math/whatIsMathML.html | Mathematical Markup Language}
   */
  "application/mathml+xml"?: string
  /**
   * svg+xml is only use for diagram export
   */
  "image/svg+xml"?: string
  /**
   * vnd.openxmlformats-officedocument.presentationml.presentation is only use for diagram export
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob | Blob}
   */
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"?: Blob
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
  selectedStrokes: TStroke[]
  recognizedSymbols?: TUpdatePatch[]
  converts?: TExport
  exports?: TExport
  width: number
  height: number
  idle: boolean

  mergeExport(exports: TExport)
  addPoint(stroke: TStroke, point: TPoint): void
  addStroke(stroke: TStroke): void
  addStrokeToGroup(stroke: TStroke, strokePenStyle: TPenStyle): void
  extractUnsentStrokes(): TStroke[]
  initCurrentStroke(point: TPoint, pointerId: number, pointerType: string, style: TPenStyle, dpi: number = 96): void
  appendToCurrentStroke(point: TPoint): void
  endCurrentStroke(point: TPoint, penStyle: TPenStyle): void
  extractPendingRecognizedSymbols (position: number = this.positions.lastRenderedPosition + 1): TUpdatePatch[]

  resetSelectedStrokes(): void
  appendSelectedStrokesFromPoint(point: TPoint): void

  removeStrokesFromPoint(point: TPoint): number

  updatePositionSent(position: number = this.model.rawStrokes.length - 1): void
  updatePositionReceived(): void
  updatePositionRendered(position: number = this.model.recognizedSymbols ? this.model.recognizedSymbols.length - 1 : -1): void
  resetPositionRenderer(): void
  resetPositions(): void

  getClone(): IModel

  clear(): void
}
