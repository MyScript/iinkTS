

# [v4.0.0](https://github.com/MyScript/iinkTS/tree/v4.0.0)

## Features

### Editor state (IIC-1681 / IIC-1706)
- feat(editor): add `editor.connectionState` (initializing/online-idle/online-working/syncing/offline/error) + `connectionStateChanged` event, computed centrally in `AbstractEditor` for all 4 editor variants
- feat(editor): add `editor.trackOperation()`/`startOperation()`/`endOperation()` — named, ref-counted busy tracking; wired into recognition, conversion, synchronization, math computation/evaluation, transforms, gestures, and export/undo/redo/clear/import across all editor variants
- feat(editor): the state badge tooltip opens on click (positioned beside the badge) instead of on hover, and lists the active operation label(s) when busy
- feat(editor): `online-working` badge icon changed from a pencil to a 3-dot "typing" indicator (pulses per-dot); `online-working`/`syncing` badges now also pulse a colored ring around the badge itself
- feat(editor): "Recognizing" busy tracking reworked to an optimistic model — writer/transform managers mark it active on pointerDown/drag-start (immediate UI feedback, no network round-trip), and it's cleared once per debounced `synchronize()` cycle rather than per network call. Avoids serializing every stroke/transform send behind its individual server ack (previous approach added real latency to fast writing, scratch-out gestures, and multi-stroke imports)
- feat(editor): **BREAKING** `EditorLayer.updateState()`/`showState()`/`hideState()`/`createState()`/`createBusy()` removed — replaced by `updateEditorState()` driven by `editor.connectionState`. `EditorLayer.ui.state` shape changed (`{ root, icon, count }` instead of `{ root, busy }`)
- feat(recognizer): `RecognizerWebSocket` proactively detects unexpected disconnects and starts reconnecting immediately (previously only reactive, on the next `addStrokes()` call); `TConnectionStatus` gains an `"error"` value once reconnection attempts are exhausted, with the retry budget reset for the next attempt
- feat(examples): add "Connection Status" example demonstrating `editor.connectionState` and reconnect handling

### Math (IIC-1633)
- feat(math): implement comprehensive math dependencies visualization (variables, overlays, computation, evaluation)
- feat(math): add Math Diagnostic menu and function evaluator UI component
- feat(math): introduce TMathVariableUsage and variable cache layer
- feat(math): add numerical computation result display with graph rendering
- feat(math): add auto variable management option in menu (IIC-1660)
- feat(math): include math equations in downloadAsText export (IIC-1652)
- feat(math): add Power and Underoverscript expression types

### Chart (IIC-1639 / IIC-1640 / IIC-1642)
- feat(chart): support multiple data series with per-series colors
- feat(chart): add zoom and pan functionality with control buttons
- feat(chart): add toggle button for graph points visibility

### Editor
- feat(keyboard): add keyboard shortcuts — copy/paste/cut (Ctrl+C/V/X), undo/redo (Ctrl+Z/Y), zoom (Ctrl+±), pan (Ctrl+Arrows), fit (Ctrl+0) (IIC-1679)
- feat(editor): add zoomToFit(symbols?) to center view on content (IIC-1680)
- feat(minimap): add Minimap component with MutationObserver sync and click/drag navigation
- feat(menu): add minimap toggle button in action menu bar (shown in editor UI layer)

### Gestures & Input
- feat(gesture): add underline action options and integrate into gesture menu
- feat(gesture): enhance insert action for line breaks and horizontal inserts
- feat(erase): enhance stroke and character deletion logic
- feat(writer): add margin parameter to ensurePointVisible

### Other
- feat(selection): add selection granularity configuration (block/element)
- feat(jiix): add getBlocksForSymbols to IIJiixQueryManager
- feat(menu): add text export option to menu actions and context menu
- feat(dev-env): implement dev environment auto-loader for examples
- feat(gesture): join and insert gestures disabled by default

## Performance
- perf(chart): fix O(n²) spread accumulation in Chart
- perf(snap): use Set.has() for id lookup and coordinate bucketing
- perf(symbol): replace unbounded Map cache with single-value cache for bounds
- perf(synchronizer): parallelize math enrichment with per-block timeout
- perf(renderer): eliminate double indexOf call in SVGRendererMathUtil
- perf(model): remove unused symbolsToDelete getter

## Bugs fix
- fix(history): undo is no-op for style, order, and updated changes
- fix(history): carry through updated symbols in reverseChanges for undo
- fix(history): use -angle for rotation reversal
- fix(recognizer): HMAC challenge and computation errors surfaced via emitError
- fix(recognizer): undoDeferred and redoDeferred not reset after connection reset
- fix(recognizer): WebSocketSSR listeners never removed on reconnect
- fix(recognizer): emit EndInitialization after WebSocket handshake completes
- fix(renderer): canvas transform accumulates on each resize
- fix(renderer): remove spurious context2d.save() unbalancing canvas state
- fix(math): arrow SVG elements leak on each overlay refresh
- fix(math): hover zone not created if showOverlay is disabled
- fix(math): reset jiixId and variableValues on symbol duplication
- fix(math): remove unneeded parentheses around fraction numerator/denominator when converting math blocks to text (IIC-1717)
- fix(menu): context menu positioning within rendering layer bounds (IIC-1659)
- fix(menu): refresh context menu after editing variables
- fix(menu): remove document/scroll listener leaks on destroy
- fix(symbol): IIStroke.split() leaves length=0 on result strokes
- fix(symbol): IIEdgePolyLine.create validation never fired
- fix(utils): isDeepEqual incorrectly treats arrays as plain objects
- fix(utils): correct segment intersection endpoint guard
- fix(grabber): contextMenuHandler unsafe cast MouseEvent to PointerEvent
- fix(editor): destroy all existing instances before creating a new editor
- fix(editor): filter invalid strokes in importPointEvents
- fix(BaseMenuItem): remove replaceWith(cloneNode) causing DOM node leak on destroy
- fix(smartguide): correct event listener removal in removeListeners
- fix(security): force js-yaml ≥4.2.0 to fix CVE DoS audit

## Refactor
- refactor(math): split IIMathManager into sub-managers — variables, computation, evaluation (IIC-1633)
- refactor(overlay): replace math overlays with unified IIOverlayManager (IIC-1633)
- refactor(transform): unify transform managers under IITransformManager orchestrator (editor.transform.translate/.resize/.rotation)
- refactor(transform): rewrite AbstractTransformManager — drop TParams generics, all apply*() take MatrixTransform; add applyMatrixToPoints, setTransformOrigin, resolveInteractGroup, applyAndDraw, finalizeTransform helpers
- refactor(transform): move sub-managers to src/manager/interactive/transform/ (mirrors math/ structure)
- refactor(gesture): implement Strategy Pattern for IIGestureManager with GestureHandler base
- refactor(core): extract IIKeyboardManager, MathDependencyService, SymbolFactory from InteractiveInkEditor
- refactor(editor): move editor variants to dedicated folder
- refactor(selection): rename selection granularity levels from "block" to "element"
- refactor(symbol): remove group symbol handling and related utilities (IIC-1647)
- refactor(utils): centralize coordinate validation and constants
- refactor(renderer): remove duplicate SVG utility files
- refactor(recognizer): extract resolveDeferredByBlockId, mapCloseCodeToMessage
- refactor(chart): centralize dimension and range calculations
- refactor(symbol): reorganize src/symbol/ into logical categories — stroke/, text/, math/, typeset/, decorator/, eraser/, shape/, edge/, primitives/, legacy/ (IIC-1703)
- refactor(symbol): **BREAKING** remove II-prefix from all symbol types — IIStroke→TStroke, IIText→TText, IIMath→TMath, IIDecorator→TDecorator, IIEraser→TEraser, IIShapeCircle→TShapeCircle, IIEdgeLine→TEdgeLine, etc. (IIC-1703)
- refactor(symbol): **BREAKING** convert all symbol interfaces to type aliases with T* naming convention (IIC-1703)
- refactor(symbol): **BREAKING** remove SymbolFactory — creation dispatchers moved to SymbolHelpers (IIC-1703)
- refactor(symbol): apply TBaseSymbol intersection to all full symbol types (IIC-1703)
- refactor(symbol): rename convertPartialStrokesToIIStrokes → convertLegacyStrokesToStrokes (internal)

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
