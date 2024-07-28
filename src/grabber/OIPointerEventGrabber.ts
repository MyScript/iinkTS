import { TGrabberConfiguration } from "../configuration"
import { LoggerClass, LoggerManager } from "../logger"
import { TPointer } from "../primitive"
import { IGrabber } from "./IGrabber"

/**
 * @group Grabber
 */
export class OIPointerEventGrabber implements IGrabber
{
  #logger = LoggerManager.getLogger(LoggerClass.GRABBER)

  protected configuration: TGrabberConfiguration
  protected domElement!: HTMLElement
  protected activePointerId?: number
  protected prevent = (e: Event) => e.preventDefault()

  onPointerDown!: (evt: PointerEvent, point: TPointer) => void
  onPointerMove!: (evt: PointerEvent, point: TPointer) => void
  onPointerUp!: (evt: PointerEvent, point: TPointer) => void
  onContextMenu!: (el: HTMLElement, point: TPointer) => void

  constructor(configuration: TGrabberConfiguration)
  {
    this.#logger.info("constructor", { configuration })
    this.configuration = configuration
  }

  protected roundFloat(oneFloat: number, requestedFloatPrecision: number): number
  {
    if (requestedFloatPrecision >= 0) {
      const floatPrecision: number = Math.pow(10, requestedFloatPrecision)
      return Math.round(oneFloat / floatPrecision) * floatPrecision
    }
    this.#logger.debug("roundFloat", { oneFloat, requestedFloatPrecision })
    return oneFloat
  }

  protected extractPoint(event: MouseEvent | TouchEvent): TPointer
  {
    let clientX: number, clientY: number
    if ("changedTouches" in event) {
      ({ clientX, clientY } = event.changedTouches[0])
    } else {
      ({ clientX, clientY } = event)
    }
    const rect: DOMRect = this.domElement.getBoundingClientRect()
    const pointer = {
      x: this.roundFloat(clientX - rect.left - this.domElement.clientLeft + this.domElement.scrollLeft, this.configuration.xyFloatPrecision),
      y: this.roundFloat(clientY - rect.top - this.domElement.clientTop + this.domElement.scrollTop, this.configuration.xyFloatPrecision),
      t: this.roundFloat(Date.now(), this.configuration.timestampFloatPrecision),
      p: (event as PointerEvent).pressure,
    }
    this.#logger.debug("extractPoint", { event, pointer })
    return pointer
  }

  protected pointerDownHandler = (evt: PointerEvent) =>
  {
    this.#logger.info("pointerDown", { evt })

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

  protected pointerMoveHandler = (evt: PointerEvent) =>
  {
    this.#logger.info("pointerMove", { evt })
    if (this.activePointerId != undefined && this.activePointerId === evt.pointerId) {
      if (this.onPointerMove) {
        const point = this.extractPoint(evt)
        this.onPointerMove(evt, point)
      }
    }
  }

  protected pointerUpHandler = (evt: PointerEvent) =>
  {
    this.#logger.info("pointerUp", { evt })
    if (this.activePointerId != undefined && this.activePointerId === evt.pointerId) {
      this.activePointerId = undefined
      evt.stopPropagation()
      if (this.onPointerUp) {
        const point = this.extractPoint(evt)
        this.onPointerUp(evt, point)
      }
    }
  }

  protected contextMenuHandler = (evt: MouseEvent) =>
  {
    const point = this.extractPoint(evt)
    this.onContextMenu(evt.target as HTMLElement, point)
  }

  stopPointerEvent(): void
  {
    this.activePointerId = undefined
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
    this.domElement.addEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("contextmenu", this.contextMenuHandler)
  }

  detach()
  {
    this.#logger.info("detach")
    this.domElement?.removeEventListener("pointerdown", this.pointerDownHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointermove", this.pointerMoveHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointerup", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("contextmenu", this.contextMenuHandler)
  }
}
