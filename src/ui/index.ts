/**
 * @group UI
 * @summary Generic widgets that know the DOM and nothing about the canvas
 *
 * `Modal`, `Table` and `Chart` are reusable presentation pieces: they depend on `dom` and `core`,
 * and on no canvas, manager or symbol. That is what separates them from the interactive widgets in
 * `components/`, which exist to serve one canvas variant.
 */
export * from "./Chart"
export * from "./Modal"
export * from "./Table"
