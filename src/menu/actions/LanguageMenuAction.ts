import languageIcon from "@/assets/svg/language.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"
import { getAvailableLanguageList } from "@/utils"

/**
 * @group Menu
 * @remarks Menu action Language - Sélection de la langue
 */
export class LanguageMenuAction extends BaseMenuItem<HTMLDivElement> {
  #documentPointerdownHandler?: (e: PointerEvent) => void
  private select!: HTMLSelectElement
  private subMenuWrapper!: HTMLDivElement
  private subMenuContent!: HTMLDivElement

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config = {
      type: "language" as const,
      id: `${idPrefix}-language`,
      label: "Language",
    }
    super(config, canvas)
  }

  createElement(): HTMLDivElement {
    const triggerBtn = this.dom.button({
      className: "square",
      html: languageIcon,
    })
    triggerBtn.id = `${this.config.id}-trigger`

    this.select = this.dom.select({
      id: this.config.id,
      options: [],
      className: "select-language",
      onChange: (value) => {
        this.logger.info(`${this.config.id}.change`)
        this.canvas.changeLanguage(value)
      },
    })

    // Chargement asynchrone des langues disponibles
    getAvailableLanguageList(this.canvas.configuration).then((json) => {
      const languages = json.result as {
        [key: string]: string
      }
      for (const key in languages) {
        const selected = key === this.canvas.configuration.recognition.lang
        const opt = new Option(languages[key], key, selected, selected)
        this.select.appendChild(opt)
      }
    })

    this.subMenuWrapper = this.dom.div({
      className: "sub-menu",
    })
    this.subMenuWrapper.appendChild(triggerBtn)

    this.subMenuContent = this.dom.div({
      className: ["sub-menu-content", "bottom-right"],
    })
    this.subMenuContent.appendChild(this.select)
    this.subMenuWrapper.appendChild(this.subMenuContent)

    // Event listeners
    triggerBtn.addEventListener("pointerdown", () => this.subMenuContent.classList.toggle("open"))
    this.#documentPointerdownHandler = (e: PointerEvent) => {
      if (!this.subMenuWrapper.contains(e.target as HTMLElement)) {
        this.subMenuContent.classList.remove("open")
      }
    }
    document.addEventListener("pointerdown", this.#documentPointerdownHandler)

    return this.subMenuWrapper
  }

  destroy(): void {
    if (this.#documentPointerdownHandler) {
      document.removeEventListener("pointerdown", this.#documentPointerdownHandler)
      this.#documentPointerdownHandler = undefined
    }
    super.destroy()
  }

  /**
   * Wraps/unwraps according to screen size (mobile)
   */
  wrap(): void {
    if (this.subMenuContent && this.subMenuWrapper) {
      this.subMenuContent.classList.add("sub-menu-content")
      this.subMenuWrapper.appendChild(this.subMenuContent)
      this.subMenuWrapper.style.display = "block"
    }
  }

  unwrap(): void {
    if (this.subMenuContent && this.subMenuWrapper) {
      this.subMenuContent.classList.remove("sub-menu-content")
      this.subMenuWrapper.insertAdjacentElement("beforebegin", this.subMenuContent)
      this.subMenuWrapper.style.display = "none"
    }
  }

  update(): void {
    if (this.select) {
      this.select.value = this.canvas.configuration.recognition.lang
    }
    this.updateDisabled()
    this.updateVisible()
  }
}
