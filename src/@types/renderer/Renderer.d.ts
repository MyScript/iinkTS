import { IStroker } from '../stroker/Stroker'
import { TRenderingConfiguration } from '../configuration/RenderingConfiguration'
import { IModel } from '../model/Model'

export type TRendererContext = {
  minHeight: number
  minWidth: number
  renderingCanvas: HTMLCanvasElement
  renderingCanvasContext: CanvasRenderingContext2D
  capturingCanvas: HTMLCanvasElement
  capturingCanvasContext: CanvasRenderingContext2D
}

export interface IRenderer {
  config: TRenderingConfiguration
  context: TRendererContext
  init: (element: HTMLElement) => void
  destroy: (element: HTMLElement) => void
  resize: (model: IModel, stroker: IStroker) => void
  drawCurrentStroke: (model: IModel, stroker: IStroker) => void
  drawModel: (model: IModel, stroker: IStroker) => void
}
