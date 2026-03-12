/**
 * @group Manager
 * @summary Managers orchestrate user interactions and model updates
 *
 * Managers are organized by editor variant:
 *
 * **Base Managers** (`./base`)
 * - Used by all editor variants
 * - {@link AbstractWriterManager} - Base class for writing/drawing
 * - {@link EraseManager} - Handles erasing strokes/symbols
 *
 * **Simple Editor Managers** (`./simple`)
 * - Used by {@link InkEditor} (HTTPv2 API)
 * - {@link IWriterManager} - Manages writing with basic stroke model
 *
 * **Interactive Editor Managers** (`./interactive`)
 * - Used by {@link InteractiveInkEditor} (WebSocket API with advanced features)
 * - {@link IIWriterManager} - Manages writing with rich symbol support
 * - {@link IIConversionManager} - Converts between symbol types
 * - {@link IISelectionManager} - Manages symbol selection
 * - {@link IIResizeManager} - Handles resizing symbols
 * - {@link IIRotationManager} - Handles rotation of symbols
 * - {@link IITranslateManager} - Handles movement/translation
 * - {@link IITextManager} - Handles text editing
 * - {@link IIMoveManager} - Manages move operations
 *
 * **Debug Managers** (`./debug`)
 * - {@link IIDebugSVGManager} - Debug visualization for InteractiveInkEditor
 * - {@link IDebugSVGManager} - Debug visualization for InkEditor
 */

// Core abstractions
export * from "./base"

// Simple editor managers
export * from "./simple"

// Interactive editor managers
export * from "./interactive"

// Debug managers
export * from "./debug"
