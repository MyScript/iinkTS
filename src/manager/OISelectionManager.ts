import { LoggerClass, ResizeDirection, SELECTION_MARGIN, SvgElementRole } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { InternalEvent } from "../event"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { Box, SymbolType, TBoundingBox, TOISymbol, TPoint } from "../primitive"
import { OISVGRenderer, SVGBuilder } from "../renderer"
import { StyleHelper } from "../style"
import { OIResizeManager } from "./OIResizeManager"
import { OIRotationManager } from "./OIRotationManager"
import { OITranslateManager } from "./OITranslateManager"

/**
 * @group Manager
 */
export class OISelectionManager
{
  #logger = LoggerManager.getLogger(LoggerClass.SELECTION)
  #selectingId = "selecting-rect"
  startSelectionPoint?: TPoint
  endSelectionPoint?: TPoint

  behaviors: OIBehaviors

  constructor(behaviors: OIBehaviors)
  {
    this.#logger.info("constructor")
    this.behaviors = behaviors
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  get internalEvent(): InternalEvent
  {
    return this.behaviors.internalEvent
  }

  get rotator(): OIRotationManager
  {
    return this.behaviors.rotator
  }

  get translator(): OITranslateManager
  {
    return this.behaviors.translator
  }

  get resizer(): OIResizeManager
  {
    return this.behaviors.resizer
  }

  get selectionBox(): Box | undefined
  {
    if (this.startSelectionPoint && this.endSelectionPoint) {
      return Box.createFromPoints([this.startSelectionPoint, this.endSelectionPoint])
    }
    return
  }

  drawSelectingRect(box: TBoundingBox): void
  {
    this.clearSelectingRect()
    const attrs = {
      id: this.#selectingId,
      fill: "transparent",
      stroke: "grey",
      opacity: "0.25",
    }
    this.renderer.appendElement(SVGBuilder.createRect(box, attrs))
  }

  clearSelectingRect(): void
  {
    this.renderer.clearElements({ attrs: { id: this.#selectingId } })
  }

  protected getPoint(ev: PointerEvent): TPoint
  {
    const { clientLeft, scrollLeft, clientTop, scrollTop } = this.renderer.parent
    const rect: DOMRect = this.renderer.parent.getBoundingClientRect()
    return {
      x: ev.clientX - rect.left - clientLeft + scrollLeft,
      y: ev.clientY - rect.top - clientTop + scrollTop,
    }
  }

  protected createTranslateRect(box: TBoundingBox): SVGRectElement
  {
    const attrs = {
      role: SvgElementRole.Translate,
      style: "cursor:move",
      fill: "transparent",
      stroke: "transparent",
    }
    const boxWithMarge: TBoundingBox = {
      height: box.height,
      width: box.width,
      x: box.x,
      y: box.y
    }
    const translateEl = SVGBuilder.createRect(boxWithMarge, attrs)
    const handler = (ev: PointerEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      this.translator.continue(this.getPoint(ev))
    }
    const endHandler = (ev: PointerEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      this.translator.end(this.getPoint(ev))
      this.renderer.layer.removeEventListener("pointermove", handler)
      this.renderer.layer.removeEventListener("pointercancel", endHandler)
      this.renderer.layer.removeEventListener("pointerleave", endHandler)
      this.renderer.layer.removeEventListener("pointerup", endHandler)
    }

    translateEl.addEventListener("pointerdown", (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      this.translator.start(ev.target as Element, this.getPoint(ev))
      this.renderer.layer.addEventListener("pointermove", handler)
      this.renderer.layer.addEventListener("pointercancel", endHandler)
      this.renderer.layer.addEventListener("pointerleave", endHandler)
      this.renderer.layer.addEventListener("pointerup", endHandler)
    })
    return translateEl
  }

  protected createRotateGroup(box: TBoundingBox): SVGGElement
  {
    const group = SVGBuilder.createGroup({
      role: SvgElementRole.Rotate,
      "vector-effect": "non-scaling-size",
      "style": "cursor:pointer;",
      "opacity": "1",
    })
    const radius = 8
    const center: TPoint = {
      x: (box.x + box.width / 2),
      y: box.y - 20
    }
    const attrs1 = {
      role: SvgElementRole.Rotate,
      "stroke-width": "2",
      "stroke": "black",
      fill: "white",
    }
    group.appendChild(SVGBuilder.createCircle(center, radius, attrs1))

    const attrs2 = {
      role: SvgElementRole.Rotate,
      fill: "black",
    }
    group.appendChild(SVGBuilder.createCircle(center, radius / 2, attrs2))

    const handler = (ev: PointerEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      this.rotator.continue(this.getPoint(ev))
    }
    const endHandler = (ev: PointerEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      this.rotator.end(this.getPoint(ev))
      this.renderer.layer.removeEventListener("pointermove", handler)
      this.renderer.layer.removeEventListener("pointercancel", endHandler)
      this.renderer.layer.removeEventListener("pointerleave", endHandler)
      this.renderer.layer.removeEventListener("pointerup", endHandler)
    }

    group.addEventListener("pointerdown", (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      this.rotator.start(ev.target as Element, this.getPoint(ev))
      this.renderer.layer.addEventListener("pointermove", handler)
      this.renderer.layer.addEventListener("pointercancel", endHandler)
      this.renderer.layer.addEventListener("pointerleave", endHandler)
      this.renderer.layer.addEventListener("pointerup", endHandler)
    })
    return group
  }

  protected createResizeGroup(box: TBoundingBox): SVGGElement
  {
    const group = SVGBuilder.createGroup({
      role: SvgElementRole.Resize,
      "vector-effect": "non-scaling-size",
      "stroke-width": "4",
      "stroke": "#1A9FFF",
    })
    const P_NW: TPoint = { x: box.x - SELECTION_MARGIN, y: box.y - SELECTION_MARGIN }
    const P_NE: TPoint = { x: box.x + box.width + SELECTION_MARGIN, y: box.y - SELECTION_MARGIN }
    const P_SE: TPoint = { x: box.x + box.width + SELECTION_MARGIN, y: box.y + box.height + SELECTION_MARGIN }
    const P_SW: TPoint = { x: box.x - SELECTION_MARGIN, y: box.y + box.height + SELECTION_MARGIN }

    const bindEl = (el: SVGElement, transformOrigin: TPoint) => {
      const handler = (ev: PointerEvent) => {
        ev.preventDefault()
        ev.stopPropagation()
        this.resizer.continue(this.getPoint(ev))
      }
      const endHandler = (ev: PointerEvent) => {
        ev.preventDefault()
        ev.stopPropagation()
        this.resizer.end(this.getPoint(ev))
        this.renderer.layer.removeEventListener("pointermove", handler)
        this.renderer.layer.removeEventListener("pointercancel", endHandler)
        this.renderer.layer.removeEventListener("pointerleave", endHandler)
        this.renderer.layer.removeEventListener("pointerup", endHandler)
      }

      el.addEventListener("pointerdown", (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        this.resizer.start(ev.target as Element, transformOrigin)
        this.renderer.layer.addEventListener("pointermove", handler)
        this.renderer.layer.addEventListener("pointercancel", endHandler)
        this.renderer.layer.addEventListener("pointerleave", endHandler)
        this.renderer.layer.addEventListener("pointerup", endHandler)
      })
    }

    const sideResizeDefs = [
      { direction: ResizeDirection.North, p1: P_NW, p2: P_NE, transformOrigin: { x: box.x + box.width / 2, y: box.y + box.height } },
      { direction: ResizeDirection.East, p1: P_NE, p2: P_SE, transformOrigin: { x: box.x, y: box.y + box.height / 2 } },
      { direction: ResizeDirection.South, p1: P_SW, p2: P_SE, transformOrigin: { x: box.x + box.width / 2, y: box.y } },
      { direction: ResizeDirection.West, p1: P_NW, p2: P_SW, transformOrigin: { x: box.x + box.width, y: box.y + box.height / 2 } },
    ]
    sideResizeDefs.forEach(def =>
    {
      const attrs = {
        role: SvgElementRole.Resize,
        "resize-direction": def.direction,
        "transform-origin": JSON.stringify(def.transformOrigin),
        style: `cursor:${ def.direction };`
      }
      const lineResize = SVGBuilder.createLine(def.p1, def.p2, attrs)
      bindEl(lineResize, def.transformOrigin)
      group.appendChild(lineResize)
    })
    const cornerResizeDefs = [
      { direction: ResizeDirection.NorthWest, p: P_NW, transformOrigin: { x: box.x + box.width, y: box.y + box.height } },
      { direction: ResizeDirection.NorthEast, p: P_NE, transformOrigin: { x: box.x, y: box.y + box.height } },
      { direction: ResizeDirection.SouthEast, p: P_SE, transformOrigin: { x: box.x, y: box.y } },
      { direction: ResizeDirection.SouthWest, p: P_SW, transformOrigin: { x: box.x + box.width, y: box.y } },
    ]
    cornerResizeDefs.forEach(def =>
    {
      const attrs = {
        "stroke-width": "4",
        role: SvgElementRole.Resize,
        "resize-direction": def.direction,
        "transform-origin": JSON.stringify(def.transformOrigin),
        transform: "scale(1, 1)",
        fill: "white",
        style: `cursor:${ def.direction };`
      }
      const cornerResize = SVGBuilder.createCircle(def.p, 5, attrs)
      bindEl(cornerResize, def.transformOrigin)
      group.appendChild(cornerResize)
    })
    return group
  }

  protected createSelectedGroup(box: TBoundingBox, interact = { resize: false, translate: false, rotate: false, color: false }): SVGGElement
  {
    const attrs = {
      id: `selected-${ Date.now() }`,
      role: SvgElementRole.Selected,
    }
    const surroundGroup = SVGBuilder.createGroup(attrs)
    if (interact.translate) {
      surroundGroup.appendChild(this.createTranslateRect(box))
    }
    if (interact.resize) {
      surroundGroup.appendChild(this.createResizeGroup(box))
    }
    if (interact.rotate) {
      surroundGroup.appendChild(this.createRotateGroup(box))
    }
    return surroundGroup
  }

  protected wrapElements(elements: SVGElement[]): SVGGElement | undefined
  {
    this.#logger.info("drawSelectedGroup", { elements })

    if (!elements.length) return

    const elementsWithBounds = elements.map(element => ({ element, bounds: this.renderer.getElementBounds(element) }))

    const box = Box.createFromBoxes(elementsWithBounds.filter(e => e.bounds.width && e.bounds.height).map(e => e.bounds))
    const interact = {
      resize: elements.some(e => e.getAttribute("type") !== SymbolType.Decorator),
      translate: elements.some(e => e.getAttribute("type") !== SymbolType.Decorator),
      rotate: elements.some(e => e.getAttribute("type") !== SymbolType.Decorator),
      color: true
    }

    const surroundGroup = this.createSelectedGroup(box, interact)
    elements.forEach(el => el.setAttribute("filter", `url(#${ this.renderer.selectionFilterId })`))

    elements.forEach(s => s.setAttribute("style", "pointer-events:none;" + s.getAttribute("style")))

    const SURROUND_ATTRS = {
      style: "pointer-events: none",
      fill: "transparent",
      stroke: "#1A9FFF",
      "stroke-width": "1",
      "stroke-dasharray": "4",
      "vector-effect": "non-scaling-size",
    }
    elementsWithBounds.forEach(el =>
    {
      if (el.element.getAttribute("type") !== SymbolType.Decorator) {
        surroundGroup.prepend(SVGBuilder.createRect(el.bounds, SURROUND_ATTRS))
        surroundGroup.insertAdjacentElement("afterbegin", el.element)
      }
    })
    return surroundGroup
  }

  protected unWrap(group: SVGGElement): void
  {
    const querySymbols = Object.values(SymbolType).filter(v => v !== SymbolType.Decorator).map(v => `[type=${ v }]`).join(",")
    group.querySelectorAll(querySymbols)
      .forEach(s =>
      {
        const style = s.getAttribute("style") as string
        const styleJson = StyleHelper.stringToJSON(style)
        styleJson["pointer-events"] = "stroke;"
        // delete styleJson["pointer-events"]
        s.setAttribute("style", StyleHelper.JSONToString(styleJson))
        s.removeAttribute("filter")
        group.insertAdjacentElement("beforebegin", s)
      })
    group.remove()
  }

  drawSelectedGroup(symbols: TOISymbol[]): void
  {
    if (!symbols.length) return
    const symbolElments = symbols.map(s => this.renderer.getElementById(s.id)) as SVGGeometryElement[]
    const group = this.wrapElements(symbolElments)
    if (group) {
      this.renderer.appendElement(group)
    }
  }

  resetSelectedGroup(symbols: TOISymbol[]): void
  {
    this.#logger.info("resetSelectedGroup", { strokes: symbols })
    this.removeSelectedGroup()
    this.drawSelectedGroup(symbols)
  }

  removeSelectedGroup(): void
  {
    this.#logger.info("removeSelectedGroup")
    this.renderer.getElements({ attrs: { role: SvgElementRole.Selected.toString() } })
      .forEach(g =>
      {
        this.unWrap(g as SVGGElement)
      })
  }

  start(point: TPoint): TOISymbol[]
  {
    this.startSelectionPoint = point
    this.endSelectionPoint = point
    const updatedSymbols: TOISymbol[] = []

    this.model.symbols.forEach(s =>
    {
      if (s.selected !== s.overlaps(this.selectionBox!)) {
        s.selected = s.overlaps(this.selectionBox!)
        updatedSymbols.push(s)
        this.renderer.drawSymbol(s)
      }
    })
    this.drawSelectingRect(this.selectionBox!)
    return updatedSymbols
  }

  continue(point: TPoint): TOISymbol[]
  {
    if (!this.startSelectionPoint) {
      throw new Error("You need to call startSelectionByBox before")
    }
    this.endSelectionPoint = point
    const updatedSymbols: TOISymbol[] = []
    this.model.symbols.forEach(s =>
    {
      if (s.selected !== s.overlaps(this.selectionBox!)) {
        s.selected = s.overlaps(this.selectionBox!)
        updatedSymbols.push(s)
        this.renderer.drawSymbol(s)
      }
    })
    this.drawSelectingRect(this.selectionBox!)
    return updatedSymbols
  }

  end(point: TPoint): TOISymbol[]
  {
    this.endSelectionPoint = point
    const updatedSymbols = this.continue(point)
    this.startSelectionPoint = undefined
    this.endSelectionPoint = undefined
    this.clearSelectingRect()
    this.drawSelectedGroup(this.model.symbolsSelected)
    this.internalEvent.emitSelected(this.model.symbolsSelected)
    return updatedSymbols
  }
}
