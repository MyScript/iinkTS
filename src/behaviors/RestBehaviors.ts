import { IBehaviors } from "../@types/Behaviors"
import { IGrabber } from "../@types/grabber/Grabber"
import { IStroker } from "../@types/stroker/Stroker"
import { TConfiguration } from "../@types/Configuration"
import { IRenderer } from "../@types/renderer/Renderer"
import { IModel } from "../@types/model/Model"
import { IRecognizer } from "../@types/recognizer/Recognizer"

import { PointerEventGrabber } from '../grabber/PointerEventGrabber'
import { CanvasRenderer } from "../renderer/canvas/CanvasRenderer"
import { QuadraticCanvasStroker } from "../renderer/canvas/stroker/QuadraticCanvasStroker"
import { RestRecognizer } from "../recognizer/rest/RestRecognizer"

export class RestBehaviors implements IBehaviors
{
  grabber: IGrabber
  stroker: IStroker
  renderer: IRenderer
  recognizer: IRecognizer

  constructor(configuration: TConfiguration)
  {
    this.grabber = new PointerEventGrabber(configuration.grabber)
    this.stroker = new QuadraticCanvasStroker()
    this.renderer = new CanvasRenderer(configuration.rendering)
    this.recognizer = new RestRecognizer(configuration.server, configuration.recognition)
  }

  init(domElement: HTMLElement): Promise<boolean | Error>
  {
    this.grabber.attach(domElement)
    this.renderer.init(domElement)
    return Promise.resolve(true)
  }

  export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  {
    return this.recognizer.export(model, mimeTypes)
  }
}
