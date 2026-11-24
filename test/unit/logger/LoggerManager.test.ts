import { DefaultLoggerConfiguration, Logger, LoggerCategory, LoggerLevel, LoggerManager, TLoggerConfiguration } from "@/iink"

describe("LoggerManager.ts", () => {
  test("should return a Logger instance for a category", () => {
    const logger = LoggerManager.getLogger(LoggerCategory.CANVAS)
    expect(logger).toBeInstanceOf(Logger)
    expect(logger.category).toEqual(LoggerCategory.CANVAS)
  })

  test("should return the same instance on repeated calls for the same category", () => {
    const first = LoggerManager.getLogger(LoggerCategory.MODEL)
    const second = LoggerManager.getLogger(LoggerCategory.MODEL)
    expect(second).toBe(first)
  })

  test("should default a newly created logger to ERROR level", () => {
    const logger = LoggerManager.getLogger(LoggerCategory.STYLE)
    expect(logger.level).toEqual(LoggerLevel.ERROR)
  })

  test("should set the level of every category listed in setLoggerLevel's config", () => {
    const config: TLoggerConfiguration = {
      ...DefaultLoggerConfiguration,
      [LoggerCategory.GESTURE]: LoggerLevel.DEBUG,
    }
    LoggerManager.setLoggerLevel(config)
    expect(LoggerManager.getLogger(LoggerCategory.GESTURE).level).toEqual(LoggerLevel.DEBUG)
    expect(LoggerManager.getLogger(LoggerCategory.CANVAS).level).toEqual(LoggerLevel.ERROR)
  })
})
