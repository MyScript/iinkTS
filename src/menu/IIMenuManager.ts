import type { TInteractiveInkCanvas } from "@/canvas"
import { mergeDeep } from "@/core"
import { DOMFactory } from "@/dom"
import { LoggerCategory, LoggerManager } from "@/logger"

import type {
  IIAbstractMenu,
  TMenuItemFactory,
  TMenuItemOptions,
  TMenuLayoutConfig,
  TRegisteredMenuItem,
} from "./IIAbstractMenu"
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
 * @group Menu
 * @summary Menu classes `options.override.menu` can replace
 * @remarks Each one is constructed like the built-in menu it replaces: `(canvas, id, config)`, at load and on every {@link IIMenuManager.setConfig}.
 */
export type TMenuOverride = {
  style?: typeof IIMenuStyle
  tool?: typeof IIMenuTool
  action?: typeof IIMenuAction
  context?: typeof IIMenuContext
}

/**
 * @group Menu
 */
export type TMenuName = "action" | "tool" | "style" | "context"

const MENU_NAMES: readonly TMenuName[] = ["action", "style", "tool", "context"]

function isMenuName(name: string): name is TMenuName {
  return MENU_NAMES.some((menu) => menu === name)
}

/**
 * @group Menu
 * @summary An item declared at load, in `options.extend.menuItems`: in its menu from the first render
 */
export type TMenuItemRegistration = {
  menu: TMenuName
  key: string
  factory: TMenuItemFactory
  options?: TMenuItemOptions
}

/**
 * @group Manager
 */
export class IIMenuManager {
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)
  canvas: TInteractiveInkCanvas
  layer?: HTMLElement
  // Assigned by createMenu(), from the constructor
  action!: IIMenuAction
  tool!: IIMenuTool
  context!: IIMenuContext
  style!: IIMenuStyle

  /** The classes the menus are built from: the overrides, else the built-in ones */
  protected menuClasses: Required<TMenuOverride>
  /** Items added through {@link addItem}, by menu: kept here as the menus are rebuilt on every {@link setConfig} */
  protected registry: Record<TMenuName, Map<string, TRegisteredMenuItem>> = {
    action: new Map(),
    tool: new Map(),
    style: new Map(),
    context: new Map(),
  }

  constructor(canvas: TInteractiveInkCanvas, custom?: TMenuOverride, items: readonly TMenuItemRegistration[] = []) {
    this.#logger.info("constructor")
    this.canvas = canvas
    this.menuClasses = {
      style: custom?.style ?? IIMenuStyle,
      tool: custom?.tool ?? IIMenuTool,
      action: custom?.action ?? IIMenuAction,
      context: custom?.context ?? IIMenuContext,
    }
    // Declared at load: in the registry before the first render, so they show from the start
    items.forEach(({ menu, key, factory, options }) => this.register(menu, key, factory, options))
    MENU_NAMES.forEach((name) => this.createMenu(name))
    this.canvas.layout.onOccupantMoved((occupant) => this.onOccupantMoved(occupant))
  }

  /** A menu the layout moved rebuilds for its new slot; the minimap lives in the action menu, which rebuilds for it */
  protected onOccupantMoved(occupant: string): void {
    if (occupant === "minimap") {
      this.rebuildMenu("action")
    } else if (isMenuName(occupant)) {
      this.rebuildMenu(occupant)
    }
  }

  getMenu(name: TMenuName): IIAbstractMenu<TMenuLayoutConfig> {
    return this[name]
  }

  /** Builds one menu from {@link menuClasses} and the current configuration; renders nothing */
  protected createMenu(name: TMenuName): void {
    const { menu } = this.canvas.configuration
    switch (name) {
      case "style":
        this.style = new this.menuClasses.style(this.canvas, "ms-menu-style", menu.style)
        break
      case "tool":
        this.tool = new this.menuClasses.tool(this.canvas, "ms-menu-tool", menu.tool)
        break
      case "action":
        this.action = new this.menuClasses.action(this.canvas, "ms-menu-action", menu.action)
        break
      case "context":
        this.context = new this.menuClasses.context(this.canvas, "ms-menu-context", menu.context)
        break
    }
  }

  /** Renders one menu, then the items registered for it, when the menus and that menu are enabled */
  protected renderMenu(name: TMenuName): void {
    const { menu } = this.canvas.configuration
    if (!this.layer || !menu.enable || !menu[name].enable) {
      return
    }
    const instance = this.getMenu(name)
    // Each menu renders into the slot the layout gives it; the context menu follows the pointer over the whole layer
    const host = name === "context" ? undefined : this.canvas.layout.host(name)
    if (!host && name !== "context" && this.canvas.layout.isRendered) {
      // The layout places this menu nowhere
      return
    }
    instance.render(host ?? this.layer)
    instance.renderRegisteredItems(this.registry[name])
  }

  /** Destroys and rebuilds one menu; the context menu keeps its position and whether it was open */
  protected rebuildMenu(name: TMenuName): void {
    const contextState = { position: { ...this.context.position }, visible: this.isContextVisible() }
    this.getMenu(name).destroy()
    this.createMenu(name)
    this.renderMenu(name)
    if (name === "context") {
      this.restoreContext(contextState)
    }
  }

  protected isContextVisible(): boolean {
    return !!this.context.wrapper && this.context.wrapper.style.display !== "none"
  }

  protected restoreContext({ position, visible }: { position: { x: number; y: number }; visible: boolean }): void {
    this.context.position = position
    if (visible) {
      this.context.show()
    }
  }

  render(layer: HTMLElement): void {
    if (this.canvas.configuration.menu.enable) {
      this.layer = layer
      const styleElement = DOMFactory.style(style as string, { "ms-menu-style": "" })
      this.layer.prepend(styleElement)
      MENU_NAMES.forEach((name) => this.renderMenu(name))
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
    const contextState = { position: { ...this.context.position }, visible: this.isContextVisible() }
    MENU_NAMES.forEach((name) => this.getMenu(name).destroy())
    MENU_NAMES.forEach((name) => this.createMenu(name))
    MENU_NAMES.forEach((name) => this.renderMenu(name))
    this.restoreContext(contextState)
  }

  /**
   * Adds an item to a menu, built by `factory` on every render of that menu, which happens at once if it is shown.
   * It is kept across {@link setConfig}. The item goes after the menu's own items, in `options.zone` (each menu has
   * a default one), or next to `options.before`/`options.after`.
   * @throws when `key` is already registered for that menu
   * @example
   * canvas.menu.addItem("action", "download-png", () => {
   *   const button = document.createElement("button")
   *   button.textContent = "PNG"
   *   button.addEventListener("pointerdown", () => canvas.download("png"))
   *   return button
   * }, { zone: "bar" })
   */
  addItem(menu: TMenuName, key: string, factory: TMenuItemFactory, options?: TMenuItemOptions): void {
    this.register(menu, key, factory, options)
    this.rebuildMenu(menu)
  }

  protected register(menu: TMenuName, key: string, factory: TMenuItemFactory, options?: TMenuItemOptions): void {
    const registered = this.registry[menu]
    if (registered.has(key)) {
      throw new Error(`"${key}" is already registered in the ${menu} menu`)
    }
    registered.set(key, { factory, options })
  }

  /** Removes an item added by {@link addItem}; false when there was none under that key */
  removeItem(menu: TMenuName, key: string): boolean {
    const removed = this.registry[menu].delete(key)
    if (removed) {
      this.rebuildMenu(menu)
    }
    return removed
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
    MENU_NAMES.forEach((name) => this.getMenu(name).destroy())
  }
}
