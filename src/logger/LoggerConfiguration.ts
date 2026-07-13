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
  [LoggerCategory.CANVAS]: LoggerLevel.ERROR,
  [LoggerCategory.CLIENT]: LoggerLevel.ERROR,
  [LoggerCategory.GRABBER]: LoggerLevel.ERROR,
  [LoggerCategory.RENDERER]: LoggerLevel.ERROR,
  [LoggerCategory.CANVAS_EVENT]: LoggerLevel.ERROR,
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
  [LoggerCategory.SYNCHRONIZER]: LoggerLevel.ERROR,
  [LoggerCategory.SVGDEBUG]: LoggerLevel.ERROR,
  [LoggerCategory.MENU]: LoggerLevel.ERROR,
  [LoggerCategory.MOVE]: LoggerLevel.ERROR,
  [LoggerCategory.MANAGER]: LoggerLevel.ERROR,
  [LoggerCategory.JIIX_QUERY]: LoggerLevel.ERROR,
  [LoggerCategory.KEYBOARD]: LoggerLevel.ERROR,
  [LoggerCategory.MATH]: LoggerLevel.ERROR,
  [LoggerCategory.SNAP]: LoggerLevel.ERROR,
  [LoggerCategory.TEXT]: LoggerLevel.ERROR,
}
