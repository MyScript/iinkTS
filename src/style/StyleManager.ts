import type { TPartialDeep } from "@/core"
import { mergeDeep } from "@/core"
import { LoggerCategory, LoggerManager } from "@/logger"

import type { TPenStyle } from "./PenStyle"
import { DefaultPenStyle } from "./PenStyle"
import type { TTheme } from "./Theme"
import { DefaultTheme } from "./Theme"

/**
 * @group Styles
 */
export class StyleManager {
  #penStyle!: TPenStyle
  #theme!: TTheme
  #penStyleClasses!: string
  #currentPenStyle!: TPenStyle
  #logger = LoggerManager.getLogger(LoggerCategory.STYLE)

  constructor(penStyle?: TPartialDeep<TPenStyle>, theme?: TPartialDeep<TTheme>) {
    this.#logger.info("constructor", {
      penStyle,
      theme,
    })
    this.setTheme(theme)
    this.setPenStyleClasses()
    this.setPenStyle(penStyle)
  }

  get currentPenStyle(): TPenStyle {
    return this.#currentPenStyle || this.#penStyle
  }

  get penStyle(): TPenStyle {
    return this.#penStyle
  }
  setPenStyle(style?: TPartialDeep<TPenStyle>) {
    this.#logger.info("setPenStyle", { style })
    this.#penStyle = mergeDeep(structuredClone(DefaultPenStyle), style || {})
    this.#currentPenStyle = style || (this.theme[`.${this.#penStyleClasses}`] as TPenStyle)
    this.#logger.debug("setPenStyle", this.#currentPenStyle)
  }

  get theme(): TTheme {
    return this.#theme
  }
  setTheme(theme?: TPartialDeep<TTheme>) {
    this.#logger.info("setTheme", { theme })
    this.#theme = mergeDeep(structuredClone(DefaultTheme), theme || {})
    this.#logger.debug("setTheme", this.#theme)
  }

  get penStyleClasses(): string {
    return this.#penStyleClasses
  }
  setPenStyleClasses(penStyleClass = "") {
    this.#logger.info("setPenStyleClasses", {
      penStyleClass,
    })
    this.#penStyleClasses = penStyleClass
    this.#currentPenStyle = this.theme[`.${this.#penStyleClasses}`] as TPenStyle
    this.#logger.debug("setPenStyleClasses", this.#currentPenStyle)
  }
}
