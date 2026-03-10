/**
 * @group Logger
 */
export enum LoggerLevel
{
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

/**
 * @group Logger
 */
export enum LoggerCategory
{
  EDITOR = "EDITOR",
  RECOGNIZER = "RECOGNIZER",
  GRABBER = "GRABBER",
  GESTURE = "GESTURE",
  EDITOR_EVENT = "EDITOR_EVENT",
  MODEL = "MODEL",
  RENDERER = "RENDERER",
  SMARTGUIDE = "SMARTGUIDE",
  STYLE = "STYLE",
  HISTORY = "HISTORY",
  SYMBOL = "SYMBOL",
  WRITE = "WRITE",
  TRANSFORMER = "TRANSFORMER",
  CONVERTER = "CONVERTER",
  SELECTION = "SELECTION",
  SVGDEBUG = "SVGDEBUG",
  MENU = "MENU"
}

/**
 * @group Logger
 */
export class Logger
{
  category: LoggerCategory
  level: LoggerLevel

  constructor(category: LoggerCategory, level: LoggerLevel)
  {
    this.category = category
    this.level = level
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private log(level: LoggerLevel, levelName: "debug" | "info" | "warn" | "error", functionName: string, ...data: any): void
  {
    if (level >= this.level) {
      const dataLog = {
        level: levelName,
        from: `${ this.category }.${ functionName }`,
        message: data,
      }
      console[levelName](dataLog)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(functionName: string, ...data: any): void
  {
    this.log(LoggerLevel.DEBUG, "debug", functionName, ...data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(functionName: string, ...data: any): void
  {
    this.log(LoggerLevel.INFO, "info", functionName, ...data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(functionName: string, ...data: any): void
  {
    this.log(LoggerLevel.WARN, "warn", functionName, ...data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(functionName: string, ...error: any): void
  {
    this.log(LoggerLevel.ERROR, "error", functionName, ...error)
  }
}
