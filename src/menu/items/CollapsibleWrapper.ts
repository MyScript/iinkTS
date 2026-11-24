import ArrowDown from "@/assets/svg/nav-arrow-down.svg"
import { DOMFactory } from "@/dom"

/**
 * @group Menu
 * @remarks Utility class to create a collapsible wrapper around menu content
 */
export class CollapsibleWrapper {
  private wrapper: HTMLDivElement

  constructor(content: HTMLElement, title: string, id?: string) {
    this.wrapper = this.createWrapper(content, title, id)
  }

  private createWrapper(content: HTMLElement, title: string, id?: string): HTMLDivElement {
    const wrapper = DOMFactory.div({
      className: "collapsible-wrapper",
    })
    if (id) {
      wrapper.id = id
    }

    const head = DOMFactory.div({
      className: "collapsible-header",
      text: title,
    })

    const btn = DOMFactory.span({
      className: "collapsible-header-icon",
      html: ArrowDown,
    })
    head.appendChild(btn)
    head.style.setProperty("cursor", "pointer")

    const contentWrapper = DOMFactory.div({
      className: "collapsible-content",
    })

    head.addEventListener("click", () => wrapper.classList.toggle("active"))

    wrapper.appendChild(head)
    contentWrapper.appendChild(content)
    wrapper.appendChild(contentWrapper)

    return wrapper
  }

  getElement(): HTMLDivElement {
    return this.wrapper
  }

  setActive(active: boolean): void {
    if (active) {
      this.wrapper.classList.add("active")
    } else {
      this.wrapper.classList.remove("active")
    }
  }

  toggle(): void {
    this.wrapper.classList.toggle("active")
  }

  destroy(): void {
    this.wrapper.remove()
  }
}
