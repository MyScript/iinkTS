import { Intention, InternalEventType, LoggerClass, SvgElementRole, WriteTool } from "../Constants"
import { Configuration, TConfiguration, TConverstionState, TRenderingConfiguration } from "../configuration"
import { OIConverterManager } from "../manager"
import { InternalEvent } from "../event"
import { StrikeThroughAction, SurroundAction, TGesture } from "../gesture"
import { OIPointerEventGrabber } from "../grabber"
import { LoggerManager } from "../logger"
import { OIModel, TExport, TJIIXEdgeElement, TJIIXNodeElement, TJIIXTextElement } from "../model"
import { OIStroke, SymbolType, TOISymbol, TPointer, TStroke } from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { DefaultStyle, StyleManager, TStyle, TTheme } from "../style"
import { OIGestureManager, OISelectionManager, OIResizeManager, OIRotateManager, OITranslateManager, OITextManager } from "../manager"
import { TUndoRedoContext, UndoRedoManager } from "../undo-redo"
import { PartialDeep, convertBoundingBoxMillimeterToPixel, mergeDeep } from "../utils"
import { IBehaviors, TBehaviorOptions } from "./IBehaviors"

/**
 * @group Behavior
 */
export class OIBehaviors implements IBehaviors
{
  name = "OIBehaviors"
  #logger = LoggerManager.getLogger(LoggerClass.BEHAVIORS)
  #configuration: TConfiguration
  #model: OIModel
  #intention: Intention
  #writeTool: WriteTool
  #currentTransform?: SvgElementRole
  #verticesVisibility = false
  #boundingBoxVisibility = false

  grabber: OIPointerEventGrabber
  renderer: OISVGRenderer
  recognizer: OIRecognizer
  styleManager: StyleManager
  undoRedoManager: UndoRedoManager
  gestureManager: OIGestureManager
  resizeManager: OIResizeManager
  rotateManager: OIRotateManager
  translateManager: OITranslateManager
  convertManager: OIConverterManager
  textManager: OITextManager
  selectionManager: OISelectionManager

  processGestures = true

  constructor(options: PartialDeep<TBehaviorOptions>)
  {
    this.#logger.info("constructor", { options })
    this.#configuration = new Configuration(options?.configuration)
    this.styleManager = new StyleManager(Object.assign({}, DefaultStyle, options?.penStyle), options?.theme)

    this.grabber = new OIPointerEventGrabber(this.#configuration.grabber)
    this.recognizer = new OIRecognizer(this.#configuration.server, this.#configuration.recognition)
    this.renderer = new OISVGRenderer(this.#configuration.rendering)

    this.gestureManager = new OIGestureManager(this)
    this.resizeManager = new OIResizeManager(this)
    this.rotateManager = new OIRotateManager(this)
    this.translateManager = new OITranslateManager(this)
    this.convertManager = new OIConverterManager(this)
    this.textManager = new OITextManager(this)
    this.selectionManager = new OISelectionManager(this)

    this.#intention = Intention.Write
    this.#writeTool = WriteTool.Pencil
    this.#model = new OIModel(this.#configuration.rendering.minWidth, this.#configuration.rendering.minHeight, this.configuration.rendering.guides.gap)

    this.undoRedoManager = new UndoRedoManager(this.#configuration["undo-redo"], this.model)
  }

  //#region Properties
  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  get intention(): Intention
  {
    return this.#intention
  }
  set intention(i: Intention)
  {
    this.#intention = i
    this.model.resetSelection()
  }

  get writeTool(): WriteTool
  {
    return this.#writeTool
  }
  set writeTool(wt: WriteTool)
  {
    this.#writeTool = wt
    this.selectionManager.removeSelectedGroup()
  }

  get model(): OIModel
  {
    return this.#model
  }

  get context(): TUndoRedoContext
  {
    return this.undoRedoManager.context
  }

  get configuration(): TConfiguration
  {
    return this.#configuration
  }
  set renderingConfiguration(renderingConfiguration: TRenderingConfiguration)
  {
    this.configuration.rendering = mergeDeep(this.configuration.rendering, renderingConfiguration)
    const height = Math.max(this.renderer.parent.clientHeight, this.configuration.rendering.minHeight)
    const width = Math.max(this.renderer.parent.clientWidth, this.configuration.rendering.minWidth)
    this.renderer.resize(height, width)
  }

  get surroundAction(): SurroundAction
  {
    return this.gestureManager.surroundAction
  }
  set surroundAction(value: SurroundAction)
  {
    this.gestureManager.surroundAction = value
  }

  get strikeThroughAction(): StrikeThroughAction
  {
    return this.gestureManager.strikeThroughAction
  }
  set strikeThroughAction(value: StrikeThroughAction)
  {
    this.gestureManager.strikeThroughAction = value
  }

  get verticesVisibility(): boolean
  {
    return this.#verticesVisibility
  }
  set verticesVisibility(show: boolean)
  {
    this.#verticesVisibility = show
    this.#verticesVisibility ? this.showVertices() : this.hideVertices()
  }

  get boundingBoxVisibility(): boolean
  {
    return this.#boundingBoxVisibility
  }
  set boundingBoxVisibility(show: boolean)
  {
    this.#boundingBoxVisibility = show
    this.#boundingBoxVisibility ? this.showBoundingBox() : this.hideBoundingBox()
  }
  //#endregion

  //#region Style
  get currentPenStyle(): TStyle
  {
    return {
      color: this.styleManager.currentPenStyle.color || this.theme?.ink.color,
      fill: this.styleManager.currentPenStyle.fill || this.theme?.ink.fill,
      width: this.styleManager.currentPenStyle.width || this.theme?.ink.width
    }
  }

  get penStyle(): TStyle
  {
    return this.styleManager.penStyle
  }
  async setPenStyle(penStyle?: TStyle | undefined): Promise<void>
  {
    this.#logger.info("setPenStyle", { penStyle })
    this.styleManager.setPenStyle(penStyle)
    return Promise.resolve()
  }

  get penStyleClasses(): string
  {
    return this.styleManager.penStyleClasses
  }
  async setPenStyleClasses(penStyleClasses?: string | undefined): Promise<void>
  {
    this.#logger.info("setPenStyleClasses", { penStyleClasses })
    this.styleManager.setPenStyleClasses(penStyleClasses)
    return Promise.resolve()
  }

  get theme(): TTheme
  {
    return this.styleManager.theme
  }
  async setTheme(theme?: TTheme): Promise<void>
  {
    this.#logger.info("setTheme", { theme })
    this.styleManager.setTheme(theme)
    return Promise.resolve()
  }
  //#endregion

  //#region Draw
  protected startDrawing(evt: PointerEvent, pointer: TPointer): void
  {
    switch (this.#intention) {
      case Intention.Erase:
        this.drawSymbol(this.model.createCurrentSymbol(WriteTool.Pencil, pointer, this.currentPenStyle, evt.pointerId, "eraser"))
        this.model.setToDeleteSymbolsFromPoint(pointer)
        this.model.symbolsToDelete.map(s => this.drawSymbol(s))
        break
      case Intention.Select:
        this.selectionManager.startSelectionByBox(pointer)
        break
      default:
        this.drawSymbol(this.model.createCurrentSymbol(this.writeTool, pointer, this.currentPenStyle, evt.pointerId, evt.pointerType))
        break
    }
  }
  protected continueDrawing(pointer: TPointer): void
  {
    switch (this.#intention) {
      case Intention.Erase:
        this.drawSymbol(this.model.updateCurrentSymbol(pointer))
        this.model.setToDeleteSymbolsFromPoint(pointer)
        this.model.symbolsToDelete.map(s => this.drawSymbol(s))
        break
      case Intention.Select:
        this.selectionManager.updateSelectionByBox(pointer)
        break
      default:
        this.drawSymbol(this.model.updateCurrentSymbol(pointer))
        break
    }
  }
  protected async applyEraseSymbol(pointer: TPointer): Promise<void>
  {
    this.#logger.debug("applyEraseSymbol", { pointer })
    const symbol = this.model.endCurrentSymbol(pointer)
    this.renderer.removeSymbol(symbol.id)
    this.model.removeSymbol(symbol.id)
    if (this.model.symbolsToDelete.length) {
      const symbolsToDelete = this.model.symbolsToDelete.slice()
      symbolsToDelete.forEach(s =>
      {
        this.model.removeSymbol(s.id)
        this.renderer.removeSymbol(s.id)
      })
      this.undoRedoManager.addModelToStack(this.model)
      await this.recognizer.eraseStrokes(symbolsToDelete.filter(s => s.type === SymbolType.Stroke).map(s => s.id))
      this.model.updatePositionSent()
      this.model.updatePositionReceived()
      this.undoRedoManager.updateModelInStack(this.model)
    }
  }
  protected async applyDrawnSymbol(pointer: TPointer): Promise<void>
  {
    this.#logger.debug("applyDrawnSymbol", { pointer })
    const symbol = this.model.endCurrentSymbol(pointer)
    this.drawSymbol(symbol)
    if (symbol.type === SymbolType.Stroke) {
      let gestureFromContextLess: TGesture | undefined
      const currentStroke = symbol as OIStroke
      if (this.processGestures) {
        const needContextLessGesture = this.model.symbols.some(s => {
          return s.type !== SymbolType.Stroke && currentStroke.boundingBox.overlaps(s.boundingBox)
        })
        if (needContextLessGesture) {
          gestureFromContextLess =  await this.gestureManager.getGestureFromContextLess(currentStroke)
        }
      }
      if (gestureFromContextLess) {
        await this.gestureManager.apply(currentStroke, gestureFromContextLess)
      }
      else {
        this.model.updatePositionSent()
        const gesture = await this.recognizer.addStrokes([currentStroke], this.processGestures)
        if (gesture) {
          await this.gestureManager.apply(currentStroke, gesture)
        }
        else {
          this.model.addSymbol(symbol)
          this.undoRedoManager.addModelToStack(this.model)
        }
        this.model.updatePositionReceived()
      }
      this.undoRedoManager.updateModelInStack(this.model)
    }
    else {
      this.model.addSymbol(symbol)
      this.undoRedoManager.addModelToStack(this.model)
    }
  }
  protected async endDrawing(pointer: TPointer): Promise<void>
  {
    switch (this.#intention) {
      case Intention.Erase:
        await this.applyEraseSymbol(pointer)
        break
      case Intention.Select:
        this.selectionManager.endSelectionByBox(pointer)
        break
      default:
        await this.applyDrawnSymbol(pointer)
        break
    }
  }
  //#endregion

  //#region Debug
  protected debugBoundingBox(): void
  {
    this.hideBoundingBox()
    if (this.boundingBoxVisibility) {
      this.showBoundingBox()
    }
  }
  protected showBoundingBox(): void
  {
    this.#logger.info("showAllPoints")
    if (this.#model.currentSymbol) {
      this.renderer.drawBoundingBox([this.#model.currentSymbol])
    }
    this.renderer.drawBoundingBox(this.model.symbolsSelected.length ? this.model.symbolsSelected : this.model.symbols)
  }
  protected hideBoundingBox(): void
  {
    this.#logger.info("hideAllPoints")
    this.renderer.clearBoudingBox()
  }
  protected debugVertices(): void
  {
    this.hideVertices()
    if (this.verticesVisibility) {
      this.showVertices()
    }
  }
  protected showVertices(): void
  {
    this.#logger.info("showVertices")
    if (this.#model.currentSymbol) {
      this.#model.currentSymbol.vertices.forEach(p => this.renderer.drawCircle(p, 2, { fill: "red", debug: "true" }))
    }
    this.model.symbols.forEach(s => s.vertices.forEach(p => this.renderer.drawCircle(p, 2, { fill: "red", debug: "true" })))
  }
  protected hideVertices(): void
  {
    this.#logger.info("hideVertices")
    this.renderer.clearElements({ type: "circle", attrs: { debug: "true" } })
  }
  async drawRecognitionBox(): Promise<void>
  {
    this.#logger.info("drawRecognitionBox")
    await this.export(["application/vnd.myscript.jiix"])
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    this.#logger.debug("drawRecognitionBox", { jiix })
    if (jiix) {
      if (!jiix["bounding-box"]) {
        this.#logger.warn("drawRecognitionBox", "You must to enabled configuration.recognition.exports[\"bounding-box\"]")
        return
      }
      jiix.elements?.forEach(e =>
      {
        switch (e.type) {
          case "Node": {
            const node = e as TJIIXNodeElement
            if (node["bounding-box"]) {
              const box = convertBoundingBoxMillimeterToPixel(node["bounding-box"])
              this.renderer.drawRecognitionBox(box, [`type: ${ node.type }`, `kind: ${ node.kind }`, `id: ${ node.id }`])
            }
            break
          }
          case "Text": {
            const text = e as TJIIXTextElement
            text.words?.forEach(w =>
            {
              if (w?.["bounding-box"]) {
                const box = convertBoundingBoxMillimeterToPixel(w["bounding-box"])
                this.renderer.drawRecognitionBox(box, [`type: ${ text.type }`, `candidates: ${ JSON.stringify(w.candidates || []) }`])
              }
            })
            break
          }
          case "Edge": {
            const edge = e as TJIIXEdgeElement
            if (edge["bounding-box"]) {
              const box = convertBoundingBoxMillimeterToPixel(edge["bounding-box"])
              const hideProperties = ["bounding-box", "items", "x1", "x2", "y1", "y2", "ports"]
              const infos = Object.keys(edge).filter(k => !hideProperties.includes(k)).map(k => `${ k }: ${ JSON.stringify(edge[k as keyof typeof edge]) }`)
              this.renderer.drawRecognitionBox(box, infos)
            }
            break
          }
          default: {
            this.#logger.warn("drawRecognitionBox", `Unknow jiix element type: ${ e.type }`)
            break
          }
        }
      })
    }
  }
  clearRecognitionBox(): void
  {
    this.#logger.info("clearRecognitionBox")
    this.renderer.clearRecognitionBox()
  }
  async drawRecognitionBoxItem(): Promise<void>
  {
    this.#logger.info("drawRecognitionBoxItem")
    await this.export(["application/vnd.myscript.jiix"])
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    this.#logger.debug("drawRecognitionBoxItem", { jiix })
    if (jiix) {
      jiix.elements?.forEach(e =>
      {
        switch (e.type) {
          case "Text": {
            const text = e as TJIIXTextElement
            text.chars?.forEach(c =>
            {
              if (c?.["bounding-box"]) {
                const box = convertBoundingBoxMillimeterToPixel(c["bounding-box"])
                this.renderer.drawRecognitionBoxItem(box, c.label, c.candidates)
              }
            })
            break
          }
          case "Node": {
            const node = e as TJIIXNodeElement
            if (node?.["bounding-box"]) {
              const box = convertBoundingBoxMillimeterToPixel(node["bounding-box"])
              this.renderer.drawRecognitionBoxItem(box, node.kind)
            }
            break
          }
          case "Edge": {
            const edge = e as TJIIXEdgeElement
            if (edge["bounding-box"]) {
              const box = convertBoundingBoxMillimeterToPixel(edge["bounding-box"])
              this.renderer.drawRecognitionBoxItem(box, edge.kind)
            }
            break
          }
          default:
            this.#logger.warn("drawRecognitionBoxItem", `Unknow jiix element type: ${ e.type }`)
            break
        }
      })
    }
  }
  clearRecognitionBoxItem(): void
  {
    this.#logger.info("clearRecognitionBoxItem")
    this.renderer.clearRecognitionBoxItem()
  }
  //#endregion

  protected onPointerDown(evt: PointerEvent, pointer: TPointer): void
  {
    this.#logger.debug("onPointerDown", { evt, pointer })
    this.internalEvent.emitIdle(false)
    try {
      const target: Element = (evt.target as Element)
      switch (target.getAttribute("role")) {
        case SvgElementRole.Translate: {
          this.#currentTransform = SvgElementRole.Translate
          this.translateManager.start(target, pointer)
          break
        }
        case SvgElementRole.Resize: {
          this.#currentTransform = SvgElementRole.Resize
          this.resizeManager.start(target)
          break
        }
        case SvgElementRole.Rotate: {
          this.#currentTransform = SvgElementRole.Rotate
          this.rotateManager.start(target)
          break
        }
        default: {
          this.selectionManager.removeSelectedGroup()
          this.model.resetSelection()
          this.internalEvent.emitSelected(this.model.symbolsSelected)
          this.startDrawing(evt, pointer)
          break
        }
      }
    } catch (error) {
      this.#logger.error("onPointerDown", error)
      this.grabber.stopPointerEvent()
      this.internalEvent.emitError(error as Error)
    }
    finally {
      this.debugVertices()
      this.debugBoundingBox()
    }
  }

  protected onPointerMove(_evt: PointerEvent, pointer: TPointer): void
  {
    this.#logger.debug("onPointerMove", { pointer })
    try {
      switch (this.#currentTransform) {
        case SvgElementRole.Translate:
          this.translateManager.continue(pointer)
          break
        case SvgElementRole.Resize:
          this.resizeManager.continue(pointer)
          break
        case SvgElementRole.Rotate:
          this.rotateManager.continue(pointer)
          break
        default: {
          this.continueDrawing(pointer)
          break
        }
      }
    } catch (error) {
      this.#logger.error("onPointerDown", error)
      this.internalEvent.emitError(error as Error)
    }
    finally {
      this.debugVertices()
      this.debugBoundingBox()
    }
  }

  protected async onPointerUp(_evt: PointerEvent, pointer: TPointer): Promise<void>
  {
    this.#logger.debug("onPointerUp", { pointer })
    try {
      switch (this.#currentTransform) {
        case SvgElementRole.Translate: {
          await this.translateManager.end(pointer)
          break
        }
        case SvgElementRole.Resize: {
          await this.resizeManager.end(pointer)
          break
        }
        case SvgElementRole.Rotate: {
          this.rotateManager.end(pointer)
          break
        }
        default: {
          await this.endDrawing(pointer)
          break
        }
      }
    } catch (error) {
      this.undo()
      this.#logger.error("onPointerUp", error)
      this.internalEvent.emitError(error as Error)
    }
    finally {
      this.#currentTransform = undefined
      this.debugVertices()
      this.debugBoundingBox()
      this.recognizer.waitForIdle()
    }
  }

  drawSymbol(symbol: TOISymbol): void
  {
    this.#logger.debug("drawSymbol", { symbol })
    if (symbol) {
      this.renderer.drawSymbol(symbol)
    }
  }

  updateSymbolsStyle(strokeIds: string[], style: { color?: string, fill?: string, width?: number }): void
  {
    this.#logger.info("updateSymbolsStyle", { strokeIds, style })
    this.model.symbols.forEach(s =>
    {
      if (strokeIds.includes(s.id)) {
        s.style.width = style.width || s.style.width
        s.style.color = style.color || s.style.color
        s.style.fill = style.fill || s.style.fill
        this.renderer.drawSymbol(s)
        s.modificationDate = Date.now()
      }
    })
    this.undoRedoManager.addModelToStack(this.model)
  }

  async init(domElement: HTMLElement): Promise<void>
  {
    try {
      this.#logger.info("init", { domElement })
      this.model.width = Math.max(domElement.clientWidth, this.#configuration.rendering.minWidth)
      this.model.height = Math.max(domElement.clientHeight, this.#configuration.rendering.minHeight)
      this.model.rowHeight = this.configuration.rendering.guides.gap
      this.undoRedoManager.updateModelInStack(this.model)

      this.renderer.init(domElement)

      this.grabber.attach(this.renderer.layer as unknown as HTMLElement)
      this.grabber.onPointerDown = this.onPointerDown.bind(this)
      this.grabber.onPointerMove = this.onPointerMove.bind(this)
      this.grabber.onPointerUp = this.onPointerUp.bind(this)

      await this.recognizer.init()
      await this.setPenStyle(this.penStyle)
      await this.setTheme(this.theme)
      await this.setPenStyleClasses(this.penStyleClasses)
    } catch (error) {
      throw new Error(error as string)
    }
  }

  async importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<OIModel>
  {
    this.#logger.info("importPointEvents", { strokes })
    this.internalEvent.emitIdle(false)
    const errors: string[] = []
    strokes.forEach((s, strokeIndex) =>
    {
      const stroke = new OIStroke(s.style || DefaultStyle, s.pointerId || 1)
      if (s.id) stroke.id = s.id
      if (s.pointerType) stroke.pointerType = s.pointerType
      if (!s.pointers?.length) {
        errors.push(`stroke ${ strokeIndex + 1 } has not pointers`)
      }
      let flag = true
      s.pointers?.forEach((pp, pIndex) =>
      {
        flag = true
        if (!pp) {
          errors.push(`stroke ${ strokeIndex + 1 } has no pointer at ${ pIndex }`)
          return
        }
        const pointer: TPointer = {
          p: pp.p || 1,
          t: pp.t || pIndex,
          x: 0,
          y: 0
        }
        if (pp?.x == undefined || pp?.x == null) {
          errors.push(`stroke ${ strokeIndex + 1 } has no x at pointer at ${ pIndex }`)
          flag = false
        }
        else {
          pointer.x = pp.x
        }
        if (pp?.y == undefined || pp?.y == null) {
          errors.push(`stroke ${ strokeIndex + 1 } has no y at pointer at ${ pIndex }`)
          flag = false
        }
        else {
          pointer.y = pp.y
        }
        if (flag) {
          stroke.pointers.push(pointer)
        }
      })
      if (flag) {
        this.model.addSymbol(stroke)
        this.drawSymbol(stroke)
      }
    })
    this.debugVertices()
    this.debugBoundingBox()
    if (errors.length) {
      this.internalEvent.emitError(new Error(errors.join("\n")))
    }
    this.undoRedoManager.addModelToStack(this.model)
    await this.recognizer.addStrokes(this.model.extractUnsentStrokes(), false)
    this.model.updatePositionSent()
    this.model.updatePositionReceived()
    this.undoRedoManager.updateModelInStack(this.model)
    this.#logger.debug("importPointEvents", this.model)
    this.recognizer.waitForIdle()
    return this.model
  }

  async undo(): Promise<OIModel>
  {
    this.#logger.info("undo")
    if (this.context.canUndo) {
      this.internalEvent.emitIdle(false)
      this.selectionManager.removeSelectedGroup()
      const promises: Promise<void>[] = []
      const modelToApply = this.undoRedoManager.undo() as OIModel
      const modifications = modelToApply.extractDifferenceSymbols(this.model)
      this.#logger.debug("undo", { modifications })
      if (modifications.removed.length) {
        modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
        promises.push(this.recognizer.eraseStrokes(modifications.removed.filter(s => s.type === SymbolType.Stroke).map(s => s.id)))
      }
      if (modifications.added.length) {
        modifications.added.forEach(s => this.renderer.drawSymbol(s))
        promises.push(this.recognizer.addStrokes(modifications.added.filter(s => s.type === SymbolType.Stroke) as OIStroke[], false) as Promise<void>)
      }
      this.#model = modelToApply
      this.debugVertices()
      this.debugBoundingBox()
      await Promise.all(promises)
      this.recognizer.waitForIdle()
      return this.model
    }
    else {
      throw new Error("undo not allowed")
    }
  }

  async redo(): Promise<OIModel>
  {
    this.#logger.info("redo")
    if (this.context.canRedo) {
      this.internalEvent.emitIdle(false)
      this.selectionManager.removeSelectedGroup()
      const promises: Promise<void>[] = []
      const modelToApply = this.undoRedoManager.redo() as OIModel
      const modifications = modelToApply.extractDifferenceSymbols(this.model)
      this.#logger.debug("redo", { modifications })
      if (modifications.removed.length) {
        modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
        promises.push(this.recognizer.eraseStrokes(modifications.removed.filter(s => s.type === SymbolType.Stroke).map(s => s.id)))
      }
      if (modifications.added.length) {
        modifications.added.forEach(s => this.renderer.drawSymbol(s))
        promises.push(this.recognizer.addStrokes(modifications.added.filter(s => s.type === SymbolType.Stroke) as OIStroke[], false) as Promise<void>)
      }
      this.#model = modelToApply
      this.debugVertices()
      this.debugBoundingBox()
      await Promise.all(promises)
      this.recognizer.waitForIdle()
      return this.model
    }
    else {
      throw new Error("redo not allowed")
    }
  }

  async export(mimeTypes?: string[]): Promise<OIModel>
  {
    try {
      this.#logger.info("export", { mimeTypes })
      this.internalEvent.emitIdle(false)
      const exports = await this.recognizer.export(mimeTypes)
      this.model.mergeExport(exports as TExport)
      this.recognizer.waitForIdle()
      return this.model
    } catch (error) {
      this.#logger.error("export", { error })
      this.internalEvent.emitError(error as Error)
      return Promise.reject(error)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async convert(_conversionState?: TConverstionState, _requestedMimeTypes?: string[]): Promise<OIModel>
  {
    try {
      this.internalEvent.emitIdle(false)
      this.clearRecognitionBox()
      this.clearRecognitionBoxItem()
      await this.convertManager.convert()
      this.debugBoundingBox()
      this.debugVertices()
    } catch (error) {
      this.#logger.error("convert", error)
      this.internalEvent.emitError(error as Error)
    }
    finally {
      this.debugVertices()
      this.debugBoundingBox()
    }
    this.recognizer.waitForIdle()
    return this.model
  }

  async resize(height: number, width: number): Promise<OIModel>
  {
    this.internalEvent.emitIdle(false)
    this.#logger.info("resize", { height, width })
    this.model.height = height
    this.model.width = width
    this.renderer.resize(height, width)
    this.internalEvent.emitIdle(true)
    return this.model
  }

  async clear(): Promise<OIModel>
  {
    this.#logger.info("clear")
    this.internalEvent.emitIdle(false)
    if (this.model.symbols.length) {
      this.renderer.clear()
      await this.recognizer.eraseStrokes(this.model.symbols.filter(s => s.type === SymbolType.Stroke).map(s => s.id))
      this.model.clear()
      this.internalEvent.emitSelected(this.model.symbolsSelected)
      this.undoRedoManager.addModelToStack(this.model)
      this.recognizer.waitForIdle()
    }
    return this.model
  }

  async destroy(): Promise<void>
  {
    this.#logger.info("destroy")
    this.grabber.detach()
    this.renderer.destroy()
    this.recognizer.close(1000, InternalEventType.WS_CLOSED)
    return Promise.resolve()
  }
}
