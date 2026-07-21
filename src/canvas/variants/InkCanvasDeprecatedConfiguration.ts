import type { TCanvasConfiguration } from "@/canvas/AbstractCanvas"
import type { TCanvasTriggerConfiguration } from "@/canvas/CanvasTriggerConfiguration"
import { DefaultCanvasTriggerConfiguration } from "@/canvas/CanvasTriggerConfiguration"
import type { THTTPClientV1Configuration, TRecognitionHTTPV1Configuration, TServerHTTPConfiguration } from "@/client"
import { DefaultHTTPClientV1Configuration, HTTPClientV1Configuration } from "@/client"
import type { TGrabberConfiguration } from "@/grabber"
import { DefaultGrabberConfiguration } from "@/grabber"
import type { THistoryConfiguration } from "@/history"
import { DefaultHistoryConfiguration } from "@/history"
import type { TLoggerConfiguration } from "@/logger"
import { DefaultLoggerConfiguration } from "@/logger"
import type { TRendererConfiguration } from "@/renderer"
import { DefaultRendererConfiguration } from "@/renderer"
import type { TPenStyle, TTheme } from "@/style"
import { DefaultTheme } from "@/style"
import type { TPartialDeep } from "@/utils"
import { mergeDeep } from "@/utils"

/**
 * @group Canvas
 */
export type TInkCanvasDeprecatedConfiguration = TCanvasConfiguration &
  THTTPClientV1Configuration & {
    rendering: TRendererConfiguration
    "undo-redo": THistoryConfiguration
    grabber: TGrabberConfiguration
    triggers: TCanvasTriggerConfiguration
    logger: TLoggerConfiguration
    penStyle: TPenStyle
    penStyleClasses?: string
    theme: TTheme
  }

/**
 * @group Canvas
 * @source
 */
export const DefaultInkCanvasDeprecatedConfiguration: TInkCanvasDeprecatedConfiguration = {
  server: DefaultHTTPClientV1Configuration.server,
  recognition: DefaultHTTPClientV1Configuration.recognition,
  rendering: DefaultRendererConfiguration,
  grabber: DefaultGrabberConfiguration,
  triggers: DefaultCanvasTriggerConfiguration,
  "undo-redo": DefaultHistoryConfiguration,
  logger: DefaultLoggerConfiguration,
  penStyle: {},
  theme: DefaultTheme,
}

/**
 * @group Canvas
 */
export class InkCanvasDeprecatedConfiguration implements TInkCanvasDeprecatedConfiguration {
  server: TServerHTTPConfiguration
  recognition: TRecognitionHTTPV1Configuration
  rendering: TRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TCanvasTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TPenStyle
  penStyleClasses?: string
  theme: TTheme

  constructor(configuration?: TPartialDeep<TInkCanvasDeprecatedConfiguration>) {
    const { server, recognition } = new HTTPClientV1Configuration(configuration)
    this.server = server
    this.recognition = recognition
    this.rendering = mergeDeep({}, DefaultInkCanvasDeprecatedConfiguration.rendering, configuration?.rendering)
    this.grabber = mergeDeep({}, DefaultInkCanvasDeprecatedConfiguration.grabber, configuration?.grabber)
    this["undo-redo"] = mergeDeep(
      {},
      DefaultInkCanvasDeprecatedConfiguration["undo-redo"],
      configuration?.["undo-redo"]
    )
    this.triggers = mergeDeep({}, DefaultInkCanvasDeprecatedConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultInkCanvasDeprecatedConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultInkCanvasDeprecatedConfiguration.penStyle, configuration?.penStyle)
    this.penStyleClasses = configuration?.penStyleClasses || this.penStyleClasses
    this.theme = mergeDeep({}, DefaultInkCanvasDeprecatedConfiguration.theme, configuration?.theme)
  }
}
