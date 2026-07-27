/**
 * @group Manager
 * @summary Managers orchestrate user interactions and model updates
 *
 * Managers are organized by canvas variant:
 *
 * **Base Managers** (`./base`)
 * - Used by all canvas variants
 * - {@link AbstractWriterManager} - Base class for writing/drawing
 * - {@link EraseManager} - Handles erasing strokes/symbols
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
 * - {@link IIResizeManager} - Handles resizing symbols
 * - {@link IIRotationManager} - Handles rotation of symbols
 * - {@link IITranslateManager} - Handles movement/translation
 * - {@link IITypesetManager} - Handles text and math layout (bounds, reflow)
 * - {@link IIMoveManager} - Manages move operations
 * - {@link IISynchronizerManager} - Synchronizes strokes with JIIX recognition results
 * - {@link IIMathOverlayManager} - Visual overlays (badges, borders, result panels)
 * - {@link IIMathInteractionManager} - Interaction highlighting and dependency visualization
 * - {@link IIMathDependencyManager} - Math symbol dependency tracking and recalculation
 *
 * **Debug Managers** (`./debug`)
 * - {@link IIDebugSVGManager} - Debug visualization for InteractiveInkCanvas
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
