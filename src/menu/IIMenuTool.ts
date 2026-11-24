import moreIcon from "@/assets/svg/more.svg"
import type { TInteractiveInkCanvas } from "@/canvas"
import { DOMFactory } from "@/dom"

import { IIAbstractMenu, type TMenuLayoutConfig, type TMenuZone } from "./IIAbstractMenu"
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
export class IIMenuTool extends IIAbstractMenu<Required<TMenuToolConfig> & TMenuLayoutConfig> {
  readonly layoutName = "tool"
  readonly defaultZone: TMenuZone = "bar"
  /** The "…" dropdown at the end of the row, once an item goes to the dropdown zone */
  protected moreDropdown?: HTMLElement

  constructor(canvas: TInteractiveInkCanvas, id = "ms-menu-tool", config?: TMenuToolConfig & TMenuLayoutConfig) {
    super(canvas, id, { ...DefaultMenuToolConfig, ...config })
  }

  render(layer: HTMLElement): void {
    if (!this.canvas.configuration.menu.tool.enable) {
      return
    }
    this.logger.info("Rendering menu tools with config", this.config)
    this.wrapper = DOMFactory.div({ className: ["ms-menu", "ms-menu-tool", this.barClassName()] })
    this.renderBarItems()
    layer.appendChild(this.wrapper)
    this.update()
    this.show()
  }

  protected renderBarItems(): void {
    const { config, canvas, id } = this
    if (config.write) {
      this.addItem("write", new WriteTool(canvas, id))
    }
    if (config.move) {
      this.addItem("move", new MoveTool(canvas, id))
    }
    if (config.select) {
      this.addItem("select", new SelectTool(canvas, id))
    }
    if (config.erase) {
      this.addItem("erase", new EraseTool(canvas, id))
    }
    if (config.edge) {
      this.addItem("edge", new EdgeTool(canvas, id))
    }
    if (config.shape) {
      this.addItem("shape", new ShapeTool(canvas, id))
    }
  }

  protected createZone(zone: TMenuZone, wrapper: HTMLElement): HTMLElement {
    if (zone === "bar") {
      return wrapper
    }
    const column = DOMFactory.div({ className: "ms-menu-column" })
    const trigger = DOMFactory.button({ id: `${this.id}-more`, className: "square", html: moreIcon })
    this.moreDropdown = this.createDropdown(trigger, column, this.barOpenPosition() ?? "top").element
    wrapper.appendChild(this.moreDropdown)
    return column
  }

  /** Keeps the "…" dropdown last in the row */
  protected insertInZone(zone: TMenuZone, element: HTMLElement): void {
    if (zone === "bar" && this.moreDropdown) {
      this.getZone(zone).insertBefore(element, this.moreDropdown)
      return
    }
    super.insertInZone(zone, element)
  }

  destroy(): void {
    super.destroy()
    this.moreDropdown = undefined
  }
}
