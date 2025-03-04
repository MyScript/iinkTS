import { EditorTool, SELECTION_MARGIN } from "../Constants"
import { JIIXEdgeKind, JIIXELementType, JIIXNodeKind, IIModel, TExport, TJIIXStrokeItem } from "../model"
import
{
  Box,
  EdgeKind,
  IIDecorator,
  TIIEdge,
  IIEdgeArc,
  IIEdgeLine,
  IIEdgePolyLine,
  TIIShape,
  IIShapeCircle,
  IIShapeEllipse,
  IIShapePolygon,
  IIStroke,
  IIRecognizedText,
  IISymbolGroup,
  IIText,
  ShapeKind,
  SymbolType,
  TIISymbol,
  convertPartialStrokesToOIStrokes,
  TIIRecognized,
  IIRecognizedLine,
  IIRecognizedPolyLine,
  IIRecognizedArc,
} from "../symbol"
import { RecognizerWebSocket } from "../recognizer"
import { SVGRenderer, SVGBuilder, TIIRendererConfiguration } from "../renderer"
import { TStyle } from "../style"
import
{
  IIConversionManager,
  IIWriteManager,
  IISelectionManager,
  IIResizeManager,
  IIRotationManager,
  IITranslateManager,
  IITextManager,
  IIEraseManager,
  IIDebugSVGManager,
  IIMoveManager,
} from "../manager"
import { RecognizedKind, IIRecognizedCircle, IIRecognizedEllipse, IIRecognizedPolygon } from "../symbol"
import { IIHistoryManager, TIIHistoryBackendChanges, TIIHistoryChanges, THistoryContext } from "../history"
import { PartialDeep, convertMillimeterToPixel, mergeDeep } from "../utils"
import { IIMenuAction, IIMenuManager, IIMenuStyle, IIMenuTool } from "../menu"
import { AbstractEditor, EditorOptionsBase } from "./AbstractEditor"
import { InteractiveInkEditorConfiguration, TInteractiveInkEditorConfiguration } from "./InteractiveInkEditorConfiguration"
import { IIGestureManager } from "../gesture"
import { IISnapManager } from "../snap"

/**
 * @group Editor
 */
export type TInteractiveInkEditorOptions = PartialDeep<EditorOptionsBase &
  {
    configuration: TInteractiveInkEditorConfiguration
  }> &
  {
    override?: {
      recognizer?: RecognizerWebSocket
      menu?: {
        style?: IIMenuStyle
        tool?: IIMenuTool
        action?: IIMenuAction
      }
    }
  }
/**
 * @group Editor
 */
export class InteractiveInkEditor extends AbstractEditor
{
  #configuration: InteractiveInkEditorConfiguration
  #model: IIModel
  #tool: EditorTool = EditorTool.Write
  #layerUITimer?: ReturnType<typeof setTimeout>
  #recognizeStrokeTimer?: ReturnType<typeof setTimeout>

  renderer: SVGRenderer
  recognizer: RecognizerWebSocket

  #penStyle: TStyle

  history: IIHistoryManager
  writer: IIWriteManager
  eraser: IIEraseManager
  gesture: IIGestureManager
  resizer: IIResizeManager
  rotator: IIRotationManager
  translator: IITranslateManager
  converter: IIConversionManager
  texter: IITextManager
  selector: IISelectionManager
  svgDebugger: IIDebugSVGManager
  snaps: IISnapManager
  move: IIMoveManager
  menu: IIMenuManager

  constructor(rootElement: HTMLElement, options?: TInteractiveInkEditorOptions)
  {
    super(rootElement, options)

    this.#configuration = new InteractiveInkEditorConfiguration(options?.configuration)
    this.#penStyle = Object.assign({}, this.#configuration.penStyle)

    if (options?.override?.recognizer) {
      const CustomRecognizer = options?.override.recognizer as unknown as typeof RecognizerWebSocket
      this.recognizer = new CustomRecognizer(this.#configuration)
    }
    else {
      this.recognizer = new RecognizerWebSocket(this.#configuration)
    }
    this.recognizer.event.addErrorListener(this.manageError.bind(this))
    this.recognizer.event.addExportedListener(this.event.emitExported.bind(this.event))
    this.recognizer.event.addContentChangedListener(this.onContentChanged.bind(this))
    this.recognizer.event.addSessionOpenedListener(this.event.emitSessionOpened.bind(this.event))
    this.recognizer.event.addEndInitialization(this.layers.hideMessageModal.bind(this.layers))
    this.recognizer.event.addIdleListener(this.updateLayerState.bind(this))

    this.renderer = new SVGRenderer(this.#configuration.rendering)

    this.history = new IIHistoryManager(this.#configuration["undo-redo"], this.event)

    this.writer = new IIWriteManager(this)
    this.eraser = new IIEraseManager(this)
    this.selector = new IISelectionManager(this)
    this.move = new IIMoveManager(this)

    this.gesture = new IIGestureManager(this, this.#configuration.gesture)
    this.resizer = new IIResizeManager(this)
    this.rotator = new IIRotationManager(this)
    this.translator = new IITranslateManager(this)
    this.converter = new IIConversionManager(this)
    this.texter = new IITextManager(this)
    this.svgDebugger = new IIDebugSVGManager(this)
    this.snaps = new IISnapManager(this, this.#configuration.snap)
    this.menu = new IIMenuManager(this, options?.override?.menu)

    this.#model = new IIModel(this.#configuration.rendering.minWidth, this.#configuration.rendering.minHeight, this.configuration.rendering.guides.gap)
  }

  get initializationPromise(): Promise<void>
  {
    return this.recognizer.initialized.promise
  }

  //#region Properties
  get tool(): EditorTool
  {
    return this.#tool
  }
  set tool(i: EditorTool)
  {
    this.#tool = i
    this.menu.tool.update()
    this.setCursorStyle()
    this.unselectAll()

    this.eraser.detach()
    this.selector.detach()
    this.move.detach()
    this.writer.detach()
    switch (this.#tool) {
      case EditorTool.Erase:
        this.eraser.attach(this.layers.rendering)
        break
      case EditorTool.Select:
        this.selector.attach(this.layers.rendering)
        break
      case EditorTool.Move:
        this.move.attach(this.layers.rendering)
        break
      default:
        this.writer.attach(this.layers.rendering)
        break
    }
    this.event.emitToolChanged(i)
  }

  get model(): IIModel
  {
    return this.#model
  }

  get configuration(): InteractiveInkEditorConfiguration
  {
    return this.#configuration
  }
  set renderingConfiguration(renderingConfiguration: TIIRendererConfiguration)
  {
    this.configuration.rendering = mergeDeep(this.configuration.rendering, renderingConfiguration)
    const height = Math.max(this.renderer.parent.clientHeight, this.configuration.rendering.minHeight)
    const width = Math.max(this.renderer.parent.clientWidth, this.configuration.rendering.minWidth)
    this.renderer.resize(height, width)
    this.model.rowHeight = this.configuration.rendering.guides.gap
    this.history.stack.forEach(i => i.model.rowHeight = this.model.rowHeight)
    this.event.emitUIpdated()
  }
  //#endregion

  //#region Style
  get penStyle(): TStyle
  {
    return this.#penStyle
  }
  set penStyle(penStyle: PartialDeep<TStyle>)
  {
    this.logger.info("set penStyle", { penStyle })
    this.#penStyle = Object.assign({}, this.#penStyle, penStyle)
  }
  //#endregion

  protected updateLayerState(idle: boolean): void
  {
    this.event.emitIdle(idle)
    this.layers.updateState(idle)
  }

  updateLayerUI(timeout: number = 500): void
  {
    clearTimeout(this.#layerUITimer)
    this.#layerUITimer = setTimeout(() =>
    {
      this.menu.update()
      this.svgDebugger.apply()
      this.waitForIdle()
      this.event.emitUIpdated()
    }, timeout)
  }

  manageError(error: Error): void
  {
    this.layers.showMessageError(error)
    this.event.emitError(error)
  }

  protected setCursorStyle(): void
  {
    switch (this.#tool) {
      case EditorTool.Erase:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.add("erase")
        this.layers.root.classList.remove("select")
        this.layers.root.classList.remove("move")
        break
      case EditorTool.Select:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.remove("erase")
        this.layers.root.classList.add("select")
        this.layers.root.classList.remove("move")
        break
      case EditorTool.Move:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.remove("erase")
        this.layers.root.classList.remove("select")
        this.layers.root.classList.add("move")
        break
      default:
        this.layers.root.classList.add("draw")
        this.layers.root.classList.remove("erase")
        this.layers.root.classList.remove("select")
        this.layers.root.classList.remove("move")
        break
    }
  }

  protected async onContentChanged(undoRedoContext: THistoryContext): Promise<void>
  {
    clearTimeout(this.#recognizeStrokeTimer)
    this.#recognizeStrokeTimer = setTimeout(async () =>
    {
      await this.synchronizeStrokesWithJIIX()
      this.updateLayerUI(0)
      this.event.emitChanged(undoRedoContext)
    }, 500)
  }

  async initialize(): Promise<void>
  {
    try {
      this.logger.info("initialize")
      this.layers.render()
      this.layers.showLoader()
      this.tool = EditorTool.Write
      this.renderer.init(this.layers.rendering)
      this.menu.render(this.layers.ui.root)

      const compStyles = window.getComputedStyle(this.layers.root)
      this.model.width = Math.max(parseInt(compStyles.width.replace("px", "")), this.#configuration.rendering.minWidth)
      this.model.height = Math.max(parseInt(compStyles.height.replace("px", "")), this.#configuration.rendering.minHeight)
      this.model.rowHeight = this.configuration.rendering.guides.gap
      this.history.init(this.model)

      if(!this.recognizer.configuration.server.version) {
        await this.loadInfo(this.configuration.server)
        this.recognizer.configuration.server.version = this.info!.version
      }
      await this.recognizer.init()
    } catch (error) {
      this.logger.error("initialize", error)
      this.layers.showMessageError(error as Error)
      throw error
    }
    finally {
      this.logger.debug("initialize", "finally")
      this.layers.hideLoader()
      this.layers.updateState(true)
    }
  }

  async changeLanguage(code: string): Promise<void>
  {
    try {
      this.logger.info("changeLanguage", { code })
      this.updateLayerState(false)
      this.configuration.recognition.lang = code
      await this.recognizer.newSession(this.configuration)
      this.recognizer.addStrokes(this.extractStrokesFromSymbols(this.model.symbols), false)
      await this.synchronizeStrokesWithJIIX(true)
      this.layers.hideLoader()
      this.event.emitLoaded()
    }
    catch (error) {
      this.logger.error("changeLanguage", error)
      this.manageError(error as Error)
      throw error
    }
    finally {
      this.updateLayerUI()
    }
  }

  protected buildShape(partialShape: PartialDeep<TIIShape>): TIIShape
  {
    switch (partialShape.kind) {
      case ShapeKind.Circle:
        return IIShapeCircle.create(partialShape as PartialDeep<IIShapeCircle>)
      case ShapeKind.Ellipse:
        return IIShapeEllipse.create(partialShape as PartialDeep<IIShapeEllipse>)
      case ShapeKind.Polygon:
        return IIShapePolygon.create(partialShape as PartialDeep<IIShapePolygon>)
      default:
        throw new Error(`Unable to create shape, kind: "${ partialShape.kind }" is unknown`)
    }
  }

  protected buildEdge(partialEdge: PartialDeep<TIIEdge>): TIIEdge
  {
    switch (partialEdge.kind) {
      case EdgeKind.Arc:
        return IIEdgeArc.create(partialEdge as PartialDeep<IIEdgeArc>)
      case EdgeKind.Line:
        return IIEdgeLine.create(partialEdge as PartialDeep<IIEdgeLine>)
      case EdgeKind.PolyEdge:
        return IIEdgePolyLine.create(partialEdge as PartialDeep<IIEdgePolyLine>)
      default:
        throw new Error(`Unable to create edge, kind: "${ partialEdge.kind }" is unknown`)
    }
  }

  protected buildRecognized(partialSymbol: PartialDeep<TIIRecognized>): TIIRecognized
  {
    switch (partialSymbol.kind) {
      case RecognizedKind.Text:
        return IIRecognizedText.create(partialSymbol)
      case RecognizedKind.Arc:
        return IIRecognizedArc.create(partialSymbol)
      case RecognizedKind.Circle:
        return IIRecognizedCircle.create(partialSymbol)
      case RecognizedKind.Ellipse:
        return IIRecognizedEllipse.create(partialSymbol)
      case RecognizedKind.Polygone:
        return IIRecognizedPolygon.create(partialSymbol)
      case RecognizedKind.Line:
        return IIRecognizedLine.create(partialSymbol)
      case RecognizedKind.PolyEdge:
        return IIRecognizedPolyLine.create(partialSymbol)
      default:
        throw new Error(`Unable to create recognized, symbol type '${ JSON.stringify(partialSymbol) } is unknow`)
    }
  }

  protected buildGroup(partialGroup: PartialDeep<IISymbolGroup>): IISymbolGroup
  {
    if (!partialGroup.children?.length) {
      throw new Error(`Unable to create group, no children`)
    }

    const children = partialGroup.children.map(partialSymbol =>
    {
      switch (partialSymbol?.type) {
        case SymbolType.Stroke:
          return IIStroke.create(partialSymbol as PartialDeep<IIStroke>)
        case SymbolType.Shape:
          return this.buildShape(partialSymbol as PartialDeep<TIIShape>)
        case SymbolType.Edge:
          return this.buildEdge(partialSymbol as PartialDeep<TIIEdge>)
        case SymbolType.Text:
          return IIText.create(partialSymbol as PartialDeep<IIText>)
        case SymbolType.Group:
          return this.buildGroup(partialSymbol as PartialDeep<IISymbolGroup>)
        case SymbolType.Recognized:
          return this.buildRecognized(partialSymbol as PartialDeep<TIIRecognized>)
        default:
          throw new Error(`Unable to create group, symbol type '${ JSON.stringify(partialSymbol) } is unknow`)
      }
    })
    const group = new IISymbolGroup(children, partialGroup.style)
    if (partialGroup.id) {
      group.id = partialGroup.id
    }
    if (partialGroup.decorators) {
      group.decorators = partialGroup.decorators.map(d => new IIDecorator(d!.kind!, d!.style as TStyle))
    }
    return group
  }

  protected buildStroke(partialSymbol: PartialDeep<IIStroke>): IIStroke
  {
    return IIStroke.create(partialSymbol as PartialDeep<IIStroke>)
  }

  protected buildStrokeText(partialSymbol: PartialDeep<IIRecognizedText>): IIRecognizedText
  {
    return IIRecognizedText.create(partialSymbol as PartialDeep<IIRecognizedText>)
  }

  protected buildText(partialSymbol: PartialDeep<IIText>): IIText
  {
    return IIText.create(partialSymbol as PartialDeep<IIText>)
  }

  protected buildSymbol(partialSymbol: PartialDeep<TIISymbol>): TIISymbol
  {
    try {
      switch (partialSymbol.type) {
        case SymbolType.Stroke:
          return this.buildStroke(partialSymbol)
        case SymbolType.Shape:
          return this.buildShape(partialSymbol)
        case SymbolType.Edge:
          return this.buildEdge(partialSymbol)
        case SymbolType.Text:
          return this.buildText(partialSymbol)
        case SymbolType.Group:
          return this.buildGroup(partialSymbol)
        case SymbolType.Recognized:
          return this.buildRecognized(partialSymbol as PartialDeep<TIIRecognized>)
        default:
          throw new Error(`Unable to build symbol, type: "${ partialSymbol.type }" is unknown`)
      }
    }
    catch (error) {
      this.logger.error("createSymbol", error)
      this.manageError(error as Error)
      throw error
    }
  }

  async createSymbol(partialSymbol: PartialDeep<TIISymbol>): Promise<TIISymbol>
  {
    try {
      return await this.addSymbol(this.buildSymbol(partialSymbol))
    }
    catch (error) {
      this.logger.error("createSymbol", error)
      this.manageError(error as Error)
      throw error
    }
    finally {
      this.updateLayerUI()
    }
  }

  async createSymbols(partialSymbols: PartialDeep<TIISymbol>[]): Promise<TIISymbol[]>
  {
    try {
      const errors: string[] = []
      const symbols: TIISymbol[] = []
      partialSymbols.forEach(partialSymbol =>
      {
        try {
          symbols.push(this.buildSymbol(partialSymbol))
        } catch (error) {
          errors.push(((error as Error).message || error) as string)
        }
      })
      if (errors.length) {
        throw new Error(errors.join("\n"))
      }
      return await this.addSymbols(symbols)
    } catch (error) {
      this.logger.error("createSymbols", error)
      this.manageError(error as Error)
      throw error
    }
  }

  /** @hidden */
  protected updateTextBounds(symbol: TIISymbol): void
  {
    if (symbol.type === SymbolType.Text) {
      this.texter.updateBounds(symbol)
    }
    else if (symbol.type === SymbolType.Group) {
      symbol.extractText().forEach(t => this.texter.updateBounds(t))
    }
  }

  /** @hidden */
  async addSymbol(sym: TIISymbol, addToHistory = true): Promise<TIISymbol>
  {
    this.logger.info("addSymbol", { sym })
    this.updateLayerState(false)
    this.updateTextBounds(sym)
    this.model.addSymbol(sym)
    this.renderer.drawSymbol(sym)

    const strokes = this.extractStrokesFromSymbols([sym])
    this.recognizer.addStrokes(strokes, false)

    if (addToHistory) {
      this.history.push(this.model, { added: [sym] })
    }
    this.updateLayerUI()
    return sym
  }

  /** @hidden */
  async addSymbols(symList: TIISymbol[], addToHistory = true): Promise<TIISymbol[]>
  {
    this.logger.info("addSymbol", { symList })
    this.updateLayerState(false)
    symList.forEach(s =>
    {
      this.updateTextBounds(s)
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    const strokes = this.extractStrokesFromSymbols(symList)
    this.recognizer.addStrokes(strokes, false)
    if (addToHistory) {
      this.history.push(this.model, { added: symList })
    }
    this.updateLayerUI()
    return symList
  }

  async updateSymbol(sym: TIISymbol, addToHistory = true): Promise<TIISymbol>
  {
    this.logger.info("updateSymbol", { sym })
    this.updateLayerState(false)
    this.updateTextBounds(sym)
    this.model.updateSymbol(sym)
    this.renderer.drawSymbol(sym)
    const strokes = this.extractStrokesFromSymbols([sym])
    this.recognizer.replaceStrokes(strokes.map(s => s.id), strokes)
    if (addToHistory) {
      this.history.push(this.model, { updated: [sym] })
    }
    this.updateLayerUI()
    return sym
  }

  async updateSymbols(symList: TIISymbol[], addToHistory = true): Promise<TIISymbol[]>
  {
    this.logger.info("updateSymbol", { symList })
    this.updateLayerState(false)
    symList.forEach(s =>
    {
      this.updateTextBounds(s)
      this.model.updateSymbol(s)
      this.renderer.drawSymbol(s)
    })
    const strokes = this.extractStrokesFromSymbols(symList)
    this.recognizer.replaceStrokes(strokes.map(s => s.id), strokes)
    if (addToHistory) {
      this.history.push(this.model, { updated: symList })
    }
    this.updateLayerUI()
    return symList
  }

  updateSymbolsStyle(symbolIds: string[], style: PartialDeep<TStyle>, addToHistory = true): void
  {
    this.logger.info("updateSymbolsStyle", { symbolIds, style })
    const symbols: TIISymbol[] = []
    this.model.symbols.forEach(s =>
    {
      if (symbolIds.includes(s.id)) {
        s.style = Object.assign({}, s.style, style)
        if (
          SymbolType.Text === s.type ||
          SymbolType.Group === s.type ||
          SymbolType.Recognized === s.type) {
          s.updateChildrenStyle()
        }
        this.renderer.drawSymbol(s)
        this.model.updateSymbol(s)
        s.modificationDate = Date.now()
        symbols.push(s)
      }
    })
    if (symbols.length) {
      symbols.forEach(s =>
      {
        if (s.type === SymbolType.Text) {
          const lastWidth = s.bounds.width
          this.texter.updateBounds(s)
          const tx = s.bounds.width - lastWidth
          if (tx !== 0) {
            this.texter.moveTextAfter(s, tx)
          }
        }
      })
    }
    if (addToHistory && symbols.length) {
      this.history.push(this.model, { style: { symbols, style } })
    }
  }

  updateTextFontStyle(textIds: string[], { fontSize, fontWeight }: { fontSize?: number, fontWeight?: "normal" | "bold" | "auto" }): void
  {
    this.logger.info("updateTextFontStyle", { textIds, fontSize, fontWeight })
    const symbols: (IIText | IISymbolGroup)[] = []
    const translate: { symbols: TIISymbol[], tx: number, ty: number }[] = []
    this.model.symbols.forEach(s =>
    {
      if (textIds.includes(s.id)) {
        if (s.type === SymbolType.Text) {
          s.updateChildrenFont({ fontSize, fontWeight: fontWeight === "auto" ? undefined : fontWeight })
          const lastWidth = s.bounds.width
          this.texter.updateBounds(s)
          this.renderer.drawSymbol(s)
          const tx = s.bounds.width - lastWidth
          if (tx !== 0) {
            const symbolsTranslated = this.texter.moveTextAfter(s, tx)
            if (symbolsTranslated?.length) {
              translate.push({
                symbols: symbolsTranslated,
                tx,
                ty: 0
              })
            }
          }
          s.modificationDate = Date.now()
          symbols.push(s)
        }
        else if (s.type === SymbolType.Group) {
          const textChildren = s.extractText()
          if (textChildren.length) {
            textChildren.forEach(text =>
            {
              text.updateChildrenFont({ fontSize, fontWeight: fontWeight === "auto" ? undefined : fontWeight })
              const lastWidth = s.bounds.width
              this.texter.updateBounds(text)
              const tx = s.bounds.width - lastWidth
              const symbolsTranslated = this.texter.moveTextAfter(text, tx)
              if (symbolsTranslated?.length) {
                translate.push({
                  symbols: symbolsTranslated,
                  tx,
                  ty: 0
                })
              }
            })
            s.modificationDate = Date.now()
            this.renderer.drawSymbol(s)
            symbols.push(s)
          }

        }
      }
    })
    if (symbols.length) {
      this.history.push(this.model, { style: { symbols, fontSize }, translate })
    }
  }

  async replaceSymbols(oldSymbols: TIISymbol[], newSymbols: TIISymbol[], addToHistory = true): Promise<void>
  {
    this.logger.info("replaceSymbol", { oldSymbols, newSymbols })
    this.updateLayerState(false)

    const oldStrokes = this.extractStrokesFromSymbols(oldSymbols)
    const newStrokes = this.extractStrokesFromSymbols(newSymbols)

    const symToReplace = oldSymbols.shift()

    if (symToReplace) {
      oldSymbols.forEach(s =>
      {
        this.renderer.removeSymbol(s.id)
        this.model.removeSymbol(s.id)
      })

      this.model.replaceSymbol(symToReplace.id, newSymbols)
      this.renderer.replaceSymbol(symToReplace.id, newSymbols)


      if (oldStrokes.length && newStrokes.length) {
        this.recognizer.replaceStrokes(oldStrokes.map(s => s.id), newStrokes)
      }
      else if (oldStrokes.length) {
        this.recognizer.eraseStrokes(oldStrokes.map(s => s.id))
      }
      else {
        this.recognizer.addStrokes(newStrokes, false)
      }

      if (addToHistory) {
        this.history.push(this.model, { replaced: { oldSymbols, newSymbols } })
      }
      this.updateLayerUI()
    }
  }

  changeOrderSymbol(symbol: TIISymbol, position: "first" | "last" | "forward" | "backward"): void
  {
    this.model.changeOrderSymbol(symbol.id, position)
    this.renderer.changeOrderSymbol(symbol, position)
    this.history.push(this.model, { order: { symbols: [symbol], position } })
  }

  changeOrderSymbols(symbols: TIISymbol[], position: "first" | "last" | "forward" | "backward")
  {
    symbols.forEach(s =>
    {
      this.model.changeOrderSymbol(s.id, position)
      this.renderer.changeOrderSymbol(s, position)
    })
    this.history.push(this.model, { order: { symbols, position } })
  }

  groupSymbols(symbols: TIISymbol[]): IISymbolGroup
  {
    const group = this.buildGroup({ children: symbols })
    symbols.forEach(s =>
    {
      this.model.removeSymbol(s.id)
      this.renderer.removeSymbol(s.id)
    })
    this.model.addSymbol(group)
    this.history.push(this.model, { group: { symbols } })
    return group
  }

  ungroupSymbol(group: IISymbolGroup): TIISymbol[]
  {
    group.children.forEach(s => this.renderer.drawSymbol(s))
    this.renderer.removeSymbol(group.id)
    this.model.replaceSymbol(group.id, group.children)
    this.history.push(this.model, { ungroup: { group } })
    return group.children
  }

  async synchronizeStrokesWithJIIX(force: boolean = false): Promise<void>
  {
    //if there is no stroke, jiix should not have changed
    const strokes = this.model.symbols.filter(s => s.type === SymbolType.Stroke)
    if (!force && !strokes.length) {
      this.event.emitSynchronized()
      return
    }
    await this.export(["application/vnd.myscript.jiix"])

    const getSymbolsAndStrokesAssociatedFromJIIXStrokeItems = (items: TJIIXStrokeItem[] = []): { symbols: TIISymbol[], strokes: IIStroke[] } =>
    {
      const symbols: TIISymbol[] = []
      const strokes: IIStroke[] = []
      const strokeIdsUsed: string[] = []
      items.forEach(i =>
      {
        const strokeId = i["full-id"]!
        if (strokeIdsUsed.includes(strokeId)) {
          return
        }
        strokeIdsUsed.push(strokeId)
        const sym = this.model.getRootSymbol(strokeId)
        if (sym) {
          switch (sym?.type) {
            // we do not modify a group created by the user
            // case SymbolType.Group:
            //   strokes.push(...sym.extractStrokes())
            //   break
            case SymbolType.Recognized:
              // if it's recognized symbol with same number of strokes
              // the recognition has been already done
              // if (sym.strokes.length === items.length) {
              //   return
              // }
              strokes.push(sym.strokes.find(s => s.id === i["full-id"]!)!)
              break
            default:
              strokes.push(sym as IIStroke)
              break
          }
          const symIdx = symbols.findIndex(s => s.id === sym.id)
          if (symIdx < 0) {
            symbols.push(sym)
          }
          else {
            symbols[symIdx] = sym
          }
        }
      })
      return {
        symbols,
        strokes
      }
    }

    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    jiix?.elements?.forEach(el =>
    {
      switch (el.type) {
        case JIIXELementType.Text: {
          el.words?.forEach(w =>
          {
            const jiixAssociation = getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(w.items)
            if (jiixAssociation.strokes.length) {
              if (jiixAssociation.symbols.length === 1) {
                const symAsso = jiixAssociation.symbols[0]
                if (
                  symAsso.type === SymbolType.Recognized && symAsso.kind === RecognizedKind.Text &&
                  symAsso.label === w.label &&
                  symAsso.strokes.length === symAsso.strokes.length
                ) {
                  return
                }
              }
              const line = el.lines!.find(l => l["first-char"]! <= w["first-char"]! && l["last-char"]! >= w["last-char"]!)!
              const recognizedText = new IIRecognizedText(jiixAssociation.strokes, { baseline: convertMillimeterToPixel(line["baseline-y"]), xHeight: convertMillimeterToPixel(line["x-height"]) })
              recognizedText.label = w.label
              jiixAssociation.symbols.forEach(sym =>
              {
                if (sym.type === SymbolType.Recognized && sym.kind === RecognizedKind.Text) {
                  sym.decorators.forEach(d =>
                  {
                    if (!recognizedText.decorators.some(wd => wd.kind === d.kind)) {
                      recognizedText.decorators.push(d)
                    }
                  })
                }
                this.model.removeSymbol(sym.id)
                this.renderer.removeSymbol(sym.id)
              })
              this.model.addSymbol(recognizedText)
              this.renderer.drawSymbol(recognizedText)
            }
          })
          break
        }
        case JIIXELementType.Node: {
          let symbolRecognized: TIIRecognized | undefined
          const jiixAssociation = getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(el.items)
          if (jiixAssociation.strokes.length) {
            if (jiixAssociation.symbols.length === 1) {
              const symAsso = jiixAssociation.symbols[0]
              if (symAsso.type === SymbolType.Recognized &&
                symAsso.strokes.length === jiixAssociation.strokes.length) {
                return
              }
            }
            switch (el.kind) {
              case JIIXNodeKind.Circle: {
                symbolRecognized = new IIRecognizedCircle(jiixAssociation.strokes)
                break
              }
              case JIIXNodeKind.Ellipse: {
                symbolRecognized = new IIRecognizedEllipse(jiixAssociation.strokes)
                break
              }
              case JIIXNodeKind.Rectangle:
              case JIIXNodeKind.Triangle:
              case JIIXNodeKind.Parallelogram:
              case JIIXNodeKind.Polygon:
              case JIIXNodeKind.Rhombus: {
                symbolRecognized = new IIRecognizedPolygon(jiixAssociation.strokes)
                break
              }
              default:
                this.logger.warn("synchronizeStrokesWithJIIX", `Can not create recognized shape symbol, kind unknow: ${ el }`)
                break
            }
            if (symbolRecognized) {
              jiixAssociation.symbols.forEach(sym =>
              {
                this.model.removeSymbol(sym.id)
                this.renderer.removeSymbol(sym.id)
              })
              this.model.addSymbol(symbolRecognized)
              this.renderer.drawSymbol(symbolRecognized)
            }
          }
          break
        }
        case JIIXELementType.Edge: {
          let symbolRecognized: TIIRecognized | undefined
          const jiixAssociation = getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(el.kind === JIIXEdgeKind.PolyEdge ? el.edges.flatMap(e => e.items!) : el.items)
          if (jiixAssociation.strokes.length) {
            if (jiixAssociation.symbols.length === 1) {
              const symAsso = jiixAssociation.symbols[0]
              if (symAsso.type === SymbolType.Recognized &&
                symAsso.strokes.length === jiixAssociation.strokes.length) {
                return
              }
            }
            switch (el.kind) {
              case JIIXEdgeKind.Line: {
                symbolRecognized = new IIRecognizedLine(jiixAssociation.strokes)
                break
              }
              case JIIXEdgeKind.PolyEdge: {
                symbolRecognized = new IIRecognizedPolyLine(jiixAssociation.strokes)
                break
              }
              case JIIXEdgeKind.Arc: {
                symbolRecognized = new IIRecognizedArc(jiixAssociation.strokes)
                break
              }
              default:
                this.logger.warn("synchronizeStrokesWithJIIX", `Can not create recognized edge symbol, kind unknow: ${ el }`)
                break
            }
            if (symbolRecognized) {
              jiixAssociation.symbols.forEach(sym =>
              {
                this.model.removeSymbol(sym.id)
                this.renderer.removeSymbol(sym.id)
              })
              this.model.addSymbol(symbolRecognized)
              this.renderer.drawSymbol(symbolRecognized)
            }
          }
          break
        }
        default:
          this.logger.warn("synchronizeStrokesWithJIIX", `Can not create recognized symbol, type unknow: ${ el }`)
          break
      }
    })
    // because model.export is emptied when you change symbols
    this.model.mergeExport({ "application/vnd.myscript.jiix": jiix })
    this.history.update(this.model)
    this.event.emitSynchronized()
  }

  async removeSymbol(id: string, addToHistory = true): Promise<void>
  {
    this.logger.info("removeSymbol", { id })
    const symbol = this.model.getRootSymbol(id)
    if (symbol) {
      this.updateLayerState(false)
      if (symbol.type === SymbolType.Group) {
        const groupStrokeIds = symbol.extractStrokes().map(s => s.id)
        symbol.removeChilds([id])
        if (symbol.children.length) {
          this.model.updateSymbol(symbol)
          this.renderer.drawSymbol(symbol)
          if (groupStrokeIds.includes(id)) {
            this.recognizer.eraseStrokes([id])
          }
        }
        else {
          this.recognizer.eraseStrokes(groupStrokeIds)
          this.model.removeSymbol(symbol.id)
          this.renderer.removeSymbol(symbol.id)
        }
      }
      else {
        this.recognizer.eraseStrokes([id])
        this.model.removeSymbol(symbol.id)
        this.renderer.removeSymbol(symbol.id)
      }
      if (addToHistory) {
        this.history.push(this.model, { erased: [symbol] })
      }
      this.updateLayerUI()
    }
    else {
      this.renderer.removeSymbol(id)
      this.recognizer.eraseStrokes([id])
    }
  }

  async removeSymbols(ids: string[], addToHistory = true): Promise<TIISymbol[]>
  {
    this.logger.info("removeSymbol", { ids })
    const symbolsToRemove: TIISymbol[] = []
    const symbolsToUpdate: TIISymbol[] = []
    const strokesIds: string[] = []
    ids.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym) {
        /** we remove root element */
        if (sym.id === id) {
          symbolsToRemove.push(sym)
          switch (sym.type) {
            case SymbolType.Stroke:
              strokesIds.push(sym.id)
              break
            case SymbolType.Recognized:
              strokesIds.push(...sym.strokes.map(s => s.id))
              break
            case SymbolType.Group:
              strokesIds.push(...sym.extractStrokes().map(s => s.id))
              break
          }
        }
        else {
          /** we want to remove child */
          switch (sym.type) {
            case SymbolType.Group: {
              const gr = sym.clone()
              strokesIds.push(...gr.extractStrokes().map(s => s.id).filter(id => ids.includes(id)))
              gr.removeChilds(ids)
              if (gr.children.length) {
                symbolsToUpdate.push(gr)
              }
              else {
                symbolsToRemove.push(gr)
              }
              break
            }
            case SymbolType.Recognized: {
              strokesIds.push(id)
              const ws = sym.clone()
              ws.removeStrokes(ids)
              if (ws.strokes.length) {
                symbolsToUpdate.push(ws)
              }
              else {
                symbolsToRemove.push(ws)
              }
              break
            }
          }

        }
      }
    })
    this.recognizer.eraseStrokes(strokesIds)
    symbolsToRemove.forEach(s =>
    {
      this.model.removeSymbol(s.id)
      this.renderer.removeSymbol(s.id)
    })

    symbolsToUpdate.forEach(s =>
    {
      this.model.updateSymbol(s)
      this.renderer.drawSymbol(s)
    })


    if (addToHistory) {
      const changes: TIIHistoryChanges = {}
      if (symbolsToRemove.length || symbolsToUpdate.length) {
        if (symbolsToRemove.length) {
          changes.erased = symbolsToRemove
        }
        if (symbolsToUpdate.length) {
          changes.updated = symbolsToUpdate
        }
        this.history.push(this.model, changes)
        this.updateLayerUI()
      }
    }
    this.updateLayerState(false)
    return symbolsToRemove
  }

  select(ids: string[]): void
  {
    this.selector.removeSelectedGroup()
    this.model.symbols.forEach(s =>
    {
      s.selected = ids.includes(s.id)
      this.renderer.drawSymbol(s)
    })
    this.selector.drawSelectedGroup(this.model.symbolsSelected)
    this.updateLayerUI()
    this.event.emitSelected(this.model.symbolsSelected)
  }

  selectAll(): void
  {
    this.selector.removeSelectedGroup()
    this.model.symbols.forEach(s =>
    {
      s.selected = true
      this.renderer.drawSymbol(s)
    })
    this.selector.drawSelectedGroup(this.model.symbolsSelected)
    this.updateLayerUI()
    this.event.emitSelected(this.model.symbolsSelected)
  }

  unselectAll(): void
  {
    if (this.model.symbolsSelected.length) {
      this.model.symbolsSelected.forEach(s =>
      {
        s.selected = false
        this.renderer.drawSymbol(s)
      })
      this.selector.removeSelectedGroup()
      this.updateLayerUI()
      this.event.emitSelected(this.model.symbolsSelected)
    }
  }

  async importPointEvents(partialStrokes: PartialDeep<IIStroke>[]): Promise<IIModel>
  {
    this.logger.info("importPointEvents", { partialStrokes })
    this.updateLayerState(false)
    const strokes = convertPartialStrokesToOIStrokes(partialStrokes)
    strokes.forEach(s =>
    {
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    this.recognizer.addStrokes(strokes, false)
    this.history.push(this.model, { added: strokes })
    this.logger.debug("importPointEvents", this.model)
    this.updateLayerUI()
    this.event.emitImported(this.model.exports as TExport)
    return this.model
  }

  protected triggerDownload(fileName: string, urlData: string): void
  {
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", urlData)
    downloadAnchorNode.setAttribute("download", fileName)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  getSymbolsBounds(symbols: TIISymbol[], margin: number = SELECTION_MARGIN): Box
  {
    const box = Box.createFromBoxes(symbols.map(s => s.bounds))
    box.x -= margin
    box.y -= margin
    box.width += margin * 2
    box.height += margin * 2
    return box
  }

  protected buildBlobFromSymbols(symbols: TIISymbol[], box: Box): Blob
  {
    const svgNode = SVGBuilder.createLayer(box)
    symbols.forEach(s =>
    {
      const el = this.renderer.getElementById(s.id)?.cloneNode(true)
      if (el) {
        svgNode.appendChild(el)
      }
    })

    const svgString = (new XMLSerializer()).serializeToString(svgNode)

    return new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8"
    })
  }

  protected getExportName(extension: string): string
  {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }
    try {
      return `iink-ts-${ new Date().toLocaleDateString(navigator.language, options) }.${ extension }`
    }
    catch {
      return `iink-ts-${ new Date().toLocaleDateString("en-US", options) }.${ extension }`
    }
  }

  downloadAsSVG(selection = false)
  {
    const symbols = selection ? this.model.symbolsSelected : this.model.symbols
    const box = this.getSymbolsBounds(symbols)
    const svgBlob = this.buildBlobFromSymbols(symbols, box)
    const url = URL.createObjectURL(svgBlob)
    this.triggerDownload(this.getExportName("svg"), url)
  }

  downloadAsPNG(selection = false)
  {
    const symbols = selection ? this.model.symbolsSelected : this.model.symbols
    const box = this.getSymbolsBounds(symbols)
    const svgBlob = this.buildBlobFromSymbols(symbols, box)

    const url = URL.createObjectURL(svgBlob)
    const image = new Image(box.width, box.height)
    image.src = url
    image.onload = () =>
    {
      const canvas = document.createElement("canvas")
      canvas.width = image.width
      canvas.height = image.height

      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
      ctx.drawImage(image, 0, 0)
      URL.revokeObjectURL(url)

      const imgURI = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream")

      this.triggerDownload(this.getExportName("png"), imgURI)
    }
  }

  downloadAsJson(selection = false)
  {
    const symbolsToExport = selection ? this.model.symbolsSelected : this.model.symbols
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(symbolsToExport, null, 2))
    this.triggerDownload(this.getExportName("json"), dataStr)
  }

  extractStrokesFromSymbols(symbols: TIISymbol[] | undefined): IIStroke[]
  {
    if (!symbols?.length) return []
    const strokes: IIStroke[] = []
    symbols.forEach(s =>
    {
      switch (s.type) {
        case SymbolType.Stroke:
          strokes.push(s)
          break
        case SymbolType.Recognized:
          strokes.push(...s.strokes)
          break
        case SymbolType.Group:
          strokes.push(...s.extractStrokes())
          break
      }
    })
    return strokes
  }

  extractTextsFromSymbols(symbols: TIISymbol[] | undefined): IIText[]
  {
    if (!symbols?.length) return []
    const texts: IIText[] = []
    symbols.forEach(s =>
    {
      switch (s.type) {
        case SymbolType.Text:
          texts.push(s)
          break
        case SymbolType.Group:
          texts.push(...s.extractText())
          break
      }
    })
    return texts
  }

  protected extractBackendChanges(changes: TIIHistoryChanges): TIIHistoryBackendChanges
  {
    const backendChanges: TIIHistoryBackendChanges = {}
    backendChanges.added = this.extractStrokesFromSymbols(changes.added)
    backendChanges.erased = this.extractStrokesFromSymbols(changes.erased)

    const updated = this.extractStrokesFromSymbols(changes.updated)

    const oldStrokes = updated.concat(this.extractStrokesFromSymbols(changes.replaced?.oldSymbols))
    const newStrokes = updated.concat(this.extractStrokesFromSymbols(changes.replaced?.newSymbols))
    if (oldStrokes.length && newStrokes.length) {
      backendChanges.replaced = {
        oldStrokes,
        newStrokes
      }
    }
    else {
      backendChanges.added.push(...newStrokes)
      backendChanges.erased.push(...oldStrokes)
    }

    if (changes.matrix) {
      backendChanges.matrix = {
        strokes: this.extractStrokesFromSymbols(changes.matrix.symbols),
        matrix: changes.matrix.matrix,
      }
    }

    if (changes.translate?.length) {
      backendChanges.translate = []
      changes.translate.forEach(tr =>
      {
        const strokes = this.extractStrokesFromSymbols(tr.symbols)
        if (strokes.length) {
          backendChanges.translate!.push({
            strokes,
            tx: tr.tx,
            ty: tr.ty
          })
        }
      })
    }
    if (changes.scale?.length) {
      backendChanges.scale = []
      changes.scale.forEach(tr =>
      {
        const strokes = this.extractStrokesFromSymbols(tr.symbols)
        if (strokes.length) {
          backendChanges.scale!.push({
            strokes,
            origin: tr.origin,
            scaleX: tr.scaleX,
            scaleY: tr.scaleY
          })
        }
      })
    }
    if (changes.rotate?.length) {
      backendChanges.rotate = []
      changes.rotate.forEach(tr =>
      {
        const strokes = this.extractStrokesFromSymbols(tr.symbols)
        if (strokes.length) {
          backendChanges.rotate!.push({
            strokes,
            center: tr.center,
            angle: tr.angle
          })
        }
      })
    }
    return backendChanges
  }

  async undo(): Promise<IIModel>
  {
    this.logger.info("undo")
    if (this.history.context.canUndo) {
      this.updateLayerState(false)
      this.unselectAll()
      const previousStackItem = this.history.undo()
      const modifications = previousStackItem.model.extractDifferenceSymbols(this.model)
      this.#model = previousStackItem.model.clone()
      this.logger.debug("undo", { previousStackItem })
      const actionsToBackend = this.extractBackendChanges(previousStackItem.changes)
      modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
      modifications.added.forEach(s => this.renderer.drawSymbol(s))
      if (
        actionsToBackend.added?.length ||
        actionsToBackend.erased?.length ||
        actionsToBackend.replaced ||
        actionsToBackend.matrix ||
        actionsToBackend.translate?.length ||
        actionsToBackend.scale?.length ||
        actionsToBackend.rotate?.length
      ) {
        await this.recognizer.undo(actionsToBackend)
      }
      this.updateLayerUI()
    }
    return this.model
  }

  async redo(): Promise<IIModel>
  {
    this.logger.info("redo")

    if (this.history.context.canRedo) {
      this.updateLayerState(false)
      this.unselectAll()
      const nextStackItem = this.history.redo()
      const modifications = nextStackItem.model.extractDifferenceSymbols(this.model)
      this.#model = nextStackItem.model.clone()
      this.logger.debug("redo", { modifications })
      const actionsToBackend = this.extractBackendChanges(nextStackItem.changes)
      modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
      modifications.added.forEach(s => this.renderer.drawSymbol(s))
      if (
        actionsToBackend.added?.length ||
        actionsToBackend.erased?.length ||
        actionsToBackend.replaced ||
        actionsToBackend.matrix ||
        actionsToBackend.translate?.length ||
        actionsToBackend.scale?.length ||
        actionsToBackend.rotate?.length
      ) {
        await this.recognizer.redo(actionsToBackend)
      }

      this.updateLayerUI()
    }
    return this.model
  }

  async export(mimeTypes?: string[]): Promise<IIModel>
  {
    try {
      this.logger.info("export", { mimeTypes })
      const exports = await this.recognizer.export(mimeTypes)
      this.model.mergeExport(exports as TExport)
    }
    catch (error) {
      this.logger.error("export", { error })
      this.manageError(error as Error)
      throw error
    }
    return this.model
  }

  async convert(): Promise<void>
  {
    await this.convertSymbols()
  }

  async convertSymbols(symbols?: TIISymbol[]): Promise<void>
  {
    try {
      this.updateLayerState(false)
      await this.converter.apply(symbols)
      this.event.emitConverted(this.model.converts as TExport)
    }
    catch (error) {
      this.logger.error("convert", error)
      this.manageError(error as Error)
      throw error
    }
    finally {
      this.updateLayerUI()
    }
  }

  async waitForIdle(): Promise<void>
  {
    return this.recognizer.waitForIdle()
  }

  async resize({ height, width }: { height?: number, width?: number } = {}): Promise<void>
  {
    try {
      this.logger.info("resize", { height, width })
      const compStyles = window.getComputedStyle(this.layers.root)
      height = height || Math.max(parseInt(compStyles.height.replace("px", "")), this.configuration.rendering.minHeight)
      width = width || Math.max(parseInt(compStyles.width.replace("px", "")), this.configuration.rendering.minWidth)

      this.updateLayerState(false)
      this.model.height = height
      this.model.width = width
      this.renderer.resize(height, width)
      this.updateLayerUI(50)
      this.updateLayerState(true)
    } catch (error) {
      this.manageError(error as Error)
    }
  }

  async clear(): Promise<void>
  {
    try {
      this.logger.info("clear")
      this.updateLayerState(false)
      if (this.model.symbols.length) {
        this.selector.removeSelectedGroup()
        const erased = this.model.symbols
        this.renderer.clear()
        this.model.clear()
        this.history.push(this.model, { erased })
        this.recognizer.clear()
        this.event.emitSelected(this.model.symbolsSelected)
      }
      this.updateLayerUI()
      this.event.emitCleared()
    } catch (error) {
      this.manageError(error as Error)
    }
  }

  async destroy(): Promise<void>
  {
    this.logger.info("destroy")
    this.eraser.detach()
    this.selector.detach()
    this.move.detach()
    this.writer.detach()

    this.renderer.destroy()
    this.menu.destroy()
    this.recognizer.destroy()
    this.model.clear()
    this.history.clear()
    return Promise.resolve()
  }
}
