import { Logger, LoggerCategory, LoggerLevel } from "@/iink"

describe("Logger.ts", () => {
  let consoleSpies: Record<"debug" | "info" | "warn" | "error", jest.SpyInstance>

  beforeEach(() => {
    consoleSpies = {
      debug: jest.spyOn(console, "debug").mockImplementation(() => undefined),
      info: jest.spyOn(console, "info").mockImplementation(() => undefined),
      warn: jest.spyOn(console, "warn").mockImplementation(() => undefined),
      error: jest.spyOn(console, "error").mockImplementation(() => undefined),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test("should store the category and level given at construction", () => {
    const logger = new Logger(LoggerCategory.MODEL, LoggerLevel.WARN)

    expect(logger.category).toEqual(LoggerCategory.MODEL)
    expect(logger.level).toEqual(LoggerLevel.WARN)
  })

  test("should log to console[level] when the message level is at or above the configured level", () => {
    const logger = new Logger(LoggerCategory.MODEL, LoggerLevel.INFO)

    logger.info("myFunction", { foo: "bar" }, 42)

    expect(consoleSpies.info).toHaveBeenCalledWith({
      level: "info",
      from: "MODEL.myFunction",
      message: [{ foo: "bar" }, 42],
    })
  })

  test("should not log when the message level is below the configured level", () => {
    const logger = new Logger(LoggerCategory.MODEL, LoggerLevel.WARN)

    logger.debug("myFunction", "should be dropped")
    logger.info("myFunction", "should be dropped")

    expect(consoleSpies.debug).not.toHaveBeenCalled()
    expect(consoleSpies.info).not.toHaveBeenCalled()
  })

  test("should route debug/warn/error to their matching console methods", () => {
    const logger = new Logger(LoggerCategory.MODEL, LoggerLevel.DEBUG)

    logger.debug("fn")
    logger.warn("fn")
    logger.error("fn", new Error("boom"))

    expect(consoleSpies.debug).toHaveBeenCalledTimes(1)
    expect(consoleSpies.warn).toHaveBeenCalledTimes(1)
    expect(consoleSpies.error).toHaveBeenCalledWith(expect.objectContaining({ level: "error" }))
  })
})
