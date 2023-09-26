import {
  TTheme,
  TPenStyle
} from "../@types"

import { mergeDeep } from "../utils/merge"

import { DefaultPenStyle } from "./DefaultPenStyle"
import { DefaultTheme } from "./DefaultTheme"
import { LoggerManager } from "../logger"
import { LoggerClass } from "../Constants"

export class StyleManager
{
  #penStyle!: TPenStyle
  #theme!: TTheme
  #penStyleClasses!: string
  #currentPenStyle!: TPenStyle
  #logger =  LoggerManager.getLogger(LoggerClass.STYLE)

  constructor(penStyle?: TPenStyle, theme?: TTheme)
  {
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
  setPenStyle(style?: TPenStyle)
  {
    this.#logger.info("setPenStyle", { style })
    this.#penStyle = mergeDeep(structuredClone(DefaultPenStyle), style || {}) as TPenStyle
    this.#currentPenStyle = style || (this.theme[`.${ this.#penStyleClasses }`]) as TPenStyle
    this.#logger.debug("setPenStyle", this.#currentPenStyle)
  }

  get theme(): TTheme
  {
    return this.#theme
  }
  setTheme(theme?: TTheme)
  {
    this.#logger.info("setTheme", { theme })
    this.#theme = mergeDeep(structuredClone(DefaultTheme), theme || {}) as TTheme
    this.#logger.debug("setTheme", this.#theme)
  }

  get penStyleClasses(): string
  {
    return this.#penStyleClasses
  }
  setPenStyleClasses(penStyleClass = "")
  {
    this.#logger.info("setPenStyleClasses", { penStyleClass })
    this.#penStyleClasses = penStyleClass
    this.#currentPenStyle = (this.theme[`.${ this.#penStyleClasses }`]) as TPenStyle
    this.#logger.debug("setPenStyleClasses", this.#currentPenStyle)
  }

}
