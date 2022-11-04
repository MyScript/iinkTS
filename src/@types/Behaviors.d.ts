import { IStroker } from './stroker/Stroker'
import { IGrabber } from './grabber/Grabber'
import { IRenderer } from './renderer/Renderer'
import { IModel } from './model/Model'
import { IRecognizer } from './recognizer/Recognizer'
import { DeferredPromise } from '../utils/DeferredPromise'

export interface IBehaviors
{
  grabber: IGrabber
  stroker: IStroker
  renderer: IRenderer
  recognizer: IRecognizer
  initalise: DeferredPromise

  async init: (element: HTMLElement, model: IModel) => Promise<void | Error>

  drawCurrentStroke(model: IModel): void
  drawModel(model: IModel): void

  async addStrokes?: (model: IModel) => Promise<IModel | never>
  async export: (model: IModel, mimeTypes?: string[]) => Promise<IModel | never>
  async resize(model: IModel): Promise<IModel>

  async undo(): Promise<IModel>
  async redo(): Promise<IModel>

  async clear(model: IModel): Promise<IModel>
}