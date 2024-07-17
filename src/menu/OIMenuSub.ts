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

    trigger.addEventListener("pointerdown", () => this.toggle())
    document.addEventListener("pointerdown", (e) => {
      if (!this.element.contains(e.target as HTMLElement)) {
        this.close()
      }
    })
  }

  open(): void
  {
    this.content.classList.add("open")
  }

  close(): void
  {
    this.content.classList.remove("open")
  }

  toggle(): void
  {
    this.content.classList.toggle("open")
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
