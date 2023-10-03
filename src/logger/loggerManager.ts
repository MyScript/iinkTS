import { TLoggerConfiguration } from "../@types"
import { LOGGER_CLASS, LOGGER_LEVEL } from "../Constants"
import { Logger } from "./logger"

export class LoggerManager
{
  static #loggerMap: Map<LOGGER_CLASS, Logger> = new Map()
  static getLogger(name: LOGGER_CLASS): Logger {
    if(!this.#loggerMap.has(name))
    {
      this.#loggerMap.set(name, new Logger(name, LOGGER_LEVEL.ERROR))
    }
    return this.#loggerMap.get(name) as Logger
  }

  static setLoggerLevel(config: TLoggerConfiguration)
  {

    Object.keys(config).forEach((lc) => {
      LoggerManager.getLogger(lc as LOGGER_CLASS).level = config[lc as LOGGER_CLASS]
    })
  }
}