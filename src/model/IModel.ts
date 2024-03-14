import { TExport } from "./Export"
import { TSymbol } from "../primitive"

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
  positions: TRecognitionPositions
  symbols: TSymbol[]
  exports?: TExport
  converts?: TExport
  width: number
  height: number
  rowHeight: number
  idle: boolean

  getClone(): IModel
}
