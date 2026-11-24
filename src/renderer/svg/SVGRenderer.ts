import type { TBox, TPoint, TPointer } from "@/core"
import { BoxOps, getClosestPoints, MatrixTransform, OBBOps, type TOBB } from "@/core"
import { bumpSvgTransformVersion } from "@/dom"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { TEraser, TSymbol } from "@/symbol"
import { SymbolType } from "@/symbol"
import { arrowHeadEndMarkerId, arrowHeadStartMarkerId, SymbolGeometry, symbolRegistry } from "@/symbol-utils"

import { BaseRenderer } from "../base"
import type { TIIRendererConfiguration } from "../RendererConfiguration"
import { SvgElementRole } from "./SvgElementRole"
import { SVGBuilder } from "./utils/SVGBuilder"
import { GUIDE_PATH_ATTRS, SUB_GUIDE_PATH_ATTRS, SVGRendererConst } from "./utils/SVGRendererConst"

/**
 * @group Renderer
 */
export class SVGRenderer extends BaseRenderer<SVGSVGElement, TIIRendererConfiguration> {
  #logger = LoggerManager.getLogger(LoggerCategory.RENDERER)
  groupGuidesId = "guides-wrapper"

  layer!: SVGSVGElement
  definitionGroup!: SVGGElement
  /**
   * Dedicated overlay for the stroke currently being drawn. Kept out of `layer`
   * so redrawing it every frame doesn't force the browser to repaint every
   * other symbol - cost stays proportional to the current stroke, not the
   * total number of symbols on the canvas.
   */
  #currentSymbolLayer!: SVGSVGElement

  verticalGuides: number[] = []
  horizontalGuides: number[] = []

  #zoom: number = 1
  #viewBox: {
    x: number
    y: number
    width: number
    height: number
  } = { x: 0, y: 0, width: 0, height: 0 }

  /**
   * Margin added around the viewBox (as a ratio of its width/height) before culling
   * a symbol's element from the DOM, so a small pan doesn't immediately pop content in/out.
   */
  static readonly VIRTUALIZATION_MARGIN_RATIO = 0.5

  /** How much wider than the line a selection halo is, in screen pixels (half of it each side) */
  static readonly #HALO_SPREAD = 4

  /** What a group wrapping a selected symbol takes over from its element */
  static readonly #ADDRESS_ATTRIBUTES = ["id", "type", "transform"] as const

  /**
   * Symbols drawn selected. Kept here rather than read off the element, because an element is
   * rebuilt from the symbol alone — on a redraw, a deferred rebuild, a symbol scrolling back in.
   */
  #selectedIds = new Set<string>()

  /**
   * Tracks every drawn symbol's element and bounds, whether currently attached to
   * `layer` or not - see {@link drawSymbol} and {@link #reconcileVirtualization}.
   * Off-screen symbols keep their built element here instead of in the DOM, so
   * pan/zoom over a large document doesn't force a repaint of the whole scene.
   */
  #virtualizedSymbols = new Map<
    string,
    {
      element: SVGGraphicsElement
      bounds: TOBB
      isDecorator: boolean
      /**
       * Set when a redraw was skipped because the symbol was outside the extended viewBox, so
       * `element` no longer matches the symbol. `#reconcileVirtualization` rebuilds from this the
       * moment the symbol becomes visible, and clears it.
       */
      pendingRedraw?: TSymbol
    }
  >()

  constructor(configuration: TIIRendererConfiguration) {
    super(configuration)
    this.#logger.info("constructor", {
      configuration,
    })
    this.configuration = configuration
  }

  protected initLayer(): void {
    const width = Math.max(this.configuration.minWidth, this.parent.clientWidth)
    const height = Math.max(this.configuration.minHeight, this.parent.clientHeight)
    this.layer = SVGBuilder.createLayer({
      x: 0,
      y: 0,
      width,
      height,
    })
    this.layer.style.setProperty("height", "auto")
    this.layer.style.setProperty("width", "auto")
    this.layer.style.setProperty("display", "block")
    this.#viewBox = { x: 0, y: 0, width, height }
    this.layer.appendChild(this.createSVGTools())
    this.parent.appendChild(this.layer)

    this.#currentSymbolLayer = SVGBuilder.createLayer(
      { x: 0, y: 0, width, height },
      { "data-layer": "CAPTURE", style: "pointer-events: none;" }
    )
    this.parent.appendChild(this.#currentSymbolLayer)
  }

  /** Keeps the current-symbol overlay's viewBox/size aligned with `layer`'s. */
  #syncCurrentSymbolLayerViewBox(): void {
    const width = this.layer.getAttribute("width")
    const height = this.layer.getAttribute("height")
    if (width) {
      this.#currentSymbolLayer.setAttribute("width", width)
    }
    if (height) {
      this.#currentSymbolLayer.setAttribute("height", height)
    }
    this.#currentSymbolLayer.setAttribute(
      "viewBox",
      `${this.#viewBox.x}, ${this.#viewBox.y}, ${this.#viewBox.width}, ${this.#viewBox.height}`
    )
  }

  #isInViewBox(bounds: TOBB): boolean {
    const marginX = this.#viewBox.width * SVGRenderer.VIRTUALIZATION_MARGIN_RATIO
    const marginY = this.#viewBox.height * SVGRenderer.VIRTUALIZATION_MARGIN_RATIO
    const extendedViewBox: TBox = {
      x: this.#viewBox.x - marginX,
      y: this.#viewBox.y - marginY,
      width: this.#viewBox.width + 2 * marginX,
      height: this.#viewBox.height + 2 * marginY,
    }
    return OBBOps.overlapsBox(bounds, extendedViewBox)
  }

  /**
   * Attaches symbols that scrolled into the (extended) viewBox and detaches symbols that scrolled
   * out of it. Elements are not rebuilt here, except for the one case where `drawSymbol` deferred a
   * rebuild because the symbol was off screen — that debt is settled on the way in.
   */
  #reconcileVirtualization(): void {
    this.#virtualizedSymbols.forEach((tracked) => {
      if (!this.#isInViewBox(tracked.bounds)) {
        tracked.element.remove()
        return
      }
      if (tracked.pendingRedraw) {
        const rebuilt = this.buildElementFromSymbol(tracked.pendingRedraw)
        tracked.pendingRedraw = undefined
        if (rebuilt) {
          tracked.element.remove()
          tracked.element = rebuilt
        }
      }
      if (tracked.element.parentNode === null) {
        if (tracked.isDecorator) {
          this.definitionGroup.insertAdjacentElement("afterend", tracked.element)
        } else {
          this.layer.appendChild(tracked.element)
        }
      }
    })
  }

  protected createDefs(): SVGDefsElement {
    const defs = SVGBuilder.createDefs()

    const SIZE = 5
    const REFX = SIZE - 1,
      REFY = SIZE / 2
    const arrowHeadMarkerAttrs = {
      style: SVGRendererConst.noSelection,
      fill: "context-stroke",
      markerWidth: SIZE.toString(),
      markerHeight: SIZE.toString(),
      refX: REFX.toString(),
      refY: REFY.toString(),
    }

    const arrowHeadStart = SVGBuilder.createMarker(arrowHeadStartMarkerId, {
      ...arrowHeadMarkerAttrs,
      orient: "auto-start-reverse",
    })
    arrowHeadStart.appendChild(SVGBuilder.createPolygon([0, 0, SIZE, REFY, 0, SIZE], arrowHeadMarkerAttrs))
    defs.appendChild(arrowHeadStart)

    const arrowHeadEnd = SVGBuilder.createMarker(arrowHeadEndMarkerId, { ...arrowHeadMarkerAttrs, orient: "auto" })
    arrowHeadEnd.appendChild(SVGBuilder.createPolygon([0, 0, SIZE, REFY, 0, SIZE], arrowHeadMarkerAttrs))
    defs.appendChild(arrowHeadEnd)

    const crossMarkerAttrs = {
      style: SVGRendererConst.noSelection,
      markerWidth: "5",
      markerHeight: "5",
      refX: "0",
      refY: "0",
      viewBox: "-5 -5 10 10",
    }
    const cross = SVGBuilder.createMarker(SVGRendererConst.crossMarker, crossMarkerAttrs)
    cross.appendChild(
      SVGBuilder.createPath({
        d: "M -4,-4 L 4,4 M -4,4 L 4,-4",
        stroke: "white",
        "stroke-width": "3",
      })
    )
    cross.appendChild(
      SVGBuilder.createPath({
        d: "M -4,-4 L 4,4 M -4,4 L 4,-4",
        stroke: "context-stroke",
        "stroke-width": "2",
      })
    )
    defs.appendChild(cross)

    return defs
  }

  protected createFilters(): SVGGElement {
    const filtersGroup = SVGBuilder.createGroup({
      id: "filters-group",
    })
    return filtersGroup
  }

  protected drawGuides(): void {
    this.verticalGuides = []
    this.horizontalGuides = []

    const viewBox = this.#viewBox
    const maxMargin = 2000
    const calculatedMargin = Math.max(viewBox.width, viewBox.height) * 2
    const margin = Math.min(calculatedMargin, maxMargin)

    const startX = viewBox.x - margin
    const endX = viewBox.x + viewBox.width + margin
    const startY = viewBox.y - margin
    const endY = viewBox.y + viewBox.height + margin

    const offSet = this.configuration.guides.gap
    const subOffSet = this.configuration.guides.gap / 5
    const attrs = {
      id: this.groupGuidesId,
      stroke: "grey",
      opacity: "0.5",
      style: SVGRendererConst.noSelection,
      role: SvgElementRole.Guide,
    }
    const guidesGroup = SVGBuilder.createGroup(attrs)

    switch (this.configuration.guides.type) {
      case "line": {
        let pathData = ""
        const firstLineY = Math.floor(startY / offSet) * offSet + offSet
        for (let y = firstLineY; y < endY; y += offSet) {
          this.horizontalGuides.push(y)
          pathData += `M ${startX + offSet} ${y} L ${endX - offSet} ${y} `
        }
        if (pathData) {
          const path = SVGBuilder.createPath({
            ...GUIDE_PATH_ATTRS,
            d: pathData,
            style: SVGRendererConst.noSelection,
          })
          guidesGroup.appendChild(path)
        }
        break
      }
      case "grid": {
        let mainPathData = ""
        let subPathData = ""
        const drawSubGuides = this.#zoom >= 0.5

        const firstGridY = Math.floor(startY / offSet) * offSet
        for (let y = firstGridY; y < endY; y += offSet) {
          mainPathData += `M ${startX} ${y} L ${endX} ${y} `
          this.horizontalGuides.push(y)
          if (drawSubGuides) {
            for (let subY = y + subOffSet; subY < y + offSet && subY < endY; subY += subOffSet) {
              this.horizontalGuides.push(subY)
              subPathData += `M ${startX} ${subY} L ${endX} ${subY} `
            }
          }
        }

        const firstGridX = Math.floor(startX / offSet) * offSet
        for (let x = firstGridX; x < endX; x += offSet) {
          mainPathData += `M ${x} ${startY} L ${x} ${endY} `
          this.verticalGuides.push(x)
          if (drawSubGuides) {
            for (let subX = x + subOffSet; subX < x + offSet && subX < endX; subX += subOffSet) {
              this.verticalGuides.push(subX)
              subPathData += `M ${subX} ${startY} L ${subX} ${endY} `
            }
          }
        }

        if (mainPathData) {
          const mainPath = SVGBuilder.createPath({
            ...GUIDE_PATH_ATTRS,
            d: mainPathData,
            style: SVGRendererConst.noSelection,
          })
          guidesGroup.appendChild(mainPath)
        }
        if (subPathData) {
          const subPath = SVGBuilder.createPath({
            ...SUB_GUIDE_PATH_ATTRS,
            d: subPathData,
            style: SVGRendererConst.noSelection,
          })
          guidesGroup.appendChild(subPath)
        }
        break
      }
      case "point": {
        // Tiled pattern instead of one path with a dot per grid point: painting
        // thousands of arc subpaths every frame is what caused the write-lag
        // (cf IIC-1731 investigation) - a pattern rasterizes one tile and repeats it,
        // so cost stays ~constant regardless of gap/viewport size.
        const firstPointX = Math.floor(startX / offSet) * offSet + offSet
        const firstPointY = Math.floor(startY / offSet) * offSet + offSet

        for (let x = firstPointX; x < endX; x += offSet) {
          this.verticalGuides.push(x)
        }
        for (let y = firstPointY; y < endY; y += offSet) {
          this.horizontalGuides.push(y)
        }

        const patternId = `${this.groupGuidesId}-point-pattern`
        const pattern = SVGBuilder.createPattern(patternId, {
          x: firstPointX,
          y: firstPointY,
          width: offSet,
          height: offSet,
        })
        pattern.appendChild(SVGBuilder.createCircle({ x: 0, y: 0 }, 1, { fill: "grey" }))
        guidesGroup.appendChild(pattern)

        const pointsRect = SVGBuilder.createRect(
          { x: startX, y: startY, width: endX - startX, height: endY - startY },
          { fill: `url(#${patternId})`, stroke: "none", style: SVGRendererConst.noSelection }
        )
        guidesGroup.appendChild(pointsRect)
        break
      }
      default:
        this.#logger.error("drawGuides", `Guide type unknown: ${this.configuration.guides.type}`)
        break
    }
    this.horizontalGuides = [...new Set(this.horizontalGuides)]
    this.verticalGuides = [...new Set(this.verticalGuides)]
    this.definitionGroup.appendChild(guidesGroup)
  }

  protected removeGuides(): void {
    this.verticalGuides = []
    this.horizontalGuides = []
    this.getElementById(this.groupGuidesId)?.remove()
  }

  redrawGuides(): void {
    if (this.configuration.guides.enable) {
      this.removeGuides()
      this.drawGuides()
    }
  }

  protected createSVGTools(): SVGGElement {
    this.definitionGroup = SVGBuilder.createGroup({ id: "definition-group" })
    this.definitionGroup.appendChild(this.createDefs())
    this.definitionGroup.appendChild(this.createFilters())
    if (this.configuration.guides.enable) {
      this.drawGuides()
    }
    return this.definitionGroup
  }

  init(element: HTMLElement): void {
    this.#logger.info("init", { element })
    this.parent = element
    this.parent.oncontextmenu = () => false
    this.initLayer()
  }

  getAttribute(id: string, name: string): string | undefined | null {
    const element = this.getElementById(id)
    return element?.getAttribute(name)
  }

  setAttribute(id: string, name: string, value: string): void {
    const element = this.getElementById(id)
    element?.setAttribute(name, value)
  }

  #buildEraserElement(eraser: TEraser): SVGPathElement {
    const firstPoint = eraser.pointers.at(0) as TPointer
    let d = `M ${firstPoint.x} ${firstPoint.y}`

    if (eraser.pointers.length === 1) {
      const w = eraser.style.width || 4
      d += ` L ${firstPoint.x + w / 2} ${firstPoint.y}`
    } else {
      eraser.pointers.slice(1).forEach((p: TPointer) => (d += ` L ${p.x} ${p.y}`))
    }

    return SVGBuilder.createPath({
      id: eraser.id,
      type: "eraser",
      "stroke-width": String(eraser.style.width),
      stroke: eraser.style.color,
      opacity: String(eraser.style.opacity),
      shadowBlur: "5",
      "stroke-linecap": "round",
      fill: "transparent",
      d: d,
    })
  }

  buildElementFromSymbol(symbol: TSymbol): SVGGraphicsElement | undefined {
    const util = symbolRegistry.getUtil(symbol.type)
    if (!util) {
      this.#logger.error("buildElementFromSymbol", `no util for symbol: "${JSON.stringify(symbol)}"`)
      return undefined
    }
    // No check that the util can draw: `getSVGElement` is part of the contract. This used to log
    // "no util for symbol" for a util that existed but had no draw method, which said the wrong
    // thing about a registration that had in fact worked.
    const element = util.getSVGElement(symbol)
    // Applied here, where every element is built, so a redraw, a deferred rebuild or a symbol coming
    // back into view keeps its outline without each of them having to remember it
    return element && this.#selectedIds.has(symbol.id) ? this.#outlineSelected(symbol, element) : element
  }

  prependElement(el: Element): void {
    this.layer.prepend(el)
  }

  changeOrderSymbol(symbolToMove: TSymbol, position: "first" | "last" | "forward" | "backward"): void {
    const moveEl = this.getElementById(symbolToMove.id)
    if (!moveEl) {
      return
    }
    switch (position) {
      case "first":
        this.definitionGroup.insertAdjacentElement("afterend", moveEl)
        break
      case "last":
        this.layer.insertAdjacentElement("beforeend", moveEl)
        break
      case "forward":
        moveEl.nextElementSibling?.insertAdjacentElement("afterend", moveEl)
        break
      case "backward":
        if (moveEl.previousElementSibling !== this.definitionGroup) {
          moveEl.previousElementSibling?.insertAdjacentElement("beforebegin", moveEl)
        }
        break
    }
  }

  appendElement(el: Element): void {
    this.layer.appendChild(el)
  }

  removeElement(id: string): void {
    this.#logger.debug("Element", { id })
    this.#virtualizedSymbols.delete(id)
    this.#selectedIds.delete(id)
    if (!this.layer) {
      this.#logger.debug("removeElement: layer not initialized yet, skipping")
      return
    }
    this.getElementById(id)?.remove()
  }

  drawSymbol(symbol: TSymbol | TEraser): SVGGraphicsElement | undefined {
    this.#logger.debug("drawSymbol", { symbol })
    const oldNode = this.getElementById(symbol?.id)

    if (symbol.type === SymbolType.Eraser) {
      const svgEl = this.#buildEraserElement(symbol as TEraser)
      if (svgEl) {
        if (oldNode) {
          oldNode.replaceWith(svgEl)
        } else {
          this.layer.appendChild(svgEl)
        }
      }
      return svgEl
    }

    const tracked = this.#virtualizedSymbols.get(symbol.id)
    // Only computed when a util is registered for this type: `buildElementFromSymbol` below already
    // owns the "no util" case (logs and returns undefined), and `SymbolGeometry.boundsOf` throws for
    // an unregistered type instead of returning undefined - it must not run ahead of that guard.
    const bounds = symbolRegistry.has(symbol.type) ? SymbolGeometry.boundsOf(symbol as TSymbol) : undefined

    // Building an element walks every pointer of the symbol, so doing it for a symbol nobody can see
    // is work thrown away. Committing a transform over a large selection redraws every symbol in it:
    // on a 4419-stroke document that is 4419 rebuilt paths to keep the 295 elements the viewport
    // actually holds. Defer instead, and let `#reconcileVirtualization` pay for the ones that come
    // into view. Only a symbol already tracked can be deferred — the first draw must produce an
    // element, because `drawSymbol` and `getElementById` are expected to return one off screen too.
    if (tracked && bounds && !this.#isInViewBox(bounds)) {
      tracked.bounds = bounds
      tracked.pendingRedraw = symbol as TSymbol
      tracked.element.remove()
      return tracked.element
    }

    const svgEl = this.buildElementFromSymbol(symbol as TSymbol)
    if (svgEl && bounds) {
      const isDecorator = symbol.type === SymbolType.Decorator
      this.#virtualizedSymbols.set(symbol.id, { element: svgEl, bounds, isDecorator })

      const shouldAttach = this.#isInViewBox(bounds)
      if (oldNode?.parentNode) {
        if (shouldAttach) {
          oldNode.replaceWith(svgEl)
        } else {
          oldNode.remove()
        }
      } else if (shouldAttach) {
        if (isDecorator) {
          // Decorators render behind all other symbols
          this.definitionGroup.insertAdjacentElement("afterend", svgEl)
        } else {
          this.layer.appendChild(svgEl)
        }
      }
    }
    return svgEl
  }

  /**
   * Re-points an already-drawn symbol at its current matrix, without rebuilding it.
   *
   * The element's geometry is the symbol's raw coordinates, which a transform never changes — so the
   * matrix is the whole of what has to reach the DOM. Committing a transform over a large selection
   * used to rebuild every element in it (`buildElementFromSymbol` walks every pointer); this writes
   * one attribute per symbol instead.
   *
   * The tracked bounds are refreshed here too. They are what `#reconcileVirtualization` culls by,
   * and leaving them behind would strand a moved symbol at its old address — attached where it is no
   * longer drawn, detached where it now is.
   */
  setSymbolTransform(symbol: TSymbol): void {
    const tracked = this.#virtualizedSymbols.get(symbol.id)
    if (!tracked) {
      this.drawSymbol(symbol)
      return
    }
    tracked.bounds = SymbolGeometry.boundsOf(symbol)
    if (tracked.pendingRedraw) {
      // The element is already stale for another reason (it was off screen when last drawn); let
      // the deferred rebuild in `#reconcileVirtualization` carry this matrix too, instead of writing
      // an attribute onto an element that is about to be replaced wholesale.
      tracked.pendingRedraw = symbol
      return
    }
    tracked.element.setAttribute("transform", MatrixTransform.toCssString(symbol.transform))
    if (!this.#isInViewBox(tracked.bounds)) {
      tracked.element.remove()
    }
  }

  /**
   * Draws `symbol` into the dedicated current-symbol overlay instead of the
   * main layer - used while a stroke/shape is still being drawn, so redrawing
   * it every frame doesn't repaint the rest of the canvas. See `drawSymbol`.
   */
  drawCurrentSymbol(symbol: TSymbol): SVGGraphicsElement | undefined {
    this.#logger.debug("drawCurrentSymbol", { symbol })
    const oldNode = this.#currentSymbolLayer.querySelector(`#${symbol.id}`) as SVGGraphicsElement | null
    const svgEl = this.buildElementFromSymbol(symbol)
    if (svgEl) {
      if (oldNode) {
        oldNode.replaceWith(svgEl)
      } else {
        this.#currentSymbolLayer.appendChild(svgEl)
      }
    }
    return svgEl
  }

  /** Clears the current-symbol overlay once its content has been merged into `layer`. */
  clearCurrentSymbolLayer(): void {
    if (!this.#currentSymbolLayer) {
      return
    }
    while (this.#currentSymbolLayer.firstChild) {
      this.#currentSymbolLayer.firstChild.remove()
    }
  }

  updateSelectedState(symbol: TSymbol, isSelected: boolean): void {
    if (isSelected) {
      this.#selectedIds.add(symbol.id)
    } else {
      this.#selectedIds.delete(symbol.id)
    }
    const el = this.getElementById(symbol.id)
    if (!el) {
      return
    }
    // A halo changes the element itself (a group instead of the bare path): rebuild it
    if (SVGRenderer.#isOutlinedByHalo(symbol)) {
      this.drawSymbol(symbol)
      return
    }
    // The outline is a stroke the stylesheet paints under the fill, not a filter: WebKit crashed on
    // an SVG one, and Chrome left ghost ink next to the selection with a CSS drop-shadow on the GPU
    el.classList.toggle(SVGRendererConst.selectedClassName, isSelected)
  }

  /** A shape or an edge is drawn by its stroke, so the stylesheet cannot paint an outline under it */
  static #isOutlinedByHalo(symbol: TSymbol): boolean {
    return symbol.type === SymbolType.Shape || symbol.type === SymbolType.Edge
  }

  #outlineSelected(symbol: TSymbol, element: SVGGraphicsElement): SVGGraphicsElement {
    if (!SVGRenderer.#isOutlinedByHalo(symbol)) {
      element.classList.add(SVGRendererConst.selectedClassName)
      return element
    }
    return SVGRenderer.#groupWithHalo(element)
  }

  /**
   * The element preceded by a wider copy of itself, the halo, which the stylesheet colours.
   *
   * The group takes over what addresses the symbol — id, type and matrix — so `getElementById`,
   * hit-testing by `type` and `setSymbolTransform` reach the group and move both paths together.
   * The halo is unpainted until the stylesheet colours it, so an SVG export of a selected symbol does
   * not carry it. No arrow heads on it: their size follows the stroke width, they would balloon.
   */
  static #groupWithHalo(element: SVGGraphicsElement): SVGGElement {
    const group = SVGBuilder.createGroup({ class: SVGRendererConst.selectedClassName })
    SVGRenderer.#ADDRESS_ATTRIBUTES.forEach((name) => {
      const value = element.getAttribute(name)
      if (value !== null) {
        group.setAttribute(name, value)
        element.removeAttribute(name)
      }
    })
    const halo = element.cloneNode(true) as SVGGraphicsElement
    const width = Number(element.getAttribute("stroke-width")) || 1
    halo.classList.add(SVGRendererConst.selectionHaloClassName)
    halo.removeAttribute("marker-start")
    halo.removeAttribute("marker-end")
    halo.setAttribute("stroke-width", String(width + SVGRenderer.#HALO_SPREAD))
    halo.setAttribute("stroke", "none")
    halo.setAttribute("fill", "none")
    halo.setAttribute("style", SVGRendererConst.noSelection)
    group.append(halo, element)
    return group
  }

  updateDeletingState(symbol: TSymbol, isDeleting: boolean): void {
    const el = this.getElementById(symbol.id)
    if (!el) {
      return
    }
    // Plain CSS opacity, not a filter: WebKit's renderer crashed painting the SVG removal filter
    // (an alpha transfer table) on as few as five strokes
    el.classList.toggle(SVGRendererConst.deletingClassName, isDeleting)
  }

  replaceSymbol(id: string, symbols: TSymbol[]): SVGGraphicsElement[] | undefined {
    this.#logger.debug("drawSymbol", { symbols })
    const oldNode = this.getElementById(id)
    const elements = symbols.map((s) => this.buildElementFromSymbol(s)).filter((x) => !!x) as SVGGraphicsElement[]

    if (elements.length) {
      if (oldNode) {
        elements.forEach((e) => oldNode.insertAdjacentElement("beforebegin", e))
        oldNode.remove()
      } else {
        elements.forEach((e) => this.layer.appendChild(e))
      }
    }
    return elements
  }

  removeSymbol(id: string): void {
    this.#logger.debug("removeSymbol", { id })
    this.removeElement(id)
  }

  drawCircle(point: TPoint, radius: number, attrs: { [key: string]: string } = {}): void {
    this.#logger.info("drawCircle", {
      point,
      radius,
      attrs,
    })
    this.layer.appendChild(SVGBuilder.createCircle(point, radius, attrs))
  }

  drawRect(box: TBox, attrs: { [key: string]: string } = {}): void {
    this.#logger.info("drawRect", { box, attrs })
    this.layer.appendChild(SVGBuilder.createRect(box, attrs))
  }

  drawLine(p1: TPoint, p2: TPoint, attrs: { [key: string]: string } = {}): void {
    this.#logger.info("drawLine", {
      p1,
      p2,
      attrs,
    })
    this.layer.appendChild(SVGBuilder.createLine(p1, p2, attrs))
  }

  drawConnectionBetweenBox(
    id: string,
    box1: TBox,
    box2: TBox,
    position: "corners" | "sides",
    attrs?: { [key: string]: string }
  ): void {
    let points1: TPoint[] = BoxOps.getCorners(box1)
    let points2: TPoint[] = BoxOps.getCorners(box2)
    if (position === "sides") {
      points1 = BoxOps.getSide(box1)
      points2 = BoxOps.getSide(box2)
    }
    const { p1, p2 } = getClosestPoints(points1, points2)
    const attrsLine = {
      id,
      fill: "transparent",
      style: SVGRendererConst.noSelection,
      ...attrs,
    }
    this.drawLine(p1, p2, attrsLine)
  }

  resize(height: number, width: number): void {
    this.#logger.info("resize", { height, width })
    this.layer.setAttribute("width", `${width}px`)
    this.layer.setAttribute("height", `${height}px`)
    this.#viewBox.width = width
    this.#viewBox.height = height
    this.layer.setAttribute(
      "viewBox",
      `${this.#viewBox.x}, ${this.#viewBox.y}, ${this.#viewBox.width}, ${this.#viewBox.height}`
    )
    bumpSvgTransformVersion(this.layer)
    this.#syncCurrentSymbolLayerViewBox()
    this.removeGuides()
    if (this.configuration.guides.enable) {
      this.drawGuides()
    }
  }

  getElementById(id: string): SVGGraphicsElement | null {
    const tracked = this.#virtualizedSymbols.get(id)
    if (tracked) {
      return tracked.element
    }
    if (!this.layer) {
      return null
    }
    return this.layer.querySelector(`#${id}`) as SVGGraphicsElement | null
  }

  getElements({ tagName, attrs }: { tagName?: string; attrs?: { [key: string]: string } }): NodeListOf<Element> {
    this.#logger.info("getElements", {
      tagName,
      attrs,
    })
    if (!this.layer) {
      return document.querySelectorAll("never-match") // Return empty NodeList
    }
    let query = tagName || "*"
    if (attrs) {
      for (const k in attrs) {
        query += `[${k}="${attrs[k]}"]`
      }
    }
    return this.layer.querySelectorAll(query)
  }

  clearElements({ tagName, attrs }: { tagName?: string; attrs?: { [key: string]: string } }): void {
    this.#logger.info("clearElements", {
      tagName,
      attrs,
    })
    if (!this.layer) {
      this.#logger.debug("clearElements: layer not initialized yet, skipping")
      return
    }
    let query = tagName || "*"
    if (attrs) {
      for (const k in attrs) {
        query += `[${k}="${attrs[k]}"]`
      }
    }
    this.#virtualizedSymbols.forEach(({ element }, id) => {
      if (element.matches(query)) {
        this.#virtualizedSymbols.delete(id)
        this.#selectedIds.delete(id)
        element.remove()
      }
    })
    this.getElements({ tagName, attrs }).forEach((e) => e.remove())
  }

  clear(): void {
    this.#logger.info("clear")
    this.#virtualizedSymbols.clear()
    this.#selectedIds.clear()
    if (this.layer) {
      while (this.layer.firstChild) {
        this.layer.firstChild.remove()
      }
      this.layer.appendChild(this.createSVGTools())
    }
    this.clearCurrentSymbolLayer()
  }

  getRenderingContext(): SVGSVGElement {
    return this.layer
  }

  getZoom(): number {
    return this.#zoom
  }

  setZoom(zoom: number, centerX?: number, centerY?: number): void {
    this.#logger.info("setZoom", {
      zoom,
      centerX,
      centerY,
    })

    if (zoom <= 0) {
      this.#logger.warn("setZoom", "Zoom must be greater than 0")
      return
    }

    const oldZoom = this.#zoom
    this.#zoom = zoom

    const baseWidth = this.#viewBox.width * oldZoom
    const baseHeight = this.#viewBox.height * oldZoom
    const newWidth = baseWidth / zoom
    const newHeight = baseHeight / zoom

    if (centerX !== undefined && centerY !== undefined) {
      const rect = this.layer.getBoundingClientRect()
      const viewBoxX = this.#viewBox.x + (centerX / rect.width) * this.#viewBox.width
      const viewBoxY = this.#viewBox.y + (centerY / rect.height) * this.#viewBox.height

      this.#viewBox.x = viewBoxX - (centerX / rect.width) * newWidth
      this.#viewBox.y = viewBoxY - (centerY / rect.height) * newHeight
    }

    this.#viewBox.width = newWidth
    this.#viewBox.height = newHeight

    this.layer.setAttribute(
      "viewBox",
      `${this.#viewBox.x}, ${this.#viewBox.y}, ${this.#viewBox.width}, ${this.#viewBox.height}`
    )
    bumpSvgTransformVersion(this.layer)
    this.#syncCurrentSymbolLayerViewBox()
    this.#reconcileVirtualization()

    if (this.configuration.guides.enable) {
      this.removeGuides()
      this.drawGuides()
    }
  }

  /**
   * Get current viewBox
   * @returns Current viewBox {x, y, width, height}
   */
  getViewBox(): {
    x: number
    y: number
    width: number
    height: number
  } {
    return { ...this.#viewBox }
  }

  /**
   * Set viewBox
   * @param x X coordinate of top-left corner
   * @param y Y coordinate of top-left corner
   * @param width Width of viewBox
   * @param height Height of viewBox
   * @param redrawGuides Whether to redraw guides (default: true)
   */
  setViewBox(x: number, y: number, width: number, height: number, redrawGuides: boolean = true): void {
    this.#logger.debug("setViewBox", {
      x,
      y,
      width,
      height,
      redrawGuides,
    })
    this.#viewBox = { x, y, width, height }
    this.layer.setAttribute("viewBox", `${x}, ${y}, ${width}, ${height}`)
    bumpSvgTransformVersion(this.layer)
    this.#syncCurrentSymbolLayerViewBox()
    this.#reconcileVirtualization()

    if (redrawGuides && this.configuration.guides.enable) {
      this.removeGuides()
      this.drawGuides()
    }
  }

  /**
   * Pan (translate) the viewBox
   * @param dx Horizontal translation (in viewBox coordinates)
   * @param dy Vertical translation (in viewBox coordinates)
   * @param redrawGuides Whether to redraw guides (default: true)
   */
  pan(dx: number, dy: number, redrawGuides: boolean = true): void {
    this.#logger.debug("pan", {
      dx,
      dy,
      redrawGuides,
    })
    this.#viewBox.x += dx
    this.#viewBox.y += dy
    this.layer.setAttribute(
      "viewBox",
      `${this.#viewBox.x}, ${this.#viewBox.y}, ${this.#viewBox.width}, ${this.#viewBox.height}`
    )
    bumpSvgTransformVersion(this.layer)
    this.#syncCurrentSymbolLayerViewBox()
    this.#reconcileVirtualization()

    if (redrawGuides && this.configuration.guides.enable) {
      this.removeGuides()
      this.drawGuides()
    }
  }

  /**
   * Ensure a point is visible in the viewBox by panning if necessary
   * @param point Point to make visible
   * @param margin Optional margin around the point (default: 50)
   */
  ensurePointVisible(point: TPoint, margin: number = 50): void {
    let needsPan = false
    let dx = 0
    let dy = 0

    if (point.x < this.#viewBox.x + margin) {
      dx = this.#viewBox.x + margin - point.x
      needsPan = true
    } else if (point.x > this.#viewBox.x + this.#viewBox.width - margin) {
      dx = this.#viewBox.x + this.#viewBox.width - margin - point.x
      needsPan = true
    }

    if (point.y < this.#viewBox.y + margin) {
      dy = this.#viewBox.y + margin - point.y
      needsPan = true
    } else if (point.y > this.#viewBox.y + this.#viewBox.height - margin) {
      dy = this.#viewBox.y + this.#viewBox.height - margin - point.y
      needsPan = true
    }

    if (needsPan) {
      this.pan(-dx, -dy, false)
    }
  }

  destroy(): void {
    if (this.layer) {
      this.layer.remove()
    }
    this.#currentSymbolLayer?.remove()
  }
}
