import { JSDOM } from "jsdom"

/**
 * The benches measure the built bundle, not `src/`. Two reasons: it is what ships, and it removes
 * the need for a TypeScript runner in the bench path — node strips the types of these files itself.
 *
 * The bundle touches the DOM at import time, so a jsdom window has to be installed on the globals
 * before the import. Only the globals the library actually reaches for are copied; anything missing
 * will surface as a clear `ReferenceError` rather than a silent fallback.
 */
const DOM_GLOBALS = [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLCanvasElement",
  "SVGElement",
  "SVGGraphicsElement",
  "Element",
  "Node",
  "DOMParser",
  "XMLSerializer",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "CustomEvent",
  "Event",
  "EventTarget",
  "MutationObserver",
  "ResizeObserver",
] as const

/**
 * Globals that must come from jsdom even when node already provides one.
 *
 * Node has had `Event`, `CustomEvent` and `EventTarget` for several versions, so the "only fill what
 * is missing" rule left node's in place — and the library dispatches the same event object on both
 * an `EventTarget` subclass and a jsdom element, which cannot both accept it unless all three come
 * from one realm. Leaving node's in place threw `parameter 1 is not of type 'Event'`; taking jsdom's
 * event classes alone moved the throw to the other side, `must be an instance of Event. Received an
 * instance of CustomEvent`.
 */
const REALM_BOUND = new Set<string>(["Event", "CustomEvent", "EventTarget"])

export function installDom(): void {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true })
  const source = dom.window as unknown as Record<string, unknown>
  const target = globalThis as unknown as Record<string, unknown>
  for (const key of DOM_GLOBALS) {
    if (source[key] === undefined) continue
    if (target[key] === undefined || REALM_BOUND.has(key)) {
      target[key] = source[key]
    }
  }
}
