# InkCanvas — Architecture

`InkCanvas` is the HTTP batch editor variant (INKV2 protocol — simpler, stateless, `Canvas.load(element, "INKV2", options)`). It is a **sibling** of `InteractiveInkCanvas`, not a subclass — both extend the same `AbstractCanvas` base.

The legacy `InkCanvasDeprecated` (INKV1, `@deprecated`) is documented alongside it since it shares the base class and illustrates why `InkCanvas` was introduced, but new code should never use it.

## Overview

```mermaid
classDiagram
  class AbstractCanvas {
    <<abstract>>
  }
  AbstractCanvas <|-- InkCanvas
  AbstractCanvas <|-- InkCanvasDeprecated

  class AbstractWriterManager {
    <<abstract>>
  }
  AbstractWriterManager <|-- IWriterManager

  InkCanvas *-- IWriterManager : writer
  InkCanvas *-- EraseManager : eraser
  InkCanvas *-- IDebugSVGManager : debugger
  InkCanvas *-- IHistoryManager : history
  InkCanvas *-- HTTPClientV2 : client
  InkCanvas o-- SVGRenderer : renderer
  InkCanvas o-- IModel : model
  InkCanvas *-- InkCanvasConfiguration : configuration

  InkCanvasDeprecated *-- PointerEventGrabber : grabber
  InkCanvasDeprecated *-- HistoryManager : history
  InkCanvasDeprecated *-- StyleManager : styleManager
  InkCanvasDeprecated *-- HTTPClientV1 : client
  InkCanvasDeprecated o-- CanvasRenderer : renderer
  InkCanvasDeprecated o-- Model : model
  InkCanvasDeprecated *-- InkCanvasDeprecatedConfiguration : configuration

  AbstractHistoryStack~T~ <|-- IHistoryManager
  AbstractHistoryStack~T~ <|-- HistoryManager

  IWriterManager ..> PointerEventGrabber : creates (via base ctor)
  EraseManager ..> PointerEventGrabber : creates
```

Notes:
- `EraseManager` and `AbstractWriterManager` are **shared** with `InteractiveInkCanvas` (typed to accept either canvas) — they are not `InkCanvas`-exclusive.
- `InkCanvasDeprecated` does **not** reuse `EraseManager`/`AbstractWriterManager`: it hand-rolls pointer handling directly (`onPointerDown`/`onPointerMove`/`onPointerUp`) plus a bare `PointerEventGrabber`.
- `ColorPaletteManager` is **not** used anywhere in this graph — it's exclusive to `InteractiveInkCanvas`'s math/overlay managers.

## Complete

```mermaid
classDiagram
  class AbstractCanvas {
    <<abstract>>
    +logger
    +layers: CanvasLayer
    +event: CanvasEvent
    +connectionState: TCanvasConnectionState
    +trackOperation(label, fn) Promise~T~
    +startOperation(label) void
    +endOperation(label) void
    +loadInfo(server) Promise~TApiInfos~
    +initialize()* Promise~void~
    +clear()* Promise~void~
    +destroy()* Promise~void~
    +resize(dims?)* Promise~void~
  }

  class InkCanvas {
    +renderer: SVGRenderer
    +client: HTTPClientV2
    +history: IHistoryManager
    +writer: IWriterManager
    +eraser: EraseManager
    +debugger: IDebugSVGManager
    +tool: CanvasTool
    +constructor(rootElement, options?)
    +initialize() Promise~void~
    +updateSymbolsStyle(ids, style) void
    +export(mimeTypes?) Promise~TExportV2~
    +removeStrokes(ids) Promise~void~
    +undo() Promise~void~
    +redo() Promise~void~
    +resize(dims?) Promise~void~
    +clear() Promise~void~
    +destroy() Promise~void~
  }
  AbstractCanvas <|-- InkCanvas

  class InkCanvasDeprecated {
    +grabber: PointerEventGrabber
    +renderer: CanvasRenderer
    +client: HTTPClientV1
    +history: HistoryManager
    +styleManager: StyleManager
    +tool: CanvasTool
    +constructor(rootElement, options?)
    +initialize() Promise~void~
    +export(mimeTypes?) Promise~Model~
    +convert(params?) Promise~Model~
    +importPointEvents(strokes) Promise~Model~
    +undo() Promise~void~
    +redo() Promise~void~
    +resize(dims?) Promise~void~
    +clear() Promise~void~
    +destroy() Promise~void~
  }
  AbstractCanvas <|-- InkCanvasDeprecated

  class AbstractWriterManager {
    <<abstract>>
    +canvas: TInteractiveInkCanvas|InkCanvas
    +grabber
    +currentSymbol
    +attach(layer) void
    +detach() void
    +start(info) void
    +continue(info) void
    +end(info)* Promise~void~
  }

  class IWriterManager {
    +constructor(canvas)
    +model: IModel
    +end(info) Promise~void~
  }
  AbstractWriterManager <|-- IWriterManager

  class EraseManager {
    +canvas: TInteractiveInkCanvas|InkCanvas
    +eraserWidth: number
    +constructor(canvas)
    +attach(layer) void
    +detach() void
    +start(info) void
    +continue(info) void
    +end(info) Promise~void~
  }

  class IDebugSVGManager {
    +canvas: InkCanvas
    +constructor(canvas)
    +recognitionBoxVisibility: boolean
    +debugRecognitionBox() Promise~void~
    +debugRecognitionBoxItems() Promise~void~
    +apply() void
  }

  class AbstractHistoryStack~TStackItem~ {
    <<abstract>>
    +configuration: THistoryConfiguration
    +stack: TStackItem[]
    +pop() void
    +clear() void
  }
  class IHistoryManager {
    +updateModelStack(model) void
    +init(model) void
    +push(model, changes) void
    +undo() TIHistoryStackItem
    +redo() TIHistoryStackItem
  }
  class HistoryManager {
    +push(model) void
    +updateStack(model) void
    +undo() Model
    +redo() Model
  }
  AbstractHistoryStack <|-- IHistoryManager
  AbstractHistoryStack <|-- HistoryManager

  class HTTPClientV2 {
    +configuration: HTTPClientV2Configuration
    +constructor(config)
    +url: string
    +send(strokes, mimeTypes?) Promise~TExportV2~
  }

  class HTTPClientV1 {
    +configuration: HTTPClientV1Configuration
    +constructor(config)
    +url: string
    +convert(model, state?, mimeTypes?) Promise~Model~
    +export(model, mimeTypes?) Promise~Model~
    +resize(model) Promise~Model~
  }

  class StyleManager {
    +constructor(penStyle?, theme?)
    +currentPenStyle: TPenStyle
    +setPenStyle(style?) void
    +theme: TTheme
    +setTheme(theme?) void
  }

  class PointerEventGrabber {
    +configuration: TGrabberConfiguration
    +onPointerDown: fn
    +onPointerMove: fn
    +onPointerUp: fn
    +constructor(configuration)
    +attach(layer) void
    +detach() void
    +stopPointerEvent() void
  }

  InkCanvas *-- IWriterManager : writer
  InkCanvas *-- EraseManager : eraser
  InkCanvas *-- IDebugSVGManager : debugger
  InkCanvas *-- IHistoryManager : history
  InkCanvas *-- HTTPClientV2 : client
  InkCanvasDeprecated *-- PointerEventGrabber : grabber
  InkCanvasDeprecated *-- HistoryManager : history
  InkCanvasDeprecated *-- StyleManager : styleManager
  InkCanvasDeprecated *-- HTTPClientV1 : client
  IWriterManager ..> PointerEventGrabber : creates
  EraseManager ..> PointerEventGrabber : creates
```

## Source files

| Class | File |
|---|---|
| `InkCanvas` | `src/canvas/variants/InkCanvas.ts` |
| `InkCanvasDeprecated` | `src/canvas/variants/InkCanvasDeprecated.ts` |
| `AbstractCanvas` | `src/canvas/AbstractCanvas.ts` |
| `IWriterManager` (simple) | `src/manager/simple/IWriterManager.ts` |
| `AbstractWriterManager` / `EraseManager` | `src/manager/base/` |
| `IDebugSVGManager` | `src/manager/debug/IDebugSVGManager.ts` |
| `IHistoryManager` / `HistoryManager` / `AbstractHistoryStack` | `src/history/` |
| `HTTPClientV2` / `HTTPClientV1` | `src/client/` |
| `StyleManager` | `src/style/StyleManager.ts` |
| `PointerEventGrabber` | `src/grabber/PointerEventGrabber.ts` |
