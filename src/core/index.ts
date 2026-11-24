/**
 * @group Core
 * @summary The lowest layer of the library: pure, DOM-free, dependency-free helpers
 *
 * Nothing here may import from anywhere else in `src/` — the eslint layer rule enforces it.
 *
 * **Math** — scalar helpers that speak `number` only
 *
 * **Geometry** — helpers that speak `TPoint`, `TBox`, `TSegment`, `TPointer`
 *
 * **Std** — helpers that speak `unknown`, plain objects and strings
 */
export * from "./geometry"
export * from "./latex"
export * from "./math"
export * from "./std"
