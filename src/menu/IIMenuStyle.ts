import styleIcon from "@/assets/svg/palette.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { DOMFactory } from "@/components/dom"
import { CanvasTool, CanvasWriteTool } from "@/Constants"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { IIModel } from "@/model"
import type { TSymbol } from "@/symbol"
import { ShapeOps } from "@/symbol/shape/Shape"

import type { BaseMenuItem } from "./items"
import {
  DEFAULT_FONT_SIZE_LIST,
  DEFAULT_FONT_WEIGHT_LIST,
  DEFAULT_MENU_COLORS,
  DEFAULT_THICKNESS_LIST,
} from "./MenuConstants"

/**
 * @group Menu
 * @remarks Configuration to enable/disable each style element individually
 */
export type TMenuStyleConfig = {
  /** Enable/disable stroke color picker */
  strokeColor?: boolean
  /** Enable/disable fill color picker */
  fillColor?: boolean
  /** Enable/disable stroke thickness picker */
  thickness?: boolean
  /** Enable/disable font size picker */
  fontSize?: boolean
  /** Enable/disable font weight picker */
  fontWeight?: boolean
  /** Enable/disable opacity picker */
  opacity?: boolean
  /** Custom color palette */
  colors?: string[]
  /** Custom thickness list */
  thicknessList?: {
    label: string
    value: number
  }[]
  /** Custom font size list */
  fontSizeList?: {
    label: string
    value: "auto" | number
  }[]
  /** Custom font weight list */
  fontWeightList?: {
    label: string
    value: "auto" | "normal" | "bold"
  }[]
}

/** @group Menu */
export const DefaultMenuStyleConfig: Required<TMenuStyleConfig> = {
  strokeColor: true,
  fillColor: true,
  thickness: true,
  fontSize: true,
  fontWeight: true,
  opacity: true,
  colors: DEFAULT_MENU_COLORS,
  thicknessList: DEFAULT_THICKNESS_LIST,
  fontSizeList: DEFAULT_FONT_SIZE_LIST,
  fontWeightList: DEFAULT_FONT_WEIGHT_LIST,
}
import {
  FillColorStyle,
  FontSizeStyle,
  FontWeightStyle,
  OpacityStyle,
  StrokeColorStyle,
  ThicknessStyle,
} from "./styles"

/**
 * @group Menu
 */
export class IIMenuStyle {
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)

  canvas: TInteractiveInkCanvas
  id: string
  wrapper?: HTMLDivElement
  config: Required<TMenuStyleConfig>
  triggerBtn?: HTMLButtonElement
  subMenuWrapper?: HTMLDivElement
  subMenuContent?: HTMLDivElement

  #documentPointerdownHandler?: (e: PointerEvent) => void
  // Style items
  private styleItems: Map<string, BaseMenuItem> = new Map()

  constructor(canvas: TInteractiveInkCanvas, id = "ms-menu-style", config?: TMenuStyleConfig) {
    this.id = id
    this.#logger.info("constructor")
    this.canvas = canvas
    this.config = { ...DefaultMenuStyleConfig }
    if (config) {
      if (config.colors) {
        this.config.colors = config.colors
      }
      if (config.thicknessList) {
        this.config.thicknessList = config.thicknessList
      }
      if (config.fontSizeList) {
        this.config.fontSizeList = config.fontSizeList
      }
      if (config.fontWeightList) {
        this.config.fontWeightList = config.fontWeightList
      }
      this.config.strokeColor = config.strokeColor ?? this.config.strokeColor
      this.config.fillColor = config.fillColor ?? this.config.fillColor
      this.config.thickness = config.thickness ?? this.config.thickness
      this.config.fontSize = config.fontSize ?? this.config.fontSize
      this.config.fontWeight = config.fontWeight ?? this.config.fontWeight
      this.config.opacity = config.opacity ?? this.config.opacity
    }
  }

  get model(): IIModel {
    return this.canvas.model
  }

  get symbolsSelected(): TSymbol[] {
    return this.model.symbolsSelected
  }

  get writeShape(): boolean {
    return ![CanvasWriteTool.Arrow, CanvasWriteTool.DoubleArrow, CanvasWriteTool.Line, CanvasWriteTool.Pencil].includes(
      this.canvas.writer.tool
    )
  }

  get rowHeight(): number {
    return this.canvas.configuration.rendering.guides.gap
  }

  get isMobile(): boolean {
    return this.canvas.renderer.parent.clientWidth < 700
  }

  render(layer: HTMLElement): void {
    if (this.canvas.configuration.menu.style.enable) {
      this.#logger.info("Rendering menu styles with config", this.config)

      this.triggerBtn = DOMFactory.button({
        id: this.id,
        className: "square",
        html: styleIcon,
      })

      const subMenuContent = DOMFactory.div({
        className: "ms-menu-column",
      })

      // Add style elements conditionally using new style classes
      if (this.config.strokeColor) {
        const strokeColorStyle = new StrokeColorStyle(this.canvas, this.config.colors, this.id)
        this.styleItems.set("strokeColor", strokeColorStyle)
        subMenuContent.appendChild(strokeColorStyle.getElement())
      }

      if (this.config.fillColor) {
        const fillColorStyle = new FillColorStyle(this.canvas, this.config.colors, this.id)
        this.styleItems.set("fillColor", fillColorStyle)
        subMenuContent.appendChild(fillColorStyle.getElement())
      }

      if (this.config.thickness) {
        const thicknessStyle = new ThicknessStyle(this.canvas, this.config.thicknessList, this.id)
        this.styleItems.set("thickness", thicknessStyle)
        subMenuContent.appendChild(thicknessStyle.getElement())
      }

      if (this.config.fontSize) {
        const fontSizeStyle = new FontSizeStyle(this.canvas, this.config.fontSizeList, this.rowHeight, this.id)
        this.styleItems.set("fontSize", fontSizeStyle)
        subMenuContent.appendChild(fontSizeStyle.getElement())
      }

      if (this.config.fontWeight) {
        const fontWeightStyle = new FontWeightStyle(this.canvas, this.config.fontWeightList, this.id)
        this.styleItems.set("fontWeight", fontWeightStyle)
        subMenuContent.appendChild(fontWeightStyle.getElement())
      }

      if (this.config.opacity) {
        const opacityStyle = new OpacityStyle(this.canvas, this.id)
        this.styleItems.set("opacity", opacityStyle)
        subMenuContent.appendChild(opacityStyle.getElement())
      }

      this.subMenuWrapper = DOMFactory.div({
        className: "sub-menu",
      })
      this.subMenuWrapper.appendChild(this.triggerBtn)

      this.subMenuContent = DOMFactory.div({
        className: ["sub-menu-content", "bottom-left"],
      })
      this.subMenuContent.appendChild(subMenuContent)
      this.subMenuWrapper.appendChild(this.subMenuContent)

      // Event listeners
      this.triggerBtn.addEventListener("pointerdown", () => this.subMenuContent?.classList.toggle("open"))
      this.#documentPointerdownHandler = (e: PointerEvent) => {
        if (this.subMenuWrapper && !this.subMenuWrapper.contains(e.target as HTMLElement)) {
          this.subMenuContent?.classList.remove("open")
        }
      }
      document.addEventListener("pointerdown", this.#documentPointerdownHandler)

      this.wrapper = DOMFactory.div({
        className: ["ms-menu", "ms-menu-top-right"],
      })
      this.wrapper.appendChild(this.subMenuWrapper)
      layer.appendChild(this.wrapper)
      this.update()
    }
  }

  update(): void {
    if (this.subMenuContent && this.subMenuWrapper) {
      if (this.isMobile) {
        // wrap — only if not already inside subMenuWrapper
        if (this.subMenuContent.parentElement !== this.subMenuWrapper) {
          this.subMenuContent.classList.add("sub-menu-content")
          this.subMenuWrapper.appendChild(this.subMenuContent)
          this.subMenuWrapper.style.display = "block"
        }
      } else {
        // unwrap — only if not already positioned before subMenuWrapper
        if (this.subMenuContent.nextElementSibling !== this.subMenuWrapper) {
          this.subMenuContent.classList.remove("sub-menu-content")
          this.subMenuWrapper.insertAdjacentElement("beforebegin", this.subMenuContent)
          this.subMenuWrapper.style.display = "none"
        }
      }
    }

    if (this.canvas.tool === CanvasTool.Write) {
      this.show()
      // Show all style items for write mode
      const strokeColorEl = this.styleItems.get("strokeColor")?.getElement()
      const fillColorEl = this.styleItems.get("fillColor")?.getElement()
      const thicknessEl = this.styleItems.get("thickness")?.getElement()
      const fontSizeEl = this.styleItems.get("fontSize")?.getElement()
      const fontWeightEl = this.styleItems.get("fontWeight")?.getElement()
      const opacityEl = this.styleItems.get("opacity")?.getElement()

      if (strokeColorEl) {
        strokeColorEl.style.display = "block"
      }
      if (fillColorEl) {
        fillColorEl.style.display = this.writeShape ? "block" : "none"
      }
      if (thicknessEl) {
        thicknessEl.style.display = "block"
      }
      if (fontSizeEl) {
        fontSizeEl.style.display = "block"
      }
      if (fontWeightEl) {
        fontWeightEl.style.display = "block"
      }
      if (opacityEl) {
        opacityEl.style.display = "block"
      }
    } else if (this.canvas.tool === CanvasTool.Select) {
      this.show()
      const shapeSelected =
        this.model.symbolsSelected.length && this.model.symbolsSelected.some((s) => ShapeOps.isShape(s))

      const strokeColorEl = this.styleItems.get("strokeColor")?.getElement()
      const fillColorEl = this.styleItems.get("fillColor")?.getElement()
      const thicknessEl = this.styleItems.get("thickness")?.getElement()
      const fontSizeEl = this.styleItems.get("fontSize")?.getElement()
      const fontWeightEl = this.styleItems.get("fontWeight")?.getElement()
      const opacityEl = this.styleItems.get("opacity")?.getElement()

      if (strokeColorEl) {
        strokeColorEl.style.display = "block"
      }
      if (fillColorEl) {
        fillColorEl.style.display = shapeSelected ? "block" : "none"
      }
      if (thicknessEl) {
        thicknessEl.style.display = "block"
      }
      if (fontSizeEl) {
        fontSizeEl.style.display = "block"
      }
      if (fontWeightEl) {
        fontWeightEl.style.display = "block"
      }
      if (opacityEl) {
        opacityEl.style.display = "block"
      }
    } else {
      this.hide()
    }
  }

  show(): void {
    if (this.wrapper) {
      this.wrapper.style.visibility = "visible"
    }
  }

  hide(): void {
    if (this.wrapper) {
      this.wrapper.style.visibility = "hidden"
    }
  }

  destroy(): void {
    if (this.#documentPointerdownHandler) {
      document.removeEventListener("pointerdown", this.#documentPointerdownHandler)
      this.#documentPointerdownHandler = undefined
    }
    if (this.wrapper) {
      // Destroy all style items
      this.styleItems.forEach((item) => item.destroy())
      this.styleItems.clear()

      while (this.wrapper.lastChild) {
        this.wrapper.removeChild(this.wrapper.lastChild)
      }
      this.wrapper.remove()
      this.wrapper = undefined
      this.subMenuWrapper = undefined
      this.subMenuContent = undefined
      this.triggerBtn = undefined
    }
  }
}
