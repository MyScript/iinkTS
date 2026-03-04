
// Core
export * from "./AbstractEditor"
export * from "./Editor"
export * from "./EditorEvent"
export * from "./EditorLayer"
export * from "./EditorTriggerConfiguration"

// Factory
export { EditorFactory, type EditorVariantMap, type EditorOptionsMap } from "./EditorFactory"

// Editor variants
export * from "./variants"

// Re-export concrete implementations for backward compatibility
export * from "./InkEditor"
export * from "./InkEditorConfiguration"

export * from "./InkEditorDeprecated"
export * from "./InkEditorDeprecatedConfiguration"

export * from "./InteractiveInkSSREditor"
export * from "./InteractiveInkSSREditorConfiguration"

export * from "./InteractiveInkEditor"
export * from "./InteractiveInkEditorConfiguration"
