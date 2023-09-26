
/**
 * @group Logger
 */
export const enum LoggerLevel
{
  DEBUG = "1",
  INFO = "2",
  WARN = "3",
  ERROR = "4"
}

/**
 * @group Logger
 */
export const enum LoggerClass
{
  EDITOR = "EDITOR",
  RECOGNIZER = "RECOGNIZER",
  GRABBER = "GRABBER",
  BEHAVIORS = "BEHAVIORS",
  CONFIGURATION = "CONFIGURATION",
  PUBLIC_EVENT = "PUBLIC_EVENT",
  MODEL = "MODEL",
  RENDERER = "RENDERER",
  SMARTGUIDE = "SMARTGUIDE",
  STYLE = "STYLE",
  UNDO_REDO = "UNDO_REDO",
  STROKE = "STROKE",
  INTERNAL_EVENT = "INTERNAL_EVENT"
}

export type TLoggerConfiguration = {
  [key in keyof typeof LoggerClass]: LoggerLevel
}
