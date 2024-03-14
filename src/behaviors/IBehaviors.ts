import { Intention } from "../Constants"
import { TConfiguration, TConverstionState, TLoggerConfiguration } from "../configuration"
import { IGrabber } from "../grabber"
import { IModel } from "../model"
import { TStroke } from "../primitive"
import { RestRecognizer, WSRecognizer } from "../recognizer"
import { TStyle, TTheme } from "../style"
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
  penStyle?: TStyle
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
