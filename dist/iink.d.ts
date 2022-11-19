import styleInject from '../node_modules/style-inject/dist/style-inject.es.js';

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

var css_248z = "/* @import url(../node_modules/perfect-scrollbar/css/perfect-scrollbar.css); */\n\n.ms-editor {\n    position: relative;\n    z-index: 20;\n    color: #1A9FFF;\n    font-family: sans-serif;\n}\n\n.ms-editor.erasing {\n    cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEsSURBVDiNrdO7SgNBFMbx/3fmCbQ1tunDIayFBvFSKxbxBfSdBPEBtLIWb3Ebl4R9AQWLkE70CWbHZl1Eg2iSr5vL+c1hhhFTMhwOdyX1gQ2gVU+PgTyldNHtdq+/1+jroCiKtpmdSupNO6ApkgZmdtzpdJ5+QGVZ9qqqugSWfkO+5F3SnrvnDVQURTuE8PgP5DNvkjJ3fzaAEMLJDAjAclVVZwCqL/ZqBqSJme2YpMN5EIAYY9+A9XkhST0DVuaFgJYtAAGoDJgsAJoYkM+rSHqwlNL5Ajq6EMBoNLoBtmbsZuDumwYQYzwCXmdw3oAjAAPIsuxF0kG98GdE0r67PzcQgLvnIYQ14P4PyF39WZuH0rRdZVluxxj7kjaA1Xp6nFLKzezc3W+/13wAItdV6XjME1AAAAAASUVORK5CYII=') 10 10, auto;\n}\n\n.ms-editor canvas,\n.ms-editor svg {\n    z-index: 15;\n    position: absolute;\n    left: 0;\n    top: 0;\n    height: 100%;\n    width: 100%;\n}\n\n.ms-editor canvas.ms-rendering-canvas {\n    z-index: 10;\n    pointer-events: none;\n    background-image: linear-gradient(to right, #F5F6F7 1px, transparent 1px),\n    linear-gradient(to bottom, #F5F6F7 1px, transparent 1px);\n    background-size: 18px 18px;\n}\n\n.ms-editor svg {\n    z-index: 10;\n    pointer-events: none;\n}\n.ms-editor svg[data-layer=\"BACKGROUND\"] {\n    z-index: 9;\n}\n\n.ms-editor .loader {\n    z-index: 30;\n    position: absolute;\n    width: 120px;\n    height: 120px;\n    top: calc(50% - 60px);\n    left: calc(50% - 60px);\n    border: 16px solid #F5F6F7;\n    border-radius: 50%;\n    border-top-color: #1A9FFF;\n    -webkit-animation: spin 2s linear infinite;\n    animation: spin 2s linear infinite;\n}\n\n.ms-editor .message {\n    z-index: 25;\n    position: absolute;\n    width: 200px;\n    height: 200px;\n    top: calc(50% - 100px);\n    left: calc(50% - 100px);\n    font-size: 16px;\n    text-align: center;\n    word-wrap: break-word;\n}\n\n.ms-editor .error-msg::before {\n    content: url(\"data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCA3Ni41IDYxMiA0NTkiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiPgogICAgPHBhdGggZmlsbD0iIzFBOUZGRiIgZD0iTTQ5NC43LDIyOS41Yy0xNy44NTEtODYuNy05NC4zNTEtMTUzLTE4OC43LTE1M2MtMzguMjUsMC03My45NSwxMC4yLTEwMiwzMC42bDM4LjI1LDM4LjI1IGMxNy44NS0xMi43NSw0MC44LTE3Ljg1LDYzLjc1LTE3Ljg1Yzc2LjUsMCwxNDAuMjUsNjMuNzUsMTQwLjI1LDE0MC4yNXYxMi43NWgzOC4yNWM0My4zNSwwLDc2LjUsMzMuMTUsNzYuNSw3Ni41IGMwLDI4LjA1LTE1LjMsNTMuNTUtNDAuOCw2Ni4zbDM4LjI1LDM4LjI1QzU5MS42LDQzOC42LDYxMiw0MDAuMzUsNjEyLDM1N0M2MTIsMjkwLjcsNTU4LjQ1LDIzNC42LDQ5NC43LDIyOS41eiBNNzYuNSwxMDkuNjUgbDcxLjQsNjguODVDNjYuMywxODMuNiwwLDI0OS45LDAsMzMxLjVjMCw4NC4xNSw2OC44NSwxNTMsMTUzLDE1M2gyOTguMzVsNTEsNTFsMzMuMTUtMzMuMTVMMTA5LjY1LDc2LjVMNzYuNSwxMDkuNjV6IE0xOTYuMzUsMjI5LjVsMjA0LDIwNEgxNTNjLTU2LjEsMC0xMDItNDUuOS0xMDItMTAyYzAtNTYuMSw0NS45LTEwMiwxMDItMTAySDE5Ni4zNXoiIC8+Cjwvc3ZnPgo=\");\n}\n\n.ms-editor .info-msg::before {\n    content: \"\";\n    background-image: url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgdmlld0JveD0iMCAwIDI0IDI0IgogIGZpbGw9Im5vbmUiCiAgc3Ryb2tlPSIjMUE5RkZGIgogIHN0cm9rZS13aWR0aD0iMiIKICBzdHJva2UtbGluZWNhcD0icm91bmQiCiAgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIKPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIiAvPgogIDxsaW5lIHgxPSIxMiIgeTE9IjE2IiB4Mj0iMTIiIHkyPSIxMiIgLz4KICA8bGluZSB4MT0iMTIiIHkxPSI4IiB4Mj0iMTIuMDEiIHkyPSI4IiAvPgo8L3N2Zz4=\");;\n    background-size: 100% 100%;\n    display: block;\n    margin: auto;\n    padding-bottom: 10px;\n    height: 25px;\n    width:25px;\n}\n\n.ms-editor .smartguide {\n    position: absolute;\n    z-index: 40;\n    font-size: 16px;\n}\n\n.ms-editor .smartguide.smartguide-in {\n    visibility: visible !important;\n    transition: opacity 0.5s;\n    opacity: 1;\n}\n\n.ms-editor .smartguide.smartguide-out {\n    transition: opacity 1s, visibility 1s;\n    visibility: hidden !important;\n    opacity: 0;\n}\n\n.ms-editor .smartguide .tag-icon {\n    padding: 0 18px;\n    border: 1px solid #959DA6;\n    font-weight: bold;\n    font-size: large;\n    -moz-user-select: none;\n    -webkit-user-select: none;\n    -ms-user-select: none;\n    user-select: none;\n    position: absolute;\n    z-index: 31;\n    height: 48px;\n    line-height: 48px;\n    background-color: rgba(255, 255, 255, 0.9);\n    color: #959DA6;\n}\n\n.ms-editor .smartguide .ellipsis {\n    cursor: pointer;\n    border-bottom: 1px solid #959DA6;\n    position: absolute;\n    z-index: 31;\n    height: 48px;\n    line-height: 38px;\n    padding: 0 8px;\n    font-weight: bold;\n    font-size: x-large;\n    background-color: rgba(255, 255, 255, 0.9);\n    color: #959DA6;\n    -moz-user-select: none;\n    -webkit-user-select: none;\n    -ms-user-select: none;\n    user-select: none;\n    -webkit-tap-highlight-color: transparent;\n}\n\n.ms-editor .smartguide .ellipsis:active {\n    background-color: #e0e0e0;\n}\n\n.ms-editor .smartguide .prompter-container {\n    background-color: rgba(255, 255, 255, 0.9);\n    height: 48px;\n    line-height: 48px;\n    overflow: hidden;\n    white-space: nowrap;\n    display: block;\n    text-align: left;\n    border-bottom: 1px solid #959DA6;\n    position: absolute;\n    z-index: 30;\n    color: #bfbfbf;\n    -moz-user-select: none;\n    -webkit-user-select: none;\n    -ms-user-select: none;\n    user-select: none;\n    -webkit-tap-highlight-color: transparent;\n}\n\n.ms-editor .smartguide .prompter-container > div > span {\n    cursor: pointer;\n    display: inline-block;\n}\n\n.ms-editor .smartguide .prompter-container .prompter-text {\n    margin-left: 12px;\n}\n\n.ms-editor .smartguide .prompter-container .prompter-text .added-word {\n    animation: 0.1s linear word-added,\n    3s ease-in-out color-input;\n}\n\n.ms-editor .smartguide .prompter-container .prompter-text .modified-word {\n    animation: 0.1s linear word-modified,\n    3s ease-in-out color-input;\n}\n\n.ms-editor .smartguide .candidates {\n    color: black;\n    flex-direction: column;\n    text-align: center;\n    line-height: 30px;\n    border-radius: 3px;\n    position: absolute;\n    box-shadow: 2px 2px 12px #BDBDBD, -2px 2px 12px #BDBDBD;\n    background-color: #F5F5F5;\n    z-index: 100;\n    -webkit-tap-highlight-color: transparent;\n}\n\n.ms-editor .smartguide .candidates > span {\n    cursor: pointer;\n    padding: 2px 20px;\n}\n\n.ms-editor .smartguide .candidates > span:hover {\n    background-color: #EEEEEE;\n}\n\n.ms-editor .smartguide .candidates > span:active {\n    background-color: #E0E0E0;\n}\n\n.ms-editor .smartguide .candidates .selected-word {\n    font-weight: bold;\n    background-color: #E0E0E0;\n}\n\n.ms-editor .smartguide .more-menu {\n    display: flex;\n    flex-direction: column;\n    margin-right: 12px;\n    line-height: 30px;\n    border-radius: 3px;\n    position: absolute;\n    z-index: 100;\n    box-shadow: 2px 2px 12px #BDBDBD;\n    background-color: #F5F5F5;\n    overflow: hidden;\n    transition: max-height 2s ease-out, opacity 1s, visibility 0.5s linear;\n}\n.ms-editor .smartguide .more-menu.open {\n    max-height: 500px;\n    visibility: visible;\n    opacity: 1;\n}\n.ms-editor .smartguide .more-menu.close {\n    max-height: 0;\n    visibility: hidden;\n    opacity: 0;\n}\n\n.ms-editor .smartguide .more-menu .options-label-button {\n    color: black;\n    font-size: 16px;\n    cursor: pointer;\n    box-sizing: border-box;\n    background: transparent;\n    border: none;\n    padding: 0 24px;\n    margin: 0;\n    height: 40px;\n    outline: none;\n    -webkit-tap-highlight-color: transparent;\n}\n\n.ms-editor .smartguide .more-menu .options-label-button:hover {\n    background-color: #EEEEEE;\n}\n\n.ms-editor .smartguide .more-menu .options-label-button:active {\n    background-color: #E0E0E0;\n}\n\n.ms-editor .ps__rail-x {\n    top: 32px !important;\n}\n\n/** Stroke **/\n\n.ms-editor .removed-stroke {\n    opacity: 0;\n    transition: opacity 0.1s ease-in-out;\n}\n\n.ms-editor .added-stroke {\n    animation: 0.2s opacity-appear;\n}\n\n@keyframes color-input {\n    0% {\n        color: black;\n    }\n    100% {\n        color: #bfbfbf;\n    }\n}\n\n@keyframes word-added {\n    0% {\n        transform: translate(5px, 0);\n    }\n    100% {\n        transform: none;\n    }\n}\n\n@keyframes word-modified {\n    0% {\n        transform: translate(0, 5px);\n    }\n    100% {\n        transform: none;\n    }\n}\n\n@keyframes opacity-appear {\n    0% {\n        opacity: 0;\n    }\n    100% {\n        opacity : 1;\n    }\n}\n\n@keyframes spin {\n    0% {\n        transform: rotate(0deg);\n    }\n    100% {\n        transform: rotate(360deg);\n    }\n}\n\n@-webkit-keyframes spin {\n    0% {\n        -webkit-transform: rotate(0deg);\n    }\n    100% {\n        -webkit-transform: rotate(360deg);\n    }\n}\n";
styleInject(css_248z);

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
    get initialized(): boolean;
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