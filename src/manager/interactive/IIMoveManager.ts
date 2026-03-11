import { InteractiveInkEditor } from "../../editor/InteractiveInkEditor"
import { PointerEventGrabber, PointerInfo } from "../../grabber"
import { LoggerCategory, LoggerManager } from "../../logger"
import { SVGRenderer } from "../../renderer"

/**
 * @group Manager
 */
export class IIMoveManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.MOVE)
  grabber: PointerEventGrabber
  editor: InteractiveInkEditor

  origin?: {
    viewBoxX: number,
    viewBoxY: number,
    clientX: number,
    clientY: number
  }

  constructor(editor: InteractiveInkEditor)
  {
    this.editor = editor
    this.grabber = new PointerEventGrabber(editor.configuration.grabber)
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  protected updateViewBox(info: PointerInfo, redrawGuide: boolean): void
  {
    if (!this.origin) {
      this.#logger.error("Can't move cause origin is undefined")
      return
    }
    const dx = info.clientX - this.origin.clientX
    const dy = info.clientY - this.origin.clientY

    const viewBox = this.renderer.getViewBox()
    const zoom = this.renderer.getZoom()

    const viewBoxDx = -dx / zoom
    const viewBoxDy = -dy / zoom

    this.renderer.setViewBox(
      this.origin.viewBoxX + viewBoxDx,
      this.origin.viewBoxY + viewBoxDy,
      viewBox.width,
      viewBox.height,
      redrawGuide
    )
  }

  attach(layer: HTMLElement): void
  {
    this.#logger.info("attach", { layer })
    this.grabber.attach(layer)
    this.grabber.onPointerDown = this.start.bind(this)
    this.grabber.onPointerMove = this.continue.bind(this)
    this.grabber.onPointerUp = this.end.bind(this)
  }

  detach(): void
  {
    this.#logger.info("detach")
    this.grabber.detach()
  }

  start(info: PointerInfo): void
  {
    const viewBox = this.renderer.getViewBox()
    this.origin = {
      viewBoxX: viewBox.x,
      viewBoxY: viewBox.y,
      clientX: info.clientX,
      clientY: info.clientY,
    }
    this.#logger.info("start", { origin: this.origin })
  }

  continue(info: PointerInfo): void
  {
    this.#logger.info("continue", { info })
    this.updateViewBox(info, false)
  }

  end(info: PointerInfo): void
  {
    this.#logger.info("end", { info })
    this.updateViewBox(info, true)
    this.origin = undefined
  }
}
