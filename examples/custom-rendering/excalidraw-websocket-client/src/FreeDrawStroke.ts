import type { ExcalidrawElement, ExcalidrawFreeDrawElement, ExcalidrawLinearElement, ExcalidrawTextElement } from "@excalidraw/excalidraw/element/types"
import type { TRecognitionStroke } from "iink-ts"

/**
 * Excalidraw stores no timestamp per point; the interval between points is synthesized, as the
 * TLDraw example does
 */
export const POINT_INTERVAL_MS = 20

export type TBox = { minX: number, minY: number, maxX: number, maxY: number }

export const isFreeDraw = <T extends ExcalidrawElement>(element: T): element is T & ExcalidrawFreeDrawElement =>
  element.type === "freedraw"

type TPointsElement = ExcalidrawFreeDrawElement | ExcalidrawLinearElement

const hasPoints = (element: ExcalidrawElement): element is TPointsElement => "points" in element

export const isText = <T extends ExcalidrawElement>(element: T): element is T & ExcalidrawTextElement =>
  element.type === "text"

/**
 * Only what changes the ink on the page: a colour or a width change must not trigger a new recognition
 */
export const geometrySignature = (element: ExcalidrawFreeDrawElement): string =>
  [element.x, element.y, element.angle, element.width, element.height, element.points.length].join("|")

/**
 * Points are relative to (x, y); Excalidraw rotates an element around the center of its points bounds
 */
export const toScenePoints = (element: TPointsElement): { x: number, y: number }[] =>
{
  const xs = element.points.map(([x]) => x)
  const ys = element.points.map(([, y]) => y)
  const cx = element.x + (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = element.y + (Math.min(...ys) + Math.max(...ys)) / 2
  const cos = Math.cos(element.angle)
  const sin = Math.sin(element.angle)
  return element.points.map(([px, py]) =>
  {
    const dx = element.x + px - cx
    const dy = element.y + py - cy
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
  })
}

export const sceneBox = (element: ExcalidrawElement): TBox =>
{
  // A line's (x, y) is its first point, not its top-left corner: its bounds come from its points
  const points = hasPoints(element) ? toScenePoints(element) : [{ x: element.x, y: element.y }, { x: element.x + element.width, y: element.y + element.height }]
  return {
    minX: Math.min(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)),
    maxX: Math.max(...points.map(p => p.x)),
    maxY: Math.max(...points.map(p => p.y)),
  }
}

export const boxContains = (outer: TBox, inner: TBox): boolean =>
  outer.minX <= inner.minX && outer.minY <= inner.minY && outer.maxX >= inner.maxX && outer.maxY >= inner.maxY

export const boxOverlaps = (a: TBox, b: TBox): boolean =>
  a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY

export const expandBox = (box: TBox, margin: number): TBox =>
  ({ minX: box.minX - margin, minY: box.minY - margin, maxX: box.maxX + margin, maxY: box.maxY + margin })

/**
 * creationTime is when the stroke was first seen, kept across replacements so the recognizer
 * keeps the writing order it uses for gesture detection
 */
export const toRecognitionStroke = (element: ExcalidrawFreeDrawElement, creationTime: number): TRecognitionStroke => ({
  id: element.id,
  pointerType: element.simulatePressure ? "mouse" : "pen",
  creationTime,
  pointers: toScenePoints(element).map((point, i) => ({
    ...point,
    dt: i * POINT_INTERVAL_MS,
    p: element.pressures[i] ?? 1,
  })),
})
