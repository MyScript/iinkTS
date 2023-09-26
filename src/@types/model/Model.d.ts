import { TStroke } from "./Stroke"
import { TRecognitionPositions } from "./RecognitionPositions"
import { TExport } from "./Export"

export interface IModel
{
  readonly creationTime: number
  modificationDate: number
  currentStroke?: TStroke
  positions: TRecognitionPositions
  strokes: TStroke[]
  selectedStrokes: TStroke[]
  exports?: TExport
  converts?: TExport
  conversion?: TConversion
  width: number
  height: number
  rowHeight: number
  idle: boolean

  getClone(): IModel
}
