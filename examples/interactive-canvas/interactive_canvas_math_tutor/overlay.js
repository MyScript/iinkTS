// @ts-check
/**
 * Draws the verdicts over the ink: a mark before each line, a highlight and a hint under the
 * first wrong one, and what the machine read in the right margin. Following pan and zoom is
 * left to the ink overlay.
 */

import { convertBoundingBoxMillimeterToPixel } from "../../../dist/iink.esm.js"
import { InkOverlay } from "../../components/ink-overlay/ink-overlay.js"
import { UI } from "./strings.js"

/**
 * @typedef {import("./judge.js").TMark} TMark
 * @typedef {import("../../components/ink-overlay/ink-overlay.js").TBox} TBox
 * @typedef {import("../../components/ink-overlay/ink-overlay.js").TInkOverlayItem} TInkOverlayItem
 * @typedef {"mark" | "highlight" | "hint" | "reading"} TPlace
 * @typedef {{ render: (latex: string, element: HTMLElement, options: object) => void }} TKatex
 */

const MARK_GAP = 8
const HINT_GAP = 6

/** @param {TBox} box */
const middle = (box) => box.y + box.height / 2

/** @type {Record<TPlace, (element: HTMLElement, box: TBox) => void>} */
const PLACES = {
  mark: ({ style }, box) => {
    style.left = `${box.x - MARK_GAP}px`
    style.top = `${middle(box)}px`
  },
  highlight: ({ style }, box) => {
    Object.assign(style, {
      left: `${box.x}px`,
      top: `${box.y}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    })
  },
  hint: ({ style }, box) => {
    style.left = `${box.x}px`
    style.top = `${box.y + box.height + HINT_GAP}px`
  },
  reading: ({ style }, box) => {
    style.top = `${middle(box)}px`
  },
}

export class TutorOverlay {
  /**
   * @param {HTMLElement} container positioned element laid over the canvas
   * @param {HTMLElement} canvasElement the canvas root, holding the rendering layer
   * @param {TKatex | undefined} katex
   */
  constructor(container, canvasElement, katex) {
    this.ink = new InkOverlay(container, canvasElement, convertBoundingBoxMillimeterToPixel)
    this.katex = katex
  }

  /**
   * @param {TMark[]} marks
   */
  render(marks) {
    this.ink.render(marks.flatMap((mark) => this.#itemsOf(mark)))
  }

  clear() {
    this.ink.clear()
  }

  /**
   * @param {TMark} mark
   * @returns {TInkOverlayItem[]}
   */
  #itemsOf(mark) {
    const items = [this.#item(mark, "mark", UI.marks[mark.status]), this.#reading(mark)]
    if (mark.status === "wrong") items.push(this.#item(mark, "highlight", ""))
    if (mark.hint) items.push(this.#item(mark, "hint", mark.hint))
    return items
  }

  /**
   * @param {TMark} mark
   * @param {TPlace} place
   * @param {string} text
   * @returns {TInkOverlayItem}
   */
  #item(mark, place, text) {
    const element = document.createElement("div")
    element.className = `tutor-${place} is-${mark.status}`
    element.textContent = text
    return { element, box: mark.line.box, place: PLACES[place] }
  }

  /**
   * @param {TMark} mark
   * @returns {TInkOverlayItem}
   */
  #reading(mark) {
    const item = this.#item(mark, "reading", mark.line.label)
    try {
      this.katex?.render(mark.line.label, item.element, { throwOnError: false })
    } catch {
      // Unparsable LaTeX stays as plain text
    }
    return item
  }
}
