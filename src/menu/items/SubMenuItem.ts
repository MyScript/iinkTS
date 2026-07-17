import ArrowDown from "@/assets/svg/nav-arrow-down.svg"

import type { TMenuItemBase } from "./BaseMenuItem"
import { BaseMenuItem } from "./BaseMenuItem"
import type { TMenuButtonList } from "./ButtonListMenuItem"
import type { TMenuButton } from "./ButtonMenuItem"
import type { TMenuCheckbox } from "./CheckboxMenuItem"
import type { TMenuFileInput } from "./FileInputMenuItem"
import { createMenuItemInstance } from "./MenuItemFactory"
import type { TMenuRange } from "./RangeMenuItem"
import type { TMenuSelect } from "./SelectMenuItem"

/**
 * @group Menu
 * @remarks Submenu position type
 */
export type TMenuPosition = "top" | "left" | "right" | "right-top" | "bottom" | "bottom-left" | "bottom-right"

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

  protected getArrowRotationForPosition(position: TMenuPosition): number {
    if (position.includes("bottom")) {
      return 180
    } else if (position.includes("left")) {
      return 90
    } else if (position.includes("right")) {
      return -90
    } else {
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
    const position = this.config.position || "right-top"

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

    if (position.includes("left")) {
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
      const menuItem = createMenuItemInstance(item, this.editor)
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
