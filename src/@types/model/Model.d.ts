import { TPoint, TPointer } from "../geometry"
import { TStroke } from "./Stroke"
import { TPenStyle } from "../style/PenStyle"
import { TRecognitionPositions } from "./RecognitionPositions"

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
  positions: TRecognitionPositions
  rawStrokes: TStroke[]
  selectedStrokes: TStroke[]
  converts?: TExport
  exports?: TExport
  width: number
  height: number
  idle: boolean

  mergeExport(exports: TExport)
  mergeConvert(converts: TExport)

  addPoint(stroke: TStroke, point: TPointer): void
  addStroke(stroke: TStroke): void
  extractUnsentStrokes(): TStroke[]

  initCurrentStroke(point: TPointer, pointerId: number, pointerType: string, style: TPenStyle, dpi: number = 96): void
  appendToCurrentStroke(point: TPointer): void
  endCurrentStroke(point: TPointer): void

  resetSelectedStrokes(): void
  appendSelectedStrokesFromPoint(point: TPoint): void

  removeStroke(id: string): void
  updateStroke(updatedStroke: TStroke): void
  removeStrokesFromPoint(point: TPoint): string[]

  updatePositionSent(position: number = this.model.rawStrokes.length - 1): void
  updatePositionReceived(): void
  resetPositions(): void

  getClone(): IModel

  clear(): void
}
