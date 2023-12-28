import { TPoint } from "../../primitive"

const XMLNS = "http://www.w3.org/2000/svg"

/**
 * @group Renderer
 */
export function createLayer(width: number, height: number, attrs: { [key: string]: string } = {}): SVGElement
{
  const svgEl = document.createElementNS(XMLNS, "svg")
  svgEl.setAttribute("width", `${ width }px`)
  svgEl.setAttribute("height", `${ height }px`)
  svgEl.setAttribute("viewBox", `0, 0, ${ width }, ${ height }`)
  Object.keys(attrs).forEach(k =>
  {
    svgEl.setAttribute(k, attrs[k])
  })
  return svgEl
}

/**
 * @group Renderer
 */
export function createFilter(id: string): SVGFilterElement
{
  const filter = document.createElementNS(XMLNS, "filter")
  filter.id = id
  return filter
}

/**
 * @group Renderer
 */
export function createDefs(): SVGDefsElement
{
  return document.createElementNS(XMLNS, "defs")
}

/**
 * @group Renderer
 */
export function createMarker(id: string, markerWidth: number, markerHeight: number, refX: number, refY: number, orient: "auto-start-reverse" | "auto"): SVGMarkerElement
{
  const marker = document.createElementNS(XMLNS, "marker")
  marker.setAttribute("id", id)
  marker.setAttribute("markerWidth", markerWidth.toString())
  marker.setAttribute("markerHeight", markerHeight.toString())
  marker.setAttribute("refX", refX.toString())
  marker.setAttribute("refY", refY.toString())
  marker.setAttribute("orient", orient)
  return marker
}

/**
 * @group Renderer
 */
export function createComponentTransfert(): SVGFEComponentTransferElement
{
  return document.createElementNS(XMLNS, "feComponentTransfer")
}

/**
 * @group Renderer
 */
export function createTransfertFunctionTable(type: "feFuncA" | "feFuncB" | "feFuncG" | "feFuncR", values: string): SVGFEFuncAElement
{
  const feFunc = document.createElementNS(XMLNS, type)
  feFunc.setAttribute("type", "table")
  feFunc.setAttribute("tableValues", values)
  return feFunc
}

/**
 * @group Renderer
 */
export function createGroup(attrs: { [key: string]: string } = {}): SVGGElement
{
  const groupEl = document.createElementNS(XMLNS, "g")
  Object.keys(attrs).forEach(k =>
  {
    groupEl.setAttribute(k, attrs[k])
  })
  return groupEl
}

/**
 * @group Renderer
 */
export function createLine(p1: TPoint, p2: TPoint, attrs: { [key: string]: string } = {}): SVGLineElement
{
  const lineEl = document.createElementNS(XMLNS, "line")
  lineEl.setAttribute("x1", p1.x.toString())
  lineEl.setAttribute("y1", p1.y.toString())
  lineEl.setAttribute("x2", p2.x.toString())
  lineEl.setAttribute("y2", p2.y.toString())
  Object.keys(attrs).forEach(k =>
  {
    lineEl.setAttribute(k, attrs[k])
  })
  return lineEl
}

/**
 * @group Renderer
 */
export function createCircle(p: TPoint, r: number, attrs: { [key: string]: string } = {}): SVGCircleElement
{
  const circleEl = document.createElementNS(XMLNS, "circle")
  circleEl.setAttribute("cx", p.x.toString())
  circleEl.setAttribute("cy", p.y.toString())
  circleEl.setAttribute("r", r.toString())
  Object.keys(attrs).forEach(k =>
  {
    circleEl.setAttribute(k, attrs[k])
  })
  return circleEl
}

/**
 * @group Renderer
 */
export function createPath(attrs: { [key: string]: string } = {}): SVGPathElement
{
  const pathEl = document.createElementNS(XMLNS, "path")
  Object.keys(attrs).forEach(k =>
  {
    pathEl.setAttribute(k, attrs[k])
  })
  return pathEl
}

/**
 * @group Renderer
 */
export function createPolygon(points: number[], attrs: { [key: string]: string } = {}): SVGPolylineElement
{
  const polygonEl = document.createElementNS(XMLNS, "polygon")
  polygonEl.setAttribute("points", points.join(","))
  Object.keys(attrs).forEach(k =>
  {
    polygonEl.setAttribute(k, attrs[k])
  })
  return polygonEl
}
