import styleIcon from "@/assets/svg/palette.svg"
import type { TCanvasTheme } from "@/canvas/CanvasThemes"
import { CanvasThemes } from "@/canvas/CanvasThemes"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem"
import { SubMenuItem } from "@/menu/items/SubMenuItem"

const STORAGE_KEY_ATTR = "data-theme-id"

/**
 * Sub-menu action for switching predefined canvas themes.
 * Selected theme is persisted to localStorage.
 * @group Menu
 */
export class ThemeMenuAction extends SubMenuItem {
  private themes: TCanvasTheme[]
  private currentThemeId: string
  private themeItems: Map<string, HTMLElement> = new Map()

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action", themes?: TCanvasTheme[]) {
    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-theme`,
      label: "Theme",
      icon: styleIcon,
      menuTitle: "Theme",
      position: "right-top",
      items: [],
    }
    super(config, canvas)
    this.themes = themes ?? CanvasThemes.EDITOR_THEMES
    this.currentThemeId = CanvasThemes.getSavedThemeId()
  }

  createElement(): HTMLDivElement {
    const wrapper = super.createElement()
    this.buildThemeItems()
    this.applyStoredTheme()
    return wrapper
  }

  private buildThemeItems(): void {
    if (!this.subMenuWrapper) {
      return
    }

    this.themes.forEach((theme) => {
      const item = this.dom.div({
        className: "ms-theme-item",
      })
      item.setAttribute(STORAGE_KEY_ATTR, theme.id)

      const swatch = this.dom.div({
        className: "ms-theme-swatch",
      })
      swatch.style.backgroundColor = theme.swatch

      const label = this.dom.span({
        text: theme.label,
      })
      label.style.color = theme.color

      item.appendChild(swatch)
      item.appendChild(label)
      item.addEventListener("pointerup", (e) => {
        e.stopPropagation()
        this.applyTheme(theme.id)
        this.close()
      })

      this.subMenuWrapper!.appendChild(item)
      this.themeItems.set(theme.id, item)
    })
  }

  private applyTheme(id: string): void {
    const theme = this.themes.find((t) => t.id === id) ?? this.themes[0]
    this.canvas.setCssVars(theme.vars)
    this.currentThemeId = id
    CanvasThemes.saveThemeId(id)
    this.updateActiveItem()
  }

  private applyStoredTheme(): void {
    if (this.currentThemeId !== "default") {
      this.applyTheme(this.currentThemeId)
    }
    this.updateActiveItem()
  }

  private updateActiveItem(): void {
    this.themeItems.forEach((el, id) => {
      el.classList.toggle("active", id === this.currentThemeId)
    })
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }
}
