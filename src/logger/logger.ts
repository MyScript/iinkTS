/**
 * @group Logger
 */
export enum LoggerLevel {
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

/**
 * @group Logger
 */
export enum LoggerCategory {
  CANVAS = "CANVAS",
  CLIENT = "CLIENT",
  GRABBER = "GRABBER",
  GESTURE = "GESTURE",
  MOVE = "MOVE",
  CANVAS_EVENT = "CANVAS_EVENT",
  MODEL = "MODEL",
  RENDERER = "RENDERER",
  SMARTGUIDE = "SMARTGUIDE",
  MANAGER = "MANAGER",
  STYLE = "STYLE",
  HISTORY = "HISTORY",
  SYMBOL = "SYMBOL",
  WRITE = "WRITE",
  TRANSFORMER = "TRANSFORMER",
  CONVERTER = "CONVERTER",
  SELECTION = "SELECTION",
  SYNCHRONIZER = "SYNCHRONIZER",
  SVGDEBUG = "SVGDEBUG",
  MENU = "MENU",
  JIIX_QUERY = "JIIX_QUERY",
  KEYBOARD = "KEYBOARD",
  MATH = "MATH",
  SNAP = "SNAP",
  TEXT = "TEXT",
}

/**
 * @group Logger
 */
export class Logger {
  category: LoggerCategory
  level: LoggerLevel

  constructor(category: LoggerCategory, level: LoggerLevel) {
    this.category = category
    this.level = level
  }

  private log(
    level: LoggerLevel,
    levelName: "debug" | "info" | "warn" | "error",
    functionName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...data: any
  ): void {
    if (level >= this.level) {
      const dataLog = {
        level: levelName,
        from: `${this.category}.${functionName}`,
        message: data,
      }
      console[levelName](dataLog)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(functionName: string, ...data: any): void {
    this.log(LoggerLevel.DEBUG, "debug", functionName, ...data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(functionName: string, ...data: any): void {
    this.log(LoggerLevel.INFO, "info", functionName, ...data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(functionName: string, ...data: any): void {
    this.log(LoggerLevel.WARN, "warn", functionName, ...data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(functionName: string, ...error: any): void {
    this.log(LoggerLevel.ERROR, "error", functionName, ...error)
  }
}
