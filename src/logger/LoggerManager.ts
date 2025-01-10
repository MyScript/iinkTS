import { TLoggerConfiguration } from "./LoggerConfiguration"
import { Logger, LoggerCategory, LoggerLevel } from "./logger"

/**
 * @group Logger
 */
export class LoggerManager
{
  static #loggerMap: Map<LoggerCategory, Logger> = new Map()

  static getLogger(name: LoggerCategory): Logger
  {
    if (!this.#loggerMap.has(name)) {
      this.#loggerMap.set(name, new Logger(name, LoggerLevel.ERROR))
    }
    return this.#loggerMap.get(name) as Logger
  }

  static setLoggerLevel(config: TLoggerConfiguration)
  {
    Object.keys(config).forEach((lc) =>
    {
      LoggerManager.getLogger(lc as LoggerCategory).level = config[lc as LoggerCategory]
    })
  }
}
