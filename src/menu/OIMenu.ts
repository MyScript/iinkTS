import ArrowDown from "../assets/svg/nav-arrow-down.svg"
import { OIMenuSub } from "./OIMenuSub"

/**
 * Menu
 */
export type TMenuItem = {
  id: string,
  label: string,
  type: "button" | "checkbox" | "select" | "list"
}

/**
 * Menu
 */
export type TMenuItemButton = TMenuItem & {
  type: "button"
  tooltip?: {
    label: string,
    position: "top" | "left" | "right" | "bottom"
  },
  icon?: string
  callback: () => void
}

/**
 * Menu
 */
export type TMenuItemButtonList = TMenuItem & {
  type: "list"
  tooltip?: {
    label: string,
    position: "top" | "left" | "right" | "bottom"
  },
  initValue: string,
  values: { label: string, value: string }[]
  callback: (value: string) => void
}

/**
 * Menu
 */
export type TMenuItemBoolean = TMenuItem & {
  type: "checkbox",
  initValue: boolean,
  callback: (value: boolean) => void
}

/**
 * Menu
 */
export type TMenuItemSelect = TMenuItem & {
  type: "select",
  initValue: string,
  values: { label: string, value: string }[]
  callback: (value: string) => void
}

/**
 * Menu
 */
export abstract class OIMenu
{
  protected createToolTip(el: HTMLElement, text: string, position: "top" | "left" | "right" | "bottom" = "top"): HTMLElement
  {
    el.classList.add("ms-tooltip")
    const tooltipContent = document.createElement("span")
    tooltipContent.classList.add("ms-tooltip-content", position)
    tooltipContent.textContent = text
    el.appendChild(tooltipContent)
    return el
  }

  protected createSubMenu(trigger: HTMLElement, subMenu: HTMLElement, position: "top" | "left" | "right" | "bottom" | "bottom-left" = "top"): OIMenuSub
  {
    return new OIMenuSub(trigger, subMenu, position)
  }

  protected createWrapCollapsible(el: Node, title: string): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.classList.add("collapsible-wrapper")
    const head = document.createElement("div")
    head.classList.add("collapsible-header")
    head.textContent = title
    const btn = document.createElement("buttom")
    btn.classList.add("ms-menu-button")
    btn.innerHTML = ArrowDown
    head.appendChild(btn)
    head.style.setProperty("pointer", "cursor")
    const content = document.createElement("div")
    content.classList.add("collapsible-content")
    head.addEventListener("pointerup", () => wrapper.classList.toggle("active"))
    wrapper.appendChild(head)
    content.appendChild(el)
    wrapper.appendChild(content)
    return wrapper
  }

  protected createSeparatorHorizontal(): HTMLHRElement
  {
    const separator = document.createElement("hr")
    separator.classList.add("separator")
    separator.classList.add("horizontal")
    return separator
  }

  protected createSeparatorVertical(): HTMLHRElement
  {
    const separator = document.createElement("hr")
    separator.classList.add("separator")
    separator.classList.add("vertical")
    return separator
  }

  protected createMenuItemBoolean(item: TMenuItemBoolean): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.classList.add("ms-menu-item", item.type)
    const labelEl = document.createElement("span")
    labelEl.textContent = item.label
    wrapper.appendChild(labelEl)
    const checkbox = document.createElement("input")
    checkbox.id = item.id
    checkbox.setAttribute("type", "checkbox")
    checkbox.checked = item.initValue
    checkbox.addEventListener("change", (e) => item.callback((e.target as HTMLInputElement).checked))
    wrapper.appendChild(checkbox)
    return wrapper
  }

  protected createMenuItemSelect(item: TMenuItemSelect): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.classList.add("ms-menu-item", item.type)
    const labelEl = document.createElement("span")
    labelEl.textContent = item.label
    wrapper.appendChild(labelEl)
    const select = document.createElement("select")
    select.id = item.id
    item.values.forEach(v =>
    {
      const selected = v.value === item.initValue
      const opt = new Option(v.label, v.value.toString(), selected, selected)
      select.appendChild(opt)
    })
    select.addEventListener("change", (e) => item.callback((e.target as HTMLInputElement).value))
    wrapper.appendChild(select)
    return wrapper
  }

  protected createMenuItemButton(item: TMenuItemButton): HTMLElement
  {
    const btn = document.createElement("button")
    btn.classList.add("ms-menu-item", item.type)
    btn.innerHTML = item.icon || item.label
    btn.addEventListener("pointerup", item.callback)
    if (item.tooltip) {
      return this.createToolTip(btn, item.tooltip.label, item.tooltip.position)
    }
    else {
      return btn
    }
  }

  protected createMenuItemButtonList(item: TMenuItemButtonList): HTMLElement
  {
    const wrapper = document.createElement("div")
    wrapper.classList.add("ms-menu-item", item.type)
    wrapper.id = item.id
    const labelEl = document.createElement("span")
    labelEl.textContent = item.label
    wrapper.appendChild(labelEl)
    item.values.forEach((v) =>
    {
      const btn = document.createElement("button")
      btn.id = `${item.id}-${ v.value }-btn`
      if (item.initValue === v.value) {
        btn.classList.add("active")
      }
      btn.textContent = v.label
      btn.addEventListener("pointerup", () =>
      {
        item.callback(v.value)
        wrapper.querySelectorAll("*").forEach(e => e.classList.remove("active"))
        btn.classList.add("active")
      })
      wrapper.appendChild(btn)
    })
    return wrapper
  }

  protected createMenuItem(item: TMenuItem): HTMLElement
  {
    switch (item.type) {
      case "checkbox":
        return this.createMenuItemBoolean(item as TMenuItemBoolean)
      case "select":
        return this.createMenuItemSelect(item as TMenuItemSelect)
      case "list":
        return this.createMenuItemButtonList(item as TMenuItemButtonList)
      case "button":
      default:
        return this.createMenuItemButton(item as TMenuItemButton)
    }
  }

  abstract render(domElement: HTMLElement): void

  abstract update(): void

  abstract show(): void

  abstract hide(): void

  abstract destroy(): void
}
