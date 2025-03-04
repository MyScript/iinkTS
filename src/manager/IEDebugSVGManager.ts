import { LoggerManager, LoggerCategory } from "../logger"
import { IIModel, JIIXEdgeKind } from "../model"
import { Box, IIText, SymbolType, TBox, TIISymbol } from "../symbol"
import { SVGRenderer, SVGRendererConst, SVGBuilder } from "../renderer"
import { convertBoundingBoxMillimeterToPixel, createUUID } from "../utils"
import { InkEditor } from "../editor"

/**
 * @group Manager
 */
export class IIDebugSVGManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.SVGDEBUG)
  #recognitionBoxVisibility = false

  editor: InkEditor

  constructor(editor: InkEditor)
  {
    this.#logger.info("constructor")
    this.editor = editor
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
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

  protected drawBoundingBox(symbols: TIISymbol[]): void
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
          const text = s as IIText
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
            symEl.insertAdjacentElement("beforebegin", SVGBuilder.createRect(c.bounds, ca))
          })
          const sa = {
            ...symbolAttrs,
            symbol: s.id,
            transform
          }
          symEl.insertAdjacentElement("beforebegin", SVGBuilder.createRect(s.bounds, sa))
        }
        else {
          const sa = {
            ...symbolAttrs,
            symbol: s.id,
          }
          symEl.insertAdjacentElement("beforebegin", SVGBuilder.createRect(s.bounds, sa))
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

  protected drawRecognitionBox(box: TBox, infos?: string[]): void
  {
    const COLOR = "green"
    const TEXT_HEIGHT = 20
    const recognitionGroup = SVGBuilder.createGroup({ "debug": "recognition-box" })

    const rect = SVGBuilder.createRect(box, { fill: "transparent", stroke: COLOR, style: SVGRendererConst.noSelection })
    recognitionGroup.appendChild(rect)

    const infosGroup = SVGBuilder.createGroup({ id: `infos-group-${ createUUID() }` })
    const infoX = box.x + box.width
    let infoY = box.y + TEXT_HEIGHT / 2
    infos?.forEach(w =>
    {
      infosGroup.appendChild(SVGBuilder.createText({ x: infoX, y: infoY }, w, { stroke: COLOR, style: SVGRendererConst.noSelection }))
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
      this.renderer.drawConnectionBetweenBox(`connection-${ infosGroup.id }`, box, newRectBox, { stroke: COLOR, debug: "recognition-box-link" })
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
    await this.editor.recognizer.send(["application/vnd.myscript.jiix"])
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    this.#logger.debug("showRecognitionBox", { jiix })
    if (jiix) {
      if (!jiix["bounding-box"]) {
        this.#logger.warn("drawRecognitionBox", "You must to enabled configuration.recognition.exports[\"bounding-box\"]")
        return
      }
      jiix.elements?.forEach(el =>
      {
        switch (el.type) {
          case "Node": {
            if (el["bounding-box"]) {
              const box = convertBoundingBoxMillimeterToPixel(el["bounding-box"])
              const hideProperties = ["bounding-box", "items", "id"]
              const infos = Object.keys(el).filter(k => !hideProperties.includes(k)).map(k => `${ k }: ${ JSON.stringify(el[k as keyof typeof el]) }`)
              this.drawRecognitionBox(box, infos)
            }
            break
          }
          case "Text": {
            el.words?.forEach(w =>
            {
              if (w?.["bounding-box"]) {
                const box = convertBoundingBoxMillimeterToPixel(w["bounding-box"])
                this.drawRecognitionBox(box, [`type: ${ el.type }`, `candidates: ${ JSON.stringify(w.candidates || []) }`])
              }
            })
            break
          }
          case "Edge": {
            if (el.kind === JIIXEdgeKind.PolyEdge) {
              const infos = [
                `type: ${ el.type }`,
                `kind: ${ el.kind }`,
              ]
              el.edges.forEach((e, i) =>
              {
                let inf = `edge-${ i }: [{ x1: ${ e.x1 }, y2: ${ e.y1 } },{ x2: ${ e.x2 }, y2: ${ e.y2 } }]`
                if (e.p1Decoration) {
                  inf += `, p1Decoration: ${ e.p1Decoration }`
                }
                if (e.p2Decoration) {
                  inf += `, p2Decoration: ${ e.p2Decoration }`
                }
                infos.push(inf)
              })
              const box = convertBoundingBoxMillimeterToPixel(Box.createFromBoxes(el.edges.map(e => e["bounding-box"] as TBox)))
              this.drawRecognitionBox(box, infos)
            }
            else if (el["bounding-box"]) {
              const box = convertBoundingBoxMillimeterToPixel(el["bounding-box"])
              const hideProperties = ["bounding-box", "items", "id", "ports", "connected"]
              const infos = Object.keys(el).filter(k => !hideProperties.includes(k)).map(k => `${ k }: ${ JSON.stringify(el[k as keyof typeof el]) }`)
              this.drawRecognitionBox(box, infos)
            }
            break
          }
          default: {
            this.#logger.warn("drawRecognitionBox", `Unknow jiix element type: ${ el.type }`)
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

  apply(): void
  {
    this.debugRecognitionBox()
  }
}
