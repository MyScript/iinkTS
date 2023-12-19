import { Intention, InternalEventType, LoggerClass, WriteTool } from "../Constants"
import { Configuration, TConfiguration, TConverstionState, TRenderingConfiguration } from "../configuration"
import { InternalEvent } from "../event"
import { PointerEventGrabber } from "../grabber"
import { LoggerManager } from "../logger"
import { OIModel, TExport } from "../model"
import { OIStroke, SymbolType, TOISymbol, TPointer, TStroke } from "../primitive"
import { OIRecognizer } from "../recognizer/OIRecognizer"
import { OISVGRenderer } from "../renderer"
import { DefaultStyle, StyleManager, TStyle, TTheme } from "../style"
import { TUndoRedoContext, UndoRedoManager } from "../undo-redo"
import { PartialDeep, mergeDeep } from "../utils"
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

  grabber: PointerEventGrabber
  renderer: OISVGRenderer
  recognizer: OIRecognizer
  styleManager: StyleManager
  undoRedoManager: UndoRedoManager

  constructor(options: PartialDeep<TBehaviorOptions>)
  {
    this.#logger.info("constructor", { options })
    this.#configuration = new Configuration(options?.configuration)
    this.styleManager = new StyleManager(options?.penStyle, options?.theme)

    this.grabber = new PointerEventGrabber(this.#configuration.grabber)
    this.renderer = new OISVGRenderer(this.#configuration.rendering)
    this.recognizer = new OIRecognizer(this.#configuration.server, this.#configuration.recognition)

    this.#intention = Intention.Write
    this.#writeTool = WriteTool.Pencil
    this.#model = new OIModel()

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
    this.renderer.configuration = this.configuration.rendering
    const height = Math.max(this.renderer.parent.clientHeight, this.configuration.rendering.minHeight)
    const width = Math.max(this.renderer.parent.clientWidth, this.configuration.rendering.minWidth)
    this.renderer.resize(height, width)
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

  protected onPointerDown(evt: PointerEvent, pointer: TPointer): void
  {
    this.#logger.debug("onPointerDown", { evt, pointer })

    switch (this.#intention) {
      case Intention.Erase:
        this.drawSymbol(this.model.createCurrentSymbol(this.writeTool, pointer, this.currentPenStyle, evt.pointerId, "eraser"))
        this.model.selectedSymbolsFromPoint(pointer)
        this.model.selection.map(s => this.drawSymbol(s))
        break
      case Intention.Select:
        break
      default:
        this.drawSymbol(this.model.createCurrentSymbol(this.writeTool, pointer, this.currentPenStyle, evt.pointerId, evt.pointerType))
        break
    }
  }

  protected onPointerMove(_evt: PointerEvent, pointer: TPointer): void
  {
    this.#logger.debug("onPointerMove", { pointer })
    switch (this.#intention) {
      case Intention.Erase:
        this.drawSymbol(this.model.updateCurrentSymbol(pointer))
        this.model.selectedSymbolsFromPoint(pointer)
        this.model.selection.map(s => this.drawSymbol(s))
        break
      case Intention.Select:
        break
      default:
        // this.#drawStroke(pointer)
        this.drawSymbol(this.model.updateCurrentSymbol(pointer))
        break
    }
  }

  protected async applyEraseSymbol(pointer: TPointer): Promise<void>
  {
    const symbol = this.model.endCurrentSymbol(pointer)
    this.renderer.removeSymbol(symbol.id)
    this.model.removeSymbol(symbol.id)
    if (this.model.selection.length) {
      this.model.selection.forEach(s =>
      {
        this.model.removeSymbol(s.id)
        this.renderer.removeSymbol(s.id)
      })
      this.undoRedoManager.addModelToStack(this.model)
      this.model.updatePositionSent()
      await this.recognizer.eraseStrokes(this.model.selection.filter(s => s.type === SymbolType.Stroke).map(s => s.id))
      this.model.updatePositionReceived()
      this.undoRedoManager.updateModelInStack(this.model)
    }
  }

  protected async applyDrawnSymbol(pointer: TPointer): Promise<void>
  {
    const symbol = this.model.endCurrentSymbol(pointer)
    this.drawSymbol(symbol)
    this.model.updatePositionSent()
    if (symbol.type === SymbolType.Stroke) {
      await this.recognizer.addStrokes([symbol as OIStroke])
    }
    this.undoRedoManager.addModelToStack(this.model)
  }

  protected onPointerUp(_evt: PointerEvent, pointer: TPointer): void
  {
    this.#logger.debug("onPointerUp", { pointer })
    switch (this.#intention) {
      case Intention.Erase:
        this.applyEraseSymbol(pointer)
        break
      case Intention.Select:
        break
      default:
        this.applyDrawnSymbol(pointer)
        break
    }
  }

  drawSymbol(symbol: TOISymbol): void
  {
    this.#logger.debug("drawSymbol", { symbol })
    if (symbol) {
      this.renderer.drawSymbol(symbol)
    }
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
      }
    })
    if (errors.length) {
      this.internalEvent.emitError(new Error(errors.join("\n")))
    }
    await this.recognizer.addStrokes(this.model.extractUnsentStrokes(), false)
    this.#logger.debug("importPointEvents", this.model)
    return this.model
  }

  async undo(): Promise<OIModel>
  {
    this.#logger.info("undo")
    if (this.context.canUndo) {
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
      await Promise.all(promises)
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
      await Promise.all(promises)
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
      const exports = await this.recognizer.export(mimeTypes)
      this.model.mergeExport(exports as TExport)
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
    throw new Error("Not implemented")
  }

  async resize(height: number, width: number): Promise<OIModel>
  {
    this.#logger.info("resize", { height, width })
    this.model.height = height
    this.model.width = width
    this.renderer.resize(height, width)
    return this.model
  }

  async clear(): Promise<OIModel>
  {
    this.#logger.info("clear")
    if (this.model.symbols.length) {
      this.renderer.clear()
      await this.recognizer.eraseStrokes(this.model.symbols.filter(s => s.type === SymbolType.Stroke).map(s => s.id))
      this.model.clear()
      this.undoRedoManager.addModelToStack(this.model)
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
