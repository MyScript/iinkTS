import { Intention, InternalEventType, LoggerClass, SELECTION_MARGIN } from "../Constants"
import { Configuration, TConfiguration, TConverstionState, TRenderingConfiguration } from "../configuration"
import { InternalEvent } from "../event"
import { OIPointerEventGrabber } from "../grabber"
import { LoggerManager } from "../logger"
import { OIModel, TExport } from "../model"
import
{
  Box,
  EdgeKind,
  OIEdge,
  OIEdgeArc,
  OIEdgeLine,
  OIEdgePolyLine,
  OIShape,
  OIShapeCircle,
  OIShapeEllipse,
  OIShapeParallelogram,
  OIShapePolygon,
  OIShapeRectangle,
  OIShapeTriangle,
  OIStroke,
  OIText,
  ShapeKind,
  SymbolType,
  TOISymbol,
  TPoint,
  TPointer,
  TStroke,
  TSymbol,
  convertPartialStrokesToOIStrokes
} from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer, SVGBuilder } from "../renderer"
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
import { OIHistoryManager, TOIActions } from "../history"
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

  styler: StyleManager
  history: OIHistoryManager
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
    this.styler = new StyleManager(Object.assign({}, DefaultStyle, options?.penStyle), options?.theme)

    this.grabber = new OIPointerEventGrabber(this.#configuration.grabber)
    this.recognizer = new OIRecognizer(this.#configuration.server, this.#configuration.recognition)
    this.renderer = new OISVGRenderer(this.#configuration.rendering)

    this.history = new OIHistoryManager(this.#configuration["undo-redo"])
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
    this.unselectAll()
  }

  get model(): OIModel
  {
    return this.#model
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
    return this.styler.currentPenStyle
  }

  get penStyle(): TStyle
  {
    return this.styler.penStyle
  }
  async setPenStyle(penStyle?: TStyle | undefined): Promise<void>
  {
    this.#logger.info("setPenStyle", { penStyle })
    this.styler.setPenStyle(Object.assign({}, this.currentPenStyle, penStyle))
    return Promise.resolve()
  }

  get penStyleClasses(): string
  {
    return this.styler.penStyleClasses
  }
  async setPenStyleClasses(penStyleClasses?: string | undefined): Promise<void>
  {
    this.#logger.info("setPenStyleClasses", { penStyleClasses })
    this.styler.setPenStyleClasses(penStyleClasses)
    return Promise.resolve()
  }

  get theme(): TTheme
  {
    return this.styler.theme
  }
  async setTheme(theme?: TTheme): Promise<void>
  {
    this.#logger.info("setTheme", { theme })
    this.styler.setTheme(theme)
    return Promise.resolve()
  }
  //#endregion

  protected onPointerDown(evt: PointerEvent, pointer: TPointer): void
  {
    this.#logger.debug("onPointerDown", { evt, pointer })
    this.internalEvent.emitIdle(false)
    try {
      this.unselectAll()
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
          this.writer.start(this.currentPenStyle, pointer, evt.pointerType)
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
      this.#logger.error("onPointerMove", error)
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
      this.menu.update()
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
    }
  }

  protected async onContextMenu(el: HTMLElement, point: TPoint): Promise<void>
  {
    if (this.intention === Intention.Select) {
      let found = false
      let currentEl: HTMLElement | null = el
      const symbolTypesAllowed = [SymbolType.Edge.toString(), SymbolType.Shape.toString(), SymbolType.Stroke.toString(), SymbolType.Text.toString()]
      while (currentEl && currentEl.tagName !== "svg" && !found) {
        if (symbolTypesAllowed.includes(currentEl.getAttribute("type") as string)) {
          found = true
        }
        else {
          currentEl = currentEl.parentElement
        }
      }
      this.unselectAll()
      if (currentEl?.id) {
        this.model.selectSymbol(currentEl.id)
        this.renderer.drawSymbol(this.model.symbolsSelected[0])
        this.selector.drawSelectedGroup(this.model.symbolsSelected)
      }
      else {
        this.menu.context.position.x = point.x + this.renderer.parent.clientLeft
        this.menu.context.position.y = point.y + this.renderer.parent.clientTop
        this.menu.context.show()
      }
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
      this.grabber.onContextMenu = this.onContextMenu.bind(this)

      this.model.width = Math.max(domElement.clientWidth, this.#configuration.rendering.minWidth)
      this.model.height = Math.max(domElement.clientHeight, this.#configuration.rendering.minHeight)
      this.model.rowHeight = this.configuration.rendering.guides.gap
      this.history.push(this.model, {})

      await this.recognizer.init()
      await this.setPenStyle(this.penStyle)
      await this.setTheme(this.theme)
      await this.setPenStyleClasses(this.penStyleClasses)
    } catch (error) {
      throw new Error(error as string)
    }
  }

  async changeLanguage(code: string): Promise<void>
  {
    try {
      this.#logger.info("changeLanguage", { code })
      this.internalEvent.emitIdle(false)
      this.configuration.recognition.lang = code
      await this.recognizer.destroy()
      this.recognizer = new OIRecognizer(this.#configuration.server, this.#configuration.recognition)
      await this.recognizer.init()
      await this.recognizer.addStrokes(this.model.symbols.filter(s => s.type === SymbolType.Stroke) as OIStroke[], false)
    } catch (error) {
      this.#logger.error("changeLanguage", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
    finally {
      this.menu.update()
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
    }
  }

  protected createShape(partialShape: PartialDeep<OIShape>): OIShape
  {
    switch (partialShape.kind) {
      case ShapeKind.Circle:
        return OIShapeCircle.create(partialShape as PartialDeep<OIShapeCircle>)
      case ShapeKind.Ellipse:
        return OIShapeEllipse.create(partialShape as PartialDeep<OIShapeEllipse>)
      case ShapeKind.Parallelogram:
        return OIShapeParallelogram.create(partialShape as PartialDeep<OIShapeParallelogram>)
      case ShapeKind.Polygon:
        return OIShapePolygon.create(partialShape as PartialDeep<OIShapePolygon>)
      case ShapeKind.Rectangle:
        return OIShapeRectangle.create(partialShape as PartialDeep<OIShapeRectangle>)
      case ShapeKind.Triangle:
        return OIShapeTriangle.create(partialShape as PartialDeep<OIShapeTriangle>)
      default:
        throw new Error(`Unable to create shape, kind: "${ partialShape.kind }" is unknown`)
    }
  }

  protected createEdge(partialEdge: PartialDeep<OIEdge>): OIEdge
  {
    switch (partialEdge.kind) {
      case EdgeKind.Arc:
        return OIEdgeArc.create(partialEdge)
      case EdgeKind.Line:
        return OIEdgeLine.create(partialEdge)
      case EdgeKind.PolyEdge:
        return OIEdgePolyLine.create(partialEdge)
      default:
        throw new Error(`Unable to create edge, kind: "${ partialEdge.kind }" is unknown`)
    }
  }


  async createSymbols(partialSymbols: PartialDeep<TOISymbol>[]): Promise<TOISymbol[]>
  {
    try {
      const errors: string[] = []
      const symbols: (TOISymbol | undefined)[] = partialSymbols.map(s =>
      {
        switch (s.type) {
          case SymbolType.Stroke:
            return OIStroke.create(s as PartialDeep<OIStroke>)
          case SymbolType.Shape:
            return this.createShape(s as PartialDeep<OIStroke>)
          case SymbolType.Edge:
            return this.createEdge(s as PartialDeep<OIEdge>)
          case SymbolType.Text:
            return OIText.create(s as PartialDeep<OIText>)
          default:
            errors.push(`Unable to create symbol, type: "${ s.type }" is unknown`)
            return
        }
      })
      if (errors.length) {
        throw new Error(errors.join("\n"))
      }
      return await this.addSymbols(symbols as TOISymbol[])
    } catch (error) {
      this.#logger.error("importPointEvents", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
  }

  async createSymbol(partialSymbol: PartialDeep<TOISymbol>): Promise<TOISymbol>
  {
    try {
      switch (partialSymbol.type) {
        case SymbolType.Stroke:
          return await this.addSymbol(OIStroke.create(partialSymbol as PartialDeep<OIStroke>))
        case SymbolType.Shape:
          return await this.addSymbol(this.createShape(partialSymbol as PartialDeep<OIStroke>))
        case SymbolType.Edge:
          return await this.addSymbol(this.createEdge(partialSymbol as PartialDeep<OIEdge>))
        default:
          throw new Error(`Unable to create symbol, type: "${ partialSymbol.type }" is unknown`)
      }
    } catch (error) {
      this.#logger.error("importPointEvents", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
  }

  async addSymbol(symbolToAdd: TOISymbol): Promise<TOISymbol>
  {
    try {
      this.#logger.info("addSymbol", { symbolToAdd })
      this.internalEvent.emitIdle(false)
      this.model.addSymbol(symbolToAdd)
      this.renderer.drawSymbol(symbolToAdd)
      if (symbolToAdd.type === SymbolType.Stroke) {
        await this.recognizer.addStrokes([symbolToAdd as OIStroke], false)
      }
      this.history.push(this.model, { added: [symbolToAdd] })
      return symbolToAdd
    } catch (error) {
      this.#logger.error("addSymbol", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
    finally {
      this.menu.update()
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
    }
  }

  async addSymbols(symbolsToAdd: TOISymbol[]): Promise<TOISymbol[]>
  {
    try {
      this.#logger.info("addSymbol", { symbolsToAdd })
      this.internalEvent.emitIdle(false)
      const strokes = symbolsToAdd.filter(s => s.type === SymbolType.Stroke) as OIStroke[]
      await this.recognizer.addStrokes(strokes, false)
      symbolsToAdd.forEach(s =>
      {
        this.model.addSymbol(s)
        this.renderer.drawSymbol(s)
      })
      this.history.push(this.model, { added: symbolsToAdd })
      return symbolsToAdd
    } catch (error) {
      this.#logger.error("addSymbol", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
    finally {
      this.menu.update()
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
    }
  }

  async updateSymbol(symbolToUpdate: TOISymbol): Promise<TOISymbol>
  {
    try {
      this.#logger.info("updateSymbol", { symbolToUpdate })
      this.internalEvent.emitIdle(false)
      this.model.updateSymbol(symbolToUpdate)
      this.renderer.drawSymbol(symbolToUpdate)
      if (symbolToUpdate.type === SymbolType.Stroke) {
        await this.recognizer.replaceStrokes([symbolToUpdate.id], [symbolToUpdate as OIStroke])
      }
      this.history.push(this.model, { replaced: { oldSymbols: [symbolToUpdate], newSymbols: [symbolToUpdate] } })
      return symbolToUpdate
    } catch (error) {
      this.#logger.error("addSymbol", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
    finally {
      this.menu.update()
      await this.svgDebugger.apply()
    }
  }

  async replaceSymbol(symbolToReplace: TOISymbol, newSymbols: TOISymbol[]): Promise<void>
  {
    try {
      this.#logger.info("replaceSymbol", { symbolToReplace, newSymbols })
      this.internalEvent.emitIdle(false)
      this.model.replaceSymbol(symbolToReplace.id, newSymbols)
      this.renderer.replaceSymbol(symbolToReplace.id, newSymbols)
      const newStrokes = newSymbols.filter(s => s.type === SymbolType.Stroke) as OIStroke[]
      if (symbolToReplace.type === SymbolType.Stroke && newStrokes.length) {
        await this.recognizer.replaceStrokes([symbolToReplace.id], newStrokes)
      }
      else if (symbolToReplace.type === SymbolType.Stroke) {
        await this.recognizer.eraseStrokes([symbolToReplace.id])
      }
      else if (newStrokes.length) {
        await this.recognizer.addStrokes(newStrokes, false)
      }
      this.history.push(this.model, { replaced: { oldSymbols: [symbolToReplace], newSymbols } })
    } catch (error) {
      this.#logger.error("replaceSymbol", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
    finally {
      this.menu.update()
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
    }
  }

  changeOrderSymbols(symbols: TOISymbol[], position: "first" | "last" | "forward" | "backward")
  {
    symbols.forEach(s => this.changeOrderSymbol(s, position))
  }

  changeOrderSymbol(symbol: TOISymbol, position: "first" | "last" | "forward" | "backward"): void
  {
    this.model.changeOrderSymbol(symbol.id, position)
    this.renderer.changeOrderSymbol(symbol, position)
  }

  async removeSymbols(ids: string[]): Promise<void>
  {
    try {
      this.#logger.info("removeSymbol", { ids })
      this.internalEvent.emitIdle(false)
      const symbolsToRemove = this.model.symbols.filter(s => ids.includes(s.id))
      const strokeIdsToRemove = symbolsToRemove.filter(s => s.type === SymbolType.Stroke).map(s => s.id)
      symbolsToRemove.forEach(s =>
      {
        this.model.removeSymbol(s.id)
        this.renderer.removeSymbol(s.id)
      })
      await this.recognizer.eraseStrokes(strokeIdsToRemove)

      this.history.push(this.model, { erased: symbolsToRemove })
    } catch (error) {
      this.#logger.error("removeSymbol", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
    finally {
      this.menu.update()
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
    }
  }

  async removeSymbol(id: string): Promise<void>
  {
    try {
      this.#logger.info("removeSymbol", { id })
      this.internalEvent.emitIdle(false)
      const symbol = this.model.symbols.find(s => s.id === id)
      if (symbol) {
        this.model.removeSymbol(symbol.id)
        this.renderer.removeSymbol(symbol.id)
        if (symbol.type === SymbolType.Stroke) {
          await this.recognizer.eraseStrokes([symbol.id])
        }
        this.history.push(this.model, { erased: [symbol] })
      }
    } catch (error) {
      this.#logger.error("removeSymbol", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
    finally {
      this.menu.update()
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
    }
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
    this.internalEvent.emitSelected(this.model.symbolsSelected)
  }

  unselectAll(): void
  {
    this.menu.context.hide()
    this.menu.update()
    if (this.model.symbolsSelected.length) {
      this.model.symbolsSelected.forEach(s =>
      {
        s.selected = false
        this.renderer.drawSymbol(s)
      })
      this.selector.removeSelectedGroup()
      this.internalEvent.emitSelected(this.model.symbolsSelected)
    }
  }

  updateSymbolsStyle(symbolIds: string[], style: TStyle): void
  {
    this.#logger.info("updateSymbolsStyle", { symbolIds, style })
    const symbols: TSymbol[] = []
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
        symbols.push(s)
      }
    })
    if (symbols.length) {
      this.history.push(this.model, { transformed: [{ transformationType: "STYLE", symbols, style }] })
    }
  }

  updateTextFontSize(textIds: string[], fontSize: number): void
  {
    this.#logger.info("updateTextFontSize", { textIds, fontSize })
    const textSymbols: OIText[] = []
    this.model.symbols.forEach(s =>
    {
      if (textIds.includes(s.id) && s.type === SymbolType.Text) {
        const textSymbol = s as OIText
        textSymbol.chars.forEach(tc => tc.fontSize = fontSize)
        this.texter.updateTextBoundingBox(textSymbol)
        this.renderer.drawSymbol(s)
        s.modificationDate = Date.now()
        textSymbols.push(textSymbol)
      }
    })
    if (textSymbols.length) {
      this.texter.adjustText()
      this.history.push(this.model, { transformed: [{ transformationType: "STYLE", symbols: textSymbols, fontSize }] })
    }
  }

  async importPointEvents(partialStrokes: PartialDeep<TStroke>[]): Promise<OIModel>
  {
    try {
      this.#logger.info("importPointEvents", { partialStrokes })
      this.internalEvent.emitIdle(false)
      const strokes = convertPartialStrokesToOIStrokes(partialStrokes)
      strokes.forEach(s =>
      {
        this.model.addSymbol(s)
        this.renderer.drawSymbol(s)
      })
      await this.recognizer.addStrokes(strokes, false)
      this.history.push(this.model, { added: strokes })
      this.#logger.debug("importPointEvents", this.model)
      return this.model
    } catch (error) {
      this.#logger.error("importPointEvents", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
    finally {
      this.menu.update()
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
    }
    return this.model
  }

  private extractActionsToBackend(actions: TOIActions): TOIActions
  {
    return {
      added: actions.added?.filter(s => s.type === SymbolType.Stroke),
      erased: actions.erased?.filter(s => s.type === SymbolType.Stroke),
      replaced: {
        oldSymbols: actions.replaced?.oldSymbols.filter(s => s.type === SymbolType.Stroke) || [],
        newSymbols: actions.replaced?.newSymbols.filter(s => s.type === SymbolType.Stroke) || [],
      },
      transformed: actions.transformed?.filter(t => ["TRANSLATE", "MATRIX"].includes(t.transformationType) && t.symbols.some(s => s.type === SymbolType.Stroke)),
    }
  }

  async undo(): Promise<OIModel>
  {
    this.#logger.info("undo")
    if (this.history.context.canUndo) {
      this.internalEvent.emitIdle(false)
      this.unselectAll()
      const previousStackItem = this.history.undo()
      const modifications = previousStackItem.model.extractDifferenceSymbols(this.model)
      this.#model = previousStackItem.model.clone()
      this.#logger.debug("undo", { previousStackItem })
      const actionsToBackend = this.extractActionsToBackend(previousStackItem.actions)
      modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
      modifications.added.forEach(s => this.renderer.drawSymbol(s))
      if (
        actionsToBackend.added?.length ||
        actionsToBackend.erased?.length ||
        actionsToBackend.replaced?.newSymbols.length ||
        actionsToBackend.transformed?.length
      ) {
        await this.recognizer.undo(actionsToBackend)
      }

      this.menu.update()
      this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
    }
    return this.model
  }

  async redo(): Promise<OIModel>
  {
    this.#logger.info("redo")
    if (this.history.context.canRedo) {
      this.internalEvent.emitIdle(false)
      this.unselectAll()
      const nextStackItem = this.history.redo()
      const modifications = nextStackItem.model.extractDifferenceSymbols(this.model)
      this.#model = nextStackItem.model.clone()
      this.#logger.debug("redo", { modifications })
      const actionsToBackend = this.extractActionsToBackend(nextStackItem.actions)
      modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
      modifications.added.forEach(s => this.renderer.drawSymbol(s))
      if (
        actionsToBackend.added?.length ||
        actionsToBackend.erased?.length ||
        actionsToBackend.replaced?.newSymbols.length ||
        actionsToBackend.transformed?.length
      ) {
        await this.recognizer.redo(actionsToBackend)
      }
      this.menu.update()
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
    }
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

  protected getSymbolsBounds(symbols: TOISymbol[]): Box
  {
    const box = Box.createFromBoxes(symbols.map(s => s.boundingBox))
    box.x -= SELECTION_MARGIN
    box.y -= SELECTION_MARGIN
    box.width += SELECTION_MARGIN * 2
    box.height += SELECTION_MARGIN * 2
    return box
  }

  protected buildBlobFromSymbols(symbols: TOISymbol[], box: Box): Blob
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
    } catch {
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

  downloadAsJPG(selection = false)
  {
    const symbols = selection ? this.model.symbolsSelected : this.model.symbols
    const box = this.getSymbolsBounds(symbols)
    const svgBlob = this.buildBlobFromSymbols(symbols, box)

    const url = URL.createObjectURL(svgBlob)
    const image = new Image()
    image.width = box.width
    image.height = box.height
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

      this.triggerDownload(this.getExportName("jpg"), imgURI)
    }
  }

  downloadAsJson(selection = false)
  {
    const symbolsToExport = selection ? this.model.symbolsSelected : this.model.symbols
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(symbolsToExport, null, 2))
    this.triggerDownload(this.getExportName("json"), dataStr)
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
      await this.converter.apply()
    } catch (error) {
      this.#logger.error("convert", error)
      this.internalEvent.emitError(error as Error)
    }
    finally {
      this.menu.update()
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
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
        this.selector.removeSelectedGroup()
        const erased = this.model.symbols
        this.renderer.clear()
        this.model.clear()
        this.history.push(this.model, { erased })
        if (erased.some(s => s.type === SymbolType.Stroke)) {
          await this.recognizer.clear()
        }
        this.internalEvent.emitSelected(this.model.symbolsSelected)
      }
      this.menu.update()
    }
    catch (error) {
      this.#logger.error("clear", error)
      this.internalEvent.emitError(error as Error)
    }
    finally {
      this.menu.update()
      await this.svgDebugger.apply()
      await this.recognizer.waitForIdle()
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
