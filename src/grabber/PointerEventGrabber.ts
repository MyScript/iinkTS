import { IGrabber } from "../@types/grabber/Grabber"
import { TGrabberConfiguration } from "../@types/configuration/GrabberConfiguration"
import { TPointer } from "../@types/geometry"
import { Logger, LoggerManager } from "../logger"
import { LOGGER_CLASS } from "../Constants"

export class PointerEventGrabber implements IGrabber
{
  private configuration: TGrabberConfiguration

  private domElement!: HTMLElement

  private activePointerId?: number

  private prevent = (e: Event) => e.preventDefault()
  #logger: Logger

  onPointerDown!: (evt: PointerEvent, point: TPointer) => void
  onPointerMove!: (evt: PointerEvent, point: TPointer) => void
  onPointerUp!: (evt: PointerEvent, point: TPointer) => void

  constructor(configuration: TGrabberConfiguration)
  {
    this.#logger = LoggerManager.getLogger(LOGGER_CLASS.GRABBER)
    this.configuration = configuration
    this.#logger.info("constructor", { configuration })
  }

  private roundFloat(oneFloat: number, requestedFloatPrecision: number): number
  {
    if (requestedFloatPrecision >= 0) {
      const floatPrecision: number = Math.pow(10, requestedFloatPrecision)
      return Math.round(oneFloat / floatPrecision) * floatPrecision
    }
    this.#logger.info("roundFloat", { oneFloat, requestedFloatPrecision })
    return oneFloat
  }

  private extractPoint(event: MouseEvent | TouchEvent): TPointer
  {
    let clientX: number, clientY: number
    if ("changedTouches" in event) {
      ({ clientX, clientY } = event.changedTouches[0])
    } else {
      ({ clientX, clientY } = event)
    }
    const rect: DOMRect = this.domElement.getBoundingClientRect()
    this.#logger.info("extractPoint", { event })
    return {
      x: this.roundFloat(clientX - rect.left - this.domElement.clientLeft, this.configuration.xyFloatPrecision),
      y: this.roundFloat(clientY - rect.top - this.domElement.clientTop, this.configuration.xyFloatPrecision),
      t: this.roundFloat(Date.now(), this.configuration.timestampFloatPrecision),
      p: (event as PointerEvent).pressure || 1,

    }
  }

  private pointerDownHandler = (evt: PointerEvent) =>
  {
    this.#logger.info("pointerDown", {evt})
    // exit if not a left click or multi-touch
    if (evt.button !== 0 || evt.buttons !== 1) {
      return
    }

    this.activePointerId = evt.pointerId

    if (this.onPointerDown) {
      const point = this.extractPoint(evt)
      this.onPointerDown(evt, point)
    }
  }

  private pointerMoveHandler = (evt: PointerEvent) =>
  {
    this.#logger.info("pointerDown", {evt})
    if (this.activePointerId != undefined && this.activePointerId === evt.pointerId) {
      if (this.onPointerMove) {
        const point = this.extractPoint(evt)
        this.onPointerMove(evt, point)
      }
    }
  }

  private pointerUpHandler = (evt: PointerEvent) =>
  {
    this.#logger.info("pointerUp", {evt})
    if (this.activePointerId != undefined && this.activePointerId === evt.pointerId) {
      this.activePointerId = undefined
      evt.stopPropagation()
      if (this.onPointerUp) {
        const point = this.extractPoint(evt)
        this.onPointerUp(evt, point)
      }
    }
  }

  attach(domElement: HTMLElement)
  {
    this.#logger.info("attach", { domElement })
    if (this.domElement) {
      this.detach()
    }
    this.domElement = domElement
    this.domElement.addEventListener("pointerdown", this.pointerDownHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointermove", this.pointerMoveHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointerup", this.pointerUpHandler, this.configuration.listenerOptions)
    // this.domElement.addEventListener("pointerout", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)

    this.domElement.addEventListener("touchmove", this.prevent)

    // FIXME investigate why this is needed for iOS devices
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    document.documentElement.addEventListener("pointerdown", () => { })
  }

  detach()
  {
    this.#logger.info("detach", {})
    this.domElement?.removeEventListener("pointerdown", this.pointerDownHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointermove", this.pointerMoveHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointerup", this.pointerUpHandler, this.configuration.listenerOptions)
    // this.domElement?.removeEventListener("pointerout", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("touchmove", this.prevent)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    document.documentElement.removeEventListener("pointerdown", () => { })
  }
}
