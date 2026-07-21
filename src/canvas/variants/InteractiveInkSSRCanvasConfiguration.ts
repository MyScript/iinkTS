import type { TCanvasConfiguration } from "@/canvas/AbstractCanvas"
import type { TCanvasTriggerConfiguration } from "@/canvas/CanvasTriggerConfiguration"
import { DefaultCanvasTriggerConfiguration } from "@/canvas/CanvasTriggerConfiguration"
import type {
  TServerWebsocketConfiguration,
  TWebSocketSSRClientConfiguration,
  TWebSocketSSRClientRecognitionConfiguration,
} from "@/client"
import { DefaultWebSocketSSRClientConfiguration, WebSocketSSRClientConfiguration } from "@/client"
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

    this.rendering = mergeDeep({}, DefaultInteractiveInkSSRCanvasConfiguration.rendering, configuration?.rendering)
    this.smartGuide = mergeDeep({}, DefaultInteractiveInkSSRCanvasConfiguration.smartGuide, configuration?.smartGuide)
    this["undo-redo"] = mergeDeep(
      {},
      DefaultInteractiveInkSSRCanvasConfiguration["undo-redo"],
      configuration?.["undo-redo"]
    )
    this.grabber = mergeDeep({}, DefaultInteractiveInkSSRCanvasConfiguration.grabber, configuration?.grabber)
    this.triggers = mergeDeep({}, DefaultInteractiveInkSSRCanvasConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultInteractiveInkSSRCanvasConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultInteractiveInkSSRCanvasConfiguration.penStyle, configuration?.penStyle)
    this.penStyleClasses = configuration?.penStyleClasses || this.penStyleClasses
    this.theme = mergeDeep({}, DefaultInteractiveInkSSRCanvasConfiguration.theme, configuration?.theme)

    if (this.recognition.type !== "TEXT") {
      this.smartGuide.enable = false
    }
    if (this.smartGuide.enable && !this.recognition.text.mimeTypes.includes("application/vnd.myscript.jiix")) {
      this.recognition.text.mimeTypes.push("application/vnd.myscript.jiix")
    }
  }
}
