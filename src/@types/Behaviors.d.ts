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

  async init: (element: HTMLElement) => Promise<void>
  async export(mimeTypes?: string[]): Promise<IModel | never>
  async convert(conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel | never>
  async resize(height: number, width: number): Promise<IModel>
  async undo(): Promise<IModel>
  async redo(): Promise<IModel>

  async waitForIdle?(): Promise<void>
  async importPointEvents?(strokes: TStroke[]): Promise<IModel | never>
  async import?(data: Blob, mimeType?: string): Promise<IModel | never>

  async clear(): Promise<IModel>

  async destroy(): Promise<void>
}
