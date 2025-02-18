/**
 * @group Menu
 */
export type TSubMenuParam =
{
  trigger: HTMLElement,
  menuTitle?: string,
  subMenu: HTMLElement,
  position: "top" | "left" | "right" | "right-top" | "bottom" | "bottom-left" | "bottom-right"
}

/**
 * @group Menu
 */
export class IIMenuSub {
  element: HTMLDivElement
  content: HTMLElement

  constructor(param : TSubMenuParam) {
    this.element = document.createElement("div")
    this.element.classList.add("sub-menu")
    this.element.appendChild(param.trigger)
    this.content = document.createElement("div")
    if(param.menuTitle) {
      const menuTitleElement = document.createElement("h3")
      menuTitleElement.classList.add("ms-menu-title")
      menuTitleElement.textContent = param.menuTitle
      this.content.appendChild(menuTitleElement)
    }
    this.content.classList.add("sub-menu-content", param.position)
    this.content.appendChild(param.subMenu)
    this.element.appendChild(this.content)

    param.trigger.addEventListener("pointerdown", () => this.toggle())
    document.addEventListener("pointerdown", (e) => {
      if (!this.element.contains(e.target as HTMLElement)) {
        this.close()
      }
    })
  }

  open(): void {
    this.content.classList.add("open")
  }

  close(): void {
    this.content.classList.remove("open")
  }

  toggle(): void {
    this.content.classList.toggle("open")
  }

  unwrap(): void {
    this.content.classList.remove("sub-menu-content")
    this.element.insertAdjacentElement("beforebegin", this.content)
    this.element.style.display = "none"
  }

  wrap(): void {
    this.content.classList.add("sub-menu-content")
    this.element.appendChild(this.content)
    this.element.style.display = "block"
  }

}
