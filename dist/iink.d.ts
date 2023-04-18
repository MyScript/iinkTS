type TListenerConfiguration = {
  capture: boolean
  passive: boolean
}

type TGrabberConfiguration = {
  listenerOptions: TListenerConfiguration
  xyFloatPrecision: number
  timestampFloatPrecision: number
}

interface IGrabber {
  setConfiguration(configuration: TGrabberConfiguration): void

  attach(domElement?: HTMLElement): void

  detach(domElement?: HTMLElement): void

  onPointerDown(evt: PointerEvent, point: TPoint): void

  onPointerMove(evt: PointerEvent, point: TPoint): void

  onPointerUp(evt: PointerEvent, point: TPoint): void
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

type TPartialXYPoint = {
  x: number
  y: number
}

type TPoint$1 = TPartialXYPoint & {
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
type TPenStyle = {
  color?: string
  width?: number
  "-myscript-pen-width"?: number
  "-myscript-pen-fill-style"?: string
  "-myscript-pen-fill-color"?: string
}

type TSymbol = TPenStyle & {
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
  penStyle: TPenStyle
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

/**
 * List all supported MIME types for export.
 * Attention, the MIME types supported depend on the {@link TRecognitionType | type of recognition}
 */
type TExport = {
  /** @hidden */
  [key: string]: TJIIXExport | string | Blob
  /**
   * vnd.myscript.jiix is used for text and raw-content exports
   */
  "application/vnd.myscript.jiix"?: TJIIXExport
  /**
   * text/plain is only use for text export
   */
  "text/plain"? : string
  /**
   * x-latex is only use for math export
   * @see {@link https://katex.org/docs/browser.html | katex} to render
   */
  "application/x-latex"?: string
  /**
   * mathml+xml is only use for math export
   * @see {@link https://www.w3.org/Math/whatIsMathML.html | Mathematical Markup Language}
   */
  "application/mathml+xml"?: string
  /**
   * svg+xml is only use for diagram export
   */
  "image/svg+xml"?: string
  /**
   * vnd.openxmlformats-officedocument.presentationml.presentation is only use for diagram export
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob | Blob}
   */
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"?: Blob
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

  addPoint(stroke: TStroke, point: TPoint$1): void
  addStroke(stroke: TStroke): void
  addStrokeToGroup(stroke: TStroke, strokePenStyle: TPenStyle): void
  extractPendingStrokes(position?: number): TStroke[]
  initCurrentStroke(point: TPoint$1, pointerId: number, pointerType: string, style: TPenStyle, dpi: number = 96): void
  appendToCurrentStroke(point: TPoint$1): void
  endCurrentStroke(point: TPoint$1, penStyle: TPenStyle): void
  extractPendingRecognizedSymbols (position: number = this.positions.lastRenderedPosition + 1): TUpdatePatch[]

  updatePositionSent(position: number = this.model.rawStrokes.length - 1): void
  updatePositionReceived(): void
  updatePositionRendered(position: number = this.model.recognizedSymbols ? this.model.recognizedSymbols.length - 1 : -1): void
  resetPositionRenderer(): void
  resetPositions(): void

  getClone(): IModel

  clear(): void
}

type TCanvasRendererContext = {
  parent: HTMLElement
  renderingCanvas: HTMLCanvasElement
  renderingCanvasContext: CanvasRenderingContext2D
  capturingCanvas: HTMLCanvasElement
  capturingCanvasContext: CanvasRenderingContext2D
}

type TSVGRendererContext = {
  parent: HTMLElement
}

interface IRenderer {
  config: TRenderingConfiguration
  init: (element: HTMLElement) => void
  resize: (model: IModel) => void
  destroy: () => void
}

interface IRecognizer {
  export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  resize(model: IModel): Promise<IModel | never>
  import?(data: Blob, mimeType?: string): Promise<TExport | never>
}

declare class DeferredPromise<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (value: Error) => void;
    isFullFilled: boolean;
    isPending: boolean;
    constructor();
}

type TMathTheme = {
  "font-family": string
}

type TMathSolvedTheme = {
  "font-family": string
  color: string
}

type TTextTheme = {
  "font-family": string,
  "font-size": number
}

type TTheme = {
  ink: TPenStyle
  ".math": TMathTheme
  ".math-solved": TMathSolvedTheme
  ".text": TTextTheme
  [key: string]: unknown
}

type TConvertConfiguration = {
  convertOnDoubleTap: boolean
}

type TEraserConfiguration = {
  "erase-precisely": boolean
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
  mimeTypes: ("text/plain" | "application/vnd.myscript.jiix")[]
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
  mimeTypes: ("application/vnd.myscript.jiix" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "image/svg+xml")[]
  "enable-sub-blocks"?: boolean
  text?: TTextConfConfiguration
  convert?: TDiagramConvertConfiguration
  "session-time"?: number
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
  "bounding-box"?: boolean
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

type TExportConfiguration$1 = {
  "image-resolution"?: number
  image?: TImageConfiguration
  jiix?: TJiixConfiguration
  mathml?: TMathMLExport
}

type TRoundingMode = "half up" | "truncate"

type TAngleUnit = "deg" | "rad"

type TSolverOptions = "algebraic" | "numeric"

type TSolverConfiguration = {
  enable?: boolean
  "fractional-part-digits"?: number
  "decimal-separator"?: string
  "rounding-mode"?: TRoundingMode
  "angle-unit"?: TAngleUnit
  options?: TSolverOptions
}

type TUndoRedoMode = "stroke" | "session"

type TMathUndoRedoConfiguration = {
  mode: TUndoRedoMode
}

type TMathConfiguration = {
  mimeTypes: ("application/x-latex" | "application/mathml+xml" | "application/vnd.myscript.jiix")[]
  solver?: TSolverConfiguration
  margin?: TMarginConfiguration
  "undo-redo"?: TMathUndoRedoConfiguration
  customGrammar?: string
  customGrammarId?: string
  customGrammarContent?: string
  eraser?: TEraserConfiguration
  "session-time"?: number
  "recognition-timeout"?: number
}

type TRecognitionConfiguration$1 = {
  text: boolean
  shape: boolean
}

type TRawContentConfiguration = {
  text?: TTextConfConfiguration
  "session-time"?: number
  recognition?: TRecognitionConfiguration$1
  eraser?: TEraserConfiguration
}

type TDebugConfiguration = {
  "draw-text-boxes": boolean
  "draw-image-boxes": boolean
}

type TRecognitionRendererConfiguration = {
  debug: TDebugConfiguration
}

type TGesture = { enable: boolean }

type TRecognitionType = "TEXT" | "MATH" | "DIAGRAM" | "Raw Content"

type TConverstionState = "DIGITAL_EDIT" | "HANDWRITING"

type TRecognitionConfiguration = {
  convert?: TConvertConfiguration
  type: TRecognitionType
  alwaysConnected: boolean
  lang: string
  math: TMathConfiguration
  text: TTextConfiguration
  diagram: TDiagramConfiguration
  renderer: TRecognitionRendererConfiguration
  export: TExportConfiguration$1
  "raw-content": TRawContentConfiguration
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
  export?: TExportConfiguration$1
  "raw-content"?: TRawContentConfiguration
  gesture?: TGesture
}

interface IBehaviors
{
  grabber: IGrabber
  renderer: IRenderer
  recognizer: IRecognizer
  initialized: DeferredPromise

  async init: (element: HTMLElement) => Promise<void | Error>

  drawCurrentStroke(model: IModel): void

  async updateModelRendering: (model: IModel) => Promise<IModel | never>

  async export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  async convert(model: IModel, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel | never>

  async import?(model: IModel, data: Blob, mimeType?: string): Promise<IModel | never>

  setPenStyle?(penStyle: TPenStyle): void
  setPenStyleClasses?(penStyleClasses: string): void
  setTheme?(theme: TTheme): void

  async resize(model: IModel): Promise<IModel>

  async undo(): Promise<IModel>
  async redo(): Promise<IModel>

  async clear(model: IModel): Promise<IModel>

  async destroy(model: IModel): Promise<void>
}

type TEventConfiguration = {
  processDelay: number
}

type TProtocol = "WEBSOCKET" | "REST"

type TSchene = "https" | "http"

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
  exportContent: "QUIET_PERIOD" | "POINTER_UP" | "DEMAND"
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
  "undo-redo": TUndoRedoConfiguration
}

type TConfigurationClient = {
  server?: TServerConfigurationClient
  recognition?: TRecognitionConfigurationClient
  grabber?: TGrabberConfiguration
  rendering?: TRenderingConfiguration
  triggers?: TTriggerConfiguration
  events?: TEventConfiguration
  "undo-redo"?: TUndoRedoConfiguration
}

type TEditorOptions = {
  configuration: TConfiguration
  behaviors?: IBehaviors
  penStyle?: TPenStyle
  theme?: TTheme
  globalClassCss?: string
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
    Writing = "writing",
    /**
     * @remarks Only available on WEBSOCKET
     */
    Erasing = "erasing"
}
type HTMLEditorElement = HTMLElement & {
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
    /**
     * @remarks Only available in WEBSOCKET
     */
    set mode(m: EditorMode);
    get events(): GlobalEvent;
    get theme(): TTheme;
    set theme(t: TTheme);
    get penStyleClasses(): string;
    set penStyleClasses(psc: string);
    get penStyle(): TPenStyle;
    set penStyle(p: TPenStyle);
    undo(): Promise<IModel>;
    redo(): Promise<IModel>;
    clear(): Promise<IModel>;
    resize(): Promise<IModel>;
    export(mimeTypes?: string[]): Promise<IModel>;
    convert(params?: {
        conversionState?: TConverstionState;
        mimeTypes?: string[];
    }): Promise<IModel | never>;
    import(data: Blob, mimeType?: string): Promise<IModel | never>;
}

declare function getAvailableLanguageList(configuration: TConfigurationClient): Promise<Array<Record<string, string>> | never>;

/**
 * @group Constants
 */
declare const _default: {
    readonly Error: {
        readonly WRONG_CREDENTIALS: "Application credentials are invalid. Please check or regenerate your application key and hmackey.";
        readonly UNKNOW: "An unknown error has occurred.";
        readonly ABNORMAL_CLOSURE: "MyScript recognition server is not reachable. Please reload once you are connected.";
        readonly CANT_ESTABLISH: "Unable to establish a connection to MyScript recognition server. Check the host and your connectivity.";
        readonly GOING_AWAY: "MyScript recognition server is going away, either because of a server failure or because the browser is navigating away from the page that opened the connection.";
        readonly PROTOCOL_ERROR: "MyScript recognition server terminated the connection due to a protocol error.";
        readonly UNSUPPORTED_DATA: "MyScript recognition server terminated the connection because the endpoint received data of a type it cannot accept. (For example, a text-only endpoint received binary data.)";
        readonly INVALID_FRAME_PAULOAD: "MyScript recognition server terminated the connection because a message was received that contained inconsistent data (e.g., non-UTF-8 data within a text message).";
        readonly POLICY_VIOLATION: "MyScript recognition server terminated the connection because it received a message that violates its policy.";
        readonly MESSAGE_TOO_BIG: "MyScript recognition server terminated the connection because a data frame was received that is too large.";
        readonly INTERNAL_ERROR: "MyScript recognition server terminated the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
        readonly SERVICE_RESTART: "MyScript recognition server terminated the connection because it is restarting.";
        readonly TRY_AGAIN: "MyScript recognition server terminated the connection due to a temporary condition, e.g. it is overloaded and is casting off some of its clients.";
        readonly BAD_GATEWAY: "MyScript recognition server was acting as a gateway or proxy and received an invalid response from the upstream server.";
        readonly TLS_HANDSHAKE: "MyScript recognition server connection was closed due to a failure to perform a TLS handshake";
    };
    readonly EventType: {
        /**
         * @event
         * event emitted when history has changed i.e. the context of undo-redo
         */
        readonly CHANGED: "changed";
        /**
         * @event
         * event emitted on click on clear button from the Smartguide
         */
        readonly CLEAR: "clear";
        /**
         * @event
         * event emitted when clearing is complete
         */
        readonly CLEARED: "cleared";
        /**
         * @event
         * event emitted on click on convert button from the Smartguide
         */
        readonly CONVERT: "convert";
        /**
         * @event
         * event emitted after the conversion is complete
         */
        readonly CONVERTED: "converted";
        /**
         * @event
         * event emitted when the editor encounters an error
         */
        readonly ERROR: "error";
        /**
         * @event
         * event emitted after the end of the export
         */
        readonly EXPORTED: "exported";
        /**
         * @event
         * event emitted on click on candidate element from the Smartguide
         */
        readonly IMPORT: "import";
        /**
         * @event
         * event emitted after the end of the import
         */
        readonly IMPORTED: "imported";
        /**
         * @event
         * event emitted when the server is idle after a job
         */
        readonly IDLE: "idle";
        /**
         * @event
         * event emitted after full editor initialization
         */
        readonly LOADED: "loaded";
        /**
         * @event
         * event emitted to notify the user, for example after clicking the Smartguide copy button
         */
        readonly NOTIF: "notif";
        /**
         * @event
         * event emitted after rendering is complete
         */
        readonly RENDERED: "rendered";
    };
    readonly Exports: {
        readonly JIIX: "application/vnd.myscript.jiix";
        readonly TEXT: "text/plain";
        readonly LATEX: "application/x-latex";
        readonly MATHML: "application/mathml+xml";
        readonly SVG: "image/svg+xml";
        readonly OFFICE_DOCUMENT: "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    };
};

declare const DefaultServerConfiguration: TServerConfiguration;
declare const DefaultRecognitionConfiguration: TRecognitionConfiguration;
declare const DefaultGrabberConfiguration: TGrabberConfiguration;
declare const DefaultRenderingConfiguration: TRenderingConfiguration;
declare const DefaultTriggerConfiguration: TTriggerConfiguration;
declare const DefaultEventsConfiguration: TEventConfiguration;
declare const DefaultUndoRedoConfiguration: TUndoRedoConfiguration;
declare const DefaultConfiguration: TConfiguration;

declare class PointerEventGrabber implements IGrabber {
    private configuration;
    private domElement;
    private activePointerId?;
    private prevent;
    onPointerDown: (evt: PointerEvent, point: TPoint$1) => void;
    onPointerMove: (evt: PointerEvent, point: TPoint$1) => void;
    onPointerUp: (evt: PointerEvent, point: TPoint$1) => void;
    constructor(configuration: TGrabberConfiguration);
    private roundFloat;
    private extractPoint;
    private pointerDownHandler;
    private pointerMoveHandler;
    private pointerUpHandler;
    setConfiguration(configuration: TGrabberConfiguration): void;
    attach(domElement: HTMLElement): void;
    detach(): void;
}

declare class CanvasQuadraticStroker {
    private renderArc;
    private renderLine;
    private renderFinal;
    private renderQuadratic;
    private getPointByIndex;
    drawStroke(context2d: CanvasRenderingContext2D, stroke: TStroke): void;
}

declare class CanvasRenderer implements IRenderer {
    config: TRenderingConfiguration;
    stroker: CanvasQuadraticStroker;
    context: TCanvasRendererContext;
    constructor(config: TRenderingConfiguration);
    private createCanvas;
    private resizeContent;
    private drawSymbol;
    init(element: HTMLElement): void;
    drawModel(model: IModel): void;
    drawPendingStroke(stroke: TStroke | undefined): void;
    resize(model: IModel): void;
    destroy(): void;
}

declare abstract class AbstractRecognizer implements IRecognizer {
    protected serverConfiguration: TServerConfiguration;
    protected recognitionConfiguration: TRecognitionConfiguration;
    constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration);
    abstract export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>;
    abstract resize(model: IModel): Promise<IModel | never>;
}

type TRestPostConfiguration = {
  lang: string,
  diagram?: TDiagramConfiguration,
  math?: TMathConfiguration,
  "raw-content"?: TRawContentConfiguration,
  text?: TTextConfiguration,
  export: TExportConfiguration
}

declare class RestRecognizer extends AbstractRecognizer {
    constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration);
    get url(): string;
    get postConfig(): TRestPostConfiguration;
    private buildData;
    private post;
    private tryFetch;
    private getMimeTypes;
    convert(model: IModel, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel | never>;
    private exportModel;
    export(model: IModel, requestedMimeTypes?: string[]): Promise<IModel | never>;
    resize(model: IModel): Promise<IModel | never>;
}

declare class UndoRedoManager {
    context: TUndoRedoContext;
    configuration: TUndoRedoConfiguration;
    constructor(configuration: TUndoRedoConfiguration, model: IModel);
    get globalEvent(): GlobalEvent;
    private updateCanUndoRedo;
    getLastModel(): IModel;
    getModelFromModificationDate(modificationDate: number): IModel;
    addModelToStack(model: IModel): void;
    updateModelInStack(model: IModel): void;
    undo(): IModel;
    redo(): IModel;
    reset(model: IModel): void;
}

declare class RestBehaviors implements IBehaviors {
    #private;
    grabber: PointerEventGrabber;
    renderer: CanvasRenderer;
    recognizer: RestRecognizer;
    undoRedoManager: UndoRedoManager;
    initialized: DeferredPromise<void | Error>;
    constructor(configuration: TConfiguration, model: IModel);
    get globalEvent(): GlobalEvent;
    init(domElement: HTMLElement): Promise<void | Error>;
    drawCurrentStroke(model: IModel): void;
    updateModelRendering(model: IModel): Promise<IModel | never>;
    export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>;
    convert(model: IModel, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel | never>;
    resize(model: IModel): Promise<IModel>;
    undo(): Promise<IModel>;
    redo(): Promise<IModel>;
    clear(model: IModel): Promise<IModel>;
    destroy(model: IModel): Promise<void>;
}

type TWebSocketEvent = {
  type: string
  [key: string]: unknown
}

type TWebSocketPartChangeEvent = TWebSocketEvent & {
  partIdx: number
  partId: string
  partCount: number
}

type TWebSocketContentChangeEvent = TWebSocketEvent & {
  partId: string
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  undoStackIndex: number
  possibleUndoCount: number
}

type TWebSocketExportEvent = TWebSocketEvent & {
  partId: string
  exports: TExport
}

type TUpdatePatchType = "REPLACE_ALL" | "REMOVE_ELEMENT" | "REPLACE_ELEMENT" | "REMOVE_CHILD" | "APPEND_CHILD" | "INSERT_BEFORE" | "REMOVE_ATTRIBUTE" | "SET_ATTRIBUTE"

type TUpdatePatch$1 = {
  type: TUpdatePatchType
}

type TWebSocketSVGPatchEvent = TWebSocketEvent & {
  updates: TUpdatePatch$1[]
  layer: ("MODEL" | "CAPTURE")
}

declare class WSEvent extends EventTarget {
    #private;
    constructor();
    private emit;
    emitInitialized(): void;
    emitConnected(): void;
    emitConnectionActive(): void;
    addConnectionActiveListener(callback: () => void): void;
    emitDisconnected(event: CloseEvent): void;
    addDisconnectedListener(callback: (event: CloseEvent) => void): void;
    emitPartChange(partChange: TWebSocketPartChangeEvent): void;
    addPartChangeListener(callback: (partChange: TWebSocketPartChangeEvent) => void): void;
    emitContentChange(contentChange: TWebSocketContentChangeEvent): void;
    addContentChangeListener(callback: (contentChange: TWebSocketContentChangeEvent) => void): void;
    emitSVGPatch(patchChange: TWebSocketSVGPatchEvent): void;
    addSVGPatchListener(callback: (contentChange: TWebSocketSVGPatchEvent) => void): void;
    emitExported(exports: TWebSocketExportEvent): void;
    addExportListener(callback: (exports: TWebSocketExportEvent) => void): void;
    emitError(err: Error): void;
    addErrorListener(callback: (err: Error) => void): void;
    clearListeners(): void;
}

declare class WSRecognizer extends AbstractRecognizer {
    #private;
    private socket;
    private pingCount;
    private reconnectionCount;
    private sessionId?;
    private currentPartId?;
    private viewSizeHeight;
    private viewSizeWidth;
    private currentErrorCode?;
    wsEvent: WSEvent;
    constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration);
    get url(): string;
    get mimeTypes(): string[];
    private infinitePing;
    private openCallback;
    private closeCallback;
    private manageHMACChallengeMessage;
    private manageContentPackageDescriptionMessage;
    private managePartChangeMessage;
    private manageContentChangeMessage;
    private manageExportMessage;
    private manageSVGPatchMessage;
    private manageErrorMessage;
    private messageCallback;
    init(height: number, width: number): void;
    canReconnect(): boolean;
    addStrokes(model: IModel): void;
    send(message: TWebSocketEvent): void;
    close(code: number, reason: string): void;
    setPenStyle(penStyle: TPenStyle): void;
    setPenStyleClasses(penStyleClasses: string): void;
    setTheme(theme: TTheme): void;
    export(model: IModel, requestedMimeTypes?: string[]): Promise<IModel | never>;
    import(data: Blob, mimeType?: string): Promise<TExport | never>;
    resize(model: IModel): Promise<IModel>;
    convert(conversionState?: TConverstionState): void;
    undo(): void;
    redo(): void;
    clear(): void;
}

declare class SVGQuadraticStroker {
    private getArcPath;
    private getLinePath;
    private getFinalPath;
    private getQuadraticPath;
    private getPointByIndex;
    private buildSVGPath;
    drawStroke(svgElement: SVGElement, stroke: TStroke): void;
    drawErasingStroke(svgElement: SVGElement, stroke: TStroke): void;
}

declare class SVGRenderer implements IRenderer {
    #private;
    config: TRenderingConfiguration;
    stroker: SVGQuadraticStroker;
    context: TSVGRendererContext;
    constructor(config: TRenderingConfiguration);
    init(element: HTMLElement): void;
    updateLayer(layerName: string, update: TUpdatePatch$1): void;
    updatesLayer(layerName: string, updates: TUpdatePatch$1[]): void;
    clearPendingStroke(): void;
    drawPendingStroke(stroke: TStroke): void;
    resize(model: IModel): void;
    destroy(): void;
}

declare class WSBehaviors implements IBehaviors {
    #private;
    grabber: PointerEventGrabber;
    renderer: SVGRenderer;
    recognizer: WSRecognizer;
    undoRedoManager: UndoRedoManager;
    initialized: DeferredPromise<void>;
    constructor(configuration: TConfiguration, model: IModel);
    get globalEvent(): GlobalEvent;
    init(domElement: HTMLElement): Promise<void>;
    private onConnectionActive;
    private onContentChange;
    private onSVGPatch;
    private onError;
    private onExport;
    private onDisconnected;
    setPenStyle(penStyle: TPenStyle): void;
    setPenStyleClasses(penStyleClasses: string): void;
    setTheme(theme: TTheme): void;
    drawCurrentStroke(model: IModel): void;
    updateModelRendering(model: IModel): Promise<IModel | never>;
    export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>;
    convert(model: IModel, conversionState?: TConverstionState): Promise<IModel | never>;
    import(model: IModel, data: Blob, mimeType?: string): Promise<IModel | never>;
    resize(model: IModel): Promise<IModel>;
    undo(): Promise<IModel>;
    redo(): Promise<IModel>;
    clear(model: IModel): Promise<IModel>;
    destroy(): Promise<void>;
}

declare const DefaultPenStyle: TPenStyle;

declare const DefaultTheme: TTheme;

export { _default as Constants, DefaultConfiguration, DefaultEventsConfiguration, DefaultGrabberConfiguration, DefaultPenStyle, DefaultRecognitionConfiguration, DefaultRenderingConfiguration, DefaultServerConfiguration, DefaultTheme, DefaultTriggerConfiguration, DefaultUndoRedoConfiguration, Editor, EditorMode, RestBehaviors, WSBehaviors, getAvailableLanguageList };
//# sourceMappingURL=iink.d.ts.map
