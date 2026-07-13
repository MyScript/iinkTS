import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { DOMFactory } from "@/components/dom"
import { LoggerCategory, LoggerManager } from "@/logger"
import { mergeDeep } from "@/utils"

import type { TMenuActionConfig } from "./IIMenuAction"
import { IIMenuAction } from "./IIMenuAction"
import type { TMenuContextConfig } from "./IIMenuContext"
import { IIMenuContext } from "./IIMenuContext"
import type { TMenuStyleConfig } from "./IIMenuStyle"
import { IIMenuStyle } from "./IIMenuStyle"
import type { TMenuToolConfig } from "./IIMenuTool"
import { IIMenuTool } from "./IIMenuTool"
import style from "./menu.css"

/**
 * @group Menu
 * @remarks Partial config accepted by {@link IIMenuManager.setConfig} after initial load.
 */
export type TMenuConfigUpdate = {
  enable?: boolean
  style?: TMenuStyleConfig & { enable?: boolean }
  tool?: TMenuToolConfig & { enable?: boolean }
  action?: TMenuActionConfig & {
    enable?: boolean
  }
  context?: TMenuContextConfig & {
    enable?: boolean
  }
}

/**
 * @group Manager
 */
export class IIMenuManager {
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)
  canvas: TInteractiveInkCanvas
  layer?: HTMLElement
  action: IIMenuAction
  tool: IIMenuTool
  context: IIMenuContext
  style: IIMenuStyle

  constructor(
    canvas: TInteractiveInkCanvas,
    custom?: {
      style?: IIMenuStyle
      tool?: IIMenuTool
      action?: IIMenuAction
      context?: IIMenuContext
    }
  ) {
    this.#logger.info("constructor")
    this.canvas = canvas

    if (custom?.style) {
      const CustomMenuStyle = custom.style as unknown as typeof IIMenuStyle
      this.style = new CustomMenuStyle(this.canvas)
    } else {
      this.style = new IIMenuStyle(this.canvas, "ms-menu-style", this.canvas.configuration.menu.style)
    }
    if (custom?.tool) {
      const CustomMenuTool = custom.tool as unknown as typeof IIMenuTool
      this.tool = new CustomMenuTool(this.canvas)
    } else {
      this.tool = new IIMenuTool(this.canvas, "ms-menu-tool", this.canvas.configuration.menu.tool)
    }
    if (custom?.action) {
      const CustomMenuAction = custom.action as unknown as typeof IIMenuAction
      this.action = new CustomMenuAction(this.canvas)
    } else {
      this.action = new IIMenuAction(this.canvas, "ms-menu-action", this.canvas.configuration.menu.action)
    }
    if (custom?.context) {
      const CustomMenuAction = custom.context as unknown as typeof IIMenuContext
      this.context = new CustomMenuAction(this.canvas)
    } else {
      this.context = new IIMenuContext(this.canvas, "ms-menu-context", this.canvas.configuration.menu.context)
    }
  }

  render(layer: HTMLElement): void {
    if (this.canvas.configuration.menu.enable) {
      this.layer = layer

      const styleElement = DOMFactory.style(style as string, { "ms-menu-style": "" })
      this.layer.prepend(styleElement)

      if (this.canvas.configuration.menu.action.enable) {
        this.action.render(this.layer)
      }
      if (this.canvas.configuration.menu.style.enable) {
        this.style.render(this.layer)
      }
      if (this.canvas.configuration.menu.tool.enable) {
        this.tool.render(this.layer)
      }
      if (this.canvas.configuration.menu.context.enable) {
        this.context.render(this.layer)
      }
    }
  }

  /**
   * Update menu configuration at runtime and re-render affected sections.
   * Merges deeply into the current config — omitted keys keep their current value.
   * @example
   * // Hide only PNG and text export
   * canvas.menu.setConfig({ action: { export: { png: false, text: false } } })
   * // Disable the entire action menu
   * canvas.menu.setConfig({ action: { enable: false } })
   */
  setConfig(config: TMenuConfigUpdate): void {
    mergeDeep(this.canvas.configuration.menu, config)

    if (!this.layer) {
      return
    }

    const contextPosition = {
      ...this.context.position,
    }
    const contextVisible = this.context.wrapper?.style.display !== "none"

    this.action.destroy()
    this.tool.destroy()
    this.style.destroy()
    this.context.destroy()

    this.action = new IIMenuAction(this.canvas, "ms-menu-action", this.canvas.configuration.menu.action)
    this.tool = new IIMenuTool(this.canvas, "ms-menu-tool", this.canvas.configuration.menu.tool)
    this.style = new IIMenuStyle(this.canvas, "ms-menu-style", this.canvas.configuration.menu.style)
    this.context = new IIMenuContext(this.canvas, "ms-menu-context", this.canvas.configuration.menu.context)

    if (this.canvas.configuration.menu.enable) {
      if (this.canvas.configuration.menu.action.enable) {
        this.action.render(this.layer)
      }
      if (this.canvas.configuration.menu.style.enable) {
        this.style.render(this.layer)
      }
      if (this.canvas.configuration.menu.tool.enable) {
        this.tool.render(this.layer)
      }
      if (this.canvas.configuration.menu.context.enable) {
        this.context.render(this.layer)
        this.context.position = contextPosition
        if (contextVisible) {
          this.context.show()
        }
      }
    }
  }

  update(): void {
    this.action.update()
    this.tool.update()
    this.style.update()
  }

  show(): void {
    this.action.show()
    this.tool.show()
    this.style.show()
  }

  hide(): void {
    this.action.hide()
    this.tool.hide()
    this.style.hide()
  }

  destroy(): void {
    this.action.destroy()
    this.tool.destroy()
    this.style.destroy()
    this.context.destroy()
  }
}
