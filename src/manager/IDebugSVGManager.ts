import { LoggerManager, LoggerCategory } from "../logger"
import { IModel } from "../model"
import { Box, IIStroke, IIText, SymbolType, TBox, TIISymbol } from "../symbol"
import { SVGRenderer, SVGRendererConst, SVGBuilder } from "../renderer"
import { createUUID } from "../utils"
import { InkEditor } from "../editor"

/**
 * @group Manager
 */
export class IDebugSVGManager {
  #logger = LoggerManager.getLogger(LoggerCategory.SVGDEBUG)
  #recognitionBoxVisibility = false
  #recognitionBoxItemsVisibility = false

  editor: InkEditor

  constructor(editor: InkEditor) {
    this.#logger.info("constructor")
    this.editor = editor
  }

  get model(): IModel {
    return this.editor.model
  }

  get renderer(): SVGRenderer {
    return this.editor.renderer
  }

  get recognitionBoxVisibility(): boolean {
    return this.#recognitionBoxVisibility
  }

  set recognitionBoxVisibility(show: boolean) {
    this.#recognitionBoxVisibility = show
    this.debugRecognitionBox()
  }

  get recognitionBoxItemsVisibility(): boolean {
    return this.#recognitionBoxItemsVisibility
  }

  set recognitionBoxItemsVisibility(show: boolean) {
    this.#recognitionBoxItemsVisibility = show
    this.debugRecognitionBoxItems()
  }

  protected drawBoundingBox(symbols: TIISymbol[]): void {
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
    symbols.forEach(s => {
      const symEl = this.renderer.getElementById(s.id)
      if (symEl) {
        if (s.type === SymbolType.Text) {
          const text = s as IIText
          let transform: string = ""
          if (text.rotation) {
            transform = `rotate(${text.rotation.degree}, ${text.rotation.center.x}, ${text.rotation.center.y})`
          }
          text.chars.forEach(c => {
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

  protected drawRecognitionBox(box: TBox, infos: string[], color: string , debugAttr: string): void {
    const TEXT_HEIGHT = 20
    const recognitionGroup = SVGBuilder.createGroup({ "debug": debugAttr, "opacity": debugAttr === "recognition-box-items" ? "0.8" : "1" })
    const rectAttr = {
      fill: "transparent",
      stroke: color,
      style: SVGRendererConst.noSelection,
      "stroke-dasharray": debugAttr === "recognition-box-items" ? "1 5 10" : "" ,
    }
    const rect = SVGBuilder.createRect(box, rectAttr)
    recognitionGroup.appendChild(rect)

    const infosGroup = SVGBuilder.createGroup({ id: `infos-group-${createUUID()}` })
    const infoX = box.x + box.width
    let infoY = box.y + TEXT_HEIGHT / 2
    infos?.forEach(w => {
      infosGroup.appendChild(SVGBuilder.createText({ x: infoX, y: infoY }, w, { stroke: color, style: SVGRendererConst.noSelection }))
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

    const rectTranslate = SVGBuilder.createRect(rectBox, { ...rectAttr, fill: "white", style: "cursor:move" })
    infosGroup.prepend(rectTranslate)

    const translateEl = (e: PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const originX = Number(this.renderer.getAttribute(infosGroup.id, "originX"))
      const originY = Number(this.renderer.getAttribute(infosGroup.id, "originY"))
      const tx = e.clientX - originX
      const ty = e.clientY - originY
      this.renderer.setAttribute(infosGroup.id, "transform", `translate(${tx},${ty})`)
      const newRectBox = {
        width: rectBox.width,
        height: rectBox.height,
        x: rectBox.x + tx,
        y: rectBox.y + ty,
      }
      this.renderer.removeSymbol(`connection-${infosGroup.id}`)
      this.renderer.drawConnectionBetweenBox(`connection-${infosGroup.id}`, box, newRectBox, "sides", { stroke: color, debug: debugAttr })
    }

    rectTranslate.addEventListener("pointerdown", e => {
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

  protected buildInfos(obj: object, currentPath = ""): string[] {
    const infos: string[] = []
    Object.keys(obj).forEach((key) => {
      const value = obj[key as keyof typeof obj]
      const localPath = currentPath ? `${currentPath}.${key}` : key
      switch (typeof value) {
        case "object":
          infos.push(...this.buildInfos(value, localPath))
          break
        default:
          infos.push(`${localPath}: ${JSON.stringify(value)}`)
          break
      }
    })
    return infos
  }

  protected async showRecognitionBox(): Promise<void> {
    this.#logger.info("showRecognitionBox")
    let jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    if (!jiix) {
      const exports = await this.editor.recognizer.send(this.model.strokes, ["application/vnd.myscript.jiix"])
      jiix = exports["application/vnd.myscript.jiix"]!
    }
    this.#logger.debug("showRecognitionBox", { jiix })
    if (jiix) {
      jiix.elements?.forEach(el => {
        switch (el.type) {
          case "Drawing":
          case "Shape": {
            const associatedStrokes: IIStroke[] = []
            el.range?.forEach(r => {
              associatedStrokes.push(...this.model.strokes.slice(r.from.stroke, r.to.stroke + 1))
            })
            const box = Box.createFromBoxes(associatedStrokes.map(s => s.bounds))
            let infos: string[] = [`type: ${el.type}`]
            infos.push(...this.buildInfos(el))
            const hideProperties = ["bounding-box", "primitives", "range", "candidates"]
            infos = infos.filter(i => !hideProperties.some(h => i.indexOf(h) > -1))
            const color = el.type === "Shape" ? "orange" : "green"
            this.drawRecognitionBox(box, infos, color, "recognition-box")
            break
          }
          case "Text": {
            const associatedStrokes: IIStroke[] = []
            el.range?.forEach(r => {
              associatedStrokes.push(...this.model.strokes.slice(r.from.stroke, r.to.stroke + 1))
            })
            const box = Box.createFromBoxes(associatedStrokes.map(s => s.bounds))
            this.drawRecognitionBox(box, [`type: ${el.type}`, `label: ${JSON.stringify(el.label || [])}`], "blue", "recognition-box")
            break
          }
          case "Math": {
            const associatedStrokes: IIStroke[] = []
            el.range?.forEach(r => {
              associatedStrokes.push(...this.model.strokes.slice(r.from.stroke, r.to.stroke + 1))
            })
            const box = Box.createFromBoxes(associatedStrokes.map(s => s.bounds))
            let infos: string[] = [`type: ${el.type}`]
            infos.push(...this.buildInfos(el))
            const hideProperties = ["bounding-box", "primitives", "range", "candidates"]
            infos = infos.filter(i => !hideProperties.some(h => i.indexOf(h) > -1))
            this.drawRecognitionBox(box, infos, "red", "recognition-box")
            break
          }
          default: {
            this.#logger.warn("drawRecognitionBox", `Unknow jiix element type: ${el.type}`)
            break
          }
        }
      })
    }
  }

  protected async showRecognitionBoxItems(): Promise<void> {
    this.#logger.info("showRecognitionBoxItems")
    let jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    if (!jiix) {
      const exports = await this.editor.recognizer.send(this.model.strokes, ["application/vnd.myscript.jiix"])
      jiix = exports["application/vnd.myscript.jiix"]!
    }
    this.#logger.debug("showRecognitionBoxItems", { jiix })
    if (jiix) {
      jiix.elements?.forEach(el => {
        switch (el.type) {
          case "Shape": {
            el.elements.forEach(e => {
              const associatedStrokes: IIStroke[] = []
              e.range?.forEach(r => {
                associatedStrokes.push(...this.model.strokes.slice(r.from.stroke, r.to.stroke + 1))
              })
              const box = Box.createFromBoxes(associatedStrokes.map(s => s.bounds))
              let infos: string[] = [`type: ${el.type}`]
              infos.push(...this.buildInfos(e))
              const hideProperties = ["bounding-box", "primitives", "range", "candidates"]
              infos = infos.filter(i => !hideProperties.some(h => i.indexOf(h) > -1))
              this.drawRecognitionBox(box, infos, "#ce922a", "recognition-box-items")
            })
            break
          }
          case "Math":
          case "Text": {
            el.lines?.forEach(e => {
              e.spans?.forEach(s => {
                const associatedStrokes: IIStroke[] = []
                s.range.forEach(r => {
                  associatedStrokes.push(...this.model.strokes.slice(r.from.stroke, r.to.stroke + 1))
                })
                const color = s.type === "Math" ? "#ff6565" : "#099df7"
                const box = Box.createFromBoxes(associatedStrokes.map(s => s.bounds))
                this.drawRecognitionBox(box, [`type: ${s.type}`, `label: ${JSON.stringify(s.label || [])}`], color, "recognition-box-items")
              })
            })
            break
          }

          default: {
            this.#logger.warn("drawRecognitionBox", `Unknow jiix element type: ${el.type}`)
            break
          }
        }
      })
    }
  }

  protected clearRecognitionBox(): void {
    this.#logger.info("clearRecognitionBox")
    this.renderer.clearElements({ attrs: { "debug": "recognition-box" } })
  }

  protected clearRecognitionBoxItems(): void {
    this.#logger.info("clearRecognitionBoxItems")
    this.renderer.clearElements({ attrs: { "debug": "recognition-box-items" } })
  }

  async debugRecognitionBox(): Promise<void> {
    this.clearRecognitionBox()
    if (this.#recognitionBoxVisibility) {
      this.showRecognitionBox()
    }
  }

  async debugRecognitionBoxItems(): Promise<void> {
    this.clearRecognitionBoxItems()
    if (this.#recognitionBoxItemsVisibility) {
      this.showRecognitionBoxItems()
    }
  }

  apply(): void {
    this.debugRecognitionBox()
    this.debugRecognitionBoxItems()
  }
}
