/**
 * Menu
 */
export class OIMenuSub
{
  element: HTMLDivElement
  trigger: HTMLElement
  content: HTMLElement

  constructor(trigger: HTMLElement, subMenu: HTMLElement, position: "top" | "left" | "right" | "bottom" | "bottom-left" = "top")
  {
    this.trigger = trigger

    this.content = document.createElement("div")
    this.content.classList.add("sub-menu", position)
    this.content.appendChild(subMenu)

    this.element = document.createElement("div")
    this.element.appendChild(this.trigger)
    this.element.appendChild(this.content)

    trigger.addEventListener("pointerdown", () => {
      this.content.classList.toggle("open")
      const close = (e: PointerEvent) => {
        if (!this.element.contains(e.target as HTMLElement)) {
          this.content.classList.remove("open")
          document.removeEventListener("pointerup", close)
        }
      }
      document.addEventListener("pointerup", close)
    })
  }

  unwrap(): void
  {
    this.content.classList.remove("sub-menu")
    this.element.insertAdjacentElement("beforebegin", this.content)
    this.element.style.display = "none"
  }

  wrap(): void
  {
    this.content.classList.add("sub-menu")
    this.element.appendChild(this.content)
    this.element.style.display = "block"
  }

}
