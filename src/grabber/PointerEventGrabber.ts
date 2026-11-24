import type { TPointer } from "@/core"
import { bumpSvgTransformVersion, getSvgTransformVersion } from "@/dom"
import { LoggerCategory, LoggerLevel, LoggerManager } from "@/logger"

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
  /**
   * Epoch milliseconds of the `pointerdown` that opened the current gesture — the origin the
   * `dt` field of every {@link TPointer} in this gesture counts from. A symbol built out of these pointers takes it
   * as its `creationTime`, which is what turns their relative times back into absolute ones.
   */
  gestureStartTime: number
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
    const svgElement = this.getCaptureSvg()
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

  #captureSvg?: SVGSVGElement

  /**
   * The svg pointers are mapped into. Every coalesced pointer sample needs it, so the lookup is
   * kept rather than redone per sample; it is redone only once the kept svg has left
   * `layerCapture`, which is what a renderer that rebuilds its svg does.
   */
  protected getCaptureSvg(): SVGSVGElement | null {
    if (this.layerCapture instanceof SVGSVGElement) {
      return this.layerCapture
    }
    if (!this.#captureSvg || !this.layerCapture.contains(this.#captureSvg)) {
      this.#captureSvg = this.layerCapture.querySelector("svg") ?? undefined
    }
    return this.#captureSvg ?? null
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

  /**
   * Epoch milliseconds of the gesture currently being captured. Set on `pointerdown` and read back
   * by every pointer of that gesture, so they all count from the same origin.
   */
  protected gestureStartTime = 0

  /**
   * The instant an event was captured, in epoch milliseconds and with sub-millisecond precision.
   *
   * Read off the event rather than by calling `Date.now()` in the handler: under main-thread
   * pressure the browser hands several samples to one `pointermove`, and a clock read taken while
   * replaying them would stamp them all with the same instant — the recognizer would then see a
   * burst of points captured simultaneously, which is exactly the timing information it uses to
   * segment characters. `timeStamp` is relative to the page's time origin, so it is shifted back
   * onto the epoch to keep the same reference as `creationTime`.
   */
  protected eventTime(event: Event): number {
    // Three decimals: the sum of two floats carries digits neither operand had, and they would
    // ride into `creationTime` and from there onto the wire as false precision.
    return +(performance.timeOrigin + event.timeStamp).toFixed(3)
  }

  protected extractDelta(event: Event): number {
    const delta = this.eventTime(event) - this.gestureStartTime
    // Three decimals, the precision coordinates already carry. `timestampFloatPrecision` can still
    // coarsen further, but it cannot express decimals - it rounds to a power of ten - so it no
    // longer decides the default.
    return +this.roundFloat(delta, this.configuration.timestampFloatPrecision).toFixed(3)
  }

  protected extractPointer(event: MouseEvent | TouchEvent): TPointer {
    let clientX: number, clientY: number
    if ("changedTouches" in event) {
      ;({ clientX, clientY } = event.changedTouches[0])
    } else {
      ;({ clientX, clientY } = event)
    }

    let x: number, y: number

    const svgElement = this.getCaptureSvg()

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
      dt: this.extractDelta(event),
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
      gestureStartTime: this.gestureStartTime,
    }
  }

  #penDetected = false

  /** Applies `inputMode`: in "auto", the first pen seen switches the grabber to pen only */
  protected acceptsPointerType(pointerType: string): boolean {
    if (pointerType === "pen") {
      this.#penDetected = true
      return true
    }
    switch (this.configuration.inputMode) {
      case "pen":
        return false
      case "auto":
        return !this.#penDetected
      default:
        return true
    }
  }

  protected pointerDownHandler = (evt: PointerEvent) => {
    // Checked before anything else: a rejected palm landing during a pen stroke must leave that
    // stroke's time origin and capture state untouched.
    if (!this.acceptsPointerType(evt.pointerType)) {
      return
    }
    // Reparenting layerCapture (e.g. moving one editor's DOM between several
    // inputs) changes the svg's screen position without touching its transform
    // (pan/zoom/resize) or firing a scroll event, so the version-keyed cache
    // can't detect it. Force a fresh getScreenCTM read at the start of every
    // gesture so a stale value never survives across a reparent.
    this.#cachedCTMSvg = undefined
    // Opens the gesture's time origin before the first pointer is extracted, so that pointer comes
    // out at dt 0 and every later one counts from the same instant.
    this.gestureStartTime = this.eventTime(evt)
    const pointerInfo = this.getPointerInfos(evt)
    this.#logger.debug("pointerDownHandler", pointerInfo)

    // exit if not a left click or multi-touch
    if (pointerInfo.button !== 0 || evt.buttons !== 1) {
      return
    }
    this.capturing = true
    this.pointerType = evt.pointerType
    this.capturePointer(evt)

    if (this.onPointerDown) {
      this.onPointerDown(pointerInfo)
    }
  }

  /**
   * Keeps every event of the gesture on the canvas once the pointer leaves it, until the pointer is
   * released: the page around neither starts a text selection nor reacts to a drag it never saw begin.
   */
  protected capturePointer(evt: PointerEvent): void {
    try {
      this.layerCapture.setPointerCapture(evt.pointerId)
    } catch {
      // The pointer is already gone (or the event is synthetic): there is nothing left to capture.
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
      // A context menu opens no gesture, so it has no origin of its own to count from. Left on the
      // previous gesture's origin it would report a dt of however long ago that stroke was drawn.
      this.gestureStartTime = this.eventTime(evt)
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
        gestureStartTime: this.gestureStartTime,
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
