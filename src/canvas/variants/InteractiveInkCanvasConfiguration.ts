import type {
  TRecognitionWebSocketConfiguration,
  TServerWebsocketConfiguration,
  TWebSocketClientConfiguration,
} from "@/client"
import { DefaultWebSocketClientConfiguration, WebSocketClientConfiguration } from "@/client"
import type { TPartialDeep } from "@/core"
import { mergeDeep } from "@/core"
import type { TGrabberConfiguration } from "@/grabber"
import { DefaultGrabberConfiguration } from "@/grabber"
import type { THistoryConfiguration } from "@/history"
import { DefaultHistoryConfiguration } from "@/history"
import type { TLoggerConfiguration } from "@/logger"
import { DefaultLoggerConfiguration } from "@/logger"
import type {
  TConnectorConfiguration,
  TGestureConfiguration,
  TMathConfig,
  TOverlayConfig,
  TSelectionConfig,
  TSnapConfiguration,
} from "@/manager"
import {
  ConnectorConfiguration,
  DefaultConnectorConfiguration,
  DefaultGestureConfiguration,
  DefaultOverlayConfig,
  DefaultSelectionConfig,
  DefaultSnapConfiguration,
  SnapConfiguration,
} from "@/manager"
import type { TMenuConfiguration } from "@/menu"
import { DefaultMenuConfiguration } from "@/menu"
import type { TIIRendererConfiguration } from "@/renderer"
import { DefaultIIRendererConfiguration } from "@/renderer"
import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"

import type { TCanvasConfiguration } from "../AbstractCanvas"
/**
 * @group Canvas
 */
export type TInteractiveInkCanvasConfiguration = TCanvasConfiguration &
  TWebSocketClientConfiguration & {
    "undo-redo": THistoryConfiguration
    rendering: TIIRendererConfiguration
    grabber: TGrabberConfiguration
    menu: TMenuConfiguration
    penStyle: TStyle
    fontStyle: {
      size: number | "auto"
      weight: "bold" | "normal" | "auto"
    }
    gesture: TGestureConfiguration
    snap: TSnapConfiguration
    /** Whether moving/resizing/rotating a connected shape reshapes its anchored edges to follow it */
    connector: TConnectorConfiguration
    overlays: TOverlayConfig
    selection: TSelectionConfig
    /** Math manager configuration (computation behavior and visual interactions) */
    math: TMathConfig
    /** CSS custom property overrides applied to the canvas root element (e.g. `{ "--ms-ink-primary": "#ff0" }`) */
    cssVars?: Record<string, string>
  }

/**
 * @group Canvas
 * @source
 */
export const DefaultInteractiveInkCanvasConfiguration: TInteractiveInkCanvasConfiguration = {
  server: DefaultWebSocketClientConfiguration.server,
  recognition: DefaultWebSocketClientConfiguration.recognition,
  menu: DefaultMenuConfiguration,
  rendering: DefaultIIRendererConfiguration,
  logger: DefaultLoggerConfiguration,
  grabber: DefaultGrabberConfiguration,
  "undo-redo": DefaultHistoryConfiguration,

  penStyle: DefaultStyle,
  fontStyle: {
    size: "auto",
    weight: "auto",
  },
  gesture: DefaultGestureConfiguration,
  snap: DefaultSnapConfiguration,
  connector: DefaultConnectorConfiguration,
  overlays: DefaultOverlayConfig,
  selection: DefaultSelectionConfig,
  math: {},
  cssVars: undefined,
}

/**
 * @group Canvas
 */
export class InteractiveInkCanvasConfiguration implements TInteractiveInkCanvasConfiguration {
  grabber: TGrabberConfiguration
  logger: TLoggerConfiguration
  server: TServerWebsocketConfiguration
  recognition: TRecognitionWebSocketConfiguration
  rendering: TIIRendererConfiguration
  "undo-redo": THistoryConfiguration
  menu: TMenuConfiguration

  penStyle: TStyle
  fontStyle: {
    size: number | "auto"
    weight: "bold" | "normal" | "auto"
  }
  gesture: TGestureConfiguration
  snap: TSnapConfiguration
  connector: TConnectorConfiguration
  overlays: TOverlayConfig
  selection: TSelectionConfig
  math: TMathConfig
  cssVars?: Record<string, string>

  constructor(configuration?: TPartialDeep<TInteractiveInkCanvasConfiguration>) {
    const { server, recognition } = new WebSocketClientConfiguration(configuration)
    this.recognition = recognition
    this.server = server

    this.grabber = mergeDeep<TGrabberConfiguration>(
      {},
      DefaultInteractiveInkCanvasConfiguration.grabber,
      configuration?.grabber
    )
    this.logger = mergeDeep<TLoggerConfiguration>(
      {},
      DefaultInteractiveInkCanvasConfiguration.logger,
      configuration?.logger
    )
    this.rendering = mergeDeep<TIIRendererConfiguration>(
      {},
      DefaultInteractiveInkCanvasConfiguration.rendering,
      configuration?.rendering
    )
    this["undo-redo"] = mergeDeep<THistoryConfiguration>(
      {},
      DefaultInteractiveInkCanvasConfiguration["undo-redo"],
      configuration?.["undo-redo"]
    )
    this.menu = mergeDeep<TMenuConfiguration>({}, DefaultInteractiveInkCanvasConfiguration.menu, configuration?.menu)
    if (configuration?.menu?.style) {
      if (configuration.menu.style.colors) {
        this.menu.style.colors = configuration.menu.style.colors.filter((color): color is string => color !== undefined)
      }
      if (configuration.menu.style.thicknessList) {
        this.menu.style.thicknessList = configuration.menu.style.thicknessList.filter(
          (
            item
          ): item is {
            label: string
            value: number
          } => item !== undefined
        )
      }
      if (configuration.menu.style.fontSizeList) {
        this.menu.style.fontSizeList = configuration.menu.style.fontSizeList.filter(
          (
            item
          ): item is {
            label: string
            value: "auto" | number
          } => item !== undefined
        )
      }
      if (configuration.menu.style.fontWeightList) {
        this.menu.style.fontWeightList = configuration.menu.style.fontWeightList.filter(
          (
            item
          ): item is {
            label: string
            value: "auto" | "normal" | "bold"
          } => item !== undefined
        )
      }
      this.menu.style.strokeColor = configuration.menu.style.strokeColor ?? this.menu.style.strokeColor
      this.menu.style.fillColor = configuration.menu.style.fillColor ?? this.menu.style.fillColor
      this.menu.style.thickness = configuration.menu.style.thickness ?? this.menu.style.thickness
      this.menu.style.fontSize = configuration.menu.style.fontSize ?? this.menu.style.fontSize
      this.menu.style.fontWeight = configuration.menu.style.fontWeight ?? this.menu.style.fontWeight
      this.menu.style.opacity = configuration.menu.style.opacity ?? this.menu.style.opacity
    }
    this.gesture = mergeDeep<TGestureConfiguration>(
      {},
      DefaultInteractiveInkCanvasConfiguration.gesture,
      configuration?.gesture
    )
    this.snap = new SnapConfiguration(configuration?.snap)
    this.connector = new ConnectorConfiguration(configuration?.connector)
    this.overlays = mergeDeep<TOverlayConfig>({}, DefaultOverlayConfig, configuration?.overlays)

    this.penStyle = mergeDeep<TStyle>({}, DefaultInteractiveInkCanvasConfiguration.penStyle, configuration?.penStyle)
    this.fontStyle = mergeDeep<InteractiveInkCanvasConfiguration["fontStyle"]>(
      {},
      DefaultInteractiveInkCanvasConfiguration.fontStyle,
      configuration?.fontStyle
    )
    this.selection = mergeDeep<TSelectionConfig>({}, DefaultSelectionConfig, configuration?.selection)
    this.math = mergeDeep<TMathConfig>({}, DefaultInteractiveInkCanvasConfiguration.math, configuration?.math)
    this.cssVars = configuration?.cssVars as Record<string, string> | undefined
  }
}
