import { IGrabber } from './grabber/Grabber'
import { IRenderer } from './renderer/Renderer'
import { IModel } from './model/Model'
import { IRecognizer } from './recognizer/Recognizer'
import { DeferredPromise } from '../utils/DeferredPromise'

export interface IBehaviors
{
  grabber: IGrabber
  renderer: IRenderer
  recognizer: IRecognizer
  initalise: DeferredPromise

  async init: (element: HTMLElement) => Promise<void | Error>

  drawCurrentStroke(model: IModel): void

  async updateModelRendering: (model: IModel) => Promise<IModel | never>

  async export: (model: IModel, mimeTypes?: string[]) => Promise<IModel | never>
  async convert(model: IModel, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<TExport | never>

  async import?(model: IModel, data: Blob, mimeType?: string): Promise<IModel | never>

  async resize(model: IModel): Promise<IModel>

  async undo(): Promise<IModel>
  async redo(): Promise<IModel>

  async clear(model: IModel): Promise<IModel>

  async destroy(): Promise<void>
}