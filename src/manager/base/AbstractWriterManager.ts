import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { InkCanvas } from "@/canvas/variants/InkCanvas"
import type { TPointerInfo } from "@/grabber"
import { PointerEventGrabber } from "@/grabber"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { SVGRenderer } from "@/renderer"
import type { TStyle } from "@/style"
import type { TPointer, TSymbol } from "@/symbol"

/**
 * @group Manager
 */
export abstract class AbstractWriterManager {
  #logger = LoggerManager.getLogger(LoggerCategory.WRITE)
  grabber: PointerEventGrabber
  canvas: TInteractiveInkCanvas | InkCanvas
  currentSymbol?: TSymbol

  detectGesture: boolean = true

  constructor(canvas: TInteractiveInkCanvas | InkCanvas) {
    this.#logger.info("constructor")
    this.canvas = canvas
    this.grabber = new PointerEventGrabber(canvas.configuration.grabber)
  }

  get renderer(): SVGRenderer {
    return this.canvas.renderer
  }

  attach(layer: HTMLElement): void {
    this.grabber.attach(layer)
    this.grabber.onPointerDown = this.start.bind(this)
    this.grabber.onPointerMove = this.continue.bind(this)
    this.grabber.onPointerUp = this.end.bind(this)
  }

  detach(): void {
    this.grabber.detach()
  }

  protected abstract createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TSymbol
  protected abstract updateCurrentSymbol(pointer: TPointer): TSymbol

  start(info: TPointerInfo): void {
    this.#logger.info("startWriting", { info })
    const localPointer = info.pointer
    this.currentSymbol = this.createCurrentSymbol(localPointer, this.canvas.penStyle, info.pointerType)
    this.renderer.drawSymbol(this.currentSymbol!)
  }

  continue(info: TPointerInfo): void {
    this.#logger.info("continueWriting", { info })
    const localPointer = info.pointer
    this.currentSymbol = this.updateCurrentSymbol(localPointer)
    this.renderer.drawSymbol(this.currentSymbol!)
  }

  abstract end(info: TPointerInfo): Promise<void>
}
