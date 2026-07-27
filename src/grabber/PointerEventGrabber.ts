import { LoggerCategory, LoggerLevel, LoggerManager } from "@/logger"
import type { TPointer } from "@/symbol"
import { bumpSvgTransformVersion, getSvgTransformVersion } from "@/utils"

import type { TGrabberConfiguration } from "./GrabberConfiguration"

/**
 * @group Grabber
 */
export type TPointerInfo = {
  clientX: number
  clientY: number
  isPrimary: boolean
  type: string
  pointerType: string
  target: HTMLElement
  pointer: TPointer
  button: number
  buttons: number
}

/**
 * @group Grabber
 */
export class PointerEventGrabber {
  #logger = LoggerManager.getLogger(LoggerCategory.GRABBER)

  protected configuration: TGrabberConfiguration
  protected layerCapture!: HTMLElement
  protected capturing: boolean = false
  protected pointerType?: string
  protected prevent = (e: Event) => e.preventDefault()

  /**
   * Scrolling any ancestor moves the capture SVG on screen without touching its own
   * pan/zoom/resize, so `getCachedScreenCTM`'s version-keyed cache never sees it happen on its
   * own - left unhandled, every point captured after a scroll would map to the pre-scroll
   * screen position, offsetting the whole stroke. `scroll` doesn't bubble, so this is
   * registered on `window` with `capture: true` to still observe it from any scrollable
   * ancestor between `window` and `layerCapture`.
   */
  #scrollHandler = () => {
    const svgElement =
      this.layerCapture instanceof SVGSVGElement ? this.layerCapture : this.layerCapture.querySelector("svg")
    if (svgElement) {
      bumpSvgTransformVersion(svgElement)
    }
  }

  onPointerDown?: (info: TPointerInfo) => void
  onPointerMove?: (info: TPointerInfo) => void
  onPointerUp?: (info: TPointerInfo) => void
  onContextMenu?: (info: TPointerInfo) => void

  constructor(configuration: TGrabberConfiguration) {
    this.#logger.info("constructor", {
      configuration,
    })
    this.configuration = configuration
  }

  protected roundFloat(oneFloat: number, requestedFloatPrecision: number): number {
    if (requestedFloatPrecision >= 0) {
      const floatPrecision: number = Math.pow(10, requestedFloatPrecision)
      return Math.round(oneFloat / floatPrecision) * floatPrecision
    }
    this.#logger.debug("roundFloat", {
      oneFloat,
      requestedFloatPrecision,
    })
    return oneFloat
  }

  #cachedCTM?: DOMMatrix
  #cachedCTMSvg?: SVGSVGElement
  #cachedCTMVersion = -1

  /**
   * `getScreenCTM` forces the browser to flush pending layout, which gets
   * increasingly costly as the svg grows (more symbols on the canvas). Reuse
   * the last value as long as `svg`'s transform (pan/zoom/resize) hasn't changed.
   */
  protected getCachedScreenCTM(svg: SVGSVGElement): DOMMatrix | null {
    const version = getSvgTransformVersion(svg)
    if (this.#cachedCTMSvg === svg && this.#cachedCTMVersion === version) {
      return this.#cachedCTM ?? null
    }
    const ctm = svg.getScreenCTM()
    this.#cachedCTM = ctm ?? undefined
    this.#cachedCTMSvg = svg
    this.#cachedCTMVersion = version
    return ctm
  }

  protected extractPointer(event: MouseEvent | TouchEvent): TPointer {
    let clientX: number, clientY: number
    if ("changedTouches" in event) {
      ;({ clientX, clientY } = event.changedTouches[0])
    } else {
      ;({ clientX, clientY } = event)
    }

    let x: number, y: number

    const svgElement: SVGSVGElement | null =
      this.layerCapture instanceof SVGSVGElement ? this.layerCapture : this.layerCapture.querySelector("svg")

    if (svgElement) {
      const ctm = this.getCachedScreenCTM(svgElement)
      if (ctm) {
        const point = svgElement.createSVGPoint()
        point.x = clientX
        point.y = clientY
        const transformedPoint = point.matrixTransform(ctm.inverse())
        x = transformedPoint.x
        y = transformedPoint.y
      } else {
        const rect: DOMRect = this.layerCapture.getBoundingClientRect()
        x = clientX - rect.left - this.layerCapture.clientLeft
        y = clientY - rect.top - this.layerCapture.clientTop
      }
    } else {
      const rect: DOMRect = this.layerCapture.getBoundingClientRect()
      x = clientX - rect.left - this.layerCapture.clientLeft + this.layerCapture.scrollLeft
      y = clientY - rect.top - this.layerCapture.clientTop + this.layerCapture.scrollTop
    }

    const pointer = {
      x: this.roundFloat(x, this.configuration.xyFloatPrecision),
      y: this.roundFloat(y, this.configuration.xyFloatPrecision),
      t: this.roundFloat(Date.now(), this.configuration.timestampFloatPrecision),
      p: (event as PointerEvent).pressure,
    }
    this.#logger.debug("extractPointer", {
      event,
      pointer,
    })
    return pointer
  }

  protected getPointerInfos(evt: PointerEvent): TPointerInfo {
    return {
      clientX: evt.clientX,
      clientY: evt.clientY,
      isPrimary: evt.isPrimary,
      type: evt.type,
      target: evt.target as HTMLElement,
      pointerType: evt.pointerType,
      pointer: this.extractPointer(evt),
      button: evt.button,
      buttons: evt.buttons,
    }
  }

  protected pointerDownHandler = (evt: PointerEvent) => {
    const pointerInfo = this.getPointerInfos(evt)
    this.#logger.debug("pointerDownHandler", pointerInfo)

    // exit if not a left click or multi-touch
    if (pointerInfo.button !== 0 || evt.buttons !== 1) {
      return
    }
    this.capturing = true
    this.pointerType = evt.pointerType

    if (this.onPointerDown) {
      this.onPointerDown(pointerInfo)
    }
  }

  protected pointerMoveHandler = (evt: PointerEvent) => {
    if (!this.capturing || this.pointerType !== evt.pointerType) {
      return
    }
    // The browser may coalesce several physical samples into one pointermove
    // event under main-thread pressure; replay each one so points aren't lost.
    const coalescedEvents = typeof evt.getCoalescedEvents === "function" ? evt.getCoalescedEvents() : []
    const events = coalescedEvents.length > 0 ? coalescedEvents : [evt]
    for (const event of events) {
      const pointerInfo = this.getPointerInfos(event)
      this.#logger.debug("pointerMoveHandler", pointerInfo)
      if (this.onPointerMove) {
        this.onPointerMove(pointerInfo)
      }
    }
  }

  protected pointerUpHandler = (evt: PointerEvent) => {
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

  protected pointerOutHandler = (evt: PointerEvent) => {
    const pointerInfo = this.getPointerInfos(evt)
    this.#logger.debug("pointerOutHandler", pointerInfo)
    if (
      this.capturing &&
      this.pointerType === evt.pointerType &&
      !this.layerCapture.contains(evt.target as HTMLElement)
    ) {
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

  protected contextMenuHandler = (evt: MouseEvent) => {
    if (evt.target && this.onContextMenu) {
      const pointerInfo: TPointerInfo = {
        clientX: evt.clientX,
        clientY: evt.clientY,
        isPrimary: true,
        type: evt.type,
        target: evt.target as HTMLElement,
        pointerType: "mouse",
        pointer: this.extractPointer(evt),
        button: evt.button,
        buttons: evt.buttons,
      }
      this.#logger.debug("contextMenuHandler", pointerInfo)
      this.onContextMenu(pointerInfo)
    }
  }

  stopPointerEvent(): void {
    this.capturing = false
    this.pointerType = undefined
  }

  attach(layerCapture: HTMLElement) {
    this.#logger.info("attach", {
      domElement: layerCapture,
    })
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
    window.addEventListener("scroll", this.#scrollHandler, { capture: true, passive: true })
  }

  detach() {
    this.#logger.info("detach")
    window.removeEventListener("scroll", this.#scrollHandler, { capture: true })
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
