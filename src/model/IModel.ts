import { TConverstionState } from "../configuration"
import { TExport } from "./Export"
import { TStroke } from "./Stroke"

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
  conversion?: TConverstionState
  width: number
  height: number
  rowHeight: number
  idle: boolean

  getClone(): IModel
}
