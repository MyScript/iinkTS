import { LoggerClass, LoggerLevel } from "../Constants"
import { TLoggerConfiguration } from "../configuration"
import { Logger } from "./logger"

/**
 * @group Logger
 */
export class LoggerManager
{
  static #loggerMap: Map<LoggerClass, Logger> = new Map()

  static getLogger(name: LoggerClass): Logger
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
      LoggerManager.getLogger(lc as LoggerClass).level = config[lc as LoggerClass]
    })
  }
}
