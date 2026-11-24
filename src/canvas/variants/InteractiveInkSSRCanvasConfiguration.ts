import type {
  TServerWebsocketConfiguration,
  TWebSocketSSRClientConfiguration,
  TWebSocketSSRClientRecognitionConfiguration,
} from "@/client"
import { DefaultWebSocketSSRClientConfiguration, WebSocketSSRClientConfiguration } from "@/client"
import type { TPartialDeep } from "@/core"
import { mergeDeep } from "@/core"
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

import type { TCanvasConfiguration } from "../AbstractCanvas"
import type { TCanvasTriggerConfiguration } from "../CanvasTriggerConfiguration"
import { DefaultCanvasTriggerConfiguration } from "../CanvasTriggerConfiguration"
/**
 * @group Canvas
 */
export type TInteractiveInkSSRCanvasConfiguration = TCanvasConfiguration &
  TWebSocketSSRClientConfiguration & {
    rendering: TRendererConfiguration
    smartGuide: {
      enable: boolean
    }
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
export const DefaultInteractiveInkSSRCanvasConfiguration: TInteractiveInkSSRCanvasConfiguration = {
  server: DefaultWebSocketSSRClientConfiguration.server,
  recognition: DefaultWebSocketSSRClientConfiguration.recognition,
  rendering: DefaultRendererConfiguration,
  smartGuide: {
    enable: true,
  },
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
export class InteractiveInkSSRCanvasConfiguration implements TInteractiveInkSSRCanvasConfiguration {
  server: TServerWebsocketConfiguration
  recognition: TWebSocketSSRClientRecognitionConfiguration
  rendering: TRendererConfiguration
  smartGuide: {
    enable: boolean
  }
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TCanvasTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TPenStyle
  penStyleClasses?: string
  theme: TTheme

  constructor(configuration?: TPartialDeep<TInteractiveInkSSRCanvasConfiguration>) {
    const { server, recognition } = new WebSocketSSRClientConfiguration(configuration)
    this.server = server
    this.recognition = recognition

    this.rendering = mergeDeep<TRendererConfiguration>(
      {},
      DefaultInteractiveInkSSRCanvasConfiguration.rendering,
      configuration?.rendering
    )
    this.smartGuide = mergeDeep<InteractiveInkSSRCanvasConfiguration["smartGuide"]>(
      {},
      DefaultInteractiveInkSSRCanvasConfiguration.smartGuide,
      configuration?.smartGuide
    )
    this["undo-redo"] = mergeDeep<THistoryConfiguration>(
      {},
      DefaultInteractiveInkSSRCanvasConfiguration["undo-redo"],
      configuration?.["undo-redo"]
    )
    this.grabber = mergeDeep<TGrabberConfiguration>(
      {},
      DefaultInteractiveInkSSRCanvasConfiguration.grabber,
      configuration?.grabber
    )
    this.triggers = mergeDeep<TCanvasTriggerConfiguration>(
      {},
      DefaultInteractiveInkSSRCanvasConfiguration.triggers,
      configuration?.triggers
    )
    this.logger = mergeDeep<TLoggerConfiguration>(
      {},
      DefaultInteractiveInkSSRCanvasConfiguration.logger,
      configuration?.logger
    )
    this.penStyle = mergeDeep<TPenStyle>(
      {},
      DefaultInteractiveInkSSRCanvasConfiguration.penStyle,
      configuration?.penStyle
    )
    this.penStyleClasses = configuration?.penStyleClasses || this.penStyleClasses
    this.theme = mergeDeep<TTheme>({}, DefaultInteractiveInkSSRCanvasConfiguration.theme, configuration?.theme)

    if (this.recognition.type !== "TEXT") {
      this.smartGuide.enable = false
    }
    if (this.smartGuide.enable && !this.recognition.text.mimeTypes.includes("application/vnd.myscript.jiix")) {
      this.recognition.text.mimeTypes.push("application/vnd.myscript.jiix")
    }
  }
}
