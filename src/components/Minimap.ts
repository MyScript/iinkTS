import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { DOMFactory } from "@/components/dom"

/**
 * @group Components
 */
export type TMinimapOptions = {
  width?: number
  height?: number
}

const SVG_NS = "http://www.w3.org/2000/svg"

/**
 * Minimap component showing a scaled-down overview of the editor canvas.
 * Click or drag to navigate the editor viewport.
 * @group Components
 */
export class Minimap {
  static readonly DEFAULT_WIDTH = 200
  static readonly DEFAULT_HEIGHT = 150

  #editor: TInteractiveInkCanvas
  #width: number
  #height: number
  #container: HTMLDivElement
  #contentSvg: SVGSVGElement
  #contentGroup: SVGGElement
  #viewportRect: SVGRectElement
  #docBounds: {
    x: number
    y: number
    width: number
    height: number
  } = { x: 0, y: 0, width: 1, height: 1 }
  #isDragging = false
  #observer: MutationObserver

  constructor(editor: TInteractiveInkCanvas, options?: TMinimapOptions) {
    this.#editor = editor
    this.#width = options?.width ?? Minimap.DEFAULT_WIDTH
    this.#height = options?.height ?? Minimap.DEFAULT_HEIGHT
    this.#container = this.#createContainer()
    this.#contentSvg = this.#createContentSvg()
    this.#contentGroup = this.#createContentGroup()
    this.#viewportRect = this.#createViewportRect()
    this.#assembleDom()
    this.#observer = this.#createObserver()
    this.#bindPointerEvents()
  }

  #createContainer(): HTMLDivElement {
    return DOMFactory.div({
      className: "ms-minimap",
      style: `width:${this.#width}px;height:${this.#height}px;`,
    })
  }

  #createContentSvg(): SVGSVGElement {
    const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement
    svg.setAttribute("width", "100%")
    svg.setAttribute("height", "100%")
    svg.setAttribute("preserveAspectRatio", "none")
    return svg
  }

  #createContentGroup(): SVGGElement {
    const g = document.createElementNS(SVG_NS, "g") as SVGGElement
    g.setAttribute("pointer-events", "none")
    return g
  }

  #createViewportRect(): SVGRectElement {
    const rect = document.createElementNS(SVG_NS, "rect") as SVGRectElement
    rect.setAttribute("fill", "rgba(0, 100, 255, 0.08)")
    rect.setAttribute("stroke", "#0064ff")
    rect.setAttribute("stroke-width", "2")
    rect.setAttribute("vector-effect", "non-scaling-stroke")
    rect.setAttribute("pointer-events", "none")
    return rect
  }

  #assembleDom(): void {
    this.#contentSvg.appendChild(this.#contentGroup)
    this.#contentSvg.appendChild(this.#viewportRect)
    this.#container.appendChild(this.#contentSvg)
  }

  #createObserver(): MutationObserver {
    const observer = new MutationObserver(() => this.#sync())
    observer.observe(this.#editor.renderer.getRenderingContext(), {
      attributes: true,
      attributeFilter: ["viewBox"],
      childList: true,
    })
    return observer
  }

  #bindPointerEvents(): void {
    this.#container.addEventListener("pointerdown", this.#handlePointerDown)
    this.#container.addEventListener("pointermove", this.#handlePointerMove)
    this.#container.addEventListener("pointerup", this.#handlePointerUp)
    this.#container.addEventListener("pointercancel", this.#handlePointerUp)
  }

  #computeDocBounds(): {
    x: number
    y: number
    width: number
    height: number
  } {
    const rb = this.#editor.renderer.getBounds()
    const symbols = this.#editor.model.symbols
    if (!symbols.length) {
      return rb
    }

    const sb = this.#editor.getSymbolsBounds(symbols, 100)
    const x = Math.min(rb.x, sb.x)
    const y = Math.min(rb.y, sb.y)
    return {
      x,
      y,
      width: Math.max(rb.x + rb.width, sb.x + sb.width) - x,
      height: Math.max(rb.y + rb.height, sb.y + sb.height) - y,
    }
  }

  #stripIds(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      ;(node as Element).removeAttribute("id")
      node.childNodes.forEach((child) => this.#stripIds(child))
    }
  }

  #syncContent(): void {
    const mainLayer = this.#editor.renderer.getRenderingContext()
    const clones = Array.from(mainLayer.children)
      .filter((el) => el.tagName.toLowerCase() !== "defs")
      .map((el) => {
        const clone = el.cloneNode(true)
        this.#stripIds(clone)
        return clone
      })
    this.#contentGroup.replaceChildren(...clones)
  }

  #syncViewport(): void {
    const vb = this.#editor.renderer.getViewBox()
    this.#viewportRect.setAttribute("x", String(vb.x))
    this.#viewportRect.setAttribute("y", String(vb.y))
    this.#viewportRect.setAttribute("width", String(vb.width))
    this.#viewportRect.setAttribute("height", String(vb.height))
  }

  #sync(): void {
    this.#docBounds = this.#computeDocBounds()
    const { x, y, width, height } = this.#docBounds
    this.#contentSvg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`)
    this.#syncContent()
    this.#syncViewport()
  }

  #minimapToDoc(mx: number, my: number): { x: number; y: number } {
    const { x, y, width, height } = this.#docBounds
    return {
      x: x + (mx / this.#width) * width,
      y: y + (my / this.#height) * height,
    }
  }

  #getPointerRelative(event: PointerEvent): {
    x: number
    y: number
  } {
    const rect = this.#container.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  #centerViewOn(docX: number, docY: number): void {
    const vb = this.#editor.renderer.getViewBox()
    this.#editor.renderer.setViewBox(docX - vb.width / 2, docY - vb.height / 2, vb.width, vb.height)
  }

  #handlePointerDown = (event: PointerEvent): void => {
    this.#isDragging = true
    if (this.#container.setPointerCapture) {
      this.#container.setPointerCapture(event.pointerId)
    }
    const pos = this.#getPointerRelative(event)
    const doc = this.#minimapToDoc(pos.x, pos.y)
    this.#centerViewOn(doc.x, doc.y)
  }

  #handlePointerMove = (event: PointerEvent): void => {
    if (!this.#isDragging) {
      return
    }
    const pos = this.#getPointerRelative(event)
    const doc = this.#minimapToDoc(pos.x, pos.y)
    this.#centerViewOn(doc.x, doc.y)
  }

  #handlePointerUp = (): void => {
    this.#isDragging = false
  }

  /**
   * Returns the minimap DOM element to insert into the page.
   */
  getElement(): HTMLDivElement {
    return this.#container
  }

  /**
   * Appends the minimap to the given element and syncs the initial state.
   */
  attach(element: HTMLElement): void {
    element.appendChild(this.#container)
    this.#sync()
  }

  /**
   * Removes the minimap from its parent without cleaning up observers.
   */
  detach(): void {
    this.#container.remove()
  }

  /**
   * Disconnects the observer, removes event listeners, and removes the minimap from the DOM.
   */
  destroy(): void {
    this.#observer.disconnect()
    this.#container.removeEventListener("pointerdown", this.#handlePointerDown)
    this.#container.removeEventListener("pointermove", this.#handlePointerMove)
    this.#container.removeEventListener("pointerup", this.#handlePointerUp)
    this.#container.removeEventListener("pointercancel", this.#handlePointerUp)
    this.#container.remove()
  }
}
