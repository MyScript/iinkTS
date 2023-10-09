import { LoggerClass, LoggerLevel } from "../@types"

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
  debug(...data: any)
  {
    if (LoggerLevel.DEBUG >= this.level) {
      const dataLog = {
        from: this.instanceName,
        message: data,
      }
      console.debug(dataLog)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(...data: any)
  {
    if (LoggerLevel.INFO >= this.level) {
      const dataLog = {
        from: this.instanceName,
        message: data,
      }
      console.info(dataLog)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(...data: any)
  {
    if (LoggerLevel.WARN >= this.level) {
      const dataLog = {
        from: this.instanceName,
        message: data,
      }
      console.warn(dataLog)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(...error: any)
  {
    const dataLog = {
      from: this.instanceName,
      error,
    }
    console.error(dataLog)
  }
}
