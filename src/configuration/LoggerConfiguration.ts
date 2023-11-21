import { LoggerClass, LoggerLevel } from "../Constants"

/**
 * @group Configuration
 */
export type TLoggerConfiguration = {
  [key in keyof typeof LoggerClass]: LoggerLevel
}

/**
 * @group Configuration
 */
export const DefaultLoggerConfiguration: TLoggerConfiguration = {
  [LoggerClass.EDITOR]: LoggerLevel.ERROR,
  [LoggerClass.BEHAVIORS]: LoggerLevel.ERROR,
  [LoggerClass.RECOGNIZER]: LoggerLevel.ERROR,
  [LoggerClass.GRABBER]: LoggerLevel.ERROR,
  [LoggerClass.RENDERER]: LoggerLevel.ERROR,
  [LoggerClass.CONFIGURATION]: LoggerLevel.ERROR,
  [LoggerClass.PUBLIC_EVENT]: LoggerLevel.ERROR,
  [LoggerClass.INTERNAL_EVENT]: LoggerLevel.ERROR,
  [LoggerClass.MODEL]: LoggerLevel.ERROR,
  [LoggerClass.STROKE]: LoggerLevel.ERROR,
  [LoggerClass.SMARTGUIDE]: LoggerLevel.ERROR,
  [LoggerClass.STYLE]: LoggerLevel.ERROR,
  [LoggerClass.UNDO_REDO]: LoggerLevel.ERROR
}
