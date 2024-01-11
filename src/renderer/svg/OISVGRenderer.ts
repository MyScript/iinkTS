import { LoggerClass, SvgElementRole } from "../../Constants"
import { TRenderingConfiguration } from "../../configuration"
import { LoggerManager } from "../../logger"
import { OIStroke, SymbolType, TOIEdge, TOISymbol, TPoint, TOIShape, TBoundingBox, OIText, TOIDecorator, Box } from "../../primitive"
import { createUUID, getPointsNearest } from "../../utils"
import { OISVGDecoratorUtil } from "./OISVGDecoratorUtil"
import { OISVGEdgeUtil } from "./OISVGEdgeUtil"
import { OISVGShapeUtil } from "./OISVGShapeUtil"
import { OISVGStrokeUtil } from "./OISVGStrokeUtil"
import { OISVGTextUtil } from "./OISVGTextUtil"
import { SVGBuilder } from "./SVGBuilder"

const NO_SELECTION = "pointer-events: none; -webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;"

/**
 * @group Renderer
 */
export class OISVGRenderer
{
  #logger = LoggerManager.getLogger(LoggerClass.RENDERER)
  groupGuidesId = "guides-wrapper"
  selectionFilterId = "selection-filter"
  removalFilterId = "removal-filter"
  arrowHeadStart = "arrow-head-start"
  arrowHeadEnd = "arrow-head-end"

  configuration: TRenderingConfiguration
  parent!: HTMLElement
  tooltip!: HTMLElement
  layer!: SVGElement

  strokeUtil: OISVGStrokeUtil
  shapeUtil: OISVGShapeUtil
  edgeUtil: OISVGEdgeUtil
  textUtil: OISVGTextUtil
  decoratorUtil: OISVGDecoratorUtil

  verticalGuides: number[] = []
  horizontalGuides: number[] = []

  constructor(configuration: TRenderingConfiguration)
  {
    this.#logger.info("constructor", { configuration })
    this.configuration = configuration
    this.strokeUtil = new OISVGStrokeUtil(this.selectionFilterId, this.removalFilterId)
    this.shapeUtil = new OISVGShapeUtil(this.selectionFilterId, this.removalFilterId)
    this.edgeUtil = new OISVGEdgeUtil(this.selectionFilterId, this.removalFilterId, this.arrowHeadStart, this.arrowHeadEnd)
    this.textUtil = new OISVGTextUtil(this.selectionFilterId, this.removalFilterId)
    this.decoratorUtil = new OISVGDecoratorUtil(this.selectionFilterId, this.removalFilterId)

  }

  protected initLayer(): void
  {
    const width = Math.max(this.configuration.minWidth, this.parent.clientWidth)
    const height = Math.max(this.configuration.minHeight, this.parent.clientHeight)
    this.layer = SVGBuilder.createLayer(width, height)
    this.layer.style.setProperty("height", "auto")
    this.layer.style.setProperty("width", "auto")
    this.createFilters()
    this.createDefs()
    this.parent.style.setProperty("overflow", "auto")
    this.parent.appendChild(this.layer)
  }

  protected createDefs(): void
  {
    const defs = SVGBuilder.createDefs()

    const SIZE = 5
    const REFX = 0, REFY = SIZE / 2
    const arrowHeadPolyAttrs = {
      style: NO_SELECTION,
      fill: "context-stroke",
    }
    const arrowHeadStart = SVGBuilder.createMarker(this.arrowHeadStart, SIZE, SIZE, REFX, REFY, "auto-start-reverse")
    arrowHeadStart.appendChild(SVGBuilder.createPolygon([0, 0, SIZE, REFY, REFX, SIZE], arrowHeadPolyAttrs))
    defs.appendChild(arrowHeadStart)

    const arrowHeadEnd = SVGBuilder.createMarker(this.arrowHeadEnd, SIZE, SIZE, REFX, REFY, "auto")
    arrowHeadEnd.appendChild(SVGBuilder.createPolygon([0, 0, SIZE, REFY, REFX, SIZE], arrowHeadPolyAttrs))
    defs.appendChild(arrowHeadEnd)

    this.layer.appendChild(defs)
  }

  protected createFilters(): void
  {
    const removalFilter = SVGBuilder.createFilter(this.removalFilterId)
    const bfeComponentTransfer = SVGBuilder.createComponentTransfert()
    const bfeFuncA = SVGBuilder.createTransfertFunctionTable("feFuncA", "0 0.25")
    bfeComponentTransfer.appendChild(bfeFuncA)
    removalFilter.appendChild(bfeComponentTransfer)
    this.layer.appendChild(removalFilter)

    const selectionFilter = SVGBuilder.createFilter(this.selectionFilterId)
    selectionFilter.appendChild(SVGBuilder.createDropShadow({ dx: -1, dy: -1, deviation: 1 }))
    selectionFilter.appendChild(SVGBuilder.createDropShadow({ dx: 1, dy: -1, deviation: 1 }))
    selectionFilter.appendChild(SVGBuilder.createDropShadow({ dx: -1, dy: 1, deviation: 1 }))
    selectionFilter.appendChild(SVGBuilder.createDropShadow({ dx: 1, dy: 1, deviation: 1 }))

    this.layer.appendChild(selectionFilter)
  }

  protected drawGuides(): void
  {
    this.verticalGuides = []
    this.horizontalGuides = []
    const height = Number(this.layer.getAttribute("height")?.replace("px", ""))
    const width = Number(this.layer.getAttribute("width")?.replace("px", ""))
    const offSet = this.configuration.guides.gap
    const subOffSet = this.configuration.guides.gap / 5
    const attrs = {
      id: this.groupGuidesId,
      stroke: "grey",
      opacity: "0.5",
      style: NO_SELECTION,
      role: SvgElementRole.Guide
    }
    const guidesGroup = SVGBuilder.createGroup(attrs)
    switch (this.configuration.guides.type) {
      case "line":
        for (let y = offSet; y < height; y += offSet) {
          const begin: TPoint = { x: offSet, y }
          const end: TPoint = { x: width - offSet, y }
          this.horizontalGuides.push(y)
          const svgLine = SVGBuilder.createLine(begin, end, { "stroke-width": "1", style: NO_SELECTION })
          guidesGroup.appendChild(svgLine)
        }
        break
      case "grid":
        for (let y = 0; y < height; y += offSet) {
          const begin: TPoint = { x: 0, y }
          const end: TPoint = { x: width, y }
          const svgLine = SVGBuilder.createLine(begin, end, { "stroke-width": "1", style: NO_SELECTION })
          guidesGroup.appendChild(svgLine)
          this.horizontalGuides.push(y)
          for (let subY = y + subOffSet; subY < y + offSet; subY += subOffSet) {
            this.horizontalGuides.push(subY)
            const svgLine = SVGBuilder.createLine({ x: 0, y: subY }, { x: width, y: subY }, { "stroke-width": "0.25", style: NO_SELECTION })
            guidesGroup.appendChild(svgLine)
          }
        }
        for (let x = 0; x < width; x += offSet) {
          const begin: TPoint = { x, y: 0 }
          const end: TPoint = { x, y: height }
          const svgLine = SVGBuilder.createLine(begin, end, { "stroke-width": "1", style: NO_SELECTION })
          guidesGroup.appendChild(svgLine)
          this.verticalGuides.push(x)
          for (let subX = x + subOffSet; subX < x + offSet; subX += subOffSet) {
            this.verticalGuides.push(subX)
            const svgLine = SVGBuilder.createLine({ x: subX, y: 0 }, { x: subX, y: height }, { "stroke-width": "0.25", style: NO_SELECTION })
            guidesGroup.appendChild(svgLine)
          }
        }
        break
      case "point":
        for (let x = offSet; x < width; x += offSet) {
          this.verticalGuides.push(x)
          for (let y = offSet; y < height; y += offSet) {
            this.horizontalGuides.push(y)
            const svgPoint = SVGBuilder.createCircle({ x, y }, 1)
            guidesGroup.appendChild(svgPoint)
          }
        }
        break
      default:
        this.#logger.error("#drawGuides", `Guide type unknow: ${ this.configuration.guides.type }`)
        break
    }
    this.layer.appendChild(guidesGroup)
  }

  protected removeGuides(): void
  {
    this.verticalGuides = []
    this.horizontalGuides = []
    this.layer.querySelector(`#${ this.groupGuidesId }`)?.remove()
  }

  protected initTooltip(): void
  {
    this.tooltip = document.createElement("div")
    this.tooltip.id = "svg-renderer-tooltip"
    this.tooltip.classList.add("symbol-tooltip")
    this.tooltip.style.display = "none"
    this.tooltip.onpointerup = () => this.tooltip.style.display = "none"
    this.parent.appendChild(this.tooltip)
  }

  init(element: HTMLElement): void
  {
    this.#logger.info("init", { element })
    this.parent = element
    this.parent.oncontextmenu = () => false
    this.initLayer()
    this.initTooltip()
    if (this.configuration.guides.enable) {
      this.drawGuides()
    }
  }

  getAttribute(id: string, name: string): string
  {
    const element = this.layer.querySelector(`#${ id }`) as HTMLElement | null
    return element?.getAttribute(name) as string
  }

  setAttribute(id: string, name: string, value: string): void
  {
    const element = this.layer.querySelector(`#${ id }`) as HTMLElement | null
    element?.setAttribute(name, value)
  }

  prependElement(el: Element): void
  {
    this.layer.prepend(el)
  }

  insertBeforeElement(el: Element, child: Node | null): void
  {
    this.layer.insertBefore(el, child)
  }

  appendElement(el: Element): void
  {
    this.layer.appendChild(el)
  }

  removeElement(id: string): void
  {
    this.#logger.debug("Element", { id })
    const oldStroke = this.layer.querySelector(`#${ id }`)
    if (oldStroke) {
      oldStroke.remove()
    }
  }

  getSymbolElement(symbol: TOISymbol): SVGGraphicsElement | undefined
  {
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.strokeUtil.getSVGElement(symbol as OIStroke)
      case SymbolType.Shape:
        return this.shapeUtil.getSVGElement(symbol as TOIShape)
      case SymbolType.Edge:
        return this.edgeUtil.getSVGElement(symbol as TOIEdge)
      case SymbolType.Decorator:
        return this.decoratorUtil.getSVGElement(symbol as TOIDecorator)
      case SymbolType.Text:
        return this.textUtil.getSVGElement(symbol as OIText)
      default:
        this.#logger.error("getSymbolElement", `symbol type is unknow: "${ symbol.type }"`)
        return
    }
  }

  getSymbolElementBounds(el: SVGElement): TBoundingBox
  {
    if (el.tagName === "g") {
      const boxes: TBoundingBox[] = []
      const svgGroup = (el as SVGGElement)
      const deltaX = this.parent.scrollLeft - this.parent.offsetLeft
      const deltaY = this.parent.scrollTop - this.parent.offsetTop
      const m = svgGroup.getScreenCTM()
      el.childNodes.forEach(child =>
      {
        const bbox = new Box((child as SVGGeometryElement).getBBox({ stroke: true, markers: true, clipped: true, fill: true }))
        const svgPoints = bbox.getCorners().map(c =>
        {
          let point = new DOMPoint(c.x, c.y)
          if (m) {
            point = point.matrixTransform(m)
          }
          point.x += deltaX
          point.y += deltaY
          return point
        })
        const bboxTransform = Box.createFromPoints(svgPoints)
        boxes.push(bboxTransform)
      })
      return Box.createFromBoxes(boxes)
    }
    else {
      return (el as SVGGeometryElement).getBBox({ stroke: true, markers: true, clipped: true, fill: true })
    }
  }

  getSymbolBounds(symbol: TOISymbol): TBoundingBox | undefined
  {
    const id = "render-to-bbox"
    this.layer.querySelector(`#${ id }`)?.remove()
    const el = this.getSymbolElement(symbol)
    if (el) {
      el.id = id
      el.setAttribute("visibility", "hidden")
      this.layer.prepend(el)
      const bbox = this.getSymbolElementBounds(el)
      return bbox
    }
    return
  }

  addTooltipOnSymbolElement(el: SVGElement, symbol: TOISymbol): SVGElement
  {
    el.onpointerdown = (e) =>
    {
      if (e.button === 2) {
        e.preventDefault()
        e.stopPropagation()
        this.tooltip.style.left = `${ symbol.boundingBox.xMin }px`
        this.tooltip.style.top = `${ symbol.boundingBox.yMax }px`
        this.tooltip.textContent = `
  id: ${ symbol.id }
  type: ${ symbol.type }
  boundingBox: {
    xMin: ${ symbol.boundingBox.xMin },
    yMin: ${ symbol.boundingBox.yMin },
    xMax: ${ symbol.boundingBox.xMax },
    yMax: ${ symbol.boundingBox.yMax }
  }
`
        this.tooltip.style.display = "block"
      }
    }
    return el
  }

  drawSymbol(symbol: TOISymbol): SVGGraphicsElement | undefined
  {
    this.#logger.debug("drawSymbol", { symbol })
    const oldNode = this.layer.querySelector(`#${ symbol?.id }`)
    const svgEl = this.getSymbolElement(symbol)

    if (svgEl) {
      this.addTooltipOnSymbolElement(svgEl, symbol)

      if (oldNode) {
        oldNode.replaceWith(svgEl)
      }
      else {
        this.layer.appendChild(svgEl)
      }
    }
    return svgEl
  }

  removeSymbol(id: string): void
  {
    this.#logger.debug("removeSymbol", { id })
    this.removeElement(id)
  }

  drawCircle(point: TPoint, radius: number, attrs: { [key: string]: string } = {}): void
  {
    this.#logger.info("drawCircle", { point, radius, attrs })
    this.layer.appendChild(SVGBuilder.createCircle(point, radius, attrs))
  }

  drawRect(box: TBoundingBox, attrs: { [key: string]: string } = {}): void
  {
    this.#logger.info("drawCircle", { box, attrs })
    this.layer.appendChild(SVGBuilder.createRect(box, attrs))
  }

  drawLine(p1: TPoint, p2: TPoint, attrs: { [key: string]: string } = {}): void
  {
    this.#logger.info("drawLine", { p1, p2, attrs })
    const line = SVGBuilder.createLine(p1, p2, attrs)
    this.layer.appendChild(line)
  }

  drawConnectionBetweenBox(id: string, box1: TBoundingBox, box2: TBoundingBox, color: string, role = SvgElementRole.ConnectionLine): void
  {
    const points1: TPoint[] = [
      { x: box1.x, y: box1.y },
      { x: box1.x + box1.width, y: box1.y },
      { x: box1.x + box1.width, y: box1.y + box1.height },
      { x: box1.x, y: box1.y + box1.height },
    ]
    const points2: TPoint[] = [
      { x: box2.x, y: box2.y },
      { x: box2.x + box2.width, y: box2.y },
      { x: box2.x + box2.width, y: box2.y + box2.height },
      { x: box2.x, y: box2.y + box2.height },
    ]
    const { p1, p2 } = getPointsNearest(points1, points2)
    const attrs = {
      id,
      role,
      fill: "transparent",
      stroke: color,
      style: NO_SELECTION
    }
    this.drawLine(p1, p2, attrs)
  }

  clearConnectionLine(role: string): void
  {
    this.layer.querySelectorAll(`[role=${ role }]`)
      .forEach(e => e.remove())
  }

  drawBoundingBox(symbols: TOISymbol[]): void
  {
    const symbolAttrs = {
      role: SvgElementRole.BoudingBox,
      style: "pointer-events: none",
      fill: "transparent",
      stroke: "#1A9FFF",
      "stroke-width": "1",
      "stroke-dasharray": "8",
      "vector-effect": "non-scaling-stroke",
    }
    const charAttrs = {
      role: SvgElementRole.BoudingBox,
      style: "pointer-events: none",
      fill: "transparent",
      stroke: "#e01b24",
      "stroke-width": "1",
      "stroke-dasharray": "8",
      "vector-effect": "non-scaling-stroke",
    }
    symbols.forEach(s =>
    {
      const symEl = this.getRenderedElementFromSymbol(s.id) as SVGGraphicsElement
      if (s.type === SymbolType.Text) {
        const text = s as OIText
        let transform: string = ""
        if (text.rotation) {
          transform = `rotate(${ text.rotation.degree }, ${ text.rotation.center.x }, ${ text.rotation.center.y })`
        }
        text.chars.forEach(c =>
        {
          const ca = {
            ...charAttrs,
            char: c.label,
            transform
          }
          symEl.insertAdjacentElement("beforebegin", SVGBuilder.createRect(c.boundingBox, ca))
        })
        const sa = {
          ...symbolAttrs,
          symbol: s.id,
          transform
        }
        symEl.insertAdjacentElement("beforebegin", SVGBuilder.createRect(s.boundingBox, sa))
      }
      else {
        const sa = {
          ...symbolAttrs,
          symbol: s.id,
        }
        symEl.insertAdjacentElement("beforebegin", SVGBuilder.createRect(s.boundingBox, sa))
      }
    })
  }

  clearBoudingBox(): void
  {
    this.layer.querySelectorAll(`[role=${ SvgElementRole.BoudingBox }]`)
      .forEach(e => e.remove())
    this.layer.querySelectorAll(`[role=${ SvgElementRole.BoudingBox }]`)
      .forEach(e => e.remove())
  }

  drawRecognitionBox(box: TBoundingBox, words?: string[]): void
  {
    const COLOR = "green"
    const TEXT_HEIGHT = 20
    const recognitionGroup = SVGBuilder.createGroup({ role: SvgElementRole.RecognitionBox })

    const rect = SVGBuilder.createRect(box, { fill: "transparent", stroke: COLOR })
    recognitionGroup.appendChild(rect)

    const wordsGroup = SVGBuilder.createGroup({ id: `words-group-${ createUUID() }` })
    const wordX = box.x + box.width
    let wordY = box.y + TEXT_HEIGHT / 2
    words?.forEach(w =>
    {
      wordsGroup.appendChild(SVGBuilder.createText({ x: wordX, y: wordY }, w, { stroke: COLOR, style: NO_SELECTION }))
      wordY += TEXT_HEIGHT
    })
    recognitionGroup.appendChild(wordsGroup)
    this.layer.appendChild(recognitionGroup)

    const wordsGroupBox = wordsGroup.getBBox()
    const rectBox = {
      width: wordsGroupBox.width + 10,
      height: wordsGroupBox.height + 10,
      x: wordsGroupBox.x - 5,
      y: wordsGroupBox.y - 5,
    }
    const rectTranslate = SVGBuilder.createRect(rectBox, { fill: "white", style: "cursor:move", stroke: COLOR })
    wordsGroup.prepend(rectTranslate)

    const translateEl = (e: PointerEvent) =>
    {
      e.preventDefault()
      e.stopPropagation()
      const originX = Number(this.getAttribute(wordsGroup.id, "originX"))
      const originY = Number(this.getAttribute(wordsGroup.id, "originY"))
      const tx = e.clientX - originX
      const ty = e.clientY - originY
      this.setAttribute(wordsGroup.id, "transform", `translate(${ tx },${ ty })`)
      const newRectBox = {
        width: rectBox.width,
        height: rectBox.height,
        x: rectBox.x + tx,
        y: rectBox.y + ty,
      }
      this.removeSymbol(`connection-${ wordsGroup.id }`)
      this.drawConnectionBetweenBox(`connection-${ wordsGroup.id }`, box, newRectBox, COLOR, SvgElementRole.RecognitionBox)
    }

    rectTranslate.addEventListener("pointerdown", e =>
    {
      e.preventDefault()
      e.stopPropagation()
      if (!this.getAttribute(wordsGroup.id, "originX")) {
        this.setAttribute(wordsGroup.id, "originX", e.clientX.toString())
        this.setAttribute(wordsGroup.id, "originY", e.clientY.toString())
      }
      this.layer.addEventListener("pointermove", translateEl)
    })
    this.layer.addEventListener("pointerup", () => this.layer.removeEventListener("pointermove", translateEl))
    this.layer.addEventListener("pointerleave", () => this.layer.removeEventListener("pointermove", translateEl))
    this.layer.addEventListener("pointercancel", () => this.layer.removeEventListener("pointermove", translateEl))

  }

  clearRecognitionBox(): void
  {
    this.clearConnectionLine(SvgElementRole.RecognitionBox)
    this.layer.querySelectorAll(`[role=${ SvgElementRole.RecognitionBox }]`)
      .forEach(e => e.remove())
  }

  drawRecognitionBoxItem(box: TBoundingBox, label?: string, chars?: string[]): void
  {
    const COLOR = "blue"
    const CHAR_SIZE = 14

    const recognitionItemGroup = SVGBuilder.createGroup({ role: SvgElementRole.RecognitionBoxItem })
    const rect = SVGBuilder.createRect(box, { fill: "transparent", stroke: COLOR })
    recognitionItemGroup.appendChild(rect)

    const charX = box.x
    let charY = box.y - CHAR_SIZE

    const charsGroup = SVGBuilder.createGroup({ id: `chars-group-${ createUUID() }` })
    if (label) {
      charsGroup.appendChild(SVGBuilder.createText({ x: charX, y: charY }, `label: ${ label }`, { fill: COLOR, "font-size": CHAR_SIZE.toString(), style: NO_SELECTION }))
    }
    if (chars?.length) {
      charY += CHAR_SIZE
      charsGroup.appendChild(SVGBuilder.createText({ x: charX, y: charY }, `[${ chars.join(", ") }]`, { fill: COLOR, "font-size": CHAR_SIZE.toString(), style: NO_SELECTION }))
    }

    recognitionItemGroup.appendChild(charsGroup)
    this.layer.appendChild(recognitionItemGroup)

    const charsGroupBox = charsGroup.getBBox()
    const rectBox = {
      width: charsGroupBox.width + 10,
      height: charsGroupBox.height + 10,
      x: charsGroupBox.x - 5,
      y: charsGroupBox.y - 5,
    }
    const rectTranslate = SVGBuilder.createRect(rectBox, { fill: "white", style: "cursor:move", stroke: COLOR })
    charsGroup.prepend(rectTranslate)

    const translateEl = (e: PointerEvent) =>
    {
      e.preventDefault()
      e.stopPropagation()
      const originX = Number(this.getAttribute(charsGroup.id, "originX"))
      const originY = Number(this.getAttribute(charsGroup.id, "originY"))
      const tx = e.clientX - originX
      const ty = e.clientY - originY
      this.setAttribute(charsGroup.id, "transform", `translate(${ tx },${ ty })`)
      const newRectBox = {
        width: rectBox.width,
        height: rectBox.height,
        x: rectBox.x + tx,
        y: rectBox.y + ty,
      }
      this.removeSymbol(`connection-${ charsGroup.id }`)
      this.drawConnectionBetweenBox(`connection-${ charsGroup.id }`, box, newRectBox, COLOR, SvgElementRole.RecognitionBoxItem)
    }

    rectTranslate.addEventListener("pointerdown", e =>
    {
      e.preventDefault()
      e.stopPropagation()
      if (!this.getAttribute(charsGroup.id, "originX")) {
        this.setAttribute(charsGroup.id, "originX", e.clientX.toString())
        this.setAttribute(charsGroup.id, "originY", e.clientY.toString())
      }
      this.layer.addEventListener("pointermove", translateEl)
    })
    this.layer.addEventListener("pointerup", () => this.layer.removeEventListener("pointermove", translateEl))
    this.layer.addEventListener("pointerleave", () => this.layer.removeEventListener("pointermove", translateEl))
    this.layer.addEventListener("pointercancel", () => this.layer.removeEventListener("pointermove", translateEl))

  }

  clearRecognitionBoxItem(): void
  {
    this.clearConnectionLine(SvgElementRole.RecognitionBoxItem)
    this.layer.querySelectorAll(`[role=${ SvgElementRole.RecognitionBoxItem }]`)
      .forEach(e => e.remove())
  }

  resize(height: number, width: number): void
  {
    this.#logger.info("resize", { height, width })
    this.layer.setAttribute("width", `${ width }px`)
    this.layer.setAttribute("height", `${ height }px`)
    this.layer.setAttribute("viewBox", `0, 0, ${ width }, ${ height }`)
    this.removeGuides()
    if (this.configuration.guides.enable) {
      this.drawGuides()
    }
  }

  getRenderedElementFromSymbol(id: string): SVGGraphicsElement | null
  {
    return this.layer.querySelector(`#${ id }`) as SVGGraphicsElement | null
  }

  getRenderedElements({ type, attrs }: { type?: string, attrs?: { [key: string]: string } }): NodeListOf<Element>
  {
    this.#logger.info("getRenderedElements", { type, attrs })
    let query = type || "*"
    if (attrs) {
      Object.keys(attrs).forEach(k =>
      {
        query += `[${ k }=${ attrs[k] }]`
      })
    }
    return this.layer.querySelectorAll(query)
  }

  clearElements({ type, attrs }: { type?: string, attrs?: { [key: string]: string } }): void
  {
    this.#logger.info("clearElements", { type, attrs })
    this.getRenderedElements({ type, attrs })
      .forEach(e => e.remove())
  }

  clear(): void
  {
    this.#logger.info("clear")
    while (this.layer.firstChild) {
      this.layer.firstChild.remove()
    }
    this.createFilters()
    this.createDefs()
    if (this.configuration.guides.enable) {
      this.drawGuides()
    }
  }

  destroy(): void
  {
    if (this.parent) {
      while (this.parent.firstChild) {
        this.parent.firstChild.remove()
      }
    }
  }
}
