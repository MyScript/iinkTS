import { SvgElementRole } from "../../Constants"
import { getClosestPoints } from "../../utils"
import { LoggerCategory, LoggerManager } from "../../logger"
import { TIISymbol, TPoint, TBox, Box, IIEraser, SymbolType } from "../../symbol"
import { TIIRendererConfiguration } from "../RendererConfiguration"
import { BaseRenderer } from "../base"
import { SVGRendererConst } from "./utils/SVGRendererConst"
import { SVGRendererEdgeUtil } from "./SVGRendererEdgeUtil"
import { SVGRendererEraserUtil } from "./SVGRendererEraserUtil"
import { SVGRendererGroupUtil } from "./SVGRendererGroupUtil"
import { SVGRendererShapeUtil } from "./SVGRendererShapeUtil"
import { SVGRendererStrokeUtil } from "./SVGRendererStrokeUtil"
import { SVGRendererTextUtil } from "./SVGRendererTextUtil"
import { SVGRendererRecognizedUtil } from "./SVGRendererRecognizedUtil"
import { SVGBuilder } from "./utils/SVGBuilder"

/**
 * @group Renderer
 */
export class SVGRenderer extends BaseRenderer<SVGSVGElement, TIIRendererConfiguration> {
  #logger = LoggerManager.getLogger(LoggerCategory.RENDERER)
  groupGuidesId = "guides-wrapper"

  layer!: SVGSVGElement
  definitionGroup!: SVGGElement

  verticalGuides: number[] = []
  horizontalGuides: number[] = []

  #zoom: number = 1
  #viewBox: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 0, height: 0 }

  constructor(configuration: TIIRendererConfiguration) {
    super(configuration)
    this.#logger.info("constructor", { configuration })
    this.configuration = configuration
  }

  protected initLayer(): void {
    const width = Math.max(this.configuration.minWidth, this.parent.clientWidth)
    const height = Math.max(this.configuration.minHeight, this.parent.clientHeight)
    this.layer = SVGBuilder.createLayer({ x: 0, y: 0, width, height })
    this.layer.style.setProperty("height", "auto")
    this.layer.style.setProperty("width", "auto")
    this.#viewBox = { x: 0, y: 0, width, height }
    this.layer.appendChild(this.createSVGTools())
    this.parent.style.setProperty("overflow", "auto")
    this.parent.appendChild(this.layer)
  }

  protected createDefs(): SVGDefsElement {
    const defs = SVGBuilder.createDefs()

    const SIZE = 5
    const REFX = SIZE - 1, REFY = SIZE / 2
    const arrowHeadMarkerAttrs = {
      style: SVGRendererConst.noSelection,
      fill: "context-stroke",
      markerWidth: SIZE.toString(),
      markerHeight: SIZE.toString(),
      refX: REFX.toString(),
      refY: REFY.toString(),
    }

    const arrowHeadStart = SVGBuilder.createMarker(SVGRendererConst.arrowHeadStartMarker, { ...arrowHeadMarkerAttrs, orient: "auto-start-reverse" })
    arrowHeadStart.appendChild(SVGBuilder.createPolygon([0, 0, SIZE, REFY, 0, SIZE], arrowHeadMarkerAttrs))
    defs.appendChild(arrowHeadStart)

    const arrowHeadEnd = SVGBuilder.createMarker(SVGRendererConst.arrowHeadEndMaker, { ...arrowHeadMarkerAttrs, orient: "auto" })
    arrowHeadEnd.appendChild(SVGBuilder.createPolygon([0, 0, SIZE, REFY, 0, SIZE], arrowHeadMarkerAttrs))
    defs.appendChild(arrowHeadEnd)

    const crossMarkerAttrs = {
      style: SVGRendererConst.noSelection,
      markerWidth: "5",
      markerHeight: "5",
      refX: "0",
      refY: "0",
      viewBox: "-5 -5 10 10"
    }
    const cross = SVGBuilder.createMarker(SVGRendererConst.crossMarker, crossMarkerAttrs)
    cross.appendChild(SVGBuilder.createPath({ d: "M -4,-4 L 4,4 M -4,4 L 4,-4", stroke: "white", "stroke-width": "3" }))
    cross.appendChild(SVGBuilder.createPath({ d: "M -4,-4 L 4,4 M -4,4 L 4,-4", stroke: "context-stroke", "stroke-width": "2" }))
    defs.appendChild(cross)

    return defs
  }

  protected createFilters(): SVGGElement {
    const filtersGroup = SVGBuilder.createGroup({ id: "definition-group" })
    const removalFilter = SVGBuilder.createFilter(SVGRendererConst.removalFilterId, { filterUnits: "userSpaceOnUse" })
    const bfeComponentTransfer = SVGBuilder.createComponentTransfert()
    const bfeFuncA = SVGBuilder.createTransfertFunctionTable("feFuncA", "0 0.25")
    bfeComponentTransfer.appendChild(bfeFuncA)
    removalFilter.appendChild(bfeComponentTransfer)
    filtersGroup.appendChild(removalFilter)

    const selectionFilter = SVGBuilder.createFilter(SVGRendererConst.selectionFilterId, { filterUnits: "userSpaceOnUse" })
    selectionFilter.appendChild(SVGBuilder.createDropShadow({ dx: -1, dy: -1, deviation: 1 }))
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
      role: SvgElementRole.Guide
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
          const path = SVGBuilder.createPath({ d: pathData, "stroke-width": "1", stroke: "grey", fill: "none", style: SVGRendererConst.noSelection })
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
          const mainPath = SVGBuilder.createPath({ d: mainPathData, "stroke-width": "1", stroke: "grey", fill: "none", style: SVGRendererConst.noSelection })
          guidesGroup.appendChild(mainPath)
        }
        if (subPathData) {
          const subPath = SVGBuilder.createPath({ d: subPathData, "stroke-width": "0.25", stroke: "grey", fill: "none", style: SVGRendererConst.noSelection })
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
          const pointsPath = SVGBuilder.createPath({ d: pathData, fill: "grey", stroke: "none", style: SVGRendererConst.noSelection })
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
    this.layer.querySelector(`#${this.groupGuidesId}`)?.remove()
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
    const element = this.layer.querySelector(`#${id}`) as HTMLElement | null
    return element?.getAttribute(name)
  }

  setAttribute(id: string, name: string, value: string): void {
    const element = this.layer.querySelector(`#${id}`) as HTMLElement | null
    element?.setAttribute(name, value)
  }

  buildElementFromSymbol(symbol: TIISymbol | IIEraser): SVGGraphicsElement | undefined {
    let element: SVGGraphicsElement | undefined
    switch (symbol.type) {
      case SymbolType.Stroke:
        element = SVGRendererStrokeUtil.getSVGElement(symbol)
        break
      case SymbolType.Eraser:
        element = SVGRendererEraserUtil.getSVGElement(symbol)
        break
      case SymbolType.Shape:
        element = SVGRendererShapeUtil.getSVGElement(symbol)
        break
      case SymbolType.Edge:
        element = SVGRendererEdgeUtil.getSVGElement(symbol)
        break
      case SymbolType.Text:
        element = SVGRendererTextUtil.getSVGElement(symbol)
        break
      case SymbolType.Group:
        element = SVGRendererGroupUtil.getSVGElement(symbol)
        break
      case SymbolType.Recognized:
        element = SVGRendererRecognizedUtil.getSVGElement(symbol)
        break
      default:
        this.#logger.error("buildElementFromSymbol", `symbol unknown: "${JSON.stringify(symbol)}"`)
    }
    return element
  }

  prependElement(el: Element): void {
    this.layer.prepend(el)
  }

  changeOrderSymbol(symbolToMove: TIISymbol, position: "first" | "last" | "forward" | "backward"): void {
    const moveEl = this.layer.querySelector(`#${symbolToMove.id}`)
    if (!moveEl) return
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
    const oldStroke = this.layer.querySelector(`#${id}`)
    if (oldStroke) {
      oldStroke.remove()
    }
  }

  drawSymbol(symbol: TIISymbol | IIEraser): SVGGraphicsElement | undefined {
    this.#logger.debug("drawSymbol", { symbol })
    const oldNode = this.layer.querySelector(`#${symbol?.id}`)
    const svgEl = this.buildElementFromSymbol(symbol)

    if (svgEl) {
      if (oldNode) {
        oldNode.replaceWith(svgEl)
      }
      else {
        this.layer.appendChild(svgEl)
      }
    }
    return svgEl
  }

  replaceSymbol(id: string, symbols: TIISymbol[]): SVGGraphicsElement[] | undefined {
    this.#logger.debug("drawSymbol", { symbols })
    const oldNode = this.layer.querySelector(`#${id}`)
    const elements = symbols.map(s => this.buildElementFromSymbol(s)).filter(x => !!x) as SVGGraphicsElement[]

    if (elements.length) {
      if (oldNode) {
        elements.forEach(e => oldNode.insertAdjacentElement("beforebegin", e))
        oldNode.remove()
      }
      else {
        elements.forEach(e => this.layer.appendChild(e))
      }
    }
    return elements
  }

  removeSymbol(id: string): void {
    this.#logger.debug("removeSymbol", { id })
    this.removeElement(id)
  }

  drawCircle(point: TPoint, radius: number, attrs: { [key: string]: string } = {}): void {
    this.#logger.info("drawCircle", { point, radius, attrs })
    this.layer.appendChild(SVGBuilder.createCircle(point, radius, attrs))
  }

  drawRect(box: TBox, attrs: { [key: string]: string } = {}): void {
    this.#logger.info("drawRect", { box, attrs })
    this.layer.appendChild(SVGBuilder.createRect(box, attrs))
  }

  drawLine(p1: TPoint, p2: TPoint, attrs: { [key: string]: string } = {}): void {
    this.#logger.info("drawLine", { p1, p2, attrs })
    this.layer.appendChild(SVGBuilder.createLine(p1, p2, attrs))
  }

  drawConnectionBetweenBox(id: string, box1: TBox, box2: TBox, position: "corners" | "sides", attrs?: { [key: string]: string }): void {
    let points1: TPoint[] = new Box(box1).corners
    let points2: TPoint[] = new Box(box2).corners
    if (position === "sides") {
      points1 = new Box(box1).side
      points2 = new Box(box2).side
    }
    const { p1, p2 } = getClosestPoints(points1, points2)
    const attrsLine = {
      id,
      fill: "transparent",
      style: SVGRendererConst.noSelection,
      ...attrs
    }
    this.drawLine(p1, p2, attrsLine)
  }

  resize(height: number, width: number): void {
    this.#logger.info("resize", { height, width })
    this.layer.setAttribute("width", `${width}px`)
    this.layer.setAttribute("height", `${height}px`)
    this.#viewBox.width = width
    this.#viewBox.height = height
    this.layer.setAttribute("viewBox", `${this.#viewBox.x}, ${this.#viewBox.y}, ${this.#viewBox.width}, ${this.#viewBox.height}`)
    this.removeGuides()
    if (this.configuration.guides.enable) {
      this.drawGuides()
    }
  }

  getElementById(id: string): SVGGraphicsElement | null {
    return this.layer.querySelector(`#${id}`) as SVGGraphicsElement | null
  }

  getElements({ tagName, attrs }: { tagName?: string, attrs?: { [key: string]: string } }): NodeListOf<Element> {
    this.#logger.info("getElements", { tagName, attrs })
    let query = tagName || "*"
    if (attrs) {
      for (const k in attrs) {
        query += `[${k}=${attrs[k]}]`
      }
    }
    return this.layer.querySelectorAll(query)
  }

  clearElements({ tagName, attrs }: { tagName?: string, attrs?: { [key: string]: string } }): void {
    this.#logger.info("clearElements", { tagName, attrs })
    this.getElements({ tagName, attrs })
      .forEach(e => e.remove())
  }

  clear(): void {
    this.#logger.info("clear")
    if (this.layer) {
      while (this.layer.firstChild) {
        this.layer.firstChild.remove()
      }
      this.layer.appendChild(this.createSVGTools())
    }
  }

  getRenderingContext(): SVGSVGElement
  {
    return this.layer
  }


  getZoom(): number {
    return this.#zoom
  }

  setZoom(zoom: number, centerX?: number, centerY?: number): void {
    this.#logger.info("setZoom", { zoom, centerX, centerY })

    if (zoom <= 0) {
      this.#logger.warn("setZoom", "Zoom must be greater than 0")
      return
    }

    const oldZoom = this.#zoom
    this.#zoom = zoom

    if (centerX !== undefined && centerY !== undefined) {
      const zoomRatio = oldZoom / zoom
      const dx = centerX * (1 - zoomRatio)
      const dy = centerY * (1 - zoomRatio)
      this.#viewBox.x += dx
      this.#viewBox.y += dy
    }

    const baseWidth = this.#viewBox.width * oldZoom
    const baseHeight = this.#viewBox.height * oldZoom
    this.#viewBox.width = baseWidth / zoom
    this.#viewBox.height = baseHeight / zoom

    this.layer.setAttribute("viewBox", `${this.#viewBox.x}, ${this.#viewBox.y}, ${this.#viewBox.width}, ${this.#viewBox.height}`)

    if (this.configuration.guides.enable) {
      this.removeGuides()
      this.drawGuides()
    }
  }

  /**
   * Get current viewBox
   * @returns Current viewBox {x, y, width, height}
   */
  getViewBox(): { x: number, y: number, width: number, height: number } {
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
    this.#logger.debug("setViewBox", { x, y, width, height, redrawGuides })
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
    this.#logger.debug("pan", { dx, dy, redrawGuides })
    this.#viewBox.x += dx
    this.#viewBox.y += dy
    this.layer.setAttribute("viewBox", `${this.#viewBox.x}, ${this.#viewBox.y}, ${this.#viewBox.width}, ${this.#viewBox.height}`)

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
      dx = (this.#viewBox.x + margin) - point.x
      needsPan = true
    } else if (point.x > this.#viewBox.x + this.#viewBox.width - margin) {
      dx = (this.#viewBox.x + this.#viewBox.width - margin) - point.x
      needsPan = true
    }

    if (point.y < this.#viewBox.y + margin) {
      dy = (this.#viewBox.y + margin) - point.y
      needsPan = true
    } else if (point.y > this.#viewBox.y + this.#viewBox.height - margin) {
      dy = (this.#viewBox.y + this.#viewBox.height - margin) - point.y
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
  }
}
