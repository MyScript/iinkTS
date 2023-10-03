import { TTheme } from "../@types/style/Theme"
import { TPenStyle } from "../@types/style/PenStyle"

import { mergeDeep } from "../utils/MergeHelper"

import { DefaultPenStyle } from "./DefaultPenStyle"
import { DefaultTheme } from "./DefaultTheme"
import { Logger, LoggerManager } from "../logger"
import { LOGGER_CLASS } from "../Constants"

export class StyleManager
{
  #penStyle!: TPenStyle
  #theme!: TTheme
  #penStyleClasses!: string
  #currentPenStyle!: TPenStyle
  #logger: Logger

  constructor(penStyle?: TPenStyle, theme?: TTheme)
  {
    this.#logger = LoggerManager.getLogger(LOGGER_CLASS.STYLEMANAGER)
    this.#logger.info("constructor", { penStyle, theme })
    this.setTheme(theme)
    this.setPenStyleClasses()
    this.setPenStyle(penStyle)
  }

  get currentPenStyle(): TPenStyle
  {
    return this.#currentPenStyle || this.#penStyle
  }

  get penStyle(): TPenStyle
  {
    return this.#penStyle
  }
  setPenStyle(p?: TPenStyle)
  {
    this.#logger.info("setPenStyle", { p })
    this.#penStyle = mergeDeep(structuredClone(DefaultPenStyle), p || {}) as TPenStyle
    this.#currentPenStyle = p || (this.theme[`.${ this.#penStyleClasses }`]) as TPenStyle
    this.#logger.debug("setPenStyle", this.#currentPenStyle)
  }

  get theme(): TTheme
  {
    return this.#theme
  }
  setTheme(t?: TTheme)
  {
    this.#logger.info("setTheme", { t })
    this.#theme = mergeDeep(structuredClone(DefaultTheme), t || {}) as TTheme
    this.#logger.debug("setTheme", this.#theme)
  }

  get penStyleClasses(): string
  {
    return this.#penStyleClasses
  }
  setPenStyleClasses(psc = "")
  {
    this.#logger.info("setPenStyleClasses", { psc })
    this.#penStyleClasses = psc
    this.#currentPenStyle = (this.theme[`.${ this.#penStyleClasses }`]) as TPenStyle
    this.#logger.debug("setPenStyleClasses", this.#currentPenStyle)
  }

}
