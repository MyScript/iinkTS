# Changelog

One line per change. The full record of a version is in `changelog/<version>.md`; step-by-step upgrade instructions are in [MIGRATION.md](./MIGRATION.md).

Badges: **breaking** = code stops compiling or behaves differently · **behaviour** = same API, different result · **type** = signature change only · **subclass** = only affects a class you extend.

# [v5.0.0](https://github.com/MyScript/iinkTS/tree/v5.0.0)

Full record: [changelog/5.0.0.md](changelog/5.0.0.md)

## ✨ What's new

**Writing**
- **Pen nibs**: `ballpoint`, `pencil`, `fountain`, `brush`, for ink that responds to speed and pressure; width no longer changes with the sampling rate. `TStyle.pen`, per-stroke `penAngle`/`penSmoothing`/`penSpeed`, nib picker in the tool and style menus · Try `interactive_canvas_pen_nibs.html` · [details](changelog/5.0.0.md#strokes-pen-nibs-width-and-timing)
- **Pen-only input on tablets**: a resting palm no longer inks nor takes over the pen stroke. `grabber.inputMode`: `"any"` | `"pen"` | `"auto"` · [details](changelog/5.0.0.md#pen-only-input-for-tablets)
- **Writing near the edge** no longer drags the view away from the pen, and a stroke that leaves the canvas keeps going until the pen lifts · [details](changelog/5.0.0.md#bug-fixes)

**Interface**
- **Menus where you want them**: 8 slots for the menus, the connection state and the minimap, changeable at runtime. `configuration.layout`, `canvas.layout.set/add/remove` · Try `interactive_canvas_menu_layout.html` · [details](changelog/5.0.0.md#place-the-menus-where-you-want-configurationlayout)
- **Your own menu items** in the action, tool, style or context menu, without subclassing and without a flash on load. `canvas.menu.addItem(menu, key, factory, { zone, before, after, replace })`, `options.extend` · [details](changelog/5.0.0.md#add-your-own-items-to-the-menus)
- **Math solver settings** in the Math menu: angle unit, decimals, decimal separator, rounding, each item can be hidden. `TMathActionItemsConfig.solver`, new `overrideDeep` · [details](changelog/5.0.0.md#math-solver-settings-in-the-math-menu)
- **Gesture menu**: turn each gesture on or off and choose what it does; a new join mode closes the gap between words. `JoinAction.CloseGap`, `IIGestureManager.isGestureEnabled` · [details](changelog/5.0.0.md#gesture-menu-one-submenu-per-gesture)

**Content**
- **One export API** for 10 formats, now including Markdown, Mermaid, PlantUML, LLM and JIIX. `exportAs(format)` returns typed content, `download(format)` saves it; `ExportManager`, `IIExportManager` · [details](changelog/5.0.0.md#export)
- **PDF export** through the browser's print dialog, with a page-settings dialog. `download("pdf")`, `PDFExportManager` · [details](changelog/5.0.0.md#pdf-export-via-native-browser-print)
- **Shapes and edges stay connected** when moved, resized or rotated, before and after conversion. `IIConnectorManager.getFollowedStrokeIds` · [details](changelog/5.0.0.md#shape--edge-connections)
- **Change the language or any recognition setting live**, without reloading the canvas. `updateRecognitionConfiguration(partial)` · [details](changelog/5.0.0.md#one-call-changes-the-recognition-configuration-changelanguage-is-gone)
- **Update symbols by id with a patch**: one call for style, font or any change. `updateSymbols(ids, patch)`, `updateSymbol(id, patch)`, patch object or draft function · [details](changelog/5.0.0.md#one-call-updates-symbols-by-id-with-a-patch)

**Reliability and security**
- **Offline resilience**: every change made while the connection is down (strokes, transforms, undo/redo, clear) is replayed in order on reconnection, and requests wait instead of failing · [details](changelog/5.0.0.md#bug-fixes)
- **Large imports** no longer close the session: messages are split under the server's size limit (`maxMessageBytes`) · [details](changelog/5.0.0.md#bug-fixes)
- **The HMAC key stays on your server**. `server.sign(message, applicationKey)` (`THmacSigner`) · Try `examples/server-signing/` · [details](changelog/5.0.0.md#the-hmac-signature-is-computed-on-your-server-serversign)
- **No more crashes on Safari/WebKit** when selecting or erasing many strokes · [details](changelog/5.0.0.md#bug-fixes)

**Performance**
- **10 000× faster reads** on large documents (`model.symbols` on 500 strokes: 11.59 ms → 0.0012 ms) · [details](changelog/5.0.0.md#the-document-is-immutable)
- **Synchronizing an unchanged 4000-stroke document**: 1.3 s → 27 ms · [details](changelog/5.0.0.md#performance)
- **Lighter DOM**: one SVG element per stroke instead of two · [details](changelog/5.0.0.md#a-path-symbol-is-its-path-with-no-group-around-it)
- **Shorter strokes on the wire** from server 4.6.0: `t0` + `dt` instead of absolute `t` · [details](changelog/5.0.0.md#shorter-strokes-on-the-wire-t0--dt)

**Extending the library**
- **Custom symbol types** now move, rotate and resize like the built-in ones: a custom util implements `getGeometry` only and inherits `translate`/`rotate`/`resize`; new `SymbolUtil.getResizePoints`, `keepsAspectRatio` · [details](changelog/5.0.0.md#everything-a-symbol-type-knows-lives-on-its-util)
- **Every module is exported**: `resolveHmac`, `parseApiError`, `TApiError`; `defineKind`, `resolveKind` (`@experimental`) · [details](changelog/5.0.0.md#every-module-is-exported)
- **Any client can be overridden**: no `#private` member left, all protected · [details](changelog/5.0.0.md#bug-fixes)
- **Return types can be named**: `TAnchoredEdgesUpdateResult`, `TFollowedStroke`, `TShift`, `TSplitOutcome` · [details](changelog/5.0.0.md#types-returned-by-public-methods-can-be-named)

**New examples**
- **Math Tutor**: a handwritten math workbook that checks each line as it is written and hints at the first mistake. `interactive_canvas_math_tutor.html` · [details](changelog/5.0.0.md#math-tutor-example)
- **Excalidraw**: recognition and conversion into Excalidraw elements, on `WebSocketClient`. `examples/custom-rendering/excalidraw-websocket-client/` · [details](changelog/5.0.0.md#excalidraw-integration-example)
- **Pen nibs**, **menu layout**, **server-side signing**: see their entries above

## ⚠️ Upgrading from v4
- **breaking** Strokes: `TPointer.t` → `TPointer.dt` (ms since the stroke began), width computed at draw time, `TStroke.length` removed. Old documents still load; strokes from earlier versions render differently. [details](changelog/5.0.0.md#strokes-pen-nibs-width-and-timing)
- **breaking** Symbols read from `model` are frozen: write through `draftSymbol(id)` → `commitSymbol(draft)`; `getRootSymbol` → `getSymbol`. [details](changelog/5.0.0.md#the-document-is-immutable) · [migration](MIGRATION.md#the-document-is-immutable-symbols-you-read-are-frozen)
- **breaking** `*Ops` objects removed, their members moved to the family's util (`ShapeCircleOps.create` → `ShapeUtil.createCircle`…); transform managers implement one `applyThroughUtil`; `getSVGElement` is abstract. [details](changelog/5.0.0.md#everything-a-symbol-type-knows-lives-on-its-util) · [migration](MIGRATION.md#a-ops-object-is-now-its-familys-util)
- **breaking** `bounds`, `vertices`, `snapPoints`, `edges` removed from strokes, shapes and edges: read them through `SymbolGeometry`. [details](changelog/5.0.0.md#a-symbols-geometry-is-computed-and-answers-for-itself) · [migration](MIGRATION.md#geometry-is-computed-not-stored)
- **breaking** A symbol's position is a matrix in `transform`; `TText.rotation`, `TMath.rotation` removed. [details](changelog/5.0.0.md#a-symbol-carries-where-it-sits-as-a-matrix) · [migration](MIGRATION.md#a-symbol-carries-where-it-sits-as-a-matrix)
- **breaking** Strokes, shapes and edges render as a bare `<path>`: selectors such as `#<id> path` no longer match. [details](changelog/5.0.0.md#a-path-symbol-is-its-path-with-no-group-around-it) · [migration](MIGRATION.md#a-stroke-shape-or-edge-is-drawn-as-a-bare-path)
- **breaking** `TDecorator.bounds` → `targetBounds`, `hasBounds` removed. [details](changelog/5.0.0.md#a-decorators-box-is-named-for-where-it-comes-from) · [migration](MIGRATION.md#a-decorators-box-is-renamed-for-where-it-comes-from)
- **breaking** History stores diffs only: `history.push(changes)`, `updated` holds `{ before, after }` pairs. [details](changelog/5.0.0.md#history-diff-only-records-what-changed) · [migration](MIGRATION.md#history-one-form-for-every-change)
- **breaking** `StrokeOps.formatToSend` → `toWireStroke`; `TStrokeMinimal` → `TStrokeCapture`. [details](changelog/5.0.0.md#the-client-owns-the-stroke-shape-it-sends) · [migration](MIGRATION.md#the-client-owns-the-stroke-shape-it-sends)
- **breaking** `src/utils/` dissolved: deep imports only, the exported names are unchanged. [details](changelog/5.0.0.md#internal-layout-srcutils-dissolved) · [migration](MIGRATION.md#internal-layout-srcutils-no-longer-exists)
- **breaking** `SELECTION_MARGIN` split into `SELECTION_PADDING`, `HIT_TOLERANCE`, `DUPLICATE_OFFSET`, `TESSELLATION_SEGMENT_LENGTH`. [details](changelog/5.0.0.md#selection_margin-split-by-meaning-constants-dissolved) · [migration](MIGRATION.md#selection_margin-is-split-by-meaning)
- **breaking** `IIConnectorManager.updateAnchoredEdges()` returns what it moved, to include in the history entry. [details](changelog/5.0.0.md#shape--edge-connections-1)
- **breaking** `updateSymbolsStyle` / `updateTextFontStyle` → `updateSymbols(ids, patch)`. [details](changelog/5.0.0.md#one-call-updates-symbols-by-id-with-a-patch) · [migration](MIGRATION.md#one-call-updates-symbols-by-id-with-a-patch)
- **breaking** `changeLanguage(code)` → `updateRecognitionConfiguration({ lang })`. [details](changelog/5.0.0.md#one-call-changes-the-recognition-configuration-changelanguage-is-gone) · [migration](MIGRATION.md#changelanguage-becomes-updaterecognitionconfiguration)
- **behaviour** The math solver works in radians by default. [details](changelog/5.0.0.md#the-math-solver-works-in-radians-by-default) · [migration](MIGRATION.md#the-math-solver-defaults-to-radians)
- **behaviour** Math results are auto-computed and shown as a ghost by default, so they follow the variables they use. [details](changelog/5.0.0.md#math-results-are-auto-computed-as-a-ghost-by-default)
- **breaking** Nine export methods → `exportAs` / `download`. [details](changelog/5.0.0.md#export-one-exportas-one-download) · [migration](MIGRATION.md#exports-nine-methods-become-two)
- **breaking** `hmacKey` is a string only, the function form is removed: sign with `server.sign`. [details](changelog/5.0.0.md#the-hmac-signature-is-computed-on-your-server-serversign) · [migration](MIGRATION.md#hmackey-is-a-string-only-sign-on-your-server-with-serversign)
- **breaking** `CanvasEventName.POINTEREVENTS` removed (never emitted). [details](changelog/5.0.0.md#canvaseventnamepointerevents-is-removed)
- **breaking** `server.websocket.offlineQueueEnabled` removed: `autoReconnect` is the only reconnection switch. [details](changelog/5.0.0.md#bug-fixes) · [migration](MIGRATION.md#autoreconnect-is-the-only-reconnection-switch)
- **behaviour** `isOffline` is true whenever the connection is down after a first success, queued changes or not. [details](changelog/5.0.0.md#bug-fixes)
- **behaviour** A network drop is a connection state (`offline`/`syncing`), no longer an `error`. [details](changelog/5.0.0.md#bug-fixes)
- **behaviour** Writing never pans the view; a stroke goes on past the canvas edge until `pointerup`. [details](changelog/5.0.0.md#bug-fixes)
- **behaviour** Auto-compute asks the server for every math block (vertical operations included). [details](changelog/5.0.0.md#bug-fixes)
- **behaviour** The `changed` event of `InteractiveInkCanvas` carries the local history state, not the backend's. [details](changelog/5.0.0.md#bug-fixes)
- **behaviour** `mergeDeep` drops `__proto__`, `constructor`, `prototype` keys; `WebSocketSSRClient` reports `restore.session.not.found` as `NO_SESSION_FOUND`. [details](changelog/5.0.0.md#bug-fixes)
- **breaking** Selection and erase effects are CSS classes: `selectionFilterId` → `selectedClassName`, `removalFilterId` → `deletingClassName`. [details](changelog/5.0.0.md#bug-fixes)
- **breaking** CSS: menu position classes → `ms-menu-action`, `ms-menu-style`, `ms-menu-tool`. [details](changelog/5.0.0.md#place-the-menus-where-you-want-configurationlayout) · [migration](MIGRATION.md#menus-sit-in-a-layout-position-classes-are-gone)
- **type** `options.override.menu` takes menu classes (`TMenuOverride`); thicken gesture takes `widths`/`fontWeights`; `clearSolverOutputs()` returns the removed strokes; `SYNC_YIELD_CHUNK_SIZE` → `SYNC_YIELD_BUDGET_MS`. [details](changelog/5.0.0.md#bug-fixes)
- **type** History event, `override.client`, `Logger`, websocket messages, `mergeDeep` typings; `override.grabber` removed. [details](changelog/5.0.0.md#type-only)
- **subclass** Clients: `#private` members become protected (`sendOnSocket`, `offlineQueue`…), one pending-request queue replaces the `*Deferred` fields, `reconnectionCount` removed; menus share `IIAbstractMenu`. [details](changelog/5.0.0.md#bug-fixes)

## ⚡ Performance
- `InteractiveInkCanvas.select(ids)`: O(n·m) → O(n)
- Removing symbols: one pass over the document instead of two copies
- Synchronizing an unchanged 4000-stroke document: 128 ms → 94 ms of work, 80 frames → 1
- Conversion deduplicates strokes in O(n) (`uniqueById`)
- One `RafCoalescer` replaces six hand-written frame throttles

[details](changelog/5.0.0.md#performance)

## 🐛 Bug fixes

**Math**
- Undo to an empty page then redo showed every result ever computed; variable values are now in the history
- Auto-compute never computed a vertical operation

**Writing and gestures**
- Writing within 20 px of the edge made the view run away from the pen
- A gesture leaving the canvas with the button down drove the page around it
- The underline gesture in `Thicken` mode did nothing on text or math
- A gesture missing from `raw-content.gestures` was still applied without context
- A JOIN gesture between non-text symbols left the next one in place (since 4.0.0)
- `replaceSymbols()` mutated the array it was handed
- A rotated text or math block reported a mirrored box, so surrounding it did not select it

**Connection**
- A failed HMAC resolution left `init()` waiting forever
- An application key holding `&`, `=` or `#` broke the websocket URL
- The HTTP clients signed the body before adapting it to old servers: wrong signature
- `send()` resolved, or silently dropped, a message the socket failed to send
- `WebSocketSSRClient.destroy()` left pending requests hanging
- Math solver and support requests never settled after an abnormal drop
- A late handshake failure broke every following reconnection attempt
- A network drop reopened the error modal every `reconnectDelay`, losing the strokes drawn meanwhile
- Two concurrent exports of the same type: the first never resolved
- An export superseded by a change hung every caller, and recognition stopped
- An idle healthy connection closed after 5 minutes (ping counter)
- `newSession()` duplicated every array of the configuration
- A message sent during `close()` leaked into the next session
- Messages over 500 KB made the backend close the session
- `HTTPClientV2` did not strip `jiix.text.lines` for servers below 3.2.0
- `HTTPClientV1` turned a non-JSON error body into a generic connection error
- `getAvailableLanguageList()` / `getAvailableFontList()` failures were not reported as errors
- `updateRecognitionConfiguration()` on an empty sheet stayed "Recognizing" forever

**Security**
- The clients logged `applicationKey` / `hmacKey` in plaintext
- `mergeDeep` could pollute `Object.prototype`
- `InteractiveInkSSRSmartGuide` executed script from a crafted JIIX label

**Leaks and lifecycle**
- `InteractiveInkCanvas.destroy()` left thirteen managers alive
- `IISynchronizerManager` left a 5 s timer per math block on every sync
- `IDebugSVGManager` leaked pointer listeners on every drag
- `IIMenuContext.destroy()` leaked `document` listeners
- Nine swallowed errors and floating promises now reach the caller
- `clear()` did not await the server

**Rendering and model**
- Selecting or erasing many strokes crashed WebKit
- `pan()` left symbols scrolled into view undrawn
- `Minimap` cloned the whole layer on every change
- `EraseManager` threw on Safari < 18.4
- Shape/edge type picker never closed its dropdown
- `emit()` turned any falsy payload into `null`
- `override.menu` was lost on the first `setConfig`
- Synchronizer metadata left stale after a throw, or cleared exports
- Word/char grouping returned `[]` after an exports clear
- Translating an unknown edge kind failed silently
- `Model.addStroke()` accepted a duplicate id

[details](changelog/5.0.0.md#bug-fixes)


# [v4.1.0](https://github.com/MyScript/iinkTS/tree/v4.1.0)

## Features

### Import Strokes
- feat(InkCanvasV2) added strokes import functionality 

## Performance

### virtualization
- throttle pan and cull off-screen symbols on large documents

# [v4.0.0](https://github.com/MyScript/iinkTS/tree/v4.0.0)

## Breaking Changes

See [MIGRATION.md](./MIGRATION.md) for step-by-step upgrade instructions.

### Class/API renaming
- refactor: **BREAKING** `Editor` class renamed to `Canvas` (`Editor.load()` → `Canvas.load()`); `Canvas.load()` type constants renamed: `"INTERACTIVEINK"` → `"INTERACTIVE_INK"`, `"INTERACTIVEINKSSR"` → `"INTERACTIVE_INK_SSR"`, `"INKV1"` → `"INK_V1"`, `"INKV2"` → `"INK_V2"`
- refactor: **BREAKING** editor variants renamed: `InteractiveInkEditor` → `InteractiveInkCanvas`, `InteractiveInkSSREditor` → `InteractiveInkSSRCanvas`, `InkEditor` → `InkCanvas`, `InkEditorDeprecated` → `InkCanvasDeprecated` (and their `*Configuration`/`*Options` companion types)
- refactor: **BREAKING** network layer renamed from `Recognizer*` to `*Client`: `RecognizerHTTPV1` → `HTTPClientV1`, `RecognizerHTTPV2` → `HTTPClientV2`, `RecognizerWebSocket` → `WebSocketClient`, `RecognizerWebSocketSSR` → `WebSocketSSRClient` (and their `Configuration`/`Message`/`Event`/`Error` companion types)
- refactor: source layout mirrors the new naming — `src/editor/` → `src/canvas/`, `src/recognizer/` → `src/client/`
- refactor(examples): directories renamed to match — `examples/rest/` → `examples/canvas/` (files split `canvas_v1_*`/`canvas_v2_*`), `examples/websocket/` → `examples/interactive-canvas-ssr/`, `examples/offscreen-interactivity/` → `examples/interactive-canvas/`; new `examples/custom-rendering/` hosts the tldraw + `WebSocketClient` demo (`examples/custom-rendering/tldraw-websocket-client/`)
- refactor: **BREAKING** remove II-prefix from all symbol types — IIStroke→TStroke, IIText→TText, IIMath→TMath, IIDecorator→TDecorator, IIEraser→TEraser, IIShapeCircle→TShapeCircle, IIEdgeLine→TEdgeLine, etc.
- refactor: **BREAKING** convert all symbol interfaces to type aliases with T* naming convention
- refactor: **BREAKING** remove SymbolFactory — creation dispatchers moved to SymbolHelpers
- refactor: **BREAKING** the canvas instance attached to the root DOM element is now exposed as `rootElement.iink` (was `rootElement.editor`) — decoupled from the class name since it collided with the real `<canvas>` elements rendered inside that same root element
- refactor: **BREAKING** `EditorTool`/`EditorWriteTool` renamed to `CanvasTool`/`CanvasWriteTool`
- refactor: **BREAKING** `LoggerCategory.EDITOR`/`EDITOR_EVENT` renamed to `LoggerCategory.CANVAS`/`CANVAS_EVENT`
- refactor: **BREAKING** default/public CSS hook `.ms-editor` renamed to `.ms-ink`; state badge classes `.editor-state*` renamed to `.ms-ink-state*`
- refactor: **BREAKING** CSS custom property prefix `--iink-*` renamed to `--ms-ink-*` (e.g. `--iink-primary` → `--ms-ink-primary`); `--iink-editor-bg` also renamed to `--ms-ink-canvas-bg`

### Gestures
- feat(gesture): **BREAKING** `join` and `insert` gestures are now disabled by default (previously enabled) — re-enable them explicitly via the `gestures` configuration if your integration relies on them

## Features

### Canvas state
- feat(canvas): add `canvas.connectionState` (initializing/online-idle/online-working/syncing/offline/error) + `connectionStateChanged` event
- feat(canvas): add `canvas.trackOperation()`/`startOperation()`/`endOperation()`/`hasOperation(label)` — named, ref-counted busy tracking surfaced through the state badge, covering recognition, conversion, synchronization, math, transforms, gestures, and export/undo/redo/clear/import
- feat(canvas): state badge tooltip now opens on click and lists the active operation(s); new pulsing "typing" indicator for working/syncing states
- feat(canvas): "Recognizing" busy state now reacts immediately on pointer-down/drag-start instead of waiting for a server round-trip, removing perceived lag on fast writing and multi-stroke imports
- feat(canvas): **BREAKING** `CanvasLayer.updateState()`/`showState()`/`hideState()`/`createState()`/`createBusy()` removed — replaced by `updateCanvasState()` driven by `canvas.connectionState`. `CanvasLayer.ui.state` shape changed (`{ root, icon, count }` instead of `{ root, busy }`)
- feat(client): `WebSocketClient` now proactively detects unexpected disconnects and reconnects immediately (previously only reactive); `TConnectionStatus` gains an `"error"` value once reconnection attempts are exhausted

### Stroke Playback
- feat(canvas): add `canvas.playback` — replays a recorded set of strokes point by point, honoring their original relative timing; `play(strokes, speed?)`, `pause()`, `resume()`, `stop()`, `setSpeed()`, with `state`/`progress` getters and `onProgress`/`onStateChange`/`onEnd` callbacks
- feat(canvas): add `canvas.readOnly` — blocks pointer input across all tools and shows a "not-allowed" cursor; used by `canvas.playback` for the duration of a playback

### Math
- feat(math): add comprehensive math dependencies visualization (variables, overlays, computation, evaluation) and a Math Diagnostic menu with function evaluator
- feat(math): add numerical computation result display with graph rendering, and an auto variable management option
- feat(math): include math equations in `downloadAsText` export
- feat(menu): Math context menu now shows for multi-block selections when every selected block is a fully-selected Math block; add `canvas.math.getBlockCapabilities(blockId)` and `IIJiixQueryManager.getStrokeIdsForBlock(blockId)`
- feat(math): Math context menu gains a "Force compute" button that clears and recomputes numerical results for the selected blocks; add `canvas.math.forceCompute(jiixBlockIds?)` (all blocks if omitted), also used by the global "Force Compute all" action

### Chart
- feat(chart): support multiple data series with per-series colors
- feat(chart): add zoom/pan controls and a toggle for graph point visibility

### Canvas
- feat(keyboard): add shortcuts — copy/paste/cut, undo/redo, zoom, pan, fit
- feat(canvas): add `zoomToFit(symbols?)` to center view on content
- feat(minimap): add Minimap component with click/drag navigation
- feat(menu): add minimap toggle button in the action menu bar

### Gestures & Input
- feat(gesture): add underline action options and integrate into the gesture menu
- feat(gesture): enhance insert action for line breaks and horizontal inserts
- feat(erase): enhance stroke and character deletion logic
- feat(writer): add margin parameter to `ensurePointVisible`

### Other
- feat(selection): add selection granularity configuration (`element` level, for text/math/shape selections)
- feat(jiix): add `getBlocksForSymbols` to `IIJiixQueryManager`
- feat(menu): add text export option to menu actions and context menu
- feat(history): expose `extractStrokes(symbols)` (`@/symbol`) and `extractIIBackendChanges(changes)` (`@/history`) as new pure helper exports

## Performance
- perf(snap): faster id lookup and coordinate bucketing during snapping
- perf(symbol): faster bounds computation for symbols

## Bugs fix
- fix(history): undo is no-op for style, order, and updated changes; fix rotation reversal sign
- fix(history): carry through updated symbols in reverseChanges for undo
- fix(client): HMAC challenge and computation errors now surfaced via `emitError`
- fix(client): `undoDeferred`/`redoDeferred` not reset after a connection reset
- fix(client): WebSocketSSR listeners never removed on reconnect
- fix(client): emit `EndInitialization` after the WebSocket handshake completes
- fix(renderer): canvas transform accumulating on each resize
- fix(renderer): remove spurious `context2d.save()` unbalancing canvas state
- fix(menu): context menu positioning within rendering layer bounds
- fix(menu): remove document/scroll listener leaks on destroy
- fix(symbol): `TStroke.split()` leaves length=0 on result strokes
- fix(symbol): `TEdgePolyLine.create` validation never fired
- fix(utils): `isDeepEqual` incorrectly treats arrays as plain objects
- fix(utils): correct segment intersection endpoint guard
- fix(grabber): unsafe cast of `MouseEvent` to `PointerEvent` in context menu handler
- fix(canvas): destroy all existing instances before creating a new canvas
- fix(canvas): filter invalid strokes in `importPointEvents`
- fix(BaseMenuItem): remove DOM node leak on destroy (`replaceWith(cloneNode)`)
- fix(smartguide): correct event listener removal
- fix(security): force `js-yaml` ≥4.2.0 (CVE DoS)

## Refactor
- refactor: internal reorganization of transform, gesture, symbol, and history code (managers, file layout, dead code removal) — no public API impact

# [v3.3.0](https://github.com/MyScript/iinkTS/tree/v3.3.0)

## Features
- exemple(TLDraw): add TopZone component for auto conversion toggle
- feat: add zoom functionality
- feat: add pan functionality

## Performance
- perf(example): optimize perf of tldraw example
- perf(core): refactor the library to optimize performance

## Bugs fix
- fix(tldraw): Converter add toRichText
- fix(IIGestureManager): scratch-out on a shape does not erase the shape
- fix: update SVG element selection logic to verify child element counts
- fix: refactor decorable type checks in IIGestureManager and IIMenuContext
- fix: enhance selection filter and outline rendering in SVGRendererEdgeUtil
- fix: update ID generation logic in duplicate menu for consistent symbol identification
- fix: improve point calculation in getPoint method for better accuracy
- fix: correct spelling of "unknown" in error messages across multiple files
- fix: EraserManager remove warning Circular dependency
- fix(rest_custom_grabber.html): remove unused event listener for modal editor
- fix(rest_diagram_import.html): update modal editor options to include editorOptions

## Refactor
- refactor: manager, move IISnapManager & IIGestureManager into manager folder
- refactor(logger): change LoggerLevel values to integers and streamline logging methods
- refactor(exports): reorganize export types into ExportCommon for better structure and maintainability
- refactor(renderer): introduce base renderer and shared utilities for consistent rendering across formats
- refactor(symbol): reorganize symbols into dedicated folders
- refactor(Manager): separation of Managers' Dependencies
- refactor(editor): restructure editor classes and introduce EditorFactory for improved instance management
- refactor(helper): optimisation of helpers

# [v3.2.1](https://github.com/MyScript/iinkTS/tree/v3.2.1)

## Bugs fix
- fix(readme.md): remove await from readme

# [v3.2.0](https://github.com/MyScript/iinkTS/tree/v3.2.0)

## Bugs fix
- Disable default touch actions on multiple elements to improve touch interaction handling
- When HMAC key is missing despite being optional in Admin UI configuration
- Sample websocket_text_highlight_words broken, enhance export options to include text words and chars

## Refactor
- Consolidate and rename trigger configuration types
- Add API key input to iinkts sample and pass it from Admin UI
- Update samples, import iink-ts as module


# [v3.1.1](https://github.com/MyScript/iinkTS/tree/v3.1.1)

## Bugs fix
- fix(RecognizerHTTPV1, RecognizerHTTPV2): add credentials: "omit" option to POST requests
- fix(InteractiveInkEditor): clean root element
- fix(InteractiveInkEditor): remove layer classes on destroy
- fix(rest-raw-content-recognizerInk.html): recognition info is displayed twice on rest_v2_raw_content example

# [v3.1.0](https://github.com/MyScript/iinkTS/tree/v3.1.0)

## Featues
- feat(Editor) added the option to give a async function for challenge validation [#11](https://github.com/MyScript/iinkTS/issues/10)

## Bugs fix
- fix(offscreen) insert gesture does nothing after convert + undo
- fix(InkEditor.ts) [Raw Content] Show Recognition Blocks button does not work when writing after the check
- fix(InkEditor) wrong default mimeTypes for Math & RawContent

# [v3.0.2](https://github.com/MyScript/iinkTS/tree/v3.0.2)

## Bugs fix
- fix(InkEditor) last undo does not supress 1st result
- fix(InkEditor) eraser does not work
- fix(InkEditor) missing result after undo
- fix(InkEditor) bad recognition displayed when language is not english

# [v3.0.1](https://github.com/MyScript/iinkTS/tree/v3.0.1)

## Features
- feat(InkEditor): change CanvasRenderer with SVGRenderer
- feat(examples): add japanese vertical example

## Bugs fix
- fix(InkEditor): add quiet_period before send recognition request

# [v3.0](https://github.com/MyScript/iinkTS/tree/v3.0)

## Features
- configuration update
  - added classification to raw-content
  - added base lines on jiix
- can resize edges by vertices
- sync strokes with jiix element continuously

## Refactor
- replacing the editor constructor with an editor loader
- delete global configuration, definition of specific configuration per editor
- changing editor instantiation, split editor into separate editors
- centralize layers
- centralize event, rename intention to tool
- separation of smart guide style into a specific file
- separation of menu style into a specific file

## Bugs fix
- fix(Grabber) prevents the pointer cancel for touch event
- fix(Convert) misalignment when converting text
- fix(Interact) keep cursor during shape transformation
- fix(Behaviors) fix change langage to reset init promise and raise event loaded
- fix(RestBehaviors) missing exported event when export function ended

## Samples
- updating the display of exchanged Websocket messages on TLDraw example

## Chore
- chore(deps): upgrade all dependencies

# [v2.0.1](https://github.com/MyScript/iinkTS/tree/v2.0.1)

## Features
- feat(example) add underline & strikethrought gestures on tldraw example
- feat(example) add possibility to disable gesture on tldraw example

## Bugs fix
- fix(Convert) converted word in a group with a stroke disappears after conversion
- fix(Gesture) don't send contextLessGesture if stroke not overlaps symbol
- fix(examples) wrong placement of text after convert in tldraw example
- fix(examples) style broken on websocket_text_customize_editor_css.html

# [v2.0.0](https://github.com/MyScript/iinkTS/tree/v2.0.0)

## Features
- offscreen behaviors

## Refactor
- [suggestion] friendly type declaration [#4](https://github.com/MyScript/iinkTS/issues/4)

# [v1.0.5](https://github.com/MyScript/iinkTS/tree/v1.0.5)

## Refactor
- use the native Crypto module instead of the crypto-js library as the library is no longer maintained [#3](https://github.com/MyScript/iinkTS/issues/3)
- split examples css files
- redesign of the examples homepage style

## Bugs fix
- fix(SmartGuide) it is possible to write just next to the ellipsis
- fix(WSBehaviors) add stroke to model when importPointEvents

# [v1.0.4](https://github.com/MyScript/iinkTS/tree/v1.0.4)

## Bugs fix
- fix(Types) not all types are exported for development
- fix(Model) clear export when strokes changed
- fix(README.md) installing iink-ts from github using readme fails
- fix(install) npm install error after git clone
- fix(style) Editor styles unavailable in shadow dom elements [#2](https://github.com/MyScript/iinkTS/issues/2)
- fix(Convert) Server state randomly corrupts and collapses the iink editor content [#1](https://github.com/MyScript/iinkTS/issues/1)
- fix(examples) math examples don't give result when katex fails
# [v1.0.3](https://github.com/MyScript/iinkTS/tree/v1.0.3)

## Samples
- sample Math with graph

## Bugs fix
- fix(Style) wrong import for custom grabber & custom recognizer

# [v1.0.2](https://github.com/MyScript/iinkTS/tree/v1.0.2)

## Samples
- sample custom grabber for websocket & REST
- sample custom recognizer for websocket & REST
- sample digram REST

## Refactor
- renaming redraw function to importPointEvents

## Chore
- chore(deps): upgrade crypto-js 3.3.0 -> 4.2.0

## Bugs fix
- fix(Stroke) generate uniqId
- fix(Sample) wrong import into dev sample

# [v1.0.1](https://github.com/MyScript/iinkTS/tree/v1.0.1)

## Features
- can redraw JIIX export

## Bugs fix
- fix(Smartguide) hide if no export JIIX
# [v1.0.0](https://github.com/MyScript/iinkTS/tree/v1.0.0)

## Features
- migration javascript to typescript [link](https://github.com/MyScript/iinkTS)
