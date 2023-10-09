
/**
 * @group Logger
 */
export const enum LoggerLevel {
    DEBUG = "1",
    INFO = "2",
    WARN = "3",
    ERROR = "4"
  }

/**
 * @group Logger
 */
  export const enum LoggerClass {
    EDITOR = "EDITOR",
    RECOGNIZER = "RECOGNIZER",
    GRABBER = "GRABBER",
    BEHAVIORS = "BEHAVIORS",
    CONFIGURATION = "CONFIGURATION",
    PUBLIC_EVENT = "PUBLIC_EVENT",
    MODEL = "MODEL",
    CANVAS_RENDERER = "CANVAS_RENDERER",
    SVGRENDERER = "SVGRENDERER",
    SMARTGUIDE = "SMARTGUIDE",
    STYLEMANAGER = "STYLEMANAGER",
    UNDOREDO_MANAGER = "UNDOREDO_MANAGER",
    STROKE = "STROKE",
    INTERNALEVENT = "INTERNALEVENT"
  }

  export type TLoggerConfiguration = {
    [key in keyof typeof LoggerClass]: LoggerLevel
  }
