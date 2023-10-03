import { LOGGER_CLASS, LOGGER_LEVEL } from "../@types"

export class Logger {
  instanceName: LOGGER_CLASS
  level: LOGGER_LEVEL

  constructor (instanceName: LOGGER_CLASS, level: LOGGER_LEVEL) {
    this.instanceName = instanceName
    this.level = level
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(...data: any) {
    if (LOGGER_LEVEL.DEBUG >= this.level) {
      const dataLog = {
        from: this.instanceName,

        message: data,
      }
      console.debug(dataLog)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(...data: any) {
    if (LOGGER_LEVEL.INFO >= this.level) {
      const dataLog = {
        from: this.instanceName,

        message: data,
      }
      console.info(dataLog);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(...data: any) {
    if (LOGGER_LEVEL.WARN >= this.level) {
      const dataLog = {
        from: this.instanceName,

        message: data,
      }
      console.warn(dataLog)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(...error: any) {
    const dataLog = {
      from: this.instanceName,

      error,
    }
    console.error(dataLog)
  }
}