import { DefaultGrabberConfiguration, TGrabberConfiguration } from "./GrabberConfiguration"
import { LoggerCategory, LoggerLevel, LoggerManager } from "../logger"
import { TPointer } from "../symbol"
import { IGrabber } from "./IGrabber"
import { mergeDeep, PartialDeep } from "../utils"

/**
 * @group Grabber
 */
export class PointerEventGrabber implements IGrabber
{
  protected configuration: TGrabberConfiguration

  protected domElement!: HTMLElement

  protected capturing: boolean = false
  protected pointerType?: string

  protected prevent = (e: Event) => e.preventDefault()
  #logger = LoggerManager.getLogger(LoggerCategory.GRABBER)

  onPointerDown!: (evt: PointerEvent, point: TPointer) => void
  onPointerMove!: (evt: PointerEvent, point: TPointer) => void
  onPointerUp!: (evt: PointerEvent, point: TPointer) => void

  constructor(configuration?: PartialDeep<TGrabberConfiguration>)
  {
    this.#logger.info("constructor", { configuration })
    this.configuration = mergeDeep({}, DefaultGrabberConfiguration, configuration)
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
      p: (event as PointerEvent).pressure || 1,
    }
    this.#logger.debug("extractPoint", { event, pointer })
    return pointer
  }

  protected getPointerInfos(evt: PointerEvent): { clientX: number, clientY: number, isPrimary: boolean, type: string, pointerType: string, target: string }
  {
    return {
      clientX: evt.clientX,
      clientY: evt.clientY,
      isPrimary: evt.isPrimary,
      type: evt.type,
      target: (evt.target as HTMLElement)?.tagName,
      pointerType: evt.pointerType,
    }
  }

  protected pointerDownHandler = (evt: PointerEvent) =>
  {
    this.#logger.debug("pointerDownHandler", { evt })

    // exit if not a left click or multi-touch
    if (evt.button !== 0 || evt.buttons !== 1) {
      return
    }
    this.capturing = true
    this.pointerType = evt.pointerType

    if (this.#logger.level === LoggerLevel.INFO) {
      this.#logger.info("pointerDownHandler", this.getPointerInfos(evt))
    }

    if (this.onPointerDown) {
      evt.stopPropagation()
      const point = this.extractPoint(evt)
      this.onPointerDown(evt, point)
    }
  }

  protected isOrIsInDomElement(target: HTMLElement): boolean
  {
    return this.domElement == target || this.domElement.contains(target)
  }

  protected pointerMoveHandler = (evt: PointerEvent) =>
  {
    this.#logger.debug("pointerMoveHandler", { evt })
    if (this.capturing && this.pointerType === evt.pointerType) {
      if (this.#logger.level === LoggerLevel.INFO) {
        this.#logger.info("pointerMoveHandler", this.getPointerInfos(evt))
      }
      if (
        !evt.target ||
        !this.isOrIsInDomElement(evt.target as HTMLElement) ||
        (evt.target as HTMLElement).classList.contains("smartguide")
      ) {
        this.pointerUpHandler(evt)
        return
      }
      if (this.onPointerMove) {
        evt.stopPropagation()
        const point = this.extractPoint(evt)
        this.onPointerMove(evt, point)
      }
    }
  }

  protected applyEndCapture(evt: PointerEvent): void
  {
    this.#logger.debug("applyEndCapture", { evt })
    this.pointerType = undefined
    this.capturing = false
    if (this.onPointerUp) {
      evt.stopPropagation()
      const point = this.extractPoint(evt)
      this.onPointerUp(evt, point)
    }
  }

  protected pointerUpHandler = (evt: PointerEvent) =>
  {
    this.#logger.debug("pointerUpHandler", { evt })
    if (this.capturing && this.pointerType === evt.pointerType) {
      if (this.#logger.level === LoggerLevel.INFO) {
        this.#logger.info("pointerUpHandler", this.getPointerInfos(evt))
      }
      this.applyEndCapture(evt)
    }
  }

  protected pointerOutHandler = (evt: PointerEvent) =>
  {
    this.#logger.debug("pointerOutHandler", { evt })
    if (
      this.capturing &&
      this.pointerType === evt.pointerType &&
      (!evt.target || !this.isOrIsInDomElement(evt.target as HTMLElement))
    ) {
      if (this.#logger.level === LoggerLevel.INFO) {
        this.#logger.info("pointerOutHandler", this.getPointerInfos(evt))
      }
      this.applyEndCapture(evt)
    }
  }

  attach(domElement: HTMLElement)
  {
    this.#logger.info("attach", { domElement })
    if (this.domElement) {
      this.detach()
    }
    this.domElement = domElement
    // The touch-action CSS property prevents the input from continuing.
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event
    domElement.style.setProperty("touch-action", "none")
    this.domElement.addEventListener("pointerdown", this.pointerDownHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointermove", this.pointerMoveHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointerup", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement.addEventListener("pointerout", this.pointerOutHandler, this.configuration.listenerOptions)

    this.domElement.addEventListener("touchmove", this.prevent)

    // FIXME investigate why this is needed for iOS devices
    document.documentElement.addEventListener("pointerdown", () => { })
  }

  detach()
  {
    this.#logger.info("detach")
    this.domElement?.removeEventListener("pointerdown", this.pointerDownHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointermove", this.pointerMoveHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointerup", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("pointerout", this.pointerOutHandler, this.configuration.listenerOptions)
    this.domElement?.removeEventListener("touchmove", this.prevent)
    document.documentElement.removeEventListener("pointerdown", () => { })
  }
}
