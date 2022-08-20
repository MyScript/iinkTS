import { IStroker } from './stroker/Stroker'
import { IGrabber } from './grabber/Grabber'
import { IRenderer } from './renderer/Renderer'
import { IModel } from './model/Model'

export interface IBehaviors {
  eventHelper: any
  grabber: IGrabber
  stroker: IStroker
  renderer: IRenderer
  recognizer: any
  init: (element: HTMLElement) => Promise<boolean | Error>
}