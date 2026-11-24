/**
 * @group Styles
 * @summary The only module in the library that depends on an npm package at runtime
 *
 * `StyleHelper` serialises a pen style or a theme to a CSS string, and parses one back, using
 * `json-css`. It is isolated here because it is the whole of that dependency: two call sites, both
 * in the legacy clients — `HTTPClientV1` (INK_V1) and `WebSocketSSRClient` — and nothing else in the
 * library reaches for it.
 *
 * Keeping it in `style/` meant every consumer of a `TStyle` transitively carried a CSS parser. With
 * it out, the modern library has no runtime npm dependency at all, and the two variants that need
 * one pay for it alone. An eslint rule holds that line: `json-css` may only be imported from here.
 */
export * from "./StyleHelper"
