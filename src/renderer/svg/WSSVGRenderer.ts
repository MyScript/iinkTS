import { TRenderingConfiguration } from "../../@types/configuration/RenderingConfiguration"
import { IModel } from "../../@types/model/Model"
import { TUpdatePatch, TUpdatePatchAppendChild, TUpdatePatchInsertBefore, TUpdatePatchRemoveAttribut, TUpdatePatchRemoveChild, TUpdatePatchRemoveElement, TUpdatePatchReplaceAll, TUpdatePatchReplaceELement, TUpdatePatchSetAttribut } from "../../@types/recognizer/WSRecognizer"
import { TStroke } from "../../@types/model/Stroke"
import { SVGStroker } from "./SVGStroker"
import { LoggerManager } from "../../logger"
import { LoggerClass } from "../../Constants"

export class WSSVGRenderer
{
  config: TRenderingConfiguration
  stroker: SVGStroker
  context!: {
    parent: HTMLElement
  }
  #logger = LoggerManager.getLogger(LoggerClass.SVGRENDERER)

  constructor(config: TRenderingConfiguration)
  {
    this.#logger.info("constructor", { config })
    this.config = config
    this.stroker = new SVGStroker()
  }

  init(element: HTMLElement): void
  {
    this.#logger.info("init", { element })
    element.style.fontSize = "10px"
    this.context = {
      parent: element
    }
  }

  #drawStroke(svgElement: SVGElement, stroke: TStroke)
  {
    let style: string
    if (stroke.pointerType === "eraser") {
      stroke.style.width = 20
      style = "fill:grey;stroke:transparent;shadowBlur:5;opacity:0.2;"
    } else {
      style = `fill:${ stroke.style.color };stroke:transparent;`
    }
    this.stroker.drawStroke(svgElement, stroke, [{ name: "style", value: style }])
  }

  #replaceAll(layerName: string, update: TUpdatePatchReplaceAll): void
  {
    const oldLayer = this.context.parent.querySelector(`svg[data-layer="${ layerName }"]`) as SVGElement | null
    oldLayer?.remove()
    this.context.parent.insertAdjacentHTML("beforeend", update.svg)
    const layer = this.context.parent.querySelector(`svg[data-layer="${ layerName }"]`) as SVGElement
    if (layerName === "MODEL") {
      const pendingStrokesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
      pendingStrokesGroup.id = "pendingStrokes"
      layer.appendChild(pendingStrokesGroup)
    }
  }

  #replaceElement(update: TUpdatePatchReplaceELement): void
  {
    const elementToRemove = this.context.parent.querySelector(`#${ update.id }`) as HTMLElement | null
    if (elementToRemove) {
      const parent = elementToRemove.parentNode as HTMLElement | null | undefined
      elementToRemove?.remove()
      parent?.insertAdjacentHTML("beforeend", update.svg)
    }
  }

  #appendChild(layerName: string, update: TUpdatePatchAppendChild): void
  {
    const parentSelector = update.parentId ? `#${ update.parentId }` : `svg[data-layer="${ layerName }"]`
    const parent = this.context.parent.querySelector(parentSelector) as HTMLElement
    parent?.insertAdjacentHTML("beforeend", update.svg)
  }

  #removeChild(update: TUpdatePatchRemoveChild): void
  {
    this.context.parent.querySelector(`#${ update.parentId } > *:nth-child(${ update.index + 1 })`)?.remove()
  }

  #removeElement(update: TUpdatePatchRemoveElement): void
  {
    const elementToRemove = this.context.parent.querySelector(`#${ update.id }`)
    if (elementToRemove) {
      if (update.id.includes("s") || update.id.includes("MODEL")) {
        elementToRemove.remove()
      } else {
        elementToRemove.setAttribute("class", "removed-stroke")
        setTimeout(() =>
        {
          elementToRemove?.remove()
        }, 100)
      }
    }
  }

  #insertBefore(update: TUpdatePatchInsertBefore): void
  {
    const parent = this.context.parent.querySelector(`#${ update.refId }`) as HTMLElement | null
    parent?.insertAdjacentHTML("beforebegin", update.svg)
  }

  #setAttribute(update: TUpdatePatchSetAttribut): void
  {
    const selector = update.id ? `#${ update.id }` : "svg"
    const element = this.context.parent.querySelector(selector) as HTMLElement | null
    element?.setAttribute(update.name, update.value)
  }

  #removeAttribute(update: TUpdatePatchRemoveAttribut): void
  {
    const selector = update.id ? `#${ update.id }` : "svg"
    const element = this.context.parent.querySelector(selector) as HTMLElement | null
    element?.removeAttribute(update.name)
  }

  updateLayer(layerName: string, update: TUpdatePatch): void
  {
    this.#logger.info("updateLayer", { layerName, update })
    switch (update.type) {
      case "REPLACE_ALL":
        this.#replaceAll(layerName, update as TUpdatePatchReplaceAll)
        break
      case "REPLACE_ELEMENT":
        this.#replaceElement(update as TUpdatePatchReplaceELement)
        break
      case "APPEND_CHILD":
        this.#appendChild(layerName, update as TUpdatePatchAppendChild)
        break
      case "REMOVE_ELEMENT":
        this.#removeElement(update as TUpdatePatchRemoveElement)
        break
      case "REMOVE_CHILD":
        this.#removeChild(update as TUpdatePatchRemoveChild)
        break
      case "INSERT_BEFORE":
        this.#insertBefore(update as TUpdatePatchInsertBefore)
        break
      case "SET_ATTRIBUTE":
        this.#setAttribute(update as TUpdatePatchSetAttribut)
        break
      case "REMOVE_ATTRIBUTE":
        this.#removeAttribute(update as TUpdatePatchRemoveAttribut)
        break
      default:
        this.#logger.warn("updateLayer Default", {layerName, update})
        break
    }
  }

  updatesLayer(layerName: string, updates: TUpdatePatch[]): void
  {
    this.#logger.info("updatesLayer", { layerName, updates })
    updates.forEach(u => this.updateLayer(layerName, u))
    this.clearPendingStroke()
  }

  clearPendingStroke(): void
  {
    this.#logger.info("clearPendingStroke", { })
    const pendingStrokeGroup = this.context.parent.querySelector("#pendingStrokes") as SVGElement
    if (pendingStrokeGroup) {
      pendingStrokeGroup.innerHTML = ""
    }
  }

  drawPendingStroke(stroke: TStroke): void
  {
    this.#logger.info("drawPendingStroke", { stroke })
    if (stroke) {
      const pendingStrokeGroup = this.context.parent.querySelector("#pendingStrokes") as SVGElement
      if (pendingStrokeGroup) {
        const oldStroke = pendingStrokeGroup.querySelector(`#${ stroke?.id }`)
        if (oldStroke) {
          oldStroke.remove()
        }
        this.#drawStroke(pendingStrokeGroup, stroke)
      }
    }
  }

  clearErasingStrokes(): void
  {
    const erasingStrokeList = this.context.parent.querySelectorAll("[type=eraser]") as NodeListOf<SVGElement>
    erasingStrokeList.forEach(erasingStroke => {
      erasingStroke.remove()
    })
  }

  resize(model: IModel): void
  {
    this.#logger.info("resize", { model })
    const rect = this.context.parent.getBoundingClientRect()
    const svgList = this.context.parent.querySelectorAll("svg")
    const width = Math.max(rect.width, model.width)
    const height = Math.max(rect.height, model.height)
    svgList.forEach(svg =>
    {
      svg.setAttribute("viewBox", `0 0 ${ width }, ${ height }`)
      svg.setAttribute("width", `${ width }px`)
      svg.setAttribute("height", `${ height }px`)
    })
  }

  destroy(): void
  {
    this.#logger.info("destroy", { })
    if (this.context.parent) {
      this.context.parent.querySelectorAll("svg").forEach(n => n.remove())
    }
  }
}
