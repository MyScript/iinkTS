import { LoggerCategory, LoggerLevel } from "./logger"

/**
 * @group Logger
 */
export type TLoggerConfiguration = {
  [key in keyof typeof LoggerCategory]: LoggerLevel
}

/**
 * @group Logger
 * @source
 */
export const DefaultLoggerConfiguration: TLoggerConfiguration = {
  [LoggerCategory.EDITOR]: LoggerLevel.ERROR,
  [LoggerCategory.RECOGNIZER]: LoggerLevel.ERROR,
  [LoggerCategory.GRABBER]: LoggerLevel.ERROR,
  [LoggerCategory.RENDERER]: LoggerLevel.ERROR,
  [LoggerCategory.EDITOR_EVENT]: LoggerLevel.ERROR,
  [LoggerCategory.MODEL]: LoggerLevel.ERROR,
  [LoggerCategory.SYMBOL]: LoggerLevel.ERROR,
  [LoggerCategory.SMARTGUIDE]: LoggerLevel.ERROR,
  [LoggerCategory.GESTURE]: LoggerLevel.ERROR,
  [LoggerCategory.STYLE]: LoggerLevel.ERROR,
  [LoggerCategory.HISTORY]: LoggerLevel.ERROR,
  [LoggerCategory.TRANSFORMER]: LoggerLevel.ERROR,
  [LoggerCategory.CONVERTER]: LoggerLevel.ERROR,
  [LoggerCategory.WRITE]: LoggerLevel.ERROR,
  [LoggerCategory.SELECTION]: LoggerLevel.ERROR,
  [LoggerCategory.SVGDEBUG]: LoggerLevel.ERROR,
  [LoggerCategory.MENU]: LoggerLevel.ERROR,
}
