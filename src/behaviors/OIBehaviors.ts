import { Intention, SELECTION_MARGIN } from "../Constants"
import { Configuration, TConfiguration, TRenderingConfiguration } from "../configuration"
import { InternalEvent } from "../event"
import { OIPointerEventGrabber } from "../grabber"
import { LoggerClass, LoggerManager } from "../logger"
import { OIModel, TExport, TJIIXTextElement } from "../model"
import
{
  Box,
  EdgeKind,
  OIDecorator,
  TOIEdge,
  OIEdgeArc,
  OIEdgeLine,
  OIEdgePolyLine,
  TOIShape,
  OIShapeCircle,
  OIShapeEllipse,
  OIShapePolygon,
  OIStroke,
  OISymbolGroup,
  OIText,
  ShapeKind,
  SymbolType,
  TOISymbol,
  TPoint,
  TPointer,
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
import { OIHistoryManager, TOIHistoryBackendChanges, TOIHistoryChanges } from "../history"
import { PartialDeep, mergeDeep } from "../utils"
import { IBehaviors } from "./IBehaviors"
import { TBehaviorOptions } from "./TBehaviorOptions"

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
  #layerInfosTimer?: ReturnType<typeof setTimeout>
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
    this.gesture = new OIGestureManager(this, options.behaviors?.gesture)
    this.resizer = new OIResizeManager(this)
    this.rotator = new OIRotationManager(this)
    this.translator = new OITranslateManager(this)
    this.converter = new OIConversionManager(this, options.fontStyle)
    this.texter = new OITextManager(this)
    this.selector = new OISelectionManager(this)
    this.svgDebugger = new OIDebugSVGManager(this)
    this.snaps = new OISnapManager(this, options.behaviors?.snap)
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
    this.model.rowHeight = this.configuration.rendering.guides.gap
    this.history.stack.forEach(i => i.model.rowHeight = this.model.rowHeight)
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


  updateLayerInfos(): void
  {
    clearTimeout(this.#layerInfosTimer)
    this.#layerInfosTimer = setTimeout(() =>
    {
      this.menu.update()
      this.svgDebugger.apply()
      this.recognizer.waitForIdle()
    }, 1500)
  }

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
    }
    catch (error) {
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
    }
    catch (error) {
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
          this.eraser.end(pointer)
          break
        case Intention.Select:
          this.selector.end(pointer)
          break
        case Intention.Move:
          this.move.end(evt)
          break
        default:
          this.writer.end(pointer)
          break
      }
    }
    catch (error) {
      this.undo()
      this.#logger.error("onPointerUp", error)
      this.internalEvent.emitError(error as Error)
    }
    finally {
      this.updateLayerInfos()
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
    this.history.init(this.model)

    await this.recognizer.init()
    await this.setPenStyle(this.penStyle)
    await this.setTheme(this.theme)
    await this.setPenStyleClasses(this.penStyleClasses)
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
    }
    catch (error) {
      this.#logger.error("changeLanguage", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
    finally {
      this.updateLayerInfos()
    }
  }

  protected createShape(partialShape: PartialDeep<TOIShape>): TOIShape
  {
    switch (partialShape.kind) {
      case ShapeKind.Circle:
        return OIShapeCircle.create(partialShape as PartialDeep<OIShapeCircle>)
      case ShapeKind.Ellipse:
        return OIShapeEllipse.create(partialShape as PartialDeep<OIShapeEllipse>)
      case ShapeKind.Polygon:
        return OIShapePolygon.create(partialShape as PartialDeep<OIShapePolygon>)
      default:
        throw new Error(`Unable to create shape, kind: "${ partialShape.kind }" is unknown`)
    }
  }

  protected createEdge(partialEdge: PartialDeep<TOIEdge>): TOIEdge
  {
    switch (partialEdge.kind) {
      case EdgeKind.Arc:
        return OIEdgeArc.create(partialEdge as PartialDeep<OIEdgeArc>)
      case EdgeKind.Line:
        return OIEdgeLine.create(partialEdge as PartialDeep<OIEdgeLine>)
      case EdgeKind.PolyEdge:
        return OIEdgePolyLine.create(partialEdge as PartialDeep<OIEdgePolyLine>)
      default:
        throw new Error(`Unable to create edge, kind: "${ partialEdge.kind }" is unknown`)
    }
  }

  protected createGroup(partialGroup: PartialDeep<OISymbolGroup>): OISymbolGroup
  {
    if (!partialGroup.children?.length) {
      throw new Error(`Unable to create group, no children`)
    }

    const children = partialGroup.children.map(partialSymbol =>
    {
      switch (partialSymbol?.type) {
        case SymbolType.Stroke:
          return OIStroke.create(partialSymbol as PartialDeep<OIStroke>)
        case SymbolType.Shape:
          return this.createShape(partialSymbol as PartialDeep<TOIShape>)
        case SymbolType.Edge:
          return this.createEdge(partialSymbol as PartialDeep<TOIEdge>)
        case SymbolType.Text:
          return OIText.create(partialSymbol as PartialDeep<OIText>)
        case SymbolType.Group:
          return this.createGroup(partialSymbol as PartialDeep<OISymbolGroup>)
        default:
          throw new Error(`Unable to create group, symbol type '${ JSON.stringify(partialSymbol) } is unknow`)
      }
    })
    const group = new OISymbolGroup(children, partialGroup.style)
    if (partialGroup.id) {
      group.id = partialGroup.id
    }
    if (partialGroup.decorators) {
      group.decorators = partialGroup.decorators.map(d => new OIDecorator(d!.kind!, d!.style!))
    }
    return group
  }

  protected createStroke(partialSymbol: PartialDeep<OIStroke>): OIStroke
  {
    return OIStroke.create(partialSymbol as PartialDeep<OIStroke>)
  }

  protected createText(partialSymbol: PartialDeep<OIText>): OIText
  {
    return OIText.create(partialSymbol as PartialDeep<OIText>)
  }

  async createSymbol(partialSymbol: PartialDeep<TOISymbol>): Promise<TOISymbol>
  {
    try {
      switch (partialSymbol.type) {
        case SymbolType.Stroke:
          return await this.addSymbol(this.createStroke(partialSymbol))
        case SymbolType.Shape:
          return await this.addSymbol(this.createShape(partialSymbol))
        case SymbolType.Edge:
          return await this.addSymbol(this.createEdge(partialSymbol))
        case SymbolType.Text:
          return await this.addSymbol(this.createText(partialSymbol))
        case SymbolType.Group:
          return await this.addSymbol(this.createGroup(partialSymbol))
        default:
          throw new Error(`Unable to create symbol, type: "${ partialSymbol.type }" is unknown`)
      }
    }
    catch (error) {
      this.#logger.error("createSymbol", error)
      this.updateLayerInfos()
      this.internalEvent.emitError(error as Error)
      throw error
    }
  }

  async createSymbols(partialSymbols: PartialDeep<TOISymbol>[]): Promise<TOISymbol[]>
  {
    try {
      const errors: string[] = []
      const symbols: TOISymbol[] = []
      partialSymbols.forEach(partialSymbol =>
      {
        try {
          switch (partialSymbol.type) {
            case SymbolType.Stroke:
              symbols.push(this.createStroke(partialSymbol))
              break
            case SymbolType.Shape:
              symbols.push(this.createShape(partialSymbol))
              break
            case SymbolType.Edge:
              symbols.push(this.createEdge(partialSymbol))
              break
            case SymbolType.Text:
              symbols.push(this.createText(partialSymbol))
              break
            case SymbolType.Group:
              symbols.push(this.createGroup(partialSymbol))
              break
            default:
              errors.push(`Unable to create symbol, type: "${ partialSymbol.type }" is unknown`)
          }
        } catch (error) {
          errors.push(((error as Error).message || error) as string)
        }
      })
      if (errors.length) {
        throw new Error(errors.join("\n"))
      }
      return await this.addSymbols(symbols)
    } catch (error) {
      this.#logger.error("importPointEvents", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
  }

  async addSymbol(sym: TOISymbol, addToHistory = true): Promise<TOISymbol>
  {
    this.#logger.info("addSymbol", { sym })
    this.internalEvent.emitIdle(false)
    if (sym.type === SymbolType.Text) {
      this.texter.updateBounds(sym)
    }
    else if (sym.type === SymbolType.Group) {
      sym.extractSymbols().forEach(t =>
      {
        if (t.type === SymbolType.Text) {
          this.texter.updateBounds(t)
        }
      })
    }
    this.model.addSymbol(sym)
    this.renderer.drawSymbol(sym)

    const strokes = this.extractStrokesFromSymbols([sym])
    this.recognizer.addStrokes(strokes, false)

    if (addToHistory) {
      this.history.push(this.model, { added: [sym] })
    }
    this.updateLayerInfos()
    return sym
  }

  async addSymbols(symList: TOISymbol[], addToHistory = true): Promise<TOISymbol[]>
  {
    this.#logger.info("addSymbol", { symList })
    this.internalEvent.emitIdle(false)
    symList.forEach(s =>
    {
      if (s.type === SymbolType.Text) {
        this.texter.updateBounds(s)
      }
      else if (s.type === SymbolType.Group) {
        s.extractSymbols().forEach(t =>
        {
          if (t.type === SymbolType.Text) {
            this.texter.updateBounds(t)
          }
        })
      }
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    const strokes = this.extractStrokesFromSymbols(symList)
    this.recognizer.addStrokes(strokes, false)
    if (addToHistory) {
      this.history.push(this.model, { added: symList })
    }
    this.updateLayerInfos()
    return symList
  }

  async updateSymbol(sym: TOISymbol, addToHistory = true): Promise<TOISymbol>
  {
    this.#logger.info("updateSymbol", { sym })
    this.internalEvent.emitIdle(false)
    if (sym.type === SymbolType.Text) {
      this.texter.updateBounds(sym)
    }
    else if (sym.type === SymbolType.Group) {
      sym.extractSymbols().forEach(t =>
      {
        if (t.type === SymbolType.Text) {
          this.texter.updateBounds(t)
        }
      })
    }
    this.model.updateSymbol(sym)
    this.renderer.drawSymbol(sym)
    const strokes = this.extractStrokesFromSymbols([sym])
    this.recognizer.replaceStrokes(strokes.map(s => s.id), strokes)
    if (addToHistory) {
      this.history.push(this.model, { updated: [sym] })
    }
    this.updateLayerInfos()
    return sym
  }

  async updateSymbols(symList: TOISymbol[], addToHistory = true): Promise<TOISymbol[]>
  {
    this.#logger.info("updateSymbol", { symList })
    this.internalEvent.emitIdle(false)
    symList.forEach(s =>
    {
      if (s.type === SymbolType.Text) {
        this.texter.updateBounds(s)
      }
      else if (s.type === SymbolType.Group) {
        s.extractSymbols().forEach(t =>
        {
          if (t.type === SymbolType.Text) {
            this.texter.updateBounds(t)
          }
        })
      }
      this.model.updateSymbol(s)
      this.renderer.drawSymbol(s)
    })
    const strokes = this.extractStrokesFromSymbols(symList)
    this.recognizer.replaceStrokes(strokes.map(s => s.id), strokes)
    if (addToHistory) {
      this.history.push(this.model, { updated: symList })
    }
    this.updateLayerInfos()
    return symList
  }

  updateSymbolsStyle(symbolIds: string[], style: TStyle, addToHistory = true): void
  {
    this.#logger.info("updateSymbolsStyle", { symbolIds, style })
    const symbols: TOISymbol[] = []
    this.model.symbols.forEach(s =>
    {
      if (symbolIds.includes(s.id)) {
        s.style = Object.assign({}, s.style, style)
        if (s.type === SymbolType.Text) {
          s.chars.forEach(c =>
          {
            if (style.color) {
              c.color = style.color
            }
          })
        }
        else if (s.type === SymbolType.Group) {
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

  updateTextFontStyle(textIds: string[], { fontSize, fontWeight }: { fontSize?: number, fontWeight?: "normal" | "bold" }): void
  {
    this.#logger.info("updateTextFontStyle", { textIds, fontSize, fontWeight })
    const symbols: (OIText | OISymbolGroup)[] = []
    const translate: { symbols: TOISymbol[], tx: number, ty: number }[] = []
    this.model.symbols.forEach(s =>
    {
      if (textIds.includes(s.id)) {
        if (s.type === SymbolType.Text) {
          s.chars.forEach(tc => {
            if (fontSize) {
              tc.fontSize = fontSize
            }
            if (fontWeight) {
              tc.fontWeight = fontWeight
            }
          })
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
        else if ((s.type === SymbolType.Group && s.extractSymbols().some(c => c.type === SymbolType.Text))) {
          s.extractSymbols().forEach(c =>
          {
            if (c.type === SymbolType.Text) {
              c.chars.forEach(tc => {
                if (fontSize) {
                  tc.fontSize = fontSize
                }
                if (fontWeight) {
                  tc.fontWeight = fontWeight
                }
              })
              const lastWidth = s.bounds.width
              this.texter.updateBounds(c)
              const tx = s.bounds.width - lastWidth
              const symbolsTranslated = this.texter.moveTextAfter(c, tx)
              if (symbolsTranslated?.length) {
                translate.push({
                  symbols: symbolsTranslated,
                  tx,
                  ty: 0
                })
              }
              c.modificationDate = Date.now()
            }
          })
          s.modificationDate = Date.now()
          this.renderer.drawSymbol(s)
          symbols.push(s)

        }
      }
    })
    if (symbols.length) {
      this.history.push(this.model, { style: { symbols, fontSize }, translate })
    }
  }

  async replaceSymbols(oldSymbols: TOISymbol[], newSymbols: TOISymbol[], addToHistory = true): Promise<void>
  {
    this.#logger.info("replaceSymbol", { oldSymbols, newSymbols })
    this.internalEvent.emitIdle(false)

    const oldStrokes = this.extractStrokesFromSymbols(oldSymbols)
    const newStrokes = this.extractStrokesFromSymbols(newSymbols)

    const firstSym = oldSymbols[0]

    if (firstSym) {
      this.model.replaceSymbol(firstSym.id, newSymbols)
      this.renderer.replaceSymbol(firstSym.id, newSymbols)

      oldSymbols.slice(1).forEach(s =>
      {
        this.renderer.removeSymbol(s.id)
        this.model.removeSymbol(s.id)
      })

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
      this.updateLayerInfos()
    }
  }

  changeOrderSymbol(symbol: TOISymbol, position: "first" | "last" | "forward" | "backward"): void
  {
    this.model.changeOrderSymbol(symbol.id, position)
    this.renderer.changeOrderSymbol(symbol, position)
    this.history.push(this.model, { order: { symbols: [symbol], position } })
  }

  changeOrderSymbols(symbols: TOISymbol[], position: "first" | "last" | "forward" | "backward")
  {
    symbols.forEach(s =>
    {
      this.model.changeOrderSymbol(s.id, position)
      this.renderer.changeOrderSymbol(s, position)
    })
    this.history.push(this.model, { order: { symbols, position } })
  }

  groupSymbols(symbols: TOISymbol[]): OISymbolGroup
  {
    const group = this.createGroup({ children: symbols })
    symbols.forEach(s =>
    {
      this.model.removeSymbol(s.id)
      this.renderer.removeSymbol(s.id)
    })
    this.model.addSymbol(group)
    this.history.push(this.model, { group: { symbols } })
    return group
  }

  ungroupSymbol(group: OISymbolGroup): TOISymbol[]
  {
    group.children.forEach(s => this.renderer.drawSymbol(s))
    this.renderer.removeSymbol(group.id)
    this.model.replaceSymbol(group.id, group.children)
    this.history.push(this.model, { ungroup: { group } })
    return group.children
  }

  async groupStrokesByJIIXElement(): Promise<void>
  {
    await this.export(["application/vnd.myscript.jiix"])
    const strokes = this.model.symbols.filter(s => s.type === SymbolType.Stroke)
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    jiix?.elements?.forEach(el =>
    {
      if (el.type === "Text") {
        const jiixText = el as TJIIXTextElement
        jiixText.words?.forEach(w =>
        {
          const wordStrokes = strokes.filter(s => w.items?.map(s => s["full-id"]).includes(s.id))
          if (wordStrokes.length) {
            const orginDeco: OIDecorator[] = []
            let orginStyle: TStyle = wordStrokes[0].style
            if (w.items?.length !== wordStrokes.length) {
              w.items?.forEach(i =>
              {
                const sym = this.model.getRootSymbol(i["full-id"] as string)
                if (sym?.type === SymbolType.Group) {
                  orginDeco.push(...sym.decorators)
                  orginStyle = Object.assign({}, orginStyle, sym.style)
                  wordStrokes.push(...sym.extractStrokes())
                  this.model.removeSymbol(sym.id)
                  this.renderer.removeSymbol(sym.id)
                }
              })
            }
            const wordSymb = this.createGroup({ children: wordStrokes, style: orginStyle })
            orginDeco.forEach(d =>
            {
              if (!wordSymb.decorators.some(wd => wd.kind === d.kind)) {
                wordSymb.decorators.push(d)
              }
            })
            wordStrokes.map(s =>
            {
              this.model.removeSymbol(s.id)
              this.renderer.removeSymbol(s.id)
            })
            this.model.addSymbol(wordSymb)
            this.renderer.drawSymbol(wordSymb)
          }
        })
      }
      else {
        const strokesAssociated = strokes.filter(s => el.items?.map(s => s["full-id"]).includes(s.id))
        if (strokesAssociated.length) {
          const group = this.createGroup({ children: strokesAssociated })
          strokesAssociated.map(s =>
          {
            this.model.removeSymbol(s.id)
            this.renderer.removeSymbol(s.id)
          })
          this.model.addSymbol(group)
          this.renderer.drawSymbol(group)
        }
      }
    })
  }

  async removeSymbol(id: string, addToHistory = true): Promise<void>
  {
    this.#logger.info("removeSymbol", { id })
    const symbol = this.model.getRootSymbol(id)
    if (symbol) {
      this.internalEvent.emitIdle(false)
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
      this.updateLayerInfos()
    }
    else {
      this.renderer.removeSymbol(id)
      this.recognizer.eraseStrokes([id])
    }
  }

  async removeSymbols(ids: string[], addToHistory = true): Promise<TOISymbol[]>
  {
    this.#logger.info("removeSymbol", { ids })
    const symbolsToRemove: TOISymbol[] = []
    const strokesIds: string[] = []
    ids.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym) {
        symbolsToRemove.push(sym)
        switch (sym.type) {
          case SymbolType.Stroke:
            strokesIds.push(sym.id)
            break
          case SymbolType.Group:
            strokesIds.push(...sym.extractStrokes().map(s => s.id))
            break
        }
      }
    })
    this.recognizer.eraseStrokes(strokesIds)

    if (symbolsToRemove.length) {
      this.internalEvent.emitIdle(false)
      symbolsToRemove.forEach(s =>
      {
        this.model.removeSymbol(s.id)
        this.renderer.removeSymbol(s.id)
      })
      if (addToHistory) {
        this.history.push(this.model, { erased: symbolsToRemove })
      }
      this.updateLayerInfos()
    }
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
    this.internalEvent.emitSelected(this.model.symbolsSelected)
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

  async importPointEvents(partialStrokes: PartialDeep<OIStroke>[]): Promise<OIModel>
  {
    this.#logger.info("importPointEvents", { partialStrokes })
    this.internalEvent.emitIdle(false)
    const strokes = convertPartialStrokesToOIStrokes(partialStrokes)
    strokes.forEach(s =>
    {
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    this.recognizer.addStrokes(strokes, false)
    this.history.push(this.model, { added: strokes })
    this.#logger.debug("importPointEvents", this.model)
    this.updateLayerInfos()
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

  getSymbolsBounds(symbols: TOISymbol[], margin = SELECTION_MARGIN): Box
  {
    const box = Box.createFromBoxes(symbols.map(s => s.bounds))
    box.x -= margin
    box.y -= margin
    box.width += margin * 2
    box.height += margin * 2
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

      this.triggerDownload(this.getExportName("png"), imgURI)
    }
  }

  downloadAsJson(selection = false)
  {
    const symbolsToExport = selection ? this.model.symbolsSelected : this.model.symbols
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(symbolsToExport, null, 2))
    this.triggerDownload(this.getExportName("json"), dataStr)
  }

  extractStrokesFromSymbols(symbols: TOISymbol[] | undefined): OIStroke[]
  {
    if (!symbols?.length) return []
    const strokes: OIStroke[] = []
    symbols.forEach(s =>
    {
      switch (s.type) {
        case SymbolType.Stroke:
          strokes.push(s)
          break
        case SymbolType.Group:
          strokes.push(...s.extractStrokes())
          break
      }
    })
    return strokes
  }

  protected extractBackendChanges(changes: TOIHistoryChanges): TOIHistoryBackendChanges
  {
    const backendChanges: TOIHistoryBackendChanges = {}
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
      this.updateLayerInfos()
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

      this.updateLayerInfos()
    }
    return this.model
  }

  async export(mimeTypes?: string[]): Promise<OIModel>
  {
    try {
      this.#logger.info("export", { mimeTypes })
      const exports = await this.recognizer.export(mimeTypes)
      this.model.mergeExport(exports as TExport)
    }
    catch (error) {
      this.#logger.error("export", { error })
      this.internalEvent.emitError(error as Error)
      throw error
    }
    return this.model
  }

  async convert(): Promise<OIModel>
  {
    try {
      this.internalEvent.emitIdle(false)
      await this.converter.apply()
    }
    catch (error) {
      this.#logger.error("convert", error)
      this.internalEvent.emitError(error as Error)
      throw error
    }
    finally {
      this.updateLayerInfos()
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
    this.#logger.info("clear")
    this.internalEvent.emitIdle(false)
    if (this.model.symbols.length) {
      this.selector.removeSelectedGroup()
      const erased = this.model.symbols
      this.renderer.clear()
      this.model.clear()
      this.history.push(this.model, { erased })
      this.recognizer.clear()
      this.internalEvent.emitSelected(this.model.symbolsSelected)
    }
    this.updateLayerInfos()
    return this.model
  }

  async destroy(): Promise<void>
  {
    this.#logger.info("destroy")
    this.grabber.detach()
    this.renderer.destroy()
    this.menu.destroy()
    this.recognizer.destroy()
    this.model.clear()
    this.history.clear()
    return Promise.resolve()
  }
}
