import { TExport } from "./Export"
import { TSymbol } from "../symbol"

/**
 * @group Model
 */
export interface IModel
{
  readonly creationTime: number
  modificationDate: number
  symbols: TSymbol[]
  exports?: TExport
  converts?: TExport
  width: number
  height: number
  rowHeight: number
  idle: boolean

  clone(): IModel
}
