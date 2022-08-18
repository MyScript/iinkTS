type TEventConfiguration = {
  processDelay: number
}

type TListenerConfiguration = {
  capture: boolean
  passive: boolean
}

type TGrabberConfiguration = {
  listenerOptions: TListenerConfiguration
  xyFloatPrecision: number
  timestampFloatPrecision: number
}

type TConvertConfiguration = {
  convertOnDoubleTap: boolean
}

type TEraserConfiguration = {
  'erase-precisely': boolean
}

type TMarginConfiguration = {
  bottom: number
  left: number
  right: number
  top: number
}

type TGuidesConfiguration = {
  enable: boolean
}

type TTextConfConfiguration = {
  customResources?: string[]
  customLexicon?: string[]
  addLKText?: boolean
}

type TTextConfiguration = {
  mimeTypes: ('text/plain' | 'application/vnd.myscript.jiix')[]
  margin?: TMarginConfiguration
  guides?: TGuidesConfiguration
  configuration?: TTextConfConfiguration
  eraser?: TEraserConfiguration
}

type TDiagramConvertConfiguration = {
  edge?: boolean
  node?: boolean
  text?: boolean
}

type TDiagramConfiguration = {
  mimeTypes: ('application/vnd.myscript.jiix' | 'application/vnd.openxmlformats-officedocument.presentationml.presentation' | 'image/svg+xml')[]
  'enable-sub-blocks'?: boolean
  text?: TTextConfConfiguration
  convert?: TDiagramConvertConfiguration
  'session-time'?: number
  eraser?: TEraserConfiguration
}

type TImageViewportConfiguration = {
  x: number
  y: number
  width: number
  height: number
}

type TImageConfiguration = {
  guides: boolean
  viewport: TImageViewportConfiguration
}

type TJiixConfiguration = {
  'bounding-box'?: boolean
  strokes: boolean
  text?: {
    chars: boolean
    words: boolean
  }
  style?: boolean
}

type TMathMLFlavor = {
  name: string
}

type TMathMLExport = {
  flavor: TMathMLFlavor
}

type TExportConfiguration = {
  'image-resolution'?: number
  image?: TImageConfiguration
  jiix?: TJiixConfiguration
  mathml?: TMathMLExport
}

type TRoundingMode = 'half up' | 'truncate'

type TAngleUnit = 'deg' | 'rad'

type TSolverOptions = 'algebraic' | 'numeric'

type TSolverConfiguration = {
  enable?: boolean
  'fractional-part-digits'?: number
  'decimal-separator'?: string
  'rounding-mode'?: TRoundingMode
  'angle-unit'?: TAngleUnit
  options?: TSolverOptions
}

type TUndoRedoMode = 'stroke' | 'session'

type TUndoRedoConfiguration = {
  mode: TUndoRedoMode
}

type TMathConfiguration = {
  mimeTypes: ('application/x-latex' | 'application/mathml+xml' | 'application/vnd.myscript.jiix')[]
  solver?: TSolverConfiguration
  margin?: TMarginConfiguration
  'undo-redo'?: TUndoRedoConfiguration
  customGrammar?: string
  customGrammarId?: string
  customGrammarContent?: string
  eraser?: TEraserConfiguration
  'session-time'?: number
  'recognition-timeout'?: number
}

type TRecognitionConfiguration$1 = {
  text: boolean
  shape: boolean
}

type TRawContentConfiguration = {
  mimeTypes: ('application/vnd.myscript.jiix')[]
  text?: TTextConfConfiguration
  'session-time'?: number
  recognition?: TRecognitionConfiguration$1
  eraser?: TEraserConfiguration
}

type TDebugConfiguration = {
  'draw-text-boxes': boolean
  'draw-image-boxes': boolean
}

type TRecognitionRendererConfiguration = {
  debug: TDebugConfiguration
}

type TGesture = { enable: boolean }

type TRecognitionConfiguration = {
  convert?: TConvertConfiguration
  type: 'TEXT' | 'MATH' | 'DIAGRAM' | 'Raw Content'
  alwaysConnected: boolean
  lang: string
  replaceMimeTypes: boolean
  math: TMathConfiguration
  text: TTextConfiguration
  diagram: TDiagramConfiguration
  renderer: TRecognitionRendererConfiguration
  export: TExportConfiguration
  rawContent: TRawContentConfiguration
  gesture: TGesture
}

type TRecognitionConfigurationClient = {
  convert?: TConvertConfiguration
  type?: 'TEXT' | 'MATH' | 'DIAGRAM' | 'Raw Content'
  alwaysConnected?: boolean
  lang?: string
  replaceMimeTypes?: boolean
  math?: TMathConfiguration
  text?: TTextConfiguration
  diagram?: TDiagramConfiguration
  renderer?: TRecognitionRendererConfiguration
  export?: TExportConfiguration
  rawContent?: TRawContentConfiguration
  gesture?: TGesture
}

type TSmartGuidesConfiguration = {
  enable: boolean
  fadeOut: {
    enable: boolean
    duration: number
  }
}

type TRenderingConfiguration = {
  minHeight: number
  minWidth: number
  smartGuide: TSmartGuidesConfiguration
}

type TProtocol = 'WEBSOCKET' | 'REST'

type TSchene = 'https' | 'http'

type TServerConfiguration = {
  protocol: TProtocol,
  scheme: TSchene,
  host: string
  applicationKey: string
  hmacKey: string
  useWindowLocation?: boolean
  websocket?: {
    pingEnabled: boolean
    pingDelay: number
    maxPingLostCount: number
    autoReconnect: boolean
    maxRetryCount: number
    fileChunkSize: number
  }
}

type TServerConfigurationClient = {
  protocol?: TProtocol,
  scheme?: TSchene,
  host?: string
  applicationKey?: string
  hmacKey?: string
  useWindowLocation?: boolean
  websocket?: {
    pingEnabled?: boolean
    pingDelay?: number
    maxPingLostCount?: number
    autoReconnect?: boolean
    maxRetryCount?: number
    fileChunkSize?: number
  }
}

/**
 * Configure when the action is triggered.
 * POINTER_UP :   Action is triggered on every PenUP.
 *                This is the recommended mode for CDK V3 WebSocket recognitions.
 * QUIET_PERIOD : Action is triggered after a quiet period in milli-seconds on every pointer up.
 *                The value is set to 2000 for example recognition will be triggered when the user stops writing for 2 seconds.
 *                This is the recommended mode for all REST discoveries.
 * DEMAND :       Action is triggered on external demande
 */
 type TTriggerConfiguration = {
  exportContent: 'QUIET_PERIOD' | 'POINTER_UP' | 'DEMAND'
  exportContentDelay: number
  resizeTriggerDelay: number
}

type TConfiguration = {
  server: TServerConfiguration
  recognition: TRecognitionConfiguration
  grabber: TGrabberConfiguration
  rendering: TRenderingConfiguration
  triggers: TTriggerConfiguration
  events: TEventConfiguration
}

type TConfigurationClient = {
  server?: TServerConfigurationClient
  recognition?: TRecognitionConfigurationClient
  grabber?: TGrabberConfiguration
  rendering?: TRenderingConfiguration
  triggers?: TTriggerConfiguration
  events?: TEventConfiguration
}

type TEditorOptions = {
  configuration: TConfiguration
  behaviors?: any
  penStyle?: any
  theme?: any
  globalClassCss?: string
}

declare class Editor {
    private wrapperHTML;
    private _configuration;
    constructor(wrapperHTML: HTMLElement, options?: TEditorOptions);
    get configuration(): TConfiguration;
    set configuration(config: TConfigurationClient);
}

declare function getAvailableLanguageList(configuration: TConfiguration): Promise<Array<Record<string, string>> | never>;

export { Editor, getAvailableLanguageList };
//# sourceMappingURL=iink.d.ts.map
