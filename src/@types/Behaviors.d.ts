import { IGrabber } from "./grabber/Grabber"
import { IRenderer } from "./renderer/Renderer"
import { IModel } from "./model/Model"
import { IRecognizer } from "./recognizer/Recognizer"
import { TTheme } from "./style/Theme"
import { TConverstionState } from "./configuration/RecognitionConfiguration"
import { TPenStyle } from "./style/PenStyle"
import { TStroke } from "./model/Stroke"

export interface IBehaviors
{
  grabber: IGrabber
  renderer: IRenderer
  recognizer: IRecognizer

  async init: (element: HTMLElement) => Promise<void | Error>

  drawCurrentStroke(model: IModel): void

  async updateModelRendering: (model: IModel) => Promise<IModel | never>

  async export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  async convert(model: IModel, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel | never>

  async importPointEvents?(model: IModel, strokes: TStroke[]): Promise<IModel | never>
  async import?(model: IModel, data: Blob, mimeType?: string): Promise<IModel | never>

  setPenStyle?(penStyle: TPenStyle): void
  setPenStyleClasses?(penStyleClasses: string): void
  setTheme?(theme: TTheme): void

  async resize(model: IModel): Promise<IModel>

  async undo(model: IModel): Promise<IModel>
  async redo(model: IModel): Promise<IModel>

  async clear(model: IModel): Promise<IModel>

  async destroy(model: IModel): Promise<void>
}
