import { TRenderingConfiguration } from "../configuration/RenderingConfiguration"
import { IModel } from "../model/Model"

export type TCanvasRendererContext = {
  parent: HTMLElement
  renderingCanvas: HTMLCanvasElement
  renderingCanvasContext: CanvasRenderingContext2D
  capturingCanvas: HTMLCanvasElement
  capturingCanvasContext: CanvasRenderingContext2D
}

export type TSVGRendererContext = {
  parent: HTMLElement
}

export interface IRenderer {
  config: TRenderingConfiguration
  init: (element: HTMLElement) => void
  resize: (model: IModel) => void
  destroy: () => void
}
