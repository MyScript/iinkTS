import ArrowDown from "@/assets/svg/nav-arrow-down.svg"
import type { TInteractiveInkCanvas } from "@/canvas"

import type { TGenericMenuItem, TMenuItemBase } from "./BaseMenuItem"
import { BaseMenuItem } from "./BaseMenuItem"
import type { TMenuButtonList } from "./ButtonListMenuItem"
import { ButtonListMenuItem } from "./ButtonListMenuItem"
import type { TMenuButton } from "./ButtonMenuItem"
import { ButtonMenuItem } from "./ButtonMenuItem"
import type { TMenuCheckbox } from "./CheckboxMenuItem"
import { CheckboxMenuItem } from "./CheckboxMenuItem"
import type { TMenuColorList } from "./ColorListMenuItem"
import { ColorListMenuItem } from "./ColorListMenuItem"
import type { TMenuFileInput } from "./FileInputMenuItem"
import { FileInputMenuItem } from "./FileInputMenuItem"
import type { TMenuRange } from "./RangeMenuItem"
import { RangeMenuItem } from "./RangeMenuItem"
import type { TMenuSelect } from "./SelectMenuItem"
import { SelectMenuItem } from "./SelectMenuItem"

/**
 * @group Menu
 * @remarks Submenu position type
 */
export type TMenuPosition =
  | "top"
  | "top-left"
  | "top-right"
  | "left"
  | "left-top"
  | "right"
  | "right-top"
  | "bottom"
  | "bottom-left"
  | "bottom-right"

/**
 * @group Menu
 * @remarks Union type for submenu items (without recursive submenu to avoid circularity)
 */
export type TSubMenuItems = TMenuButton | TMenuCheckbox | TMenuSelect | TMenuButtonList | TMenuFileInput | TMenuRange

/**
 * @group Menu
 * @remarks Submenu configuration
 */
export type TMenuSubMenu = TMenuItemBase & {
  type: "submenu"
  icon?: string
  position?: TMenuPosition
  menuTitle?: string
  items: (TSubMenuItems | TMenuSubMenu)[]
}

/**
 * @group Menu
 * @remarks Class for submenu items
 */
export class SubMenuItem extends BaseMenuItem<HTMLDivElement> {
  #documentPointerdownHandler?: (e: PointerEvent) => void
  declare protected config: TMenuSubMenu
  protected subMenuWrapper?: HTMLElement
  protected subMenuContent?: HTMLDivElement
  protected trigger?: HTMLButtonElement
  protected arrowSpan?: HTMLSpanElement
  protected subMenuItems: Map<string, BaseMenuItem> = new Map()
  protected closedRotation: number = 0
  protected openedRotation: number = 180

  /** The side the sub-menu opens on is the first part of its position: "right-top" opens on the right */
  protected sideOf(position: TMenuPosition): string {
    return position.split("-")[0]
  }

  protected getArrowRotationForPosition(position: TMenuPosition): number {
    switch (this.sideOf(position)) {
      case "bottom":
        return 180
      case "left":
        return 90
      case "right":
        return -90
      default:
        return 0
    }
  }

  createElement(): HTMLDivElement {
    // Wrapper principal
    const wrapper = this.dom.div({
      id: this.config.id,
      className: "sub-menu",
    })

    // Bouton trigger
    this.trigger = this.dom.button({
      id: `${this.config.id}-trigger`,
      className: ["between", "full-width"],
    })
    const position = this.openPosition ?? this.config.position ?? "right-top"

    this.closedRotation = this.getArrowRotationForPosition(position)
    this.openedRotation = this.closedRotation + 180

    this.arrowSpan = this.dom.span({
      html: ArrowDown,
    })
    this.arrowSpan.style.transition = "transform 0.2s ease"
    this.arrowSpan.style.transform = `rotate(${this.closedRotation}deg)`

    if (this.config.icon && this.config.label) {
      const labelSpan = this.dom.span({
        text: this.config.label,
      })
      this.trigger.appendChild(labelSpan)
      const iconSpan = this.dom.span({
        html: this.config.icon,
      })
      iconSpan.style.setProperty("width", "32px")
      this.trigger.appendChild(iconSpan)
    } else if (this.config.icon) {
      const iconSpan = this.dom.span({
        html: this.config.icon,
      })
      iconSpan.style.setProperty("width", "32px")
      this.trigger.appendChild(iconSpan)
    } else if (this.config.label) {
      this.trigger.textContent = this.config.label
    }

    if (this.sideOf(position) === "left") {
      this.trigger.prepend(this.arrowSpan)
    } else {
      this.trigger.appendChild(this.arrowSpan)
    }

    wrapper.appendChild(this.trigger)

    this.subMenuContent = this.dom.div({
      className: ["sub-menu-content", position],
    })

    if (this.config.menuTitle) {
      const menuTitleElement = this.dom.h3({
        text: this.config.menuTitle,
        className: "ms-menu-title",
      })
      this.subMenuContent.appendChild(menuTitleElement)
    }

    this.subMenuWrapper = this.dom.div({
      className: "ms-menu-column",
    })

    this.config.items.forEach((item) => {
      const menuItem = createMenuItemInstance(item, this.canvas)
      // A nested sub-menu opens sideways, on the side its parent opened towards
      if (this.openPosition && !menuItem.openPosition) {
        menuItem.openPosition = this.sideOf(this.openPosition) === "left" ? "left-top" : "right-top"
      }
      const element = menuItem.getElement()
      if (element) {
        this.subMenuWrapper!.appendChild(element)
        this.subMenuItems.set(item.id, menuItem)
      }
    })

    this.subMenuContent.appendChild(this.subMenuWrapper)
    wrapper.appendChild(this.subMenuContent)

    this.subMenuWrapper.addEventListener("ms-menu-close", () => this.close())

    this.trigger.addEventListener("pointerdown", () => this.toggle())
    this.#documentPointerdownHandler = (e: PointerEvent) => {
      if (!wrapper.contains(e.target as HTMLElement)) {
        this.close()
      }
    }
    document.addEventListener("pointerdown", this.#documentPointerdownHandler)

    return wrapper
  }

  /**
   * Opens the submenu
   */
  open(): void {
    this.subMenuContent?.classList.add("open")
    if (this.arrowSpan) {
      this.arrowSpan.style.transform = `rotate(${this.openedRotation}deg)`
    }
  }

  /**
   * Closes the submenu
   */
  close(): void {
    this.subMenuContent?.classList.remove("open")
    if (this.arrowSpan) {
      this.arrowSpan.style.transform = `rotate(${this.closedRotation}deg)`
    }
  }

  /**
   * Toggles the submenu state
   */
  toggle(): void {
    this.subMenuContent?.classList.toggle("open")
    if (this.arrowSpan) {
      const isOpen = this.subMenuContent?.classList.contains("open")
      this.arrowSpan.style.transform = `rotate(${isOpen ? this.openedRotation : this.closedRotation}deg)`
    }
  }

  /**
   * Unwraps the submenu (mobile mode)
   */
  unwrap(): void {
    if (this.subMenuContent && this.element) {
      this.subMenuContent.classList.remove("sub-menu-content")
      this.element.insertAdjacentElement("beforebegin", this.subMenuContent)
      this.element.style.display = "none"
    }
  }

  /**
   * Wraps the submenu (desktop mode)
   */
  wrap(): void {
    if (this.subMenuContent && this.element) {
      this.subMenuContent.classList.add("sub-menu-content")
      this.element.appendChild(this.subMenuContent)
      this.element.style.display = "block"
    }
  }

  update(): void {
    this.subMenuItems.forEach((menuItem) => {
      menuItem.update()
    })

    this.updateDisabled()
    this.updateVisible()
  }

  destroy(): void {
    if (this.#documentPointerdownHandler) {
      document.removeEventListener("pointerdown", this.#documentPointerdownHandler)
      this.#documentPointerdownHandler = undefined
    }
    this.subMenuItems.forEach((menuItem) => {
      menuItem.destroy()
    })
    this.subMenuItems.clear()

    super.destroy()
  }
}

/**
 * @group Menu
 * @remarks Type union enriched with all menu item types
 */
export type TAllMenuItems = TSubMenuItems | TMenuSubMenu | TMenuColorList | TMenuRange | TMenuFileInput

/**
 * @group Menu
 * @remarks Factory function to create an instance of the appropriate menu item class
 */
export function createMenuItemInstance(config: TAllMenuItems, canvas: TInteractiveInkCanvas): BaseMenuItem {
  switch (config.type) {
    case "button":
      return new ButtonMenuItem(config, canvas)
    case "checkbox":
      return new CheckboxMenuItem(config, canvas)
    case "select":
      return new SelectMenuItem(config, canvas)
    case "buttonlist":
      return new ButtonListMenuItem(config, canvas)
    case "submenu":
      return new SubMenuItem(config, canvas)
    case "colorlist":
      return new ColorListMenuItem(config, canvas)
    case "range":
      return new RangeMenuItem(config, canvas)
    case "fileinput":
      return new FileInputMenuItem(config, canvas)
    default:
      throw new Error(`Unknown menu item type: ${(config as TGenericMenuItem).type}`)
  }
}
