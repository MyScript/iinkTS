// Core
export * from "./AbstractCanvas"
export * from "./Canvas"
export * from "./CanvasEvent"
export * from "./CanvasLayer"
export * from "./CanvasTriggerConfiguration"
export * from "./TCanvasOperationLabel"
export * from "./TInkCanvas"
export * from "./TInteractiveInkCanvas"

// Factory
export { CanvasFactory, type TCanvasOptionsMap, type TCanvasVariantMap } from "./CanvasFactory"

// The four variants are deliberately NOT re-exported here. This barrel is the canvas *contract* —
// `AbstractCanvas`, the events, the layer, `TInkCanvas`, `TInteractiveInkCanvas` — and a manager
// that imports it must not thereby pull four concrete canvases into the bundle. Reaching a variant
// is explicit, through `@/canvas/variants`, which is also what makes the eslint ban on naming a
// concrete canvas enforceable: re-exporting them here was a way around it.
// The public surface is unchanged: `src/iink.ts` exports `./canvas/variants` directly.
