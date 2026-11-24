import type { TInteractiveInkCanvas } from "@/canvas"
import { DOMFactory } from "@/dom"
import { LoggerCategory, LoggerManager } from "@/logger"
import {
  slotAnchor,
  slotOpenTowards,
  slotOrientation,
  type TLayoutSlot,
  type TMenuDirection,
  type TMenuOrientation,
} from "@/manager"

import { BaseMenuItem, type TMenuPosition } from "./items"

/**
 * @group Menu
 * @summary Where an item goes in a menu: its always-visible row, or the column behind its trigger
 */
export type TMenuZone = "bar" | "dropdown"

/**
 * @group Menu
 */
export type TMenuItemOptions = {
  /** Defaults to the menu's {@link IIAbstractMenu.defaultZone} */
  zone?: TMenuZone
  /** Key of the item to insert before; missing at render, the item goes to the end of its zone */
  before?: string
  /** Key of the item to insert after; missing at render, the item goes to the end of its zone */
  after?: string
  /** Replace the item holding the same key, in its place; without it, a taken key is refused */
  replace?: boolean
}

/**
 * @group Menu
 * @summary How a menu sits in its slot; without them, the slot decides (see `configuration.layout`)
 */
export type TMenuLayoutConfig = {
  /** The axis of the menu's bar; defaults to the slot's: vertical on the sides, horizontal elsewhere */
  orientation?: TMenuOrientation
  /** The side every dropdown of the menu opens towards, its items' sub-menus included; defaults to away from the slot's edge */
  openTowards?: TMenuDirection
}

/**
 * @group Menu
 * @summary Builds an item each time its menu renders: a menu destroys its items, which cannot be reused
 * @remarks A raw `HTMLElement` is for static content: it is removed with the menu, never updated. Anything that must
 * follow the canvas state is a {@link BaseMenuItem}.
 */
export type TMenuItemFactory = (canvas: TInteractiveInkCanvas) => BaseMenuItem | HTMLElement

/**
 * @group Menu
 * @summary An item registered through {@link IIMenuManager.addItem}, added after the menu's own items
 */
export type TRegisteredMenuItem = {
  factory: TMenuItemFactory
  options?: TMenuItemOptions
}

/** Gives a raw element the lifecycle of an item: removed on destroy, nothing to update */
class ElementMenuItem extends BaseMenuItem {
  protected wrapped: HTMLElement

  constructor(key: string, element: HTMLElement, canvas: TInteractiveInkCanvas) {
    super({ id: key, type: "element" }, canvas)
    this.wrapped = element
  }

  createElement(): HTMLElement {
    return this.wrapped
  }

  update(): void {}
}

/**
 * @group Menu
 * @summary What every menu shares: its items, their lifecycle, its zones and the dropdown mechanics
 * @remarks Every member is protected or public, never private: menus are replaced through `options.override.menu`.
 * A zone is built on its first item, so a menu shows no empty row nor an empty dropdown.
 */
export abstract class IIAbstractMenu<TConfig extends TMenuLayoutConfig> {
  protected logger = LoggerManager.getLogger(LoggerCategory.MENU)
  canvas: TInteractiveInkCanvas
  id: string
  wrapper?: HTMLElement
  config: TConfig

  /** Where an item goes when {@link addItem} names no zone */
  abstract readonly defaultZone: TMenuZone
  /** The name the layout places this menu by (`configuration.layout`); none for a menu outside the layout */
  readonly layoutName?: string

  /** The rendered items, by key: updated and destroyed with the menu */
  protected items: Map<string, BaseMenuItem> = new Map()
  /** The containers of the zones built so far */
  protected zones: Partial<Record<TMenuZone, HTMLElement>> = {}
  /** The wrapper {@link zones} and {@link items} belong to */
  protected zonesWrapper?: HTMLElement
  /** Closes the dropdown on a pointerdown outside it; set by {@link createDropdown} */
  protected documentPointerdownHandler?: (e: PointerEvent) => void

  constructor(canvas: TInteractiveInkCanvas, id: string, config: TConfig) {
    this.canvas = canvas
    this.id = id
    this.config = config
    this.logger.info("constructor", { id })
  }

  abstract render(layer: HTMLElement): void

  /** Builds the container of `zone` and inserts it in `wrapper` */
  protected abstract createZone(zone: TMenuZone, wrapper: HTMLElement): HTMLElement

  /** The slot the layout put this menu in */
  get slot(): TLayoutSlot | undefined {
    return this.layoutName ? this.canvas.layout.slotOf(this.layoutName) : undefined
  }

  get orientation(): TMenuOrientation {
    const slot = this.slot
    return this.config.orientation ?? (slot ? slotOrientation(slot) : "horizontal")
  }

  /** Undefined for a menu outside the layout, whose items keep their own directions */
  get openTowards(): TMenuDirection | undefined {
    const slot = this.slot
    return this.config.openTowards ?? (slot ? slotOpenTowards(slot) : undefined)
  }

  /** The class laying the bar out along {@link orientation} */
  protected barClassName(): string {
    return this.orientation === "vertical" ? "ms-menu-column" : "ms-menu-row"
  }

  /** Where a dropdown opening from the bar goes: towards {@link openTowards}, growing away from the slot's side */
  protected barOpenPosition(): TMenuPosition | undefined {
    const anchor = this.slot ? slotAnchor(this.slot) : "start"
    switch (this.openTowards) {
      case "down":
        return anchor === "start" ? "bottom-right" : anchor === "end" ? "bottom-left" : "bottom"
      case "up":
        return anchor === "start" ? "top-right" : anchor === "end" ? "top-left" : "top"
      case "right":
        return "right-top"
      case "left":
        return "left-top"
      default:
        return undefined
    }
  }

  /** Where a sub-menu opening from a dropdown's column goes: sideways, towards the inside of the canvas */
  protected columnOpenPosition(): TMenuPosition | undefined {
    const openTowards = this.openTowards
    if (!openTowards) {
      return undefined
    }
    const towardsLeft = openTowards === "left" || (this.slot ? slotAnchor(this.slot) === "end" : false)
    return towardsLeft ? "left-top" : "right-top"
  }

  protected itemOpenPosition(zone: TMenuZone): TMenuPosition | undefined {
    return zone === "bar" ? this.barOpenPosition() : this.columnOpenPosition()
  }

  /** A sub-menu's config entry: `true` enables it with its defaults, an object configures it */
  protected subConfig<T>(config: boolean | T): T | undefined {
    return typeof config === "object" && config !== null ? config : undefined
  }

  /**
   * The wrapper items go to. A new wrapper is a new render: the zones and items of the previous one belong to the
   * old wrapper, so they are forgotten (not destroyed: they stay where that render put them).
   */
  protected currentWrapper(): HTMLElement {
    if (!this.wrapper) {
      throw new Error(`${this.id}: items are added during render(), once wrapper is set`)
    }
    if (this.zonesWrapper !== this.wrapper) {
      this.zones = {}
      this.items.clear()
      this.zonesWrapper = this.wrapper
    }
    return this.wrapper
  }

  /** The container of `zone`, built on first use */
  protected getZone(zone: TMenuZone): HTMLElement {
    const wrapper = this.currentWrapper()
    const container = this.zones[zone] ?? this.createZone(zone, wrapper)
    this.zones[zone] = container
    return container
  }

  /** Inserts an item's element in its zone; a menu overrides it to keep its own elements in place */
  protected insertInZone(zone: TMenuZone, element: HTMLElement): void {
    this.getZone(zone).appendChild(element)
  }

  /**
   * Keeps `item` with the menu's items and inserts its element: next to `before`/`after` when that item is
   * rendered, else at the end of its zone; in place of the item it replaces with `replace`.
   * A key already taken is refused (logged) unless `replace` is set.
   */
  protected addItem(key: string, item: BaseMenuItem | HTMLElement, options?: TMenuItemOptions): void {
    this.currentWrapper()
    const menuItem = item instanceof BaseMenuItem ? item : new ElementMenuItem(key, item, this.canvas)
    if (!menuItem.openPosition) {
      menuItem.openPosition = this.itemOpenPosition(options?.zone ?? this.defaultZone)
    }
    const element = menuItem.getElement()
    const replaced = this.items.get(key)
    if (replaced && !options?.replace) {
      this.logger.error("addItem", `"${key}" is already in the ${this.id} menu: pass { replace: true } to replace it`)
      return
    }
    if (replaced) {
      replaced.getElement().replaceWith(element)
      replaced.destroy()
    } else if (!this.insertNextTo(element, options)) {
      this.insertInZone(options?.zone ?? this.defaultZone, element)
    }
    this.items.set(key, menuItem)
  }

  /** Inserts `element` before or after the item `options` names; false when there is none to name or render */
  protected insertNextTo(element: HTMLElement, options?: TMenuItemOptions): boolean {
    const referenceKey = options?.before ?? options?.after
    if (!referenceKey) {
      return false
    }
    const reference = this.items.get(referenceKey)?.getElement()
    if (!reference) {
      this.logger.warn("addItem", `No "${referenceKey}" in the ${this.id} menu: added at the end of its zone`)
      return false
    }
    reference.insertAdjacentElement(options?.before ? "beforebegin" : "afterend", element)
    return true
  }

  /**
   * Adds the items registered through {@link IIMenuManager.addItem}, after the menu's own: called once it rendered.
   * A factory that throws is logged and skipped, the other items still render.
   */
  renderRegisteredItems(registered: ReadonlyMap<string, TRegisteredMenuItem>): void {
    if (!this.wrapper) {
      return
    }
    registered.forEach(({ factory, options }, key) => {
      try {
        const previous = this.items.get(key)
        this.addItem(key, factory(this.canvas), options)
        const added = this.items.get(key)
        if (added && added !== previous) {
          added.update()
        }
      } catch (error) {
        this.logger.error("renderRegisteredItems", `Failed to build "${key}" in the ${this.id} menu`, error)
      }
    })
  }

  /**
   * Builds a dropdown: `trigger` toggles `content`, a pointerdown anywhere outside closes it.
   * @returns the dropdown element to insert, and the element holding `content`
   */
  protected createDropdown(
    trigger: HTMLButtonElement,
    content: HTMLElement,
    position: TMenuPosition
  ): { element: HTMLDivElement; content: HTMLDivElement } {
    const element = DOMFactory.div({ className: "sub-menu" })
    element.appendChild(trigger)
    const contentWrapper = DOMFactory.div({ className: ["sub-menu-content", position] })
    contentWrapper.appendChild(content)
    element.appendChild(contentWrapper)

    trigger.addEventListener("pointerdown", () => contentWrapper.classList.toggle("open"))
    this.documentPointerdownHandler = (e: PointerEvent) => {
      if (!(e.target instanceof Node && element.contains(e.target))) {
        contentWrapper.classList.remove("open")
      }
    }
    document.addEventListener("pointerdown", this.documentPointerdownHandler)
    return { element, content: contentWrapper }
  }

  update(): void {
    this.items.forEach((item) => item.update())
  }

  show(): void {
    this.setHidden(false)
  }

  hide(): void {
    this.setHidden(true)
  }

  /** Whether another occupant shares this menu's slot */
  protected sharesSlot(): boolean {
    const slot = this.slot
    return slot ? this.canvas.layout.occupantsOf(slot).length > 1 : false
  }

  /**
   * Alone in its slot, the menu just turns invisible and keeps its room. Sharing it, its host folds away (animated in
   * CSS) so the other occupants close the gap instead of leaving a hole.
   */
  protected setHidden(hidden: boolean): void {
    if (!this.wrapper) {
      return
    }
    const host = this.wrapper.parentElement
    if (host?.classList.contains("ms-layout-host") && this.sharesSlot()) {
      host.classList.toggle("ms-layout-host-hidden", hidden)
      this.wrapper.style.removeProperty("visibility")
      return
    }
    host?.classList.remove("ms-layout-host-hidden")
    this.wrapper.style.visibility = hidden ? "hidden" : "visible"
  }

  destroy(): void {
    if (this.documentPointerdownHandler) {
      document.removeEventListener("pointerdown", this.documentPointerdownHandler)
      this.documentPointerdownHandler = undefined
    }
    this.items.forEach((item) => item.destroy())
    this.items.clear()
    this.zones = {}
    this.zonesWrapper = undefined
    this.wrapper?.remove()
    this.wrapper = undefined
  }
}
