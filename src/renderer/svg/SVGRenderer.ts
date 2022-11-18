import { TRenderingConfiguration } from "../../@types/configuration/RenderingConfiguration"
import { IModel } from "../../@types/model/Model"
import { TUpdatePatch, TUpdatePatchAppendChild, TUpdatePatchInsertBefore, TUpdatePatchRemoveAttribut, TUpdatePatchRemoveChild, TUpdatePatchRemoveElement, TUpdatePatchReplaceAll, TUpdatePatchReplaceELement, TUpdatePatchSetAttribut } from "../../@types/recognizer/WSRecognizer"
import { IRenderer, TSVGRendererContext } from "../../@types/renderer/Renderer"
import { TStroke } from "../../@types/model/Stroke"
import { SVGQuadraticStroker } from "./SVGQuadraticStroker"

export class SVGRenderer implements IRenderer
{
  config: TRenderingConfiguration
  stroker: SVGQuadraticStroker
  context!: TSVGRendererContext

  constructor(config: TRenderingConfiguration)
  {
    this.config = config
    this.stroker = new SVGQuadraticStroker()
  }

  init(element: HTMLElement): void
  {
    element.style.fontSize = '10px'
    this.context = {
      parent: element
    }
  }

  #drawStroke(svgElement: SVGElement, stroke: TStroke)
  {
    if (stroke.pointerType === 'ERASER') {
      this.stroker.drawErasingStroke(svgElement, stroke)
    } else {
      this.stroker.drawStroke(svgElement, stroke)
    }
  }

  #replaceAll(layerName: string, update: TUpdatePatchReplaceAll): void
  {
    const oldLayer = this.context.parent.querySelector(`svg[data-layer="${ layerName }"]`) as SVGElement | null
    oldLayer?.remove()
    this.context.parent.insertAdjacentHTML('beforeend', update.svg)
    const layer = this.context.parent.querySelector(`svg[data-layer="${ layerName }"]`) as SVGElement
    if (layerName === 'MODEL') {
      const pendingStrokesGroup = document.createElementNS("http://www.w3.org/2000/svg", 'g')
      pendingStrokesGroup.id = 'pendingStrokes'
      layer.appendChild(pendingStrokesGroup)
    }
  }

  #replaceElement(update: TUpdatePatchReplaceELement): void
  {
    const elementToRemove = this.context.parent.querySelector(`#${ update.id }`) as HTMLElement | null
    if (elementToRemove) {
      const parent = elementToRemove.parentNode as HTMLElement | null | undefined
      elementToRemove?.remove()
      parent?.insertAdjacentHTML('beforeend', update.svg)
    }
  }

  #appendChild(layerName: string, update: TUpdatePatchAppendChild): void
  {
    const parentSelector = update.parentId ? `#${ update.parentId }` : `svg[data-layer="${ layerName }"]`
    const parent = this.context.parent.querySelector(parentSelector) as HTMLElement
    parent?.insertAdjacentHTML('beforeend', update.svg)
  }

  #removeChild(update: TUpdatePatchRemoveChild): void
  {
    this.context.parent.querySelector(`#${ update.parentId } > *:nth-child(${ update.index + 1 })`)?.remove()
  }

  #removeElement(update: TUpdatePatchRemoveElement): void
  {
    const elementToRemove = this.context.parent.querySelector(`#${ update.id }`)
    if (elementToRemove) {
      if (update.id.includes('s') || update.id.includes('MODEL')) {
        elementToRemove.remove()
      } else {
        elementToRemove.setAttribute('class', 'removed-stroke')
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
    parent?.insertAdjacentHTML('beforebegin', update.svg)
  }

  #setAttribute(update: TUpdatePatchSetAttribut): void
  {
    const selector = update.id ? `#${ update.id }` : 'svg'
    const element = this.context.parent.querySelector(selector) as HTMLElement | null
    element?.setAttribute(update.name, update.value)
  }

  #removeAttribute(update: TUpdatePatchRemoveAttribut): void
  {
    const selector = update.id ? `#${ update.id }` : 'svg'
    const element = this.context.parent.querySelector(selector) as HTMLElement | null
    element?.removeAttribute(update.name)
  }

  updateLayer(layerName: string, update: TUpdatePatch): void
  {
    switch (update.type) {
      case 'REPLACE_ALL':
        this.#replaceAll(layerName, update as TUpdatePatchReplaceAll)
        break
      case 'REPLACE_ELEMENT':
        this.#replaceElement(update as TUpdatePatchReplaceELement)
        break
      case 'APPEND_CHILD':
        this.#appendChild(layerName, update as TUpdatePatchAppendChild)
        break
      case 'REMOVE_ELEMENT':
        this.#removeElement(update as TUpdatePatchRemoveElement)
        break
      case 'REMOVE_CHILD':
        this.#removeChild(update as TUpdatePatchRemoveChild)
        break
      case 'INSERT_BEFORE':
        this.#insertBefore(update as TUpdatePatchInsertBefore)
        break
      case 'SET_ATTRIBUTE':
        this.#setAttribute(update as TUpdatePatchSetAttribut)
        break
      case 'REMOVE_ATTRIBUTE':
        this.#removeAttribute(update as TUpdatePatchRemoveAttribut)
        break
      default:
        break
    }
  }

  updatesLayer(layerName: string, updates: TUpdatePatch[]): void
  {
    updates.forEach(u => this.updateLayer(layerName, u))
  }

  clearPendingStroke(): void
  {
    const pendingStrokeGroup = this.context.parent.querySelector('#pendingStrokes') as SVGElement
    if (pendingStrokeGroup) {
      pendingStrokeGroup.innerHTML = ''
    }
  }

  drawPendingStroke(stroke: TStroke): void
  {
    if (stroke) {
      const pendingStrokeGroup = this.context.parent.querySelector('#pendingStrokes') as SVGElement
      if (pendingStrokeGroup) {
        const oldStroke = pendingStrokeGroup.querySelector(`#${ stroke?.id }`)
        if (oldStroke) {
          oldStroke.remove()
        }
        this.#drawStroke(pendingStrokeGroup, stroke)
      }
    }
  }

  resize(model: IModel): void
  {
    const rect = this.context.parent.getBoundingClientRect()
    const svgList = this.context.parent.querySelectorAll('svg')
    const width = Math.max(rect.width, model.width)
    const height = Math.max(rect.height, model.height)
    svgList.forEach(svg =>
    {
      svg.setAttribute('viewBox', `0 0 ${ width }, ${ height }`)
      svg.setAttribute('width', `${ width }px`)
      svg.setAttribute('height', `${ height }px`)
    })
  }

  destroy(): void
  {
    if (this.context.parent) {
      this.context.parent.innerHTML = ''
    }
  }
}