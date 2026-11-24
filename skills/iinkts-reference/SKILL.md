---
name: iinkts-reference
description: iinkTS directory map, naming conventions, symbol hierarchy, manager sub-systems, and utility reference. Invoke for "where is X", "how is Y structured", or architecture lookup questions.
---

# iinkTS Reference

## Directory structure

```
src/
├── canvas/
│   ├── variants/        # InteractiveInkCanvas, InkCanvas, InkCanvasDeprecated, InteractiveInkSSRCanvas + their *Configuration
│   ├── AbstractCanvas.ts, CanvasFactory.ts, CanvasEvent.ts, CanvasLayer.ts
│   ├── TInteractiveInkCanvas.ts, TInkCanvas.ts, TCanvasOperationLabel.ts
│   └── Canvas.ts        # Public entry point
├── manager/
│   ├── base/            # AbstractWriterManager, EraseManager, ColorPaletteManager, ExportManager, PDFExportManager, LayoutManager, CanvasTool, TExport
│   ├── simple/          # IWriterManager
│   ├── debug/           # IDebugSVGManager
│   └── interactive/     # Core interactive managers
│       ├── math/        # IIMathComputationSubManager, IIMathFunctionEvaluationSubManager, IIMathVariableSubManager, IIMathCapabilitiesSubManager
│       ├── transform/   # AbstractTransformManager.ts (class IIAbstractTransformManager), IIResizeManager, IIRotationManager, IITranslateManager, ResizeDirection
│       ├── gestures/    # GestureHandler, GestureHelpers, GestureTypes, GestureAnnotation (IIGestureAnnotationProcessor), handlers/
│       ├── IIConnectorManager.ts, IIConversionManager.ts, IIExportManager.ts
│       ├── IIGestureManager.ts, IIJiixQueryManager.ts, IIKeyboardManager.ts
│       ├── IIMathManager.ts, IIMoveManager.ts, IIOverlayManager.ts, IIPlaybackManager.ts
│       ├── IISelectionManager.ts, IISnapManager.ts, IISynchronizerManager.ts
│       ├── IITransformManager.ts (orchestrator), IITypesetManager.ts, IIWriterManager.ts
│       ├── CanvasWriteTool.ts, GestureOperationLabels.ts
│       └── IIAbstractManager.ts
├── model/               # Model, IModel, IIModel
├── store/               # SymbolStore — IIModel's storage: frozen records, drafts
├── client/              # grouped by protocol; language.ts, font.ts at the root
│   ├── http/            # HTTPClientV1 (deprecated), HTTPClientV2, their configurations, HTTPRecognition
│   ├── websocket/       # WebSocketClient, WebSocketSSRClient, their configurations and messages
│   ├── jiix/            # The JIIX format: JIIX, JIIXCommon, JIIXMath, JIIXV2, JIIXEdgeGeometry
│   ├── shared/          # ClientEvent, ClientError, ServerConfiguration (serverUrl), StrokeSerializer, HmacAuth, crypto, infos, getJSON
│   └── recognition/     # Config files (MathConfiguration, TextConfiguration, etc.)
├── renderer/
│   ├── base/            # BaseRenderer
│   ├── canvas/          # CanvasRenderer, CanvasRendererShape/Stroke/Text — INK_V1 only
│   ├── ssr/             # SVGSSRenderer.ts (InteractiveInkSSRSVGRenderer), SVGStroker
│   └── svg/
│       ├── utils/       # SVGRendererConst, GUIDE_PATH_ATTRS; SVGBuilder is a re-export shim → @/symbol-utils
│       └── SVGRenderer.ts, SvgElementRole.ts
├── symbol-utils/        # Per-type rendering/behavior, plugin registry (see Symbol hierarchy below)
│   ├── SymbolUtil.ts            # Abstract base: type, create, getGeometry, getSVGElement + overridable capabilities
│   ├── PathSymbolUtil.ts        # Base for single-<path> symbols (getPathData + getPathAttributes)
│   ├── SymbolGeometry.ts        # Façade caching a Geometry2d per frozen symbol
│   ├── SymbolRegistry.ts        # symbolRegistry — register/lookup SymbolUtil by SymbolType
│   ├── KindDefinition.ts        # TKindDefinition — one entry per kind inside a type
│   ├── TransformContext.ts
│   ├── registerBuiltinSymbolUtils.ts  # Registers the 6 built-in Util classes at startup
│   ├── SymbolFactory.ts         # createSymbolFromPartial / createSymbolsFromPartial (functions, not a class)
│   ├── SVGBuilder.ts            # Real SVGBuilder implementation
│   ├── stroke/StrokeUtil.ts, typeset/{TypesetUtil,TextUtil,MathUtil}.ts
│   ├── shape/ShapeUtil.ts, edge/EdgeUtil.ts, decorator/DecoratorUtil.ts
│   └── edge/EdgeRenderOptions.ts
├── grabber/             # PointerEventGrabber
├── history/             # AbstractHistoryStack, AbstractDiffHistoryManager, HistoryManager, IHistoryManager, IIHistoryManager
├── symbol/              # Type + type guard, per type — nothing else
│   ├── stroke/          # TStroke, isStroke/isRecognizedMath/isRecognizedText
│   ├── typeset/         # TText/TSymbolChar/isText, TMath/TMathElement/isMath, TTypesetChild (rotation lives in symbol.transform)
│   ├── decorator/       # TDecorator, DecoratorKind, isDecorator
│   ├── eraser/          # TEraser, EraserOps — a transient tool, not a symbol type, so no util
│   ├── shape/           # TShapeCircle/Ellipse/Polygon, ShapeKind
│   ├── edge/            # TEdgeArc, TEdgeLine, TEdgePolyLine, TAnchor (smart connectors)
│   ├── Symbol.ts        # SymbolType enum, TBaseSymbol, TSymbol union
│   ├── SymbolHelpers.ts # cloneSymbol() only — NOT a dispatch class, see symbol-utils/ for that
│   └── legacy/          # Stroke, CanvasSymbol (deprecated v1)
├── menu/
│   ├── IIAbstractMenu.ts # base of the 4 menus: items, zones "bar"/"dropdown", dropdown mechanics
│   ├── IIMenuManager.ts # canvas.menu: builds the menus (override classes), item registry, setConfig
│   ├── actions/         # 17 action handlers (Clear, Convert, Export, Undo/Redo, Zoom, Theme, etc.)
│   ├── context/         # 10 context menus
│   ├── items/           # 10 item types (Button, ButtonList, Checkbox, ColorList, Range, Select, SubMenu, etc.)
│   ├── tools/           # 6 tools (Write, Erase, Select, Move, Shape, Edge)
│   └── styles/          # 7 style controls (stroke/fill color, thickness, opacity, pen nib, font size/weight)
├── components/          # Minimap, IIMath{CapabilitiesTable,DiagnosticChecker,FunctionEvaluator,VariableCanvas,VariableInputList,VariablePerBlockCanvas}, MathDiagnosticMessages
├── ui/                  # Chart, Modal, Table
├── dom/                 # DOMFactory and element builders (button, input, select, table…), RafCoalescer
├── export/              # JIIX → other formats: toLLM, toMarkdown, toMermaid, toPlantUML, jiixGraph
├── smartguide/          # InteractiveInkSSRSmartGuide
├── style/               # Style, PenStyle, PenNib, StyleManager, Theme
├── style-css/           # StyleHelper (JSON ↔ CSS for themes and pen styles)
├── constants/           # Shared constants — a leaf: imports nothing else from src/
├── assets/              # SVG assets
├── logger/              # LoggerManager, LoggerConfiguration (singleton)
├── worker/              # ping.worker.ts (WebSocket heartbeat)
└── core/                # Cross-cutting primitives, DOM-free — there is no src/utils/
    ├── geometry/        # TPoint, TBox/BoxOps, OBB/OBBOps, MatrixTransform, distance/angle/intersection/containment
    │   └── shapes/      # Geometry2d, PointsGeometry2d, PointSet2d, Polyline2d, Polygon2d, Circle2d, Ellipse2d
    ├── math/            # isValidNumber, angles, tessellation, mm ↔ px conversion
    ├── std/             # mergeDeep, isDeepEqual, createUUID, DeferredPromise, version, shared types
    └── latex.ts
```

See [SETUP.md](../../../SETUP.md) for prefix conventions (T/I/II).

## Imports

Enforced by the `iink/barrel-imports` lint rule (`config/eslint-plugin-barrel-imports.mjs`):

- across `src/` folders: only the folder barrel `@/x` — `@/core`, `@/symbol`, `@/symbol-utils`, never `@/core/std` or `@/symbol/stroke/Stroke`
- inside a folder: relative paths only, never leaving the folder
- unit tests: the library only through `@/iink`

## Naming conventions

**Prefixes** (see [SETUP.md](../../../SETUP.md) "Prefix Helper"):
- `T{Name}` → TypeScript type/interface (e.g., `TSymbol`, `TPoint`, `TExport`)
- `I{Name}` → Ink variant, uses `HTTPClientV2` (e.g., `IModel`, `IWriterManager`)
- `II{Name}` → InteractiveInk variant, uses `WebSocketClient` (e.g., `IIModel`, `IIWriterManager`)

**Classes**:
- `{Name}Manager` → Business logic orchestrator
- `{Name}Renderer` → Rendering implementation
- `{Name}Configuration` → Configuration with defaults
- `Abstract{Name}` → Base class for inheritance

**Files**: PascalCase matching primary export → `InteractiveInkCanvas.ts` exports `InteractiveInkCanvas`

## Configuration pattern

Every major component uses **partial configuration merging** — a `Default*` constant plus a class whose constructor merges the partial input over it:

```typescript
export type TWebSocketClientConfiguration = { server: …; recognition: … }

export const DefaultWebSocketClientConfiguration: TWebSocketClientConfiguration = { … }

export class WebSocketClientConfiguration implements TWebSocketClientConfiguration {
  constructor(configuration?: TPartialDeep<TWebSocketClientConfiguration>) {
    this.server = mergeDeep({}, DefaultWebSocketClientConfiguration.server, configuration?.server)
    …
  }
}
```

**Never** assume all config properties exist → always merge with defaults. Arrays are concatenated by `mergeDeep`: replace them explicitly when that is wrong (see Layout below).

## Async patterns

1. **DeferredPromise**: Custom promise wrapper for tracking pending operations ([src/core/std/DeferredPromise.ts](../../../src/core/std/DeferredPromise.ts)). `WebSocketClient` waits for answers with `waitForAnswer(key, neutral)`, keyed by string (`export:<mimeType>`, block id…).
2. **Dual async model**: Operations return Promises + emit Events
   ```typescript
   await client.addStrokes(strokes)  // Operation promise
   client.event.addContentChangedListener(cb) // Notification event
   ```
3. **Initialization**: always `await canvas.initializationPromise` before interacting. On the WebSocket variants it is the client's `initialized: DeferredPromise<void>`; `HTTPClientV2`/`HTTPClientV1` are stateless, no init step.

## Symbol hierarchy

**Base type**: `TBaseSymbol` — shared properties (id, type, creationTime, modificationDate, style, transform)

**Symbol types** (`SymbolType` enum): `Stroke`, `Shape` (Circle/Ellipse/Polygon), `Edge` (Line/Arc/PolyLine), `Text`, `Math`, `Decorator`, `Eraser` (tool only, not in `TSymbol`)

```
Primitives: TPoint { x, y }, TBox { x, y, height, width }, TOBB (oriented box)
Stroke:     TStroke
Text:       TText
Math:       TMath
Typeset:    TTypesetChild
Decorator:  TDecorator
Eraser:     TEraser
Shape:      TShapeCircle, TShapeEllipse, TShapePolygon
Edge:       TEdgeArc, TEdgeLine, TEdgePolyLine, TAnchor (smart connectors)
Legacy:     Stroke, CanvasSymbol (deprecated v1)
```

**Root types** (`src/symbol/Symbol.ts`):
```typescript
type TBaseSymbol = { id: string; creationTime: number; modificationDate: number; type: string; style: TPartialDeep<TStyle>; transform: TMatrixTransform }
type TSymbol = TEdge | TShape | TStroke | TText | TMath | TDecorator
```

A transform writes `symbol.transform` only; the raw coordinates never move after creation.

**One place per type — the util:**
`src/symbol/{type}/{Type}.ts` holds the type and its guards (`isStroke`, `isText`, `isMath`, `isDecorator`). Everything else — construction, editing, geometry, rendering — is on `StrokeUtil`, `TextUtil`, `MathUtil`, `ShapeUtil`, `EdgeUtil`, `DecoratorUtil` in `src/symbol-utils/{type}/`, all extending `SymbolUtil` and registered by `registerBuiltinSymbolUtils()`. Instance methods are what the registry dispatches; statics are construction and editing, which have no symbol to dispatch on.

**There is no `*Ops` object for a symbol.** `BoxOps` and `OBBOps` are geometry primitives, not symbols; `EraserOps` belongs to a transient tool with no util.

`SVGRenderer` dispatches rendering with `symbolRegistry.getUtil(symbol.type).getSVGElement(symbol)` — don't branch on `SymbolType` inline, extend the matching util instead.

**Model distinctions**:
- `Model` (basic): `Stroke[]` — InkCanvasDeprecated (v1)
- `IModel` (intermediate): `TStroke[]` — InkCanvas (v2)
- `IIModel` (advanced): `TSymbol`s in a `SymbolStore`, frozen records, `draftSymbol`/`commitSymbol` — InteractiveInkCanvas

## Manager sub-system patterns

**Base** (`manager/interactive/IIAbstractManager.ts`): every interactive manager extends `IIAbstractManager(canvas, LoggerCategory)` — `protected logger`, getters `model`/`renderer`/`client`/`configuration` read from the canvas, optional `onInit`/`onDestroy` hooks. See the `manager-patterns` skill.

**Transform** (`manager/interactive/transform/`): `IIAbstractTransformManager` base (file `AbstractTransformManager.ts`) — `applyMatrix`/`applyToSymbol` shared, one abstract `applyThroughUtil(symbol, matrix)` — extended by `IITranslateManager`, `IIRotationManager`, `IIResizeManager`, orchestrated by `IITransformManager`.

**Math** (`manager/interactive/math/`): `IIMathVariableSubManager` (variable state), `IIMathComputationSubManager` (computation), `IIMathFunctionEvaluationSubManager` (function evaluation), `IIMathCapabilitiesSubManager` (available actions), orchestrated by `IIMathManager`.

**Gestures** (`manager/interactive/gestures/`): `GestureHandler` + `handlers/` per-gesture (Insert, Join, Scratch, StrikeThrough, Surround, Underline), `IIGestureAnnotationProcessor` for annotation logic, orchestrated by `IIGestureManager`.

**Typeset** (`IITypesetManager`): handles both text and math typeset bounds via SVG `getBBox`, replaced former `IITextManager`.

**Export** (`manager/base/ExportManager.ts`, `canvas.exportManager`): `exportAs(format)` returns `json`/`svg`/`png`/`text`/`markdown`…, `download(format)` also takes `"pdf"` (delegated to `PDFExportManager`, `window.print()`-based). `IIExportManager` is the interactive subclass; the canvas exposes `canvas.exportAs` / `canvas.download`.

**Menus** (`menu/`): `IIMenuAction`, `IIMenuStyle`, `IIMenuTool`, `IIMenuContext` extend `IIAbstractMenu<TConfig>`. Each has two zones, `"bar"` and `"dropdown"`, built on their first item (`createZone`), and a `defaultZone`. In `render()`, a menu sets `wrapper` first, then calls the protected `addItem(key, item, { zone, before, after, replace })`. An integrator adds items with `canvas.menu.addItem(menu, key, factory, options)`: the `IIMenuManager` registry keeps **factories** (menus are rebuilt by every `setConfig`, and a destroyed item can't be reused) and replays them after each render. A whole menu is replaced through `options.override.menu` (`TMenuOverride`, classes constructed `(canvas, id, config)`). Menu members are protected, never `#private`: they are overridable.

**Layout** (`manager/base/LayoutManager.ts`, `canvas.layout`, InteractiveInkCanvas + InkCanvas, not SSR/V1): 8 slots (`top-*`, `middle-left/right`, `bottom-*`, no center). `configuration.layout` maps slots to occupants in stacking order — menus, `state` (connection badge), `minimap`, custom ones — and replaces the default **slot by slot, never via `mergeDeep`** (it would concatenate arrays: a moved menu would show twice). Each occupant renders into its host (`layout.host(name)`). The slot decides a menu's `orientation` and `openTowards` (overridable in its config); the menu injects `BaseMenuItem.openPosition` into its items before they render. `canvas.layout.set/add/remove` change it at runtime (`onOccupantMoved` → `IIMenuManager` rebuilds the moved menu); `options.extend.menuItems`/`extend.layout` declare additions at load so they are in the first render. A menu hiding in a shared slot folds its host (CSS grid `minmax(0, 0fr)`).

## Key utilities

Always check `src/core/` (and `src/dom/` for DOM builders) before writing a new utility function — there is no `src/utils/`.

```typescript
// Geometry, scalars, std — all through the @/core barrel
import {
  computeDistance, computeDistanceSquared, computeAngleAxeRadian, isPointInsideBox, areValidCoordinates,
  isValidNumber, TWO_PI, convertMillimeterToPixel,
  mergeDeep, isDeepEqual, createUUID, DeferredPromise,
} from "@/core"
if (computeDistanceSquared(p1, p2) < threshold * threshold) { ... } // no sqrt, ~2x faster for comparisons

// A symbol's geometry is an object, not a record — reach it through the façade, never rebuild it
import { SymbolGeometry } from "@/symbol-utils"
SymbolGeometry.of(symbol).overlapsBox(box)   // or boundsOf / verticesOf / snapPointsOf / edgesOf / lengthOf

// SVG building — SVGBuilder's real implementation lives in @/symbol-utils; renderer/svg/utils re-exports it
import { SVGBuilder } from "@/symbol-utils"
import { GUIDE_PATH_ATTRS } from "@/renderer"
SVGBuilder.createPath({ ...GUIDE_PATH_ATTRS, d: pathData })

// HMAC signature (server.sign or hmacKey)
import { resolveHmac } from "@/client"
```

## Examples

- **`interactive-canvas/`** (31 pages) → `InteractiveInkCanvas` (WebSocket), pattern: `interactive_canvas_{feature}.html`
- **`interactive-canvas-ssr/`** (28 pages) → `InteractiveInkSSRCanvas` (WebSocket SSR)
- **`canvas/`** (18 pages) → `InkCanvas`/`InkCanvasDeprecated` (HTTP), pattern: `canvas_v2_{feature}.html` (current) / `canvas_v1_{feature}.html` (deprecated)
- **`non-specific/`** → Configuration demos
- **`server-signing/`** → HMAC signed by a server (`server.js` + page holding no credential)
- **`custom-rendering/`** → Third-party integrations (`tldraw-websocket-client/`, `excalidraw-websocket-client/`)

Most examples: `<div id="rootEl">` → `Canvas.load(element, type, options)` → event listeners. Shared assets in `examples/assets/` and `examples/components/`. Matching E2E specs live in `test/examples/{same-subdir}/*.test.js`.

## Build system

**Rollup-based**: `config/rollup.config.{build,dev}.mjs` over `config/rollup.config.mjs`. Outputs: `dist/iink.min.js` (UMD), `dist/iink.esm.js` (ESM), `dist/iink.d.ts`. CSS imported as strings in TS, injected dynamically at runtime.

## Testing

- **Unit (Jest + `@swc/jest`)**: `test/unit/` mirrors `src/` exactly, global threshold 88% branches/lines/statements and 86% functions, `yarn test:unit`, setup in `test/unit/__config__/`, mocks in `test/unit/__mocks__/`
- **E2E (Playwright)**: `test/examples/`, `yarn test:examples` — see the `testing-patterns` skill
- **Types**: `yarn typecheck` (tests included; Jest only transpiles)

## Development

```bash
yarn dev          # Rollup watch + example server on :8000
yarn dev:backend  # Docker (testcontainers): local iink backend on localhost:8897, Ctrl+C stops it
```

## Common patterns

```typescript
// Logger — in a manager, inherited from IIAbstractManager as `protected logger`
import { LoggerCategory, LoggerManager } from "@/logger"
protected logger = LoggerManager.getLogger(LoggerCategory.CANVAS)
this.logger.info("Message", data)

// Event handling — events defined in src/canvas/CanvasEvent.ts
canvas.event.addChangedListener((context: THistoryContext) => { ... })
```

## Documentation

- **SETUP**: [SETUP.md](../../../SETUP.md) — development setup, prefix guide
- **Architecture**: [architecture/](../../../architecture/) — class diagrams and WebSocket protocol
- **API Docs**: `yarn build:docs` → `docs/`
- **External**: https://developer.myscript.com/docs/cloud/latest/iinkts/get-started/

## MyScript Cloud integration

**Authentication**: HMAC-based, set in `configuration.server`: `sign` (signature computed on a server holding the key, production default) or `hmacKey` string (development only). See `examples/server-signing/`. Example credentials for `yarn dev` go in `.env.local` (`HOST`, `APPLICATION_KEY`, `HMAC_KEY`, optional `SCHEME`), turned into `examples/dev-env-loader.generated.js` and loaded into `localStorage` on localhost.
