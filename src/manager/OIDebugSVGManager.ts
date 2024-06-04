import { LoggerClass } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel, TJIIXEdgeElement, TJIIXEdgePolyEdge, TJIIXNodeElement, TJIIXTextElement } from "../model"
import { Box, EdgeKind, OIText, SymbolType, TBoundingBox, TOISymbol } from "../primitive"
import { NO_SELECTION, OISVGRenderer, SVGBuilder } from "../renderer"
import { convertBoundingBoxMillimeterToPixel, createUUID } from "../utils"

/**
 * @group Manager
 */
export class OIDebugSVGManager
{
  #logger = LoggerManager.getLogger(LoggerClass.SVGDEBUG)
  #snapPointsVisibility = false
  #verticesVisibility = false
  #boundingBoxVisibility = false
  #recognitionBoxVisibility = false
  #recognitionItemBoxVisibility = false

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

  get snapPointsVisibility(): boolean
  {
    return this.#snapPointsVisibility
  }
  set snapPointsVisibility(show: boolean)
  {
    this.#snapPointsVisibility = show
    this.debugSnapPoints()
  }

  get verticesVisibility(): boolean
  {
    return this.#verticesVisibility
  }
  set verticesVisibility(show: boolean)
  {
    this.#verticesVisibility = show
    this.debugVertices()
  }

  get boundingBoxVisibility(): boolean
  {
    return this.#boundingBoxVisibility
  }
  set boundingBoxVisibility(show: boolean)
  {
    this.#boundingBoxVisibility = show
    this.#boundingBoxVisibility ? this.showBoundingBox() : this.hideBoundingBox()
  }

  get recognitionBoxVisibility(): boolean
  {
    return this.#recognitionBoxVisibility
  }
  set recognitionBoxVisibility(show: boolean)
  {
    this.#recognitionBoxVisibility = show
    this.debugRecognitionBox()
  }

  get recognitionItemBoxVisibility(): boolean
  {
    return this.#recognitionItemBoxVisibility
  }
  set recognitionItemBoxVisibility(show: boolean)
  {
    this.#recognitionItemBoxVisibility = show
    this.debugRecognitionItemBox()
  }

  protected showSnapPoints(): void
  {
    this.#logger.info("showSnapPoints")
    if (this.model.currentSymbol) {
      this.model.currentSymbol.snapPoints.forEach(p => this.renderer.drawCircle(p, 2, { fill: "blue", "debug": "snap-points" }))
    }
    this.model.symbols.forEach(s => s.snapPoints.forEach(p => this.renderer.drawCircle(p, 2, { fill: "blue", "debug": "snap-points" })))
  }
  protected hideSnapPoints(): void
  {
    this.#logger.info("hideSnapPoints")
    this.renderer.clearElements({ attrs: { "debug": "snap-points" } })
  }
  debugSnapPoints(): void
  {
    this.hideSnapPoints()
    if (this.snapPointsVisibility) {
      this.showSnapPoints()
    }
  }

  protected showVertices(): void
  {
    this.#logger.info("showVertices")
    if (this.model.currentSymbol) {
      this.model.currentSymbol.vertices.forEach(p => this.renderer.drawCircle(p, 2, { fill: "red", "debug": "vertices" }))
    }
    this.model.symbols.forEach(s => s.vertices.forEach(p => this.renderer.drawCircle(p, 2, { fill: "red", "debug": "vertices" })))
  }
  protected hideVertices(): void
  {
    this.#logger.info("hideVertices")
    this.renderer.clearElements({ attrs: { "debug": "vertices" } })
  }
  debugVertices(): void
  {
    this.hideVertices()
    if (this.verticesVisibility) {
      this.showVertices()
    }
  }

  protected drawBoundingBox(symbols: TOISymbol[]): void
  {
    const symbolAttrs = {
      style: "pointer-events: none",
      fill: "transparent",
      stroke: "red",
      "stroke-width": "1",
      "stroke-dasharray": "5 5",
      "vector-effect": "non-scaling-stroke",
      "debug": "bounding-box"
    }
    const charAttrs = {
      style: "pointer-events: none",
      fill: "transparent",
      stroke: "orange",
      "stroke-width": "1",
      "stroke-dasharray": "0 5 0",
      "vector-effect": "non-scaling-stroke",
      "debug": "bounding-box"
    }
    symbols.forEach(s =>
    {
      const symEl = this.renderer.getElementById(s.id)
      if (symEl) {
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
      }
    })
  }
  protected showBoundingBox(): void
  {
    this.#logger.info("showBoundingBox")
    if (this.model.currentSymbol) {
      this.drawBoundingBox([this.model.currentSymbol])
    }
    this.drawBoundingBox(this.model.symbols)
  }
  protected hideBoundingBox(): void
  {
    this.#logger.info("hideBoundingBox")
    this.renderer.clearElements({ attrs: { "debug": "bounding-box" } })
  }
  debugBoundingBox(): void
  {
    this.hideBoundingBox()
    if (this.boundingBoxVisibility) {
      this.showBoundingBox()
    }
  }

  protected drawRecognitionBox(box: TBoundingBox, infos?: string[]): void
  {
    const COLOR = "green"
    const TEXT_HEIGHT = 20
    const recognitionGroup = SVGBuilder.createGroup({ "debug": "recognition-box" })

    const rect = SVGBuilder.createRect(box, { fill: "transparent", stroke: COLOR, style: NO_SELECTION })
    recognitionGroup.appendChild(rect)

    const infosGroup = SVGBuilder.createGroup({ id: `infos-group-${ createUUID() }` })
    const infoX = box.x + box.width
    let infoY = box.y + TEXT_HEIGHT / 2
    infos?.forEach(w =>
    {
      infosGroup.appendChild(SVGBuilder.createText({ x: infoX, y: infoY }, w, { stroke: COLOR, style: NO_SELECTION }))
      infoY += TEXT_HEIGHT
    })
    recognitionGroup.appendChild(infosGroup)
    this.renderer.layer.appendChild(recognitionGroup)

    const infosGroupBox = infosGroup.getBBox()
    const rectBox = {
      width: infosGroupBox.width + 10,
      height: infosGroupBox.height + 10,
      x: infosGroupBox.x - 5,
      y: infosGroupBox.y - 5,
    }
    const rectTranslate = SVGBuilder.createRect(rectBox, { fill: "white", style: "cursor:move", stroke: COLOR })
    infosGroup.prepend(rectTranslate)

    const translateEl = (e: PointerEvent) =>
    {
      e.preventDefault()
      e.stopPropagation()
      const originX = Number(this.renderer.getAttribute(infosGroup.id, "originX"))
      const originY = Number(this.renderer.getAttribute(infosGroup.id, "originY"))
      const tx = e.clientX - originX
      const ty = e.clientY - originY
      this.renderer.setAttribute(infosGroup.id, "transform", `translate(${ tx },${ ty })`)
      const newRectBox = {
        width: rectBox.width,
        height: rectBox.height,
        x: rectBox.x + tx,
        y: rectBox.y + ty,
      }
      this.renderer.removeSymbol(`connection-${ infosGroup.id }`)
      this.renderer.drawConnectionBetweenBox(`connection-${ infosGroup.id }`, box, newRectBox, { stroke: COLOR, debug: "recognition-box-link"})
    }

    rectTranslate.addEventListener("pointerdown", e =>
    {
      e.preventDefault()
      e.stopPropagation()
      if (!this.renderer.getAttribute(infosGroup.id, "originX")) {
        this.renderer.setAttribute(infosGroup.id, "originX", e.clientX.toString())
        this.renderer.setAttribute(infosGroup.id, "originY", e.clientY.toString())
      }
      this.renderer.layer.addEventListener("pointermove", translateEl)
      this.renderer.layer.addEventListener("pointerup", () => this.renderer.layer.removeEventListener("pointermove", translateEl))
      this.renderer.layer.addEventListener("pointerleave", () => this.renderer.layer.removeEventListener("pointermove", translateEl))
      this.renderer.layer.addEventListener("pointercancel", () => this.renderer.layer.removeEventListener("pointermove", translateEl))
    })
  }
  protected async showRecognitionBox(): Promise<void>
  {
    this.#logger.info("showRecognitionBox")
    await this.behaviors.export(["application/vnd.myscript.jiix"])
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    this.#logger.debug("showRecognitionBox", { jiix })
    if (jiix) {
      if (!jiix["bounding-box"]) {
        this.#logger.warn("drawRecognitionBox", "You must to enabled configuration.recognition.exports[\"bounding-box\"]")
        return
      }
      jiix.elements?.forEach(e =>
      {
        switch (e.type) {
          case "Node": {
            const node = e as TJIIXNodeElement
            if (node["bounding-box"]) {
              const box = convertBoundingBoxMillimeterToPixel(node["bounding-box"])
              const hideProperties = ["bounding-box", "items", "id"]
              const infos = Object.keys(node).filter(k => !hideProperties.includes(k)).map(k => `${ k }: ${ JSON.stringify(node[k as keyof typeof node]) }`)
              this.drawRecognitionBox(box, infos)
            }
            break
          }
          case "Text": {
            const text = e as TJIIXTextElement
            text.words?.forEach(w =>
            {
              if (w?.["bounding-box"]) {
                const box = convertBoundingBoxMillimeterToPixel(w["bounding-box"])
                this.drawRecognitionBox(box, [`type: ${ text.type }`, `candidates: ${ JSON.stringify(w.candidates || []) }`])
              }
            })
            break
          }
          case "Edge": {
            const edge = e as TJIIXEdgeElement
            if (edge.kind === EdgeKind.PolyEdge) {
              const polyline = edge as TJIIXEdgePolyEdge
              const hideProperties = ["bounding-box", "items", "id", "x1", "x2", "y1", "y2", "ports", "connected"]
              const infos = Object.keys(edge).filter(k => !hideProperties.includes(k)).map(k => `${ k }: ${ JSON.stringify(edge[k as keyof typeof edge]) }`)
              const box = convertBoundingBoxMillimeterToPixel(Box.createFromBoxes(polyline.edges.map(e => e["bounding-box"] as TBoundingBox)))
              this.drawRecognitionBox(box, infos)
            }
            else if (edge["bounding-box"]) {
              const box = convertBoundingBoxMillimeterToPixel(edge["bounding-box"])
              const hideProperties = ["bounding-box", "items", "id", "x1", "x2", "y1", "y2", "ports", "connected"]
              const infos = Object.keys(edge).filter(k => !hideProperties.includes(k)).map(k => `${ k }: ${ JSON.stringify(edge[k as keyof typeof edge]) }`)
              this.drawRecognitionBox(box, infos)
            }
            break
          }
          default: {
            this.#logger.warn("drawRecognitionBox", `Unknow jiix element type: ${ e.type }`)
            break
          }
        }
      })
    }
  }
  protected clearRecognitionBox(): void
  {
    this.#logger.info("clearRecognitionBox")
    this.renderer.clearElements({ attrs: { "debug": "recognition-box" } })
    this.renderer.clearElements({ attrs: { "debug": "recognition-box-link" } })
  }
  async debugRecognitionBox(): Promise<void>
  {
    this.clearRecognitionBox()
    if (this.#recognitionBoxVisibility) {
      this.showRecognitionBox()
    }
  }

  protected drawRecognitionItemBox(box: TBoundingBox, label?: string, chars?: string[]): void
  {
    const COLOR = "blue"
    const CHAR_SIZE = 14

    const recognitionItemGroup = SVGBuilder.createGroup({ "debug": "recognition-item-box" })
    const rect = SVGBuilder.createRect(box, { fill: "transparent", stroke: COLOR, style: NO_SELECTION })
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
    this.renderer.layer.appendChild(recognitionItemGroup)

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
      const originX = Number(this.renderer.getAttribute(charsGroup.id, "originX"))
      const originY = Number(this.renderer.getAttribute(charsGroup.id, "originY"))
      const tx = e.clientX - originX
      const ty = e.clientY - originY
      this.renderer.setAttribute(charsGroup.id, "transform", `translate(${ tx },${ ty })`)
      const newRectBox = {
        width: rectBox.width,
        height: rectBox.height,
        x: rectBox.x + tx,
        y: rectBox.y + ty,
      }
      this.renderer.removeSymbol(`connection-${ charsGroup.id }`)
      this.renderer.drawConnectionBetweenBox(`connection-${ charsGroup.id }`, box, newRectBox, { stroke: COLOR, debug: "recognition-item-box-link"})
    }

    rectTranslate.addEventListener("pointerdown", e =>
    {
      e.preventDefault()
      e.stopPropagation()
      if (!this.renderer.getAttribute(charsGroup.id, "originX")) {
        this.renderer.setAttribute(charsGroup.id, "originX", e.clientX.toString())
        this.renderer.setAttribute(charsGroup.id, "originY", e.clientY.toString())
      }
      this.renderer.layer.addEventListener("pointermove", translateEl)
    })
    this.renderer.layer.addEventListener("pointerup", () => this.renderer.layer.removeEventListener("pointermove", translateEl))
    this.renderer.layer.addEventListener("pointerleave", () => this.renderer.layer.removeEventListener("pointermove", translateEl))
    this.renderer.layer.addEventListener("pointercancel", () => this.renderer.layer.removeEventListener("pointermove", translateEl))

  }
  protected async showRecognitionItemBox(): Promise<void>
  {
    this.#logger.info("showRecognitionBoxItem")
    await this.behaviors.export(["application/vnd.myscript.jiix"])
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    this.#logger.debug("showRecognitionBoxItem", { jiix })
    if (jiix) {
      jiix.elements?.forEach(e =>
      {
        switch (e.type) {
          case "Text": {
            const text = e as TJIIXTextElement
            text.chars?.forEach(c =>
            {
              if (c?.["bounding-box"]) {
                const box = convertBoundingBoxMillimeterToPixel(c["bounding-box"])
                this.drawRecognitionItemBox(box, c.label, c.candidates)
              }
            })
            break
          }
          case "Node": {
            const node = e as TJIIXNodeElement
            if (node?.["bounding-box"]) {
              const box = convertBoundingBoxMillimeterToPixel(node["bounding-box"])
              this.drawRecognitionItemBox(box, node.kind)
            }
            break
          }
          case "Edge": {
            const edge = e as TJIIXEdgeElement
            if (edge.kind === EdgeKind.PolyEdge) {
              const polyline = edge as TJIIXEdgePolyEdge
              polyline.edges.forEach(e => {
                const box = convertBoundingBoxMillimeterToPixel(e["bounding-box"])
                this.drawRecognitionItemBox(box, e.kind)
              })
            }
            else if (edge["bounding-box"]) {
              const box = convertBoundingBoxMillimeterToPixel(edge["bounding-box"])
              this.drawRecognitionItemBox(box, edge.kind)
            }
            break
          }
          default:
            this.#logger.warn("drawRecognitionBoxItem", `Unknow jiix element type: ${ e.type }`)
            break
        }
      })
    }
  }
  protected clearRecognitionItemBox(): void
  {
    this.#logger.info("clearRecognitionBoxItem")
    this.renderer.clearElements({ attrs: { "debug": "recognition-item-box" } })
    this.renderer.clearElements({ attrs: { "debug": "recognition-item-box-link" } })
  }
  async debugRecognitionItemBox(): Promise<void>
  {
    this.clearRecognitionItemBox()
    if (this.#recognitionItemBoxVisibility) {
      this.showRecognitionItemBox()
    }
  }

  async apply(): Promise<void>
  {
    this.debugBoundingBox()
    this.debugVertices()
    this.debugSnapPoints()
    await this.debugRecognitionBox()
    await this.debugRecognitionItemBox()
  }
}
