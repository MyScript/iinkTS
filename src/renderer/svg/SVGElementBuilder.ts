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
