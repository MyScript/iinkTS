import { IStroker } from './stroker/Stroker'
import { IGrabber } from './grabber/Grabber'
import { IRenderer } from './renderer/Renderer'
import { IModel } from './model/Model'
import { IRecognizer } from './recognizer/Recognizer'

export interface IBehaviors {
  grabber: IGrabber
  stroker: IStroker
  renderer: IRenderer
  recognizer: IRecognizer
  init: (element: HTMLElement) => Promise<boolean | Error>
  addStroke?: (model: IModel) => Promise<IModel | never>
  export: (model: IModel, mimeTypes: string[]) => Promise<IModel | never>
}