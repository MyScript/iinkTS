import { IBehaviors } from "../@types/Behaviors"
import { IGrabber } from "../@types/grabber/Grabber"
import { IStroker } from "../@types/stroker/Stroker"
import { TConfiguration } from "../@types/Configuration"
import { IRenderer } from "../@types/renderer/Renderer"

import { PointerEventGrabber } from '../grabber/PointerEventGrabber'
import { CanvasRenderer } from "../renderer/canvas/CanvasRenderer"
import { QuadraticCanvasStroker } from "../renderer/canvas/stroker/QuadraticCanvasStroker"

export class RestBehaviors implements IBehaviors
{
  eventHelper!: any
  grabber: IGrabber
  stroker: IStroker
  renderer: IRenderer
  recognizer!: any

  constructor(configuration: TConfiguration)
  {
    this.grabber = new PointerEventGrabber(configuration.grabber)
    this.stroker = new QuadraticCanvasStroker()
    this.renderer = new CanvasRenderer(configuration.rendering)
  }

  init(domElement: HTMLElement): Promise<boolean | Error>
  {
    this.grabber.attach(domElement)
    this.renderer.init(domElement)
    return Promise.resolve(true)
  }

}
