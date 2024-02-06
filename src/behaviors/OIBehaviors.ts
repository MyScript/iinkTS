import { Intention, InternalEventType, LoggerClass } from "../Constants"
import { Configuration, TConfiguration, TConverstionState, TRenderingConfiguration } from "../configuration"
import { InternalEvent } from "../event"
import { OIPointerEventGrabber } from "../grabber"
import { LoggerManager } from "../logger"
import { OIModel, TExport } from "../model"
import { OIStroke, OIText, SymbolType, TPointer, TStroke } from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { DefaultStyle, StyleManager, TStyle, TTheme } from "../style"
import
{
  OIConversionManager,
  OISnapManager,
  OIWriteManager,
  OIGestureManager,
  OISelectionManager,
  OIResizeManager,
  OIRotationManager,
  OITranslateManager,
  OITextManager,
  OIEraseManager,
  OIDebugSVGManager,
  OIMoveManager,
  OIMenuManager
} from "../manager"
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
  layerInfos: HTMLDivElement

  grabber: OIPointerEventGrabber
  renderer: OISVGRenderer
  recognizer: OIRecognizer

  styleManager: StyleManager
  undoRedoManager: UndoRedoManager
  writer: OIWriteManager
  eraser: OIEraseManager
  gesture: OIGestureManager
  resizer: OIResizeManager
  rotator: OIRotationManager
  translator: OITranslateManager
  converter: OIConversionManager
  texter: OITextManager
  selector: OISelectionManager
  svgDebugger: OIDebugSVGManager
  snaps: OISnapManager
  move: OIMoveManager
  menu: OIMenuManager

  constructor(options: PartialDeep<TBehaviorOptions>, layerInfos: HTMLDivElement)
  {
    this.#logger.info("constructor", { options })
    this.#configuration = new Configuration(options?.configuration)
    this.layerInfos = layerInfos
    this.styleManager = new StyleManager(Object.assign({}, DefaultStyle, options?.penStyle), options?.theme)

    this.grabber = new OIPointerEventGrabber(this.#configuration.grabber)
    this.recognizer = new OIRecognizer(this.#configuration.server, this.#configuration.recognition)
    this.renderer = new OISVGRenderer(this.#configuration.rendering)

    this.writer = new OIWriteManager(this)
    this.eraser = new OIEraseManager(this)
    this.gesture = new OIGestureManager(this)
    this.resizer = new OIResizeManager(this)
    this.rotator = new OIRotationManager(this)
    this.translator = new OITranslateManager(this)
    this.converter = new OIConversionManager(this)
    this.texter = new OITextManager(this)
    this.selector = new OISelectionManager(this)
    this.svgDebugger = new OIDebugSVGManager(this)
    this.snaps = new OISnapManager(this)
    this.move = new OIMoveManager(this)
    this.menu = new OIMenuManager(this, options.behaviors?.menu)

    this.#intention = Intention.Write
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
    switch (this.#intention) {
      case Intention.Erase:
        this.renderer.parent?.classList.remove("draw")
        this.renderer.parent?.classList.add("erase")
        this.renderer.parent?.classList.remove("select")
        this.renderer.parent?.classList.remove("move")
        break
      case Intention.Select:
        this.renderer.parent?.classList.remove("draw")
        this.renderer.parent?.classList.remove("erase")
        this.renderer.parent?.classList.add("select")
        this.renderer.parent?.classList.remove("move")
        break
      case Intention.Move:
        this.renderer.parent?.classList.remove("draw")
        this.renderer.parent?.classList.remove("erase")
        this.renderer.parent?.classList.remove("select")
        this.renderer.parent?.classList.add("move")
        break
      default:
        this.renderer.parent?.classList.add("draw")
        this.renderer.parent?.classList.remove("erase")
        this.renderer.parent?.classList.remove("select")
        this.renderer.parent?.classList.remove("move")
        break
    }
    this.menu.update()
    this.model.resetSelection()
    this.selector.removeSelectedGroup()
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
  //#endregion

  //#region Style
  get currentPenStyle(): TStyle
  {
    return this.styleManager.currentPenStyle
  }

  get penStyle(): TStyle
  {
    return this.styleManager.penStyle
  }
  async setPenStyle(penStyle?: TStyle | undefined): Promise<void>
  {
    this.#logger.info("setPenStyle", { penStyle })
    this.styleManager.setPenStyle(Object.assign({}, this.currentPenStyle, penStyle))
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
    this.internalEvent.emitIdle(false)
    try {
      this.selector.removeSelectedGroup()
      if (this.model.symbolsSelected.length) {
        this.model.resetSelection()
        this.internalEvent.emitSelected(this.model.symbolsSelected)
      }
      switch (this.#intention) {
        case Intention.Erase:
          this.eraser.start(pointer)
          break
        case Intention.Select:
          this.selector.start(pointer)
          break
        case Intention.Move:
          this.move.start(evt)
          break
        default:
          this.writer.start(this.currentPenStyle, pointer, evt.pointerId, evt.pointerType)
          break
      }
    } catch (error) {
      this.#logger.error("onPointerDown", error)
      this.grabber.stopPointerEvent()
      this.internalEvent.emitError(error as Error)
    }
    finally {
      this.svgDebugger.apply()
    }
  }

  protected onPointerMove(evt: PointerEvent, pointer: TPointer): void
  {
    this.#logger.debug("onPointerMove", { pointer })
    try {
      switch (this.#intention) {
        case Intention.Erase:
          this.eraser.continue(pointer)
          break
        case Intention.Select:
          this.selector.continue(pointer)
          break
        case Intention.Move:
          this.move.continue(evt)
          break
        default:
          this.writer.continue(pointer)
          break
      }
    } catch (error) {
      this.#logger.error("onPointerDown", error)
      this.internalEvent.emitError(error as Error)
    }
    finally {
      this.svgDebugger.apply()
    }
  }

  protected async onPointerUp(evt: PointerEvent, pointer: TPointer): Promise<void>
  {
    this.#logger.debug("onPointerUp", { pointer })
    try {
      switch (this.#intention) {
        case Intention.Erase:
          await this.eraser.end(pointer)
          break
        case Intention.Select:
          await this.selector.end(pointer)
          break
        case Intention.Move:
          this.move.end(evt)
          break
        default:
          await this.writer.end(pointer)
          break
      }
    } catch (error) {
      this.undo()
      this.#logger.error("onPointerUp", error)
      this.internalEvent.emitError(error as Error)
    }
    finally {
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
    }
  }

  async init(domElement: HTMLElement): Promise<void>
  {
    try {
      this.#logger.info("init", { domElement })

      this.renderer.init(domElement)
      this.menu.render(this.layerInfos)

      this.grabber.attach(this.renderer.layer as unknown as HTMLElement)
      this.grabber.onPointerDown = this.onPointerDown.bind(this)
      this.grabber.onPointerMove = this.onPointerMove.bind(this)
      this.grabber.onPointerUp = this.onPointerUp.bind(this)

      this.model.width = Math.max(domElement.clientWidth, this.#configuration.rendering.minWidth)
      this.model.height = Math.max(domElement.clientHeight, this.#configuration.rendering.minHeight)
      this.model.rowHeight = this.configuration.rendering.guides.gap
      this.undoRedoManager.updateModelInStack(this.model)

      await this.recognizer.init()
      await this.setPenStyle(this.penStyle)
      await this.setTheme(this.theme)
      await this.setPenStyleClasses(this.penStyleClasses)
    } catch (error) {
      throw new Error(error as string)
    }
  }

  updateSymbolsStyle(symbolIds: string[], style: TStyle): void
  {
    this.#logger.info("updateSymbolsStyle", { symbolIds, style })
    this.model.symbols.forEach(s =>
    {
      if (symbolIds.includes(s.id)) {
        Object.assign(s.style, style)
        if (s.type === SymbolType.Text) {
          (s as OIText).chars.forEach(c =>
          {
            if (style.color) {
              c.color = style.color
            }
            if (style.width) {
              c.fontWeight = style.width * 100
            }
          })
        }
        this.renderer.drawSymbol(s)
        s.modificationDate = Date.now()
      }
    })
    this.undoRedoManager.addModelToStack(this.model)
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
        this.renderer.drawSymbol(stroke)
      }
    })
    if (errors.length) {
      this.internalEvent.emitError(new Error(errors.join("\n")))
    }
    this.undoRedoManager.addModelToStack(this.model)
    await this.recognizer.addStrokes(this.model.extractUnsentStrokes(), false)
    await this.svgDebugger.apply()
    this.model.updatePositionSent()
    this.model.updatePositionReceived()
    this.undoRedoManager.updateModelInStack(this.model)
    this.#logger.debug("importPointEvents", this.model)
    await this.recognizer.waitForIdle()
    return this.model
  }

  async undo(): Promise<OIModel>
  {
    this.#logger.info("undo")
    if (this.context.canUndo) {
      this.internalEvent.emitIdle(false)
      this.selector.removeSelectedGroup()
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
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
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
      this.selector.removeSelectedGroup()
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
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
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
      const needExport = !mimeTypes?.length && !this.model.exports?.["application/vnd.myscript.jiix"] ||
        mimeTypes?.some(mt => !this.model.exports?.[mt])
      if (needExport) {
        const exports = await this.recognizer.export(mimeTypes)
        this.model.mergeExport(exports as TExport)
        await this.recognizer.waitForIdle()
      }
    } catch (error) {
      this.#logger.error("export", { error })
      this.internalEvent.emitError(error as Error)
    }
    return this.model
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async convert(_conversionState?: TConverstionState, _requestedMimeTypes?: string[]): Promise<OIModel>
  {
    try {
      this.internalEvent.emitIdle(false)
      await this.converter.convert()
      await this.recognizer.waitForIdle()
    } catch (error) {
      this.#logger.error("convert", error)
      this.internalEvent.emitError(error as Error)
    }
    finally {
      await this.svgDebugger.apply()
      this.internalEvent.emitIdle(true)
    }
    return this.model
  }

  async resize(height: number, width: number): Promise<OIModel>
  {
    this.internalEvent.emitIdle(false)
    this.#logger.info("resize", { height, width })
    this.model.height = height
    this.model.width = width
    this.renderer.resize(height, width)
    this.menu.update()
    this.internalEvent.emitIdle(true)
    return this.model
  }

  async clear(): Promise<OIModel>
  {
    try {
      this.#logger.info("clear")
      this.internalEvent.emitIdle(false)
      if (this.model.symbols.length) {
        this.renderer.clear()
        await this.recognizer.eraseStrokes(this.model.symbols.filter(s => s.type === SymbolType.Stroke).map(s => s.id))
        this.model.clear()
        this.undoRedoManager.addModelToStack(this.model)
        this.internalEvent.emitSelected(this.model.symbolsSelected)
        await this.recognizer.waitForIdle()
      }
    }
    catch (error) {
      this.#logger.error("clear", error)
      this.internalEvent.emitError(error as Error)
    }
    finally {
      await this.svgDebugger.apply()
      this.internalEvent.emitIdle(true)
    }
    return this.model
  }

  async destroy(): Promise<void>
  {
    this.#logger.info("destroy")
    this.grabber.detach()
    this.renderer.destroy()
    this.menu.destroy()
    this.recognizer.close(1000, InternalEventType.WS_CLOSED)
    return Promise.resolve()
  }
}
