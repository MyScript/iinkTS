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

type TMathUndoRedoConfiguration = {
  mode: TUndoRedoMode
}

type TMathConfiguration = {
  mimeTypes: ('application/x-latex' | 'application/mathml+xml' | 'application/vnd.myscript.jiix')[]
  solver?: TSolverConfiguration
  margin?: TMarginConfiguration
  'undo-redo'?: TMathUndoRedoConfiguration
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

type TRecognitionType = 'TEXT' | 'MATH' | 'DIAGRAM' | 'Raw Content'

type TConverstionState = 'DIGITAL_EDIT' | 'HANDWRITING'

type TRecognitionConfiguration = {
  convert?: TConvertConfiguration
  type: TRecognitionType
  alwaysConnected: boolean
  lang: string
  math: TMathConfiguration
  text: TTextConfiguration
  diagram: TDiagramConfiguration
  renderer: TRecognitionRendererConfiguration
  export: TExportConfiguration
  'raw-content': TRawContentConfiguration
  gesture: TGesture
}

type TRecognitionConfigurationClient = {
  convert?: TConvertConfiguration
  type?: TRecognitionType
  alwaysConnected?: boolean
  lang?: string
  math?: TMathConfiguration
  text?: TTextConfiguration
  diagram?: TDiagramConfiguration
  renderer?: TRecognitionRendererConfiguration
  export?: TExportConfiguration
  'raw-content'?: TRawContentConfiguration
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
  websocket: {
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
 *                The value is set to 1000 for example recognition will be triggered when the user stops writing for 1 seconds.
 *                This is the recommended mode for all REST discoveries.
 * DEMAND :       Action is triggered on external demande
 */
 type TTriggerConfiguration = {
  exportContent: 'QUIET_PERIOD' | 'POINTER_UP' | 'DEMAND'
  exportContentDelay: number
  resizeTriggerDelay: number
}

type TUndoRedoConfiguration = {
  maxStackSize: number
}

type TConfiguration = {
  server: TServerConfiguration
  recognition: TRecognitionConfiguration
  grabber: TGrabberConfiguration
  rendering: TRenderingConfiguration
  triggers: TTriggerConfiguration
  events: TEventConfiguration
  'undo-redo': TUndoRedoConfiguration
}

type TConfigurationClient = {
  server?: TServerConfigurationClient
  recognition?: TRecognitionConfigurationClient
  grabber?: TGrabberConfiguration
  rendering?: TRenderingConfiguration
  triggers?: TTriggerConfiguration
  events?: TEventConfiguration
  'undo-redo'?: TUndoRedoConfiguration
}

type TEditorOptions = {
  configuration: TConfiguration
  behaviors?: IBehaviors
  penStyle?: TPenStyle
  theme?: TTheme
  globalClassCss?: string
}

type TPartialXYPoint = {
  x: number
  y: number
}

type TPoint = TPartialXYPoint & {
  t: number
  p: number
}

/**
 * @typedef {Object} PenStyle
 * @property {String} color=#000000 Color (supported formats rgb() rgba() hsl() hsla() #rgb #rgba #rrggbb #rrggbbaa)
 * @property {String} -myscript-pen-width=1 Width of strokes and primitives in mm (no other unit is supported yet)
 * @property {String} -myscript-pen-fill-style=none
 * @property {String} -myscript-pen-fill-color=#FFFFFF00 Color filled inside the area delimited by strokes and primitives
 */
type TPenStyle$1 = {
  color?: string
  width?: number
  '-myscript-pen-width'?: number
  '-myscript-pen-fill-style'?: string
  '-myscript-pen-fill-color'?: string
}

type TSymbol = TPenStyle$1 & {
  elementType?: string
  type: string
}

type TStrokeJSON = {
  pointerType: string
  x: number[]
  y: number[]
  t: number[]
  p: number[]
}

type TStroke = TSymbol & TStrokeJSON & {
  id?: string
  pointerId: number
  l: number[]
}

type TStrokeGroup = {
  penStyle: TPenStyle$1
  strokes: TStroke[]
}

type TRecognitionPositions = {
  lastSentPosition: number
  lastReceivedPosition: number
  lastRenderedPosition: number
}

type TWordExport = {
  id?: string
  label: string,
  candidates?: string[]
}

type TJIIXExport = {
  id: string,
  label: string,
  version: string,
  words: TWordExport[]
}

type TExport = {
  // // TEXT | Raw Content
  'application/vnd.myscript.jiix'?: TJIIXExport
  // // TEXT
  'text/plain'? : string
  // // MATH
  'application/x-latex'?: string
  'application/mathml+xml'?: string
  // // DIAGRAM
  'image/svg+xml'?: string
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'?: Blob
  [key: string]: TJIIXExport | string | Blob
}

interface IModel
{
  readonly creationTime: number
  modificationDate: number
  currentStroke?: TStroke
  strokeGroups: TStrokeGroup[]
  positions: TRecognitionPositions
  defaultSymbols: TStroke[]
  rawStrokes: TStroke[]
  recognizedSymbols?: TUpdatePatch[]
  converts?: TExport
  exports?: TExport
  width: number
  height: number
  idle: boolean
  isEmpty: boolean

  addPoint(stroke: TStroke, point: TPoint): void
  addStroke(stroke: TStroke): void
  addStrokeToGroup(stroke: TStroke, strokePenStyle: TPenStyle$1): void
  extractPendingStrokes(position?: number): TStroke[]
  initCurrentStroke(point: TPoint, pointerId: number, pointerType: string, style: TPenStyle$1, dpi: number = 96): void
  appendToCurrentStroke(point: TPoint): void
  endCurrentStroke(point: TPoint, penStyle: TPenStyle$1): void
  extractPendingRecognizedSymbols (position: number = this.positions.lastRenderedPosition + 1): TUpdatePatch[]

  updatePositionSent(position: number = this.model.rawStrokes.length - 1): void
  updatePositionReceived(): void
  updatePositionRendered(position: number = this.model.recognizedSymbols ? this.model.recognizedSymbols.length - 1 : -1): void
  resetPositionRenderer(): void
  resetPositions(): void

  getClone(): IModel

  clear(): void
}

type TMathTheme = {
  'font-family': string
}

type TMathSolvedTheme = {
  'font-family': string
  color: string
}

type TTextTheme = {
  'font-family': string,
  'font-size': number
}

type TTheme$1 = {
  ink: TPenStyle$1
  '.math': TMathTheme
  '.math-solved': TMathSolvedTheme
  '.text': TTextTheme
  [key: string]: unknown
}

type TUndoRedoContext = {
  canUndo: boolean
  canRedo: boolean
  stackIndex: number
  stack: IModel[]
}

declare class GlobalEvent extends EventTarget {
    #private;
    private constructor();
    static getInstance(): GlobalEvent;
    emitLoaded(): void;
    emitExported(exports: TExport): void;
    emitChange(undoRedoContext: TUndoRedoContext): void;
    emitIdle(model: IModel): void;
    emitError(err: Error): void;
    emitNotif(message: string, timeout?: number): void;
    emitClear(): void;
    emitCleared(model?: IModel): void;
    emitConvert(): void;
    emitConverted(exports: TExport): void;
    emitImport(jiix: string | TJIIXExport, mimeType: string): void;
    emitImported(jiix: TJIIXExport): void;
}

declare enum EditorMode {
    Mouse = "mouse",
    Pen = "pen",
    Touche = "touch",
    Eraser = "eraser"
}
declare type HTMLEditorElement = HTMLElement & {
    editor: Editor;
};
declare class Editor {
    #private;
    wrapperHTML: HTMLEditorElement;
    model: IModel;
    debug: boolean;
    constructor(wrapperHTML: HTMLElement, options?: TEditorOptions);
    get initializationPromise(): Promise<boolean>;
    get configuration(): TConfiguration;
    set configuration(config: TConfigurationClient);
    get mode(): EditorMode;
    get events(): GlobalEvent;
    get theme(): TTheme$1;
    set theme(t: TTheme$1);
    get penStyleClasses(): string;
    set penStyleClasses(psc: string);
    get penStyle(): TPenStyle$1;
    set penStyle(p: TPenStyle$1);
    setMode(mode: EditorMode): void;
    undo(): Promise<IModel>;
    redo(): Promise<IModel>;
    clear(): Promise<IModel>;
    resize(): Promise<IModel>;
    export(mimeTypes: string[]): Promise<IModel>;
    convert(params?: {
        conversionState?: TConverstionState;
        mimeTypes?: string[];
    }): Promise<IModel | never>;
    import(data: Blob, mimeType?: string): Promise<IModel | never>;
}

declare function getAvailableLanguageList(configuration?: TConfigurationClient): Promise<Array<Record<string, string>> | never>;

export { Editor, getAvailableLanguageList };
//# sourceMappingURL=iink.d.ts.map
