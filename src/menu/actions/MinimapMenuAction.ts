import minimapIcon from "@/assets/svg/minimap.svg"
import type { TInteractiveInkCanvas } from "@/canvas"
import { Minimap } from "@/components"

import type { TMenuButton } from "../items/ButtonMenuItem"
import { ButtonMenuItem } from "../items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu action to toggle the minimap overlay
 */
export class MinimapMenuAction extends ButtonMenuItem {
  #minimap: Minimap
  #visible = false

  constructor(canvas: TInteractiveInkCanvas, layer: HTMLElement, idPrefix = "ms-menu-action") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-minimap`,
      icon: minimapIcon,
      action: () => this.#toggle(),
    }
    super(config, canvas)
    this.#minimap = new Minimap(canvas, {
      width: 240,
      height: 160,
    })
    this.#initInLayer(layer)
  }

  #initInLayer(layer: HTMLElement): void {
    this.#minimap.getElement().classList.add("ms-menu-minimap")
    this.#minimap.attach(layer)
    this.#minimap.getElement().style.display = "none"
  }

  #toggle(): void {
    this.#visible = !this.#visible
    this.#minimap.getElement().style.display = this.#visible ? "block" : "none"
    this.getElement().classList.toggle("active", this.#visible)
  }

  update(): void {
    super.update()
    this.getElement().classList.toggle("active", this.#visible)
  }

  destroy(): void {
    this.#minimap.destroy()
    super.destroy()
  }
}
