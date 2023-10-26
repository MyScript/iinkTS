import { IGrabber } from "./grabber/Grabber"
import { IModel } from "./model/Model"
import { IRecognizer } from "./recognizer/Recognizer"
import { TTheme } from "./style/Theme"
import { TConverstionState } from "./configuration/RecognitionConfiguration"
import { TPenStyle } from "./style/PenStyle"
import { TStroke } from "./model/Stroke"
import { TUndoRedoContext } from "./undo-redo/UndoRedoContext"
import { TConfiguration } from "./configuration"
import { StyleManager } from "../style/StyleManager"
import { TLoggerConfiguration } from "./configuration/LoggerConfiguration"

export type TBehaviorOptions = {
  configuration: TConfiguration
  behaviors?: {
    grabber?: IGrabber
    recognizer?: IRecognizer
  }
  penStyle?: TPenStyle
  theme?: TTheme
  logger?: TLoggerConfiguration
}

export interface IBehaviors
{
  name: string
  grabber: IGrabber
  recognizer: IRecognizer
  context: TUndoRedoContext
  options: TBehaviorOptions
  styleManager: StyleManager
  intention: Intention
  #configuration: TConfiguration

  get currentPenStyle(): TPenStyle

  get model(): IModel

  get penStyle(): TPenStyle
  setPenStyle(penStyle?: TPenStyle)

  get penStyleClasses(): string
  setPenStyleClasses(penStyleClasses?: string)

  get theme(): TTheme
  setTheme(theme?: TTheme)

  get configuration(): TConfiguration
  set configuration(conf: TConfiguration)

  init(element: HTMLElement): Promise<void>
  export(mimeTypes?: string[]): Promise<IModel>
  convert(conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel>
  resize(height: number, width: number): Promise<IModel>
  undo(): Promise<IModel>
  redo(): Promise<IModel>

  waitForIdle?(): Promise<void>
  importPointEvents?(strokes: TStroke[]): Promise<IModel>
  import?(data: Blob, mimeType?: string): Promise<IModel>
  reDraw?(rawStrokes: TStroke[]): Promise<IModel>

  clear(): Promise<IModel>

  destroy(): Promise<void>
}
