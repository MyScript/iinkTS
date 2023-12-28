import { LoggerClass, SvgElementRole } from "../../Constants"
import { TRenderingConfiguration } from "../../configuration"
import { LoggerManager } from "../../logger"
import { OIStroke, SymbolType, TOIEdge, TOISymbol, TPoint, TOIShape } from "../../primitive"
import { OISVGRendererEdge } from "./OISVGRendererEdge"
import { OISVGRendererShape } from "./OISVGRendererShape"
import { OISVGRendererStroke } from "./OISVGRendererStroke"
import { createCircle, createComponentTransfert, createDefs, createFilter, createGroup, createLayer, createLine, createMarker, createPolygon, createTransfertFunctionTable } from "./SVGElementBuilder"

const NO_SELECTION = "pointer-events: none; -webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;"

/**
 * @group Renderer
 */
export class OISVGRenderer
{
  #logger = LoggerManager.getLogger(LoggerClass.RENDERER)
  groupGuidesId = "guides-wrapper"
  selectionFilterId = "selection-filter"
  arrowHeadStart = "arrow-head-start"
  arrowHeadEnd = "arrow-head-end"

  configuration: TRenderingConfiguration
  parent!: HTMLElement
  layer!: SVGElement
  strokeRenderer: OISVGRendererStroke
  shapeRenderer: OISVGRendererShape
  edgeRenderer: OISVGRendererEdge

  verticalGuides: number[] = []
  horizontalGuides: number[] = []
  boxMargin = 5

  constructor(configuration: TRenderingConfiguration)
  {
    this.#logger.info("constructor", { configuration })
    this.configuration = configuration
    this.strokeRenderer = new OISVGRendererStroke(this.selectionFilterId)
    this.shapeRenderer = new OISVGRendererShape(this.selectionFilterId)
    this.edgeRenderer = new OISVGRendererEdge(this.selectionFilterId, this.arrowHeadStart, this.arrowHeadEnd)
  }

  protected initLayer(): void
  {
    const width = Math.max(this.configuration.minWidth, this.parent.clientWidth)
    const height = Math.max(this.configuration.minHeight, this.parent.clientHeight)
    this.layer = createLayer(width, height)
    this.layer.style.setProperty("height", "auto")
    this.layer.style.setProperty("width", "auto")
    this.parent.style.setProperty("overflow", "auto")
    this.parent.appendChild(this.layer)
  }

  protected createDefs(): void
  {
    const defs = createDefs()

    const SIZE = 5
    const REFX = 0, REFY = SIZE / 2
    const arrowHeadPolyAttrs = {
      style: NO_SELECTION,
      fill: "context-stroke",
    }
    const arrowHeadStart = createMarker(this.arrowHeadStart, SIZE, SIZE, REFX, REFY, "auto-start-reverse")
    arrowHeadStart.appendChild(createPolygon([0, 0, SIZE, REFY, REFX, SIZE], arrowHeadPolyAttrs))
    defs.appendChild(arrowHeadStart)

    const arrowHeadEnd = createMarker(this.arrowHeadEnd, SIZE, SIZE, REFX, REFY, "auto")
    arrowHeadEnd.appendChild(createPolygon([0, 0, SIZE, REFY, REFX, SIZE], arrowHeadPolyAttrs))
    defs.appendChild(arrowHeadEnd)

    this.layer.appendChild(defs)
  }

  protected createFilters(): void
  {
    const selectionFilter = createFilter(this.selectionFilterId)
    const bfeComponentTransfer = createComponentTransfert()
    const bfeFuncA = createTransfertFunctionTable("feFuncA", "0 0.25")
    bfeComponentTransfer.appendChild(bfeFuncA)
    selectionFilter.appendChild(bfeComponentTransfer)
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
    const guidesGroup = createGroup(attrs)
    switch (this.configuration.guides.type) {
      case "line":
        for (let y = offSet; y < height; y += offSet) {
          const begin: TPoint = { x: offSet, y }
          const end: TPoint = { x: width - offSet, y }
          this.horizontalGuides.push(y)
          const svgLine = createLine(begin, end, { "stroke-width": "1" })
          guidesGroup.appendChild(svgLine)
        }
        break
      case "grid":
        for (let y = 0; y < height; y += offSet) {
          const begin: TPoint = { x: 0, y }
          const end: TPoint = { x: width, y }
          const svgLine = createLine(begin, end, { "stroke-width": "1" })
          guidesGroup.appendChild(svgLine)
          this.horizontalGuides.push(y)
          for (let subY = y + subOffSet; subY < y + offSet; subY += subOffSet) {
            this.horizontalGuides.push(subY)
            const svgLine = createLine({ x: 0, y: subY }, { x: width, y: subY }, { "stroke-width": "0.25" })
            guidesGroup.appendChild(svgLine)
          }
        }
        for (let x = 0; x < width; x += offSet) {
          const begin: TPoint = { x, y: 0 }
          const end: TPoint = { x, y: height }
          const svgLine = createLine(begin, end, { "stroke-width": "1" })
          guidesGroup.appendChild(svgLine)
          this.verticalGuides.push(x)
          for (let subX = x + subOffSet; subX < x + offSet; subX += subOffSet) {
            this.verticalGuides.push(subX)
            const svgLine = createLine({ x: subX, y: 0 }, { x: subX, y: height }, { "stroke-width": "0.25" })
            guidesGroup.appendChild(svgLine)
          }
        }
        break
      case "point":
        for (let x = offSet; x < width; x += offSet) {
          this.verticalGuides.push(x)
          for (let y = offSet; y < height; y += offSet) {
            this.horizontalGuides.push(y)
            const svgPoint = createCircle({ x, y }, 1)
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

  init(element: HTMLElement): void
  {
    this.#logger.info("init", { element })
    this.parent = element
    this.initLayer()
    this.createFilters()
    this.createDefs()
    if (this.configuration.guides.enable) {
      this.drawGuides()
    }
  }

  getSymbolElement(symbol: TOISymbol): SVGGeometryElement | undefined
  {
    switch(symbol.type) {
      case SymbolType.Stroke:
        return this.strokeRenderer.getSVGElement(symbol as OIStroke)
      case SymbolType.Shape:
        return this.shapeRenderer.getSVGElement(symbol as TOIShape)
      case SymbolType.Edge:
        return this.edgeRenderer.getSVGElement(symbol as TOIEdge)
      default:
        this.#logger.error("getSymbolElement", `symbol type is unknow: "${symbol.type}"`)
        return
    }
  }

  drawSymbol(symbol: TOISymbol): void
  {
    this.#logger.debug("drawSymbol", { symbol })
    const oldNode = this.layer.querySelector(`#${ symbol?.id }`)
    const svgEl = this.getSymbolElement(symbol)
    if (svgEl) {
      if (oldNode) {
        oldNode.replaceWith(svgEl)
      }
      else {
        this.layer.appendChild(svgEl)
      }
    }
  }

  removeSymbol(id: string): void
  {
    this.#logger.debug("removeStroke", { id })
    const oldStroke = this.layer.querySelector(`#${ id }`)
    if (oldStroke) {
      oldStroke.remove()
    }
  }

  resize(height: number, width: number): void
  {
    this.#logger.info("resize", { height, width })
    this.layer.setAttribute("width", `${ width }px`)
    this.layer.setAttribute("height", `${ height }px`)
    this.layer.setAttribute("viewBox", `0, 0, ${ width }, ${ height }`)
    if (this.configuration.guides.enable) {
      this.removeGuides()
      this.drawGuides()
    }
  }

  clearElements(type: string, attrs: { [key: string]: string } = {}): void
  {
    this.#logger.info("clearElements", { type, attrs })
    let query = type
    Object.keys(attrs).forEach(k =>
    {
      query += `[${ k }=${ attrs[k] }]`
    })
    this.layer.querySelectorAll(query)
      .forEach(e => e.remove())
  }

  clear(): void
  {
    this.#logger.info("clear")
    while (this.layer.firstChild) {
      this.layer.firstChild.remove()
    }
    this.init(this.parent)
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
