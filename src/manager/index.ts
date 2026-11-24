/**
 * @group Manager
 * @summary Managers orchestrate user interactions and model updates
 *
 * Managers are organized by canvas variant:
 *
 * **Base Managers** (`./base`)
 * - Shared by several canvas variants
 * - {@link AbstractWriterManager} - Base class for writing/drawing
 * - {@link EraseManager} - Handles erasing strokes/symbols
 * - {@link ExportManager} - Exports and downloads (json, svg, png, text, markdown…)
 * - {@link PDFExportManager} - PDF export through the browser's print dialog
 * - {@link LayoutManager} - Places menus and other occupants in the canvas slots
 * - {@link ColorPaletteManager} - Color palette manager (key-to-color mapping)
 *
 * **Simple Canvas Managers** (`./simple`)
 * - Used by {@link InkCanvas} (HTTPv2 API)
 * - {@link IWriterManager} - Manages writing with basic stroke model
 *
 * **Interactive Canvas Managers** (`./interactive`)
 * - Used by {@link InteractiveInkCanvas} (WebSocket API with advanced features)
 * - {@link IIWriterManager} - Manages writing with rich symbol support
 * - {@link IIConversionManager} - Converts between symbol types
 * - {@link IISelectionManager} - Manages symbol selection
 * - {@link IITransformManager} - Orchestrates {@link IITranslateManager}, {@link IIResizeManager}, {@link IIRotationManager}
 * - {@link IITypesetManager} - Handles text and math layout (bounds, reflow)
 * - {@link IIMoveManager} - Manages move operations
 * - {@link IISynchronizerManager} - Synchronizes strokes with JIIX recognition results
 * - {@link IIJiixQueryManager} - Queries the JIIX export (stroke ↔ block, labels)
 * - {@link IIGestureManager} - Applies recognized gestures
 * - {@link IIOverlayManager} - Visual overlays (highlights, variable panels)
 * - {@link IISnapManager} - Snapping while transforming
 * - {@link IIMathManager} - Math computation, variables and function evaluation
 * - {@link IIConnectorManager} - Smart connectors between edges and symbols
 * - {@link IIExportManager} - Export manager of the interactive canvas
 * - {@link IIPlaybackManager} - Stroke playback
 * - {@link IIKeyboardManager} - Keyboard shortcuts
 *
 * **Debug Managers** (`./debug`)
 * - {@link IDebugSVGManager} - Debug visualization for InkCanvas
 */

// Core abstractions
export * from "./base"

// Simple canvas managers
export * from "./simple"

// Interactive canvas managers
export * from "./interactive"

// Debug managers
export * from "./debug"
