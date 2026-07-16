import { SvgElementRole } from "@/Constants"
import { LoggerCategory, LoggerManager } from "@/logger"
import { BaseRenderer } from "@/renderer/base"
import type { TIIRendererConfiguration } from "@/renderer/RendererConfiguration"
import type { TBox, TEraser, TPoint, TPointer, TSymbol } from "@/symbol"
import { SymbolType } from "@/symbol"
import { BoxOps } from "@/symbol/primitives/Box"
import { arrowHeadEndMarkerId, arrowHeadStartMarkerId } from "@/symbol-utils/edge/EdgeRenderOptions"
import { symbolRegistry } from "@/symbol-utils/SymbolRegistry"
import { bumpSvgTransformVersion, getClosestPoints } from "@/utils"

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
    this.#currentSymbolLayer.setAttribute("width", `${this.#viewBox.width}px`)
    this.#currentSymbolLayer.setAttribute("height", `${this.#viewBox.height}px`)
    this.#currentSymbolLayer.setAttribute(
      "viewBox",
      `${this.#viewBox.x}, ${this.#viewBox.y}, ${this.#viewBox.width}, ${this.#viewBox.height}`
    )
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
    const removalFilter = SVGBuilder.createFilter(SVGRendererConst.removalFilterId)
    const bfeComponentTransfer = SVGBuilder.createComponentTransfert()
    const bfeFuncA = SVGBuilder.createTransfertFunctionTable("feFuncA", "0 0.25")
    bfeComponentTransfer.appendChild(bfeFuncA)
    removalFilter.appendChild(bfeComponentTransfer)
    filtersGroup.appendChild(removalFilter)

    const selectionFilter = SVGBuilder.createFilter(SVGRendererConst.selectionFilterId, {
      x: "-50%",
      y: "-50%",
      width: "200%",
      height: "200%",
    })

    const feMorphology = document.createElementNS("http://www.w3.org/2000/svg", "feMorphology")
    feMorphology.setAttribute("operator", "dilate")
    feMorphology.setAttribute("radius", "1.5")
    feMorphology.setAttribute("in", "SourceAlpha")
    feMorphology.setAttribute("result", "dilated")

    const feFlood = document.createElementNS("http://www.w3.org/2000/svg", "feFlood")
    feFlood.setAttribute("flood-color", "#3e68ff")
    feFlood.setAttribute("result", "color")

    const feComposite1 = document.createElementNS("http://www.w3.org/2000/svg", "feComposite")
    feComposite1.setAttribute("in", "color")
    feComposite1.setAttribute("in2", "dilated")
    feComposite1.setAttribute("operator", "in")
    feComposite1.setAttribute("result", "outline")

    const feComposite2 = document.createElementNS("http://www.w3.org/2000/svg", "feComposite")
    feComposite2.setAttribute("in", "SourceGraphic")
    feComposite2.setAttribute("in2", "outline")
    feComposite2.setAttribute("operator", "over")

    selectionFilter.appendChild(feMorphology)
    selectionFilter.appendChild(feFlood)
    selectionFilter.appendChild(feComposite1)
    selectionFilter.appendChild(feComposite2)
    filtersGroup.appendChild(selectionFilter)

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
        const firstPointX = Math.floor(startX / offSet) * offSet + offSet
        const firstPointY = Math.floor(startY / offSet) * offSet + offSet

        let pathData = ""
        const pointsX = []
        const pointsY = []

        for (let x = firstPointX; x < endX; x += offSet) {
          this.verticalGuides.push(x)
          pointsX.push(x)
        }
        for (let y = firstPointY; y < endY; y += offSet) {
          this.horizontalGuides.push(y)
          pointsY.push(y)
        }

        const maxPoints = 5000
        const totalPoints = pointsX.length * pointsY.length

        if (totalPoints <= maxPoints) {
          for (const x of pointsX) {
            for (const y of pointsY) {
              pathData += `M ${x} ${y} m -1,0 a 1,1 0 1,0 2,0 a 1,1 0 1,0 -2,0 `
            }
          }
        } else {
          const skipFactor = Math.ceil(Math.sqrt(totalPoints / maxPoints))
          for (let i = 0; i < pointsX.length; i += skipFactor) {
            for (let j = 0; j < pointsY.length; j += skipFactor) {
              pathData += `M ${pointsX[i]} ${pointsY[j]} m -1,0 a 1,1 0 1,0 2,0 a 1,1 0 1,0 -2,0 `
            }
          }
        }

        if (pathData) {
          const pointsPath = SVGBuilder.createPath({
            d: pathData,
            fill: "grey",
            stroke: "none",
            style: SVGRendererConst.noSelection,
          })
          guidesGroup.appendChild(pointsPath)
        }
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
    if (util?.getSVGElement) {
      return util.getSVGElement(symbol)
    }
    this.#logger.error("buildElementFromSymbol", `no util for symbol: "${JSON.stringify(symbol)}"`)
    return undefined
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
    if (!this.layer) {
      this.#logger.debug("removeElement: layer not initialized yet, skipping")
      return
    }
    this.getElementById(id)?.remove()
  }

  drawSymbol(symbol: TSymbol | TEraser): SVGGraphicsElement | undefined {
    this.#logger.debug("drawSymbol", { symbol })
    const oldNode = this.getElementById(symbol?.id)
    const svgEl =
      symbol.type === SymbolType.Eraser
        ? this.#buildEraserElement(symbol as TEraser)
        : this.buildElementFromSymbol(symbol as TSymbol)

    if (svgEl) {
      if (oldNode) {
        oldNode.replaceWith(svgEl)
      } else if (symbol.type === SymbolType.Decorator) {
        // Decorators render behind all other symbols
        this.definitionGroup.insertAdjacentElement("afterend", svgEl)
      } else {
        this.layer.appendChild(svgEl)
      }
    }
    return svgEl
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
    // Edge selection adds/removes a child outline path — full redraw needed
    if (symbol.type === SymbolType.Edge) {
      this.drawSymbol(symbol)
      return
    }
    const el = this.getElementById(symbol.id)
    if (!el) {
      return
    }
    if (isSelected) {
      el.setAttribute("filter", `url(#${SVGRendererConst.selectionFilterId})`)
    } else {
      el.removeAttribute("filter")
    }
  }

  updateDeletingState(symbol: TSymbol, isDeleting: boolean): void {
    const el = this.getElementById(symbol.id)
    if (!el) {
      return
    }
    if (isDeleting) {
      el.setAttribute("filter", `url(#${SVGRendererConst.removalFilterId})`)
    } else {
      el.removeAttribute("filter")
    }
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
    this.getElements({ tagName, attrs }).forEach((e) => e.remove())
  }

  clear(): void {
    this.#logger.info("clear")
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
