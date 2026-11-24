// @ts-check
/**
 * Draws HTML over the ink without touching the canvas model: anything drawn as a model change
 * would land in undo/redo and reach the server.
 *
 * Each item is anchored to a box in the document frame; the boxes reach the screen through the
 * rendering layer's CTM, which pan and zoom keep up to date. The overlay keeps the items on their
 * boxes, the caller decides what they look like and where they sit around their box.
 *
 * The library is not imported here: it is only built after the unit tests and the typecheck that
 * reach this file. The caller hands over the conversion of its boxes to the rendering layer's
 * pixels, `convertBoundingBoxMillimeterToPixel` for JIIX boxes in millimeters.
 */

/**
 * @typedef {{ x: number, y: number, width: number, height: number }} TBox
 * @typedef {{
 *   element: HTMLElement,
 *   box: TBox,
 *   place: (element: HTMLElement, box: TBox) => void
 * }} TInkOverlayItem `box` in document units, handed back to `place` in container pixels
 * @typedef {(box: TBox) => TBox} TToPixels from document units to the rendering layer's pixels
 */

/**
 * `getScreenCTM` returns an SVGMatrix in some browsers, without `transformPoint`: the affine
 * transform is applied from its coefficients.
 * @param {Pick<DOMMatrix, "a" | "b" | "c" | "d" | "e" | "f">} matrix
 * @param {number} x
 * @param {number} y
 */
function transform({ a, b, c, d, e, f }, x, y) {
  return { x: a * x + c * y + e, y: b * x + d * y + f }
}

export class InkOverlay {
  /** @type {TInkOverlayItem[]} */
  #items = []
  #layoutKey = ""
  #frame = 0

  /**
   * @param {HTMLElement} container positioned element laid over the canvas
   * @param {HTMLElement} canvasElement the canvas root, holding the rendering layer
   * @param {TToPixels} toPixels
   */
  constructor(container, canvasElement, toPixels) {
    this.container = container
    this.canvasElement = canvasElement
    this.toPixels = toPixels
    this.#follow()
  }

  /**
   * @param {TInkOverlayItem[]} items
   */
  render(items) {
    this.#items = items
    this.container.replaceChildren(...items.map((item) => item.element))
    this.#layoutKey = ""
  }

  clear() {
    this.render([])
  }

  destroy() {
    window.cancelAnimationFrame(this.#frame)
    this.clear()
  }

  /** Repositions on every frame where the view moved: pan, zoom, resize */
  #follow() {
    this.#frame = window.requestAnimationFrame(() => this.#follow())
    const layer = this.canvasElement.querySelector(".ms-layer-rendering svg")
    const matrix = layer instanceof SVGSVGElement ? layer.getScreenCTM() : null
    if (!matrix || this.#items.length === 0) return
    const origin = this.container.getBoundingClientRect()
    const key = [matrix.a, matrix.d, matrix.e, matrix.f, origin.left, origin.top, origin.width].join()
    if (key === this.#layoutKey) return
    this.#layoutKey = key
    this.#items.forEach((item) => item.place(item.element, this.#toContainer(item.box, matrix, origin)))
  }

  /**
   * @param {TBox} box
   * @param {DOMMatrix} matrix
   * @param {DOMRect} origin
   * @returns {TBox}
   */
  #toContainer(box, matrix, origin) {
    const pixels = this.toPixels(box)
    const topLeft = transform(matrix, pixels.x, pixels.y)
    const bottomRight = transform(matrix, pixels.x + pixels.width, pixels.y + pixels.height)
    return {
      x: topLeft.x - origin.left,
      y: topLeft.y - origin.top,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    }
  }
}
