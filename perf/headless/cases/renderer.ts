import type { TBenchCase } from "../lib/harness.ts"
import { sized, RESIDENT_SIZE, type TBenchFixture } from "../lib/fixture.ts"

/**
 * `SVGRenderer`: the pan path.
 *
 * Panning is where the renderer has already gone wrong — dragging a loaded document stuttered
 * because every pointer move recomputed the viewBox and walked every symbol.
 *
 * Under jsdom this measures jsdom's DOM, not a browser's, and what follows was measured rather than
 * assumed. Work added per symbol in the pan path is caught: an attribute written on every tracked
 * element takes the case from 7.4 ms to 13.6 ms, x2.6 past the limit. **Virtualization breaking is
 * not caught and cannot be** — disabling the cull makes the case *faster*, 7.4 to 5.9 ms, because
 * `remove()` and the re-append stop being called, and what a broken cull costs is paint and layout,
 * which jsdom does not have. Only the browser scenarios can see that one.
 */

const RENDERER_PAN_PASSES = 20 // 7.44 ms measured

export const OBJECT = "renderer"

export function cases(f: TBenchFixture): TBenchCase[] {
  return [
    {
      name: sized(`renderer: pan across @${RESIDENT_SIZE}`, RENDERER_PAN_PASSES),
      // Alternating direction, so the viewBox stays over the document. Panning one way for the length
      // of a run would carry it off the content, every symbol would be culled, and the case would
      // settle into measuring an empty screen.
      fn: () => {
        for (let pass = 0; pass < RENDERER_PAN_PASSES; pass++) {
          f.renderer.pan(pass % 2 === 0 ? 20 : -20, 0)
        }
      },
    },
  ]
}
