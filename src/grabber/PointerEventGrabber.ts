import { TGrabberConfiguration } from "./GrabberConfiguration"
import { LoggerCategory, LoggerLevel, LoggerManager } from "../logger"
import { TPointer } from "../symbol"

export type PointerInfo = {
  clientX: number,
  clientY: number,
  isPrimary: boolean,
  type: string,
  pointerType: string,
  target: HTMLElement,
  pointer: TPointer,
  button: number,
  buttons: number
}

/**
 * @group Grabber
 */
export class PointerEventGrabber
{
  #logger = LoggerManager.getLogger(LoggerCategory.GRABBER)

  protected configuration: TGrabberConfiguration
  protected layerCapture!: HTMLElement
  protected capturing: boolean = false
  protected pointerType?: string
  protected prevent = (e: Event) => e.preventDefault()

  onPointerDown?: (info: PointerInfo) => void
  onPointerMove?: (info: PointerInfo) => void
  onPointerUp?: (info: PointerInfo) => void
  onContextMenu?: (info: PointerInfo) => void

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

  protected extractPointer(event: MouseEvent | TouchEvent): TPointer
  {
    let clientX: number, clientY: number
    if ("changedTouches" in event) {
      ({ clientX, clientY } = event.changedTouches[0])
    } else {
      ({ clientX, clientY } = event)
    }
    const rect: DOMRect = this.layerCapture.getBoundingClientRect()
    const pointer = {
      x: this.roundFloat(clientX - rect.left - this.layerCapture.clientLeft + this.layerCapture.scrollLeft, this.configuration.xyFloatPrecision),
      y: this.roundFloat(clientY - rect.top - this.layerCapture.clientTop + this.layerCapture.scrollTop, this.configuration.xyFloatPrecision),
      t: this.roundFloat(Date.now(), this.configuration.timestampFloatPrecision),
      p: (event as PointerEvent).pressure,
    }
    this.#logger.debug("extractPointer", { event, pointer })
    return pointer
  }

  protected getPointerInfos(evt: PointerEvent): PointerInfo
  {
    return {
      clientX: evt.clientX,
      clientY: evt.clientY,
      isPrimary: evt.isPrimary,
      type: evt.type,
      target: evt.target as HTMLElement,
      pointerType: evt.pointerType,
      pointer: this.extractPointer(evt),
      button: evt.button,
      buttons: evt.buttons
    }
  }

  protected pointerDownHandler = (evt: PointerEvent) =>
  {
    const pointerInfo = this.getPointerInfos(evt)
    this.#logger.debug("pointerDownHandler", pointerInfo)

    // exit if not a left click or multi-touch
    if (pointerInfo.button !== 0 || evt.buttons !== 1) {
      return
    }
    this.capturing = true
    this.pointerType = evt.pointerType

    if (this.#logger.level === LoggerLevel.INFO) {
      this.#logger.info("pointerDownHandler", pointerInfo)
    }

    if (this.onPointerDown) {
      this.onPointerDown(pointerInfo)
    }
  }

  protected pointerMoveHandler = (evt: PointerEvent) =>
  {
    const pointerInfo = this.getPointerInfos(evt)
    this.#logger.debug("pointerMoveHandler", pointerInfo)
    if (this.capturing && this.pointerType === evt.pointerType) {
      if (this.#logger.level === LoggerLevel.INFO) {
        this.#logger.info("pointerMoveHandler", pointerInfo)
      }
      if (this.onPointerMove) {
        this.onPointerMove(pointerInfo)
      }
    }
  }

  protected pointerUpHandler = (evt: PointerEvent) =>
  {
    const pointerInfo = this.getPointerInfos(evt)
    this.#logger.debug("pointerUpHandler", pointerInfo)
    if (this.capturing && this.pointerType === evt.pointerType) {
      if (this.#logger.level === LoggerLevel.INFO) {
        this.#logger.info("pointerUpHandler", pointerInfo)
      }
      this.pointerType = undefined
      this.capturing = false
      if (this.onPointerUp) {
        this.onPointerUp(pointerInfo)
      }
    }
  }

  protected pointerOutHandler = (evt: PointerEvent) =>
  {
    const pointerInfo = this.getPointerInfos(evt)
    this.#logger.debug("pointerOutHandler", pointerInfo)
    if (this.capturing && this.pointerType === evt.pointerType && !this.layerCapture.contains(evt.target as HTMLElement)) {
      if (this.#logger.level === LoggerLevel.INFO) {
        this.#logger.info("pointerOutHandler", pointerInfo)
      }
      this.pointerType = undefined
      this.capturing = false
      if (this.onPointerUp) {
        this.onPointerUp(pointerInfo)
      }
    }
  }

  protected contextMenuHandler = (evt: MouseEvent) =>
  {
    const pointerInfo = this.getPointerInfos(evt as PointerEvent)
    this.#logger.debug("contextMenuHandler", pointerInfo)
    if (evt.target && this.onContextMenu){
      if (this.#logger.level === LoggerLevel.INFO) {
        this.#logger.info("contextMenuHandler", pointerInfo)
      }
      this.onContextMenu(pointerInfo)
    }
  }

  stopPointerEvent(): void
  {
    this.capturing = false
    this.pointerType = undefined
  }

  attach(layerCapture: HTMLElement)
  {
    this.#logger.info("attach", { domElement: layerCapture })
    if (this.layerCapture) {
      this.detach()
    }
    this.layerCapture = layerCapture
    // The touch-action CSS property prevents the input from continuing.
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event
    this.layerCapture.style.setProperty("touch-action", "none")
    this.layerCapture.addEventListener("pointerdown", this.pointerDownHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("pointermove", this.pointerMoveHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("pointerup", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("pointerout", this.pointerOutHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("contextmenu", this.contextMenuHandler)
  }

  detach()
  {
    this.#logger.info("detach")
    this.layerCapture?.style.removeProperty("touch-action")
    this.layerCapture?.removeEventListener("pointerdown", this.pointerDownHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("pointermove", this.pointerMoveHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("pointerup", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("pointerout", this.pointerOutHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("contextmenu", this.contextMenuHandler)
  }
}
