import { Intention } from "../Constants"
import { TConfiguration, TConverstionState, TLoggerConfiguration } from "../configuration"
import { IGrabber } from "../grabber"
import { IModel, TStroke } from "../model"
import { RestRecognizer, WSRecognizer } from "../recognizer"
import { TPenStyle, TTheme } from "../style"
import { TUndoRedoContext } from "../undo-redo"
import { PartialDeep } from "../utils"

/**
 * @group Behavior
 */
export type TBehaviorOptions = {
  configuration: TConfiguration
  behaviors?: {
    grabber?: IGrabber
    recognizer?: RestRecognizer | WSRecognizer
  }
  penStyle?: TPenStyle
  theme?: TTheme
  logger?: TLoggerConfiguration
}

/**
 * @group Behavior
 */
export interface IBehaviors
{
  name: string
  grabber: IGrabber
  context: TUndoRedoContext
  intention: Intention

  get currentPenStyle(): TPenStyle

  get model(): IModel

  get penStyle(): TPenStyle
  setPenStyle(penStyle?: PartialDeep<TPenStyle>): Promise<void>

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
  importPointEvents(strokes: TStroke[]): Promise<IModel>
  import?(data: Blob, mimeType?: string): Promise<IModel>

  clear(): Promise<IModel>

  destroy(): Promise<void>
}
