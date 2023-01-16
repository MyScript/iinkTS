import { IGrabber } from "../@types/grabber/Grabber"
import { TGrabberConfiguration } from "../@types/configuration/GrabberConfiguration"
import { TPoint } from "../@types/renderer/Point"

export class PointerEventGrabber implements IGrabber
{
  private configuration!: TGrabberConfiguration

  private domElement!: HTMLElement

  private activePointerId?: number

  private prevent = (e: Event) => e.preventDefault()

  onPointerDown!: (evt: PointerEvent, point: TPoint) => void
  onPointerMove!: (evt: PointerEvent, point: TPoint) => void
  onPointerUp!: (evt: PointerEvent, point: TPoint) => void

  constructor(configuration: TGrabberConfiguration)
  {
    this.setConfiguration(configuration)
  }

  private roundFloat(oneFloat: number, requestedFloatPrecision: number): number
  {
    if (requestedFloatPrecision >= 0) {
      const floatPrecision: number = Math.pow(10, requestedFloatPrecision)
      return Math.round(oneFloat / floatPrecision) * floatPrecision
    }
    return oneFloat
  }

  private extractPoint(event: MouseEvent | TouchEvent): TPoint
  {
    let clientX: number, clientY: number
    if ("changedTouches" in event) {
      ({ clientX, clientY } = event.changedTouches[0])
    } else {
      ({ clientX, clientY } = event)
    }
    const rect: DOMRect = this.domElement.getBoundingClientRect()
    return {
      x: this.roundFloat(clientX - rect.left - this.domElement.clientLeft, this.configuration.xyFloatPrecision),
      y: this.roundFloat(clientY - rect.top - this.domElement.clientTop, this.configuration.xyFloatPrecision),
      t: this.roundFloat(Date.now(), this.configuration.timestampFloatPrecision),
      p: (event as PointerEvent).pressure || 1,

    }
  }

  private pointerDownHandler = (evt: PointerEvent) =>
  {
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
    if (this.activePointerId != undefined && this.activePointerId === evt.pointerId) {
      if (this.onPointerMove) {
        const point = this.extractPoint(evt)
        this.onPointerMove(evt, point)
      }
    }
  }

  private pointerUpHandler = (evt: PointerEvent) =>
  {
    if (this.activePointerId != undefined && this.activePointerId === evt.pointerId) {
      this.activePointerId = undefined
      evt.stopPropagation()
      if (this.onPointerUp) {
        const point = this.extractPoint(evt)
        this.onPointerUp(evt, point)
      }
    }
  }

  setConfiguration(configuration: TGrabberConfiguration)
  {
    this.configuration = configuration
  }

  attach(domElement: HTMLElement)
  {
    if (this.domElement) {
      this.detach()
    }
    this.domElement = domElement
    this.domElement.addEventListener("pointerdown", this.pointerDownHandler, this.configuration.listenerOptions)

    this.domElement.addEventListener("pointermove", this.pointerMoveHandler, this.configuration.listenerOptions)

    this.domElement.addEventListener("pointerup", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointerout", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)

    this.domElement.addEventListener("touchmove", this.prevent)

    // FIXME investigate why this is needed for iOS devices
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    document.documentElement.addEventListener("pointerdown", () => { })
  }

  detach()
  {
    this.domElement?.removeEventListener("pointerdown", this.pointerDownHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointermove", this.pointerMoveHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointerup", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointerout", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("touchmove", this.prevent)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    document.documentElement.removeEventListener("pointerdown", () => { })
  }
}
