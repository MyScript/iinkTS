/**
 * @group Renderer
 * @summary The SSR canvas's renderer, and the only thing that uses it
 *
 * `InteractiveInkSSRSVGRenderer` is used by `InteractiveInkSSRCanvas` and by nothing else, and
 * `SVGStroker` is used by that renderer and by nothing else. Both sat in `svg/` next to
 * `SVGRenderer`, which eleven other files depend on — so deleting the SSR variant meant picking two
 * files out of a shared folder and hoping nothing else referenced them.
 *
 * They are here so that each variant owns a renderer folder: `canvas/` dies with
 * `InkCanvasDeprecated`, `ssr/` dies with `InteractiveInkSSRCanvas`, and `svg/` plus `base/` are what
 * `InkCanvas` and `InteractiveInkCanvas` share. Asserted in
 * `test/unit/renderer/rendererDeletability.test.ts`.
 *
 * Note that `InteractiveInkSSRSVGRenderer` extends nothing — it is 215 standalone lines — so it does
 * not even need `BaseRenderer`.
 */
export * from "./SVGSSRenderer"
export * from "./SVGStroker"
