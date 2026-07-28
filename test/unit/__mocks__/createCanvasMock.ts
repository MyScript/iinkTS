import { IIModel } from "@/model"
import {
  DefaultInteractiveInkCanvasConfiguration,
  InteractiveInkCanvasConfiguration,
} from "@/canvas/variants/InteractiveInkCanvasConfiguration"
import { DefaultStyle } from "@/style/Style"
import { CanvasTool, CanvasWriteTool } from "@/Constants"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TStyle } from "@/style"
import type { TSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"
import type { TStroke } from "@/symbol/stroke/Stroke"
import { DOMFactory } from "@/components/dom"
import { CanvasLayer } from "@/canvas/CanvasLayer"
import { CanvasEventMock } from "./CanvasEventMock"

/**
 * Returns a jest.fn()-backed stub that satisfies any interface structurally.
 * Memoizes on first access so call counts are consistent across multiple gets.
 * Supports property assignment so tests can override specific methods:
 *   `canvas.selector.removeSelectedGroup = jest.fn()`
 */
function stubManager<T>(): T {
  const store: Record<string | symbol, unknown> = {}
  return new Proxy(store, {
    get: (target, prop) => {
      if (prop === "then") return undefined
      if (!(prop in target)) {
        target[prop] = jest.fn()
      }
      return target[prop]
    },
    set: (target, prop, value) => {
      target[prop] = value
      return true
    },
  }) as unknown as T
}

export type TRendererStub = {
  init: jest.Mock
  layer: SVGSVGElement
  verticalGuides: number[]
  horizontalGuides: number[]
  drawSymbol: jest.Mock
  drawCurrentSymbol: jest.Mock
  clearCurrentSymbolLayer: jest.Mock
  updateSelectedState: jest.Mock
  updateDeletingState: jest.Mock
  removeSymbol: jest.Mock
  removeElement: jest.Mock
  drawCircle: jest.Mock
  drawRect: jest.Mock
  drawLine: jest.Mock
  drawConnectionBetweenBox: jest.Mock
  clearElements: jest.Mock
  resize: jest.Mock
  clear: jest.Mock
  parent: HTMLElement
  getZoom: jest.Mock
  setZoom: jest.Mock
  getRenderingContext: jest.Mock
  getBounds: jest.Mock
  getViewBox: jest.Mock
  setViewBox: jest.Mock
  pan: jest.Mock
  ensurePointVisible: jest.Mock
  redrawGuides: jest.Mock
  setAttribute: jest.Mock
  appendElement: jest.Mock
  prependElement: jest.Mock
  buildElementFromSymbol: jest.Mock
}

function createRendererStub(): TRendererStub {
  const renderingContext = document.createElement("div")
  const layer = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement
  let _viewBox = { x: 0, y: 0, width: 400, height: 400 }
  return {
    init: jest.fn(),
    layer,
    verticalGuides: [],
    horizontalGuides: [],
    drawSymbol: jest.fn(),
    drawCurrentSymbol: jest.fn(),
    clearCurrentSymbolLayer: jest.fn(),
    updateSelectedState: jest.fn(),
    updateDeletingState: jest.fn(),
    removeSymbol: jest.fn(),
    removeElement: jest.fn(),
    drawCircle: jest.fn(),
    drawRect: jest.fn(),
    drawLine: jest.fn(),
    drawConnectionBetweenBox: jest.fn(),
    clearElements: jest.fn(),
    resize: jest.fn(),
    clear: jest.fn(),
    parent: document.createElement("div"),
    getZoom: jest.fn().mockReturnValue(1),
    setZoom: jest.fn(),
    getRenderingContext: jest.fn().mockReturnValue(renderingContext),
    getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
    getViewBox: jest.fn().mockImplementation(() => ({ ..._viewBox })),
    setViewBox: jest.fn().mockImplementation((x: number, y: number, width: number, height: number) => {
      _viewBox = { x, y, width, height }
    }),
    pan: jest.fn(),
    ensurePointVisible: jest.fn(),
    redrawGuides: jest.fn(),
    setAttribute: jest.fn(),
    appendElement: jest.fn().mockImplementation((el: Element) => {
      layer.appendChild(el)
    }),
    prependElement: jest.fn().mockImplementation((el: Element) => {
      layer.prepend(el)
    }),
    buildElementFromSymbol: jest.fn().mockImplementation(() => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g")
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      g.appendChild(text)
      return g
    }),
  }
}

/**
 * TCanvasMock replaces the concrete SVGRenderer with a lightweight stub.
 * SVGRenderer has private fields so plain objects can't satisfy its type.
 * Pass TCanvasMock to managers via `asCanvas(canvas)`.
 */
export type TCanvasMock = Omit<TInteractiveInkCanvas, "renderer"> & {
  renderer: TRendererStub
  /** init() is public API but not yet in TInteractiveInkCanvas — exposed here for tests that call canvas.init() */
  init: jest.Mock<Promise<void>>
}

/**
 * Lightweight factory returning a plain object satisfying TInteractiveInkCanvas.
 * No real canvas is instantiated — all methods are jest.fn().
 *
 * Note: the return type exposes `renderer` as `TRendererStub` (not `SVGRenderer`)
 * because SVGRenderer has private fields. Pass to managers with `asCanvas(canvas)`.
 * When a `TRenderer` interface is extracted from SVGRenderer the cast goes away.
 *
 * @param overrides - Partial overrides merged on top of defaults.
 *
 * @example
 * const canvas = createCanvasMock()
 * const manager = new IIMoveManager(asCanvas(canvas))
 * // introspect: canvas.renderer.drawSymbol.mock.calls
 *
 * @example with model pre-populated
 * const model = new IIModel()
 * model.addSymbol(buildIIStroke())
 * const canvas = createCanvasMock({ model })
 */
export function createCanvasMock(overrides: Partial<TCanvasMock> = {}): TCanvasMock {
  const configuration =
    overrides.configuration ??
    new InteractiveInkCanvasConfiguration(JSON.parse(JSON.stringify(DefaultInteractiveInkCanvasConfiguration)))
  const model = overrides.model ?? new IIModel()
  const renderer = overrides.renderer ?? createRendererStub()
  const event = overrides.event ?? new CanvasEventMock(document.createElement("div"))
  const client = overrides.client ?? stubManager()
  if (!overrides.client) {
    // client.event.addXListener(...) is called from manager constructors (e.g. IIGestureManager) —
    // nest another auto-stub proxy so any listener-registration method resolves to a jest.fn().
    // Must be a direct assignment (not `??=`): reading `.event` through the proxy would already
    // auto-vivify it to a plain jest.fn() before the nullish check runs.
    ;(client as unknown as { event: unknown }).event = stubManager()
  }

  let _penStyle: TStyle = { ...DefaultStyle }
  let _tool: CanvasTool = CanvasTool.Write
  const _activeOperations = new Map<string, number>()

  const base = {
    model,
    renderer,
    client,
    configuration,
    event,
    layers: overrides.layers ?? new CanvasLayer(document.createElement("div")),
    dom: overrides.dom ?? DOMFactory,
    history: overrides.history ?? stubManager(),
    writer:
      overrides.writer ??
      (() => {
        const w = stubManager()
        ;(w as unknown as Record<string, unknown>).tool = CanvasWriteTool.Pencil
        ;(w as unknown as Record<string, unknown>).currentSymbol = undefined
        return w
      })(),
    keyboard: overrides.keyboard ?? stubManager(),
    eraser: overrides.eraser ?? stubManager(),
    selector: overrides.selector ?? stubManager(),
    move: overrides.move ?? stubManager(),
    gesture: overrides.gesture ?? stubManager(),
    transform: overrides.transform ?? stubManager(),
    converter: overrides.converter ?? stubManager(),
    typeset: overrides.typeset ?? stubManager(),
    overlays:
      overrides.overlays ??
      (() => {
        const o = stubManager()
        ;(o as unknown as Record<string, unknown>).getConfig = jest.fn().mockReturnValue({
          showBlockOverlays: false,
          badgeSize: 20,
          borderWidth: 2,
          panelPadding: 8,
          labelMaxChars: 10,
          labelFontSize: 12,
        })
        return o
      })(),
    snaps:
      overrides.snaps ??
      (() => {
        const s = stubManager()
        ;(s as unknown as Record<string, unknown>).snapConfiguration = { angle: 0, guide: true, symbol: true }
        ;(s as unknown as Record<string, unknown>).snapResize = jest
          .fn()
          .mockImplementation((point: { x: number; y: number }) => point)
        ;(s as unknown as Record<string, unknown>).snapTranslate = jest
          .fn()
          .mockImplementation((x: number, y: number) => ({ x, y }))
        ;(s as unknown as Record<string, unknown>).snapRotation = jest.fn().mockImplementation((angle: number) => angle)
        return s
      })(),
    synchronizer: overrides.synchronizer ?? stubManager(),
    jiix:
      overrides.jiix ??
      (() => {
        const j = stubManager()
        ;(j as unknown as Record<string, unknown>).getTextSelectionGroups = jest.fn().mockReturnValue([])
        ;(j as unknown as Record<string, unknown>).getMathSelectionGroups = jest.fn().mockReturnValue([])
        ;(j as unknown as Record<string, unknown>).getShapeSelectionGroups = jest.fn().mockReturnValue([])
        return j
      })(),
    math:
      overrides.math ??
      (() => {
        const m = stubManager()
        ;(m as unknown as Record<string, unknown>).getComputationConfig = jest
          .fn()
          .mockReturnValue({ resultMode: "draw", autoCompute: false, resultColor: "#4caf50" })
        ;(m as unknown as Record<string, unknown>).getVariablesConfig = jest
          .fn()
          .mockReturnValue({ showDependencyOnHover: false, highlightOnSelect: false })
        return m
      })(),
    connector: overrides.connector ?? stubManager(),
    menu:
      overrides.menu ??
      (() => {
        const m = stubManager()
        ;(m as unknown as Record<string, unknown>).context = {
          wrapper: undefined,
          position: { x: 0, y: 0 },
          hide: jest.fn(),
          show: jest.fn(),
          update: jest.fn(),
        }
        ;(m as unknown as Record<string, unknown>).style = {
          update: jest.fn(),
          show: jest.fn(),
          hide: jest.fn(),
        }
        return m
      })(),

    get penStyle(): TStyle {
      return _penStyle
    },
    set penStyle(v: Partial<TStyle>) {
      _penStyle = { ..._penStyle, ...v }
    },
    get tool(): CanvasTool {
      return _tool
    },
    set tool(v: CanvasTool) {
      _tool = v
    },

    init: jest.fn().mockImplementation(() => {
      const gap = configuration.rendering.guides.gap
      if (gap > 0) {
        const extent = Math.max(400, gap * 50)
        renderer.verticalGuides = []
        renderer.horizontalGuides = []
        for (let x = -extent; x < extent; x += gap) {
          renderer.verticalGuides.push(x)
        }
        for (let y = -extent; y < extent; y += gap) {
          renderer.horizontalGuides.push(y)
        }
      }
      return Promise.resolve()
    }),
    createSymbols: jest.fn().mockResolvedValue([]),
    addSymbol: jest.fn().mockImplementation((sym: unknown) => Promise.resolve(sym)),
    addSymbols: jest.fn().mockImplementation((syms: unknown) => Promise.resolve(syms)),
    updateSymbol: jest.fn().mockImplementation((sym: unknown) => Promise.resolve(sym)),
    updateSymbols: jest.fn().mockImplementation((syms: unknown) => Promise.resolve(syms)),
    updateSymbolsStyle: jest.fn(),
    updateTextFontStyle: jest.fn(),
    replaceSymbols: jest.fn().mockResolvedValue(undefined),
    changeOrderSymbols: jest.fn(),
    removeSymbol: jest.fn().mockResolvedValue(undefined),
    removeSymbols: jest.fn().mockResolvedValue([]),
    extractStrokesFromSymbols: jest
      .fn()
      .mockImplementation((syms: TSymbol[] | undefined) =>
        (syms ?? []).filter((s): s is TStroke => s.type === SymbolType.Stroke)
      ),
    duplicate: jest.fn().mockResolvedValue([]),
    select: jest.fn(),
    selectAll: jest.fn(),
    unselectAll: jest.fn(),
    getSymbolsBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 0, height: 0 }),
    zoomToFit: jest.fn(),
    zoom: jest.fn(),
    undo: jest.fn().mockResolvedValue(model),
    redo: jest.fn().mockResolvedValue(model),
    copy: jest.fn(),
    cut: jest.fn().mockResolvedValue(undefined),
    paste: jest.fn().mockResolvedValue(undefined),
    export: jest.fn().mockResolvedValue({}),
    convert: jest.fn().mockResolvedValue(undefined),
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    downloadAsSVG: jest.fn(),
    downloadAsPNG: jest.fn(),
    downloadAsJson: jest.fn(),
    downloadAsText: jest.fn(),
    clear: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    resize: jest.fn().mockResolvedValue(undefined),
    setCssVars: jest.fn(),
    manageError: jest.fn(),
    connectionState: "online-idle",
    trackOperation: jest.fn().mockImplementation((_label: string, fn: () => Promise<unknown>) => fn()),
    startOperation: jest.fn().mockImplementation((label: string) => {
      _activeOperations.set(label, (_activeOperations.get(label) ?? 0) + 1)
    }),
    endOperation: jest.fn().mockImplementation((label: string) => {
      const count = _activeOperations.get(label) ?? 0
      if (count <= 1) {
        _activeOperations.delete(label)
      } else {
        _activeOperations.set(label, count - 1)
      }
    }),
    hasOperation: jest.fn().mockImplementation((label: string) => _activeOperations.has(label)),
  }

  Object.defineProperty(base, "renderingConfiguration", {
    set: jest.fn(),
    configurable: true,
  })

  Object.assign(base, overrides)

  return base as unknown as TCanvasMock
}

/**
 * Casts TCanvasMock to TInteractiveInkCanvas for passing to managers.
 * The cast is necessary because TCanvasMock uses TRendererStub instead of SVGRenderer.
 */
export function asCanvas(mock: TCanvasMock): TInteractiveInkCanvas {
  return mock as unknown as TInteractiveInkCanvas
}
