import { Intention } from "../Constants"
import { TConfiguration, TConverstionState } from "../configuration"
import { IGrabber } from "../grabber"
import { IModel } from "../model"
import { TStroke } from "../primitive"
import { TStyle, TTheme } from "../style"
import { IHistoryManager } from "../history"
import { PartialDeep } from "../utils"

/**
 * @group Behavior
 */
export interface IBehaviors
{
  name: string
  grabber: IGrabber
  history: IHistoryManager
  intention: Intention

  get currentPenStyle(): TStyle

  get model(): IModel

  get penStyle(): TStyle
  setPenStyle(penStyle?: PartialDeep<TStyle>): Promise<void>

  get penStyleClasses(): string
  setPenStyleClasses(penStyleClasses?: string): Promise<void>

  get theme(): TTheme
  setTheme(theme?: PartialDeep<TTheme>): Promise<void>

  get configuration(): TConfiguration
  set configuration(conf: TConfiguration)

  init(element: HTMLElement): Promise<void>
  export(mimeTypes?: string[]): Promise<IModel>
  convert(conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel>
  resize(height: number, width: number): Promise<IModel>
  undo(): Promise<IModel>
  redo(): Promise<IModel>

  waitForIdle?(): Promise<void>
  importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<IModel>
  import?(data: Blob, mimeType?: string): Promise<IModel>

  clear(): Promise<IModel>

  destroy(): Promise<void>
}
