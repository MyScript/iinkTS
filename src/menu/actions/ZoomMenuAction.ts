import zoomInIcon from "@/assets/svg/zoom-in.svg"
import zoomOutIcon from "@/assets/svg/zoom-out.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"

/**
 * @group Menu
 * @remarks Menu action Zoom (In + Level + Out)
 */
export class ZoomMenuAction extends BaseMenuItem<HTMLDivElement> {
  private zoomInButton!: HTMLButtonElement
  private zoomLevelButton!: HTMLButtonElement
  private zoomOutButton!: HTMLButtonElement

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config = {
      type: "zoom" as const,
      id: `${idPrefix}-zoom`,
      label: "Zoom",
    }
    super(config, canvas)
  }

  createElement(): HTMLDivElement {
    const wrapper = this.dom.div({
      id: this.config.id,
      className: ["ms-menu-zoom-group", "ms-menu-row"],
    })

    // Bouton Zoom In
    this.zoomInButton = this.dom.button({
      id: `${this.config.id}-in`,
      className: "square",
      html: zoomInIcon,
    })
    this.zoomInButton.addEventListener("pointerup", () => {
      const currentZoom = this.canvas.renderer.getZoom()
      this.canvas.renderer.setZoom(currentZoom * 1.2)
      this.updateZoomLevel()
    })

    // Affichage du niveau de zoom
    this.zoomLevelButton = this.dom.button({
      id: `${this.config.id}-level`,
      className: "ms-menu-zoom-level",
    })
    this.zoomLevelButton.addEventListener("click", () => {
      this.canvas.renderer.setZoom(1)
      this.updateZoomLevel()
    })
    this.updateZoomLevel()

    // Bouton Zoom Out
    this.zoomOutButton = this.dom.button({
      id: `${this.config.id}-out`,
      className: "square",
      html: zoomOutIcon,
    })
    this.zoomOutButton.addEventListener("pointerup", () => {
      const currentZoom = this.canvas.renderer.getZoom()
      this.canvas.renderer.setZoom(currentZoom / 1.2)
      this.updateZoomLevel()
    })

    wrapper.appendChild(this.zoomInButton)
    wrapper.appendChild(this.zoomLevelButton)
    wrapper.appendChild(this.zoomOutButton)

    return wrapper
  }

  private updateZoomLevel(): void {
    if (this.zoomLevelButton) {
      const zoom = this.canvas.renderer.getZoom()
      this.zoomLevelButton.textContent = `${Math.round(zoom * 100)}%`
    }
  }

  update(): void {
    this.updateZoomLevel()
    this.updateDisabled()
    this.updateVisible()
  }
}
