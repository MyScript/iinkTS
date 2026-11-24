/**
 * @group DOM
 * @summary Element construction and DOM-bound helpers, with zero internal dependencies
 *
 * This is the lowest layer that is allowed to touch the DOM. `core` stays DOM-free so the library
 * can run headless and so the client can be installed in Node, which is why these helpers cannot
 * live there — and why nothing here may import from anywhere else in `src/`.
 *
 * It merges what used to be `components/dom/` (element factories) and `browser/` (the rAF coalescer
 * and the SVG transform helper): both were DOM primitives with no dependencies, split across two
 * folders for no reason a consumer could see.
 */
export * from "./buttonElement"
export * from "./containerElement"
export { DOMFactory } from "./DOMFactory"
export * from "./inputElement"
export * from "./labelElement"
export * from "./miscElement"
export * from "./outputElement"
export * from "./RafCoalescer"
export * from "./selectElement"
export * from "./svgTransform"
export * from "./tableElement"
