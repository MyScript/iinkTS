/**
 * @group Canvas
 * @summary Canvas variants for different use cases
 *
 * This module organizes different canvas implementations:
 * - **InkCanvasVariant**: Basic ink canvas with HTTPv2 API (recommended for simple use cases)
 * - **InteractiveInkCanvasVariant**: Full-featured interactive canvas with WebSocket and advanced features
 * - **InteractiveInkSSRCanvasVariant**: SSR-compatible variant for server-side rendering
 * - **InkCanvasDeprecatedVariant**: Legacy HTTPv1 implementation (do not use for new projects)
 */
export * from "./InkCanvas"
export * from "./InkCanvasConfiguration"
export * from "./InkCanvasDeprecated"
export * from "./InkCanvasDeprecatedConfiguration"
export * from "./InteractiveInkCanvas"
export * from "./InteractiveInkCanvasConfiguration"
export * from "./InteractiveInkSSRCanvas"
export * from "./InteractiveInkSSRCanvasConfiguration"
