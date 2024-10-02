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
export enum LoggerClass
{
  EDITOR = "EDITOR",
  RECOGNIZER = "RECOGNIZER",
  GRABBER = "GRABBER",
  BEHAVIORS = "BEHAVIORS",
  GESTURE = "GESTURE",
  CONFIGURATION = "CONFIGURATION",
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
  instanceName: LoggerClass
  level: LoggerLevel

  constructor(instanceName: LoggerClass, level: LoggerLevel)
  {
    this.instanceName = instanceName
    this.level = level
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(functionName: string, ...data: any)
  {
    if (LoggerLevel.DEBUG >= this.level) {
      const dataLog = {
        from: `${this.instanceName}.${functionName}`,
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
        from: `${this.instanceName}.${functionName}`,
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
        from: `${this.instanceName}.${functionName}`,
        message: data,
      }
      console.warn(dataLog)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(functionName: string, ...error: any)
  {
    const dataLog = {
      from: `${this.instanceName}.${functionName}`,
      error,
    }
    console.error(dataLog)
  }
}
