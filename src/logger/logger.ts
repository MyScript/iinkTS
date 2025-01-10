/**
 * @group Logger
 */
export enum LoggerLevel
{
  DEBUG = "1",
  INFO = "2",
  WARN = "3",
  ERROR = "4"
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
  debug(functionName: string, ...data: any)
  {
    if (LoggerLevel.DEBUG >= this.level) {
      const dataLog = {
        level: "debug",
        from: `${ this.category }.${ functionName }`,
        message: data,
      }
      console.debug(dataLog)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(functionName: string, ...data: any)
  {
    if (LoggerLevel.INFO >= this.level) {
      const dataLog = {
        level: "info",
        from: `${ this.category }.${ functionName }`,
        message: data,
      }
      console.info(dataLog)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(functionName: string, ...data: any)
  {
    if (LoggerLevel.WARN >= this.level) {
      const dataLog = {
        level: "warn",
        from: `${ this.category }.${ functionName }`,
        message: data,
      }
      console.warn(dataLog)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(functionName: string, ...error: any)
  {
    const dataLog = {
      level: "error",
      from: `${ this.category }.${ functionName }`,
      message: error,
    }
    console.error(dataLog)
  }
}
