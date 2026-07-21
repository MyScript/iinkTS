import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { DOMFactory } from "@/components/dom"
import { LoggerCategory, LoggerManager } from "@/logger"

import type { BaseMenuItem } from "./items"
import { EdgeTool, EraseTool, MoveTool, SelectTool, ShapeTool, WriteTool } from "./tools"

/**
 * @group Menu
 * @remarks Configuration to enable/disable each tool individually
 */
export type TMenuToolConfig = {
  /** Enable/disable Write tool (Pencil) */
  write?: boolean
  /** Enable/disable Move tool (Hand) */
  move?: boolean
  /** Enable/disable Select tool (Cursor) */
  select?: boolean
  /** Enable/disable Erase tool */
  erase?: boolean
  /** Enable/disable Shape submenu (Rectangle, Circle, etc.) */
  shape?: boolean
  /** Enable/disable Edge submenu (Line, Arrow, etc.) */
  edge?: boolean
}

/** @group Menu */
export const DefaultMenuToolConfig: Required<TMenuToolConfig> = {
  write: true,
  move: true,
  select: true,
  erase: true,
  shape: true,
  edge: true,
}

/**
 * @group Menu
 */
export class IIMenuTool {
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)

  canvas: TInteractiveInkCanvas
  id: string
  wrapper?: HTMLDivElement
  config: Required<TMenuToolConfig>

  // Instances des classes d'outils
  private menuTools: Map<string, BaseMenuItem> = new Map()

  constructor(canvas: TInteractiveInkCanvas, id = "ms-menu-tool", config?: TMenuToolConfig) {
    this.id = id
    this.#logger.info("constructor")
    this.canvas = canvas
    this.config = {
      ...DefaultMenuToolConfig,
      ...config,
    }
  }

  render(layer: HTMLElement): void {
    if (this.canvas.configuration.menu.tool.enable) {
      this.#logger.info("Rendering menu tools with config", this.config)

      this.wrapper = DOMFactory.div({
        className: ["ms-menu", "ms-menu-bottom", "ms-menu-row"],
      })

      // Ajouter les outils conditionnellement
      if (this.config.write) {
        const writeTool = new WriteTool(this.canvas, this.id)
        this.menuTools.set("write", writeTool)
        this.wrapper.appendChild(writeTool.getElement())
      }

      if (this.config.move) {
        const moveTool = new MoveTool(this.canvas, this.id)
        this.menuTools.set("move", moveTool)
        this.wrapper.appendChild(moveTool.getElement())
      }

      if (this.config.select) {
        const selectTool = new SelectTool(this.canvas, this.id)
        this.menuTools.set("select", selectTool)
        this.wrapper.appendChild(selectTool.getElement())
      }

      if (this.config.erase) {
        const eraseTool = new EraseTool(this.canvas, this.id)
        this.menuTools.set("erase", eraseTool)
        this.wrapper.appendChild(eraseTool.getElement())
      }

      if (this.config.edge) {
        const edgeTool = new EdgeTool(this.canvas, this.id)
        this.menuTools.set("edge", edgeTool)
        this.wrapper.appendChild(edgeTool.getElement())
      }

      if (this.config.shape) {
        const shapeTool = new ShapeTool(this.canvas, this.id)
        this.menuTools.set("shape", shapeTool)
        this.wrapper.appendChild(shapeTool.getElement())
      }

      layer.appendChild(this.wrapper)
      this.update()
      this.show()
    }
  }

  update(): void {
    this.menuTools.forEach((tool) => {
      tool.update()
    })
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
    if (this.wrapper) {
      this.menuTools.forEach((tool) => {
        tool.destroy()
      })
      this.menuTools.clear()

      while (this.wrapper.lastChild) {
        this.wrapper.removeChild(this.wrapper.lastChild)
      }
      this.wrapper.remove()
      this.wrapper = undefined
    }
  }
}
