/**
 * @group Canvas
 * @summary Canvas variants for different use cases
 *
 * This module organizes different canvas implementations:
 * - {@link InteractiveInkCanvas} (`INTERACTIVE_INK`): full-featured interactive canvas, real-time recognition over WebSocket
 * - {@link InkCanvas} (`INK_V2`): basic ink canvas, batch recognition over the HTTP v2 API (recommended for simple use cases)
 * - {@link InteractiveInkSSRCanvas} (`INTERACTIVE_INK_SSR`): interactive canvas rendered by the server
 * - {@link InkCanvasDeprecated} (`INK_V1`): legacy HTTP v1 implementation (do not use for new projects)
 */
export * from "./InkCanvas"
export * from "./InkCanvasConfiguration"
export * from "./InkCanvasDeprecated"
export * from "./InkCanvasDeprecatedConfiguration"
export * from "./InteractiveInkCanvas"
export * from "./InteractiveInkCanvasConfiguration"
export * from "./InteractiveInkSSRCanvas"
export * from "./InteractiveInkSSRCanvasConfiguration"
