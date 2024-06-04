/**
 * @group Menu
 */
export class OIMenuSub
{
  element: HTMLDivElement
  content: HTMLElement

  constructor(trigger: HTMLElement, subMenu: HTMLElement, position: "top" | "left" | "right" | "bottom" | "bottom-left" = "top")
  {
    this.element = document.createElement("div")
    this.element.classList.add("sub-menu")
    this.element.appendChild(trigger)

    this.content = document.createElement("div")
    this.content.classList.add("sub-menu-content", position)
    this.content.appendChild(subMenu)
    this.element.appendChild(this.content)

    trigger.addEventListener("pointerdown", () => {
      this.content.classList.toggle("open")
      const close = (e: PointerEvent) => {
        if (!this.element.contains(e.target as HTMLElement)) {
          this.content.classList.remove("open")
          document.removeEventListener("pointerdown", close)
        }
      }
      document.addEventListener("pointerdown", close)
    })
  }

  unwrap(): void
  {
    this.content.classList.remove("sub-menu-content")
    this.element.insertAdjacentElement("beforebegin", this.content)
    this.element.style.display = "none"
  }

  wrap(): void
  {
    this.content.classList.add("sub-menu-content")
    this.element.appendChild(this.content)
    this.element.style.display = "block"
  }

}
