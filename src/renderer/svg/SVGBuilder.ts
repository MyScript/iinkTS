import { TBoundingBox, TPoint } from "../../primitive"

const XMLNS = "http://www.w3.org/2000/svg"
/**
 * @group Renderer
 */
export class SVGBuilder
{
  static createLayer(boundingBox: TBoundingBox, attrs: { [key: string]: string } = {}): SVGElement
  {
    const svgEl = document.createElementNS(XMLNS, "svg")
    svgEl.setAttribute("width", `${ boundingBox.width }px`)
    svgEl.setAttribute("height", `${ boundingBox.height }px`)
    svgEl.setAttribute("viewBox", `${boundingBox.x}, ${boundingBox.y}, ${boundingBox. width }, ${ boundingBox.height }`)
    Object.keys(attrs).forEach(k =>
    {
      svgEl.setAttribute(k, attrs[k])
    })
    return svgEl
  }

  static createFilter(id: string, attrs: { [key: string]: string } = {}): SVGFilterElement
  {
    const filter = document.createElementNS(XMLNS, "filter")
    filter.id = id
    Object.keys(attrs).forEach(k =>
    {
      filter.setAttribute(k, attrs[k])
    })
    return filter
  }

  static createDefs(): SVGDefsElement
  {
    return document.createElementNS(XMLNS, "defs")
  }

  static createMarker(id: string, attrs: { [key: string]: string } = {}): SVGMarkerElement
  {
    const marker = document.createElementNS(XMLNS, "marker")
    marker.setAttribute("id", id)
    Object.keys(attrs).forEach(k =>
    {
      marker.setAttribute(k, attrs[k])
    })
    return marker
  }

  static createComponentTransfert(): SVGFEComponentTransferElement
  {
    return document.createElementNS(XMLNS, "feComponentTransfer")
  }

  static createDropShadow({ dx = 0, dy = 0, deviation = 0, color = "#3e68ff", opacity = 1 }): SVGFEDropShadowElement
  {
    const shadow = document.createElementNS(XMLNS, "feDropShadow")
    shadow.setAttribute("dx", dx.toString())
    shadow.setAttribute("dy", dy.toString())
    shadow.setAttribute("stdDeviation", deviation.toString())
    shadow.setAttribute("flood-color", color)
    shadow.setAttribute("flood-opacity", opacity.toString())
    return shadow
  }

  static createTransfertFunctionTable(type: "feFuncA" | "feFuncB" | "feFuncG" | "feFuncR", values: string): SVGFEFuncAElement
  {
    const feFunc = document.createElementNS(XMLNS, type)
    feFunc.setAttribute("type", "table")
    feFunc.setAttribute("tableValues", values)
    return feFunc
  }

  static createGroup(attrs: { [key: string]: string } = {}): SVGGElement
  {
    const groupEl = document.createElementNS(XMLNS, "g")
    Object.keys(attrs).forEach(k =>
    {
      groupEl.setAttribute(k, attrs[k])
    })
    return groupEl
  }

  static createLine(p1: TPoint, p2: TPoint, attrs: { [key: string]: string } = {}): SVGLineElement
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

  static createCircle(p: TPoint, r: number, attrs: { [key: string]: string } = {}): SVGCircleElement
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

  static createPath(attrs: { [key: string]: string } = {}): SVGPathElement
  {
    const pathEl = document.createElementNS(XMLNS, "path")
    Object.keys(attrs).forEach(k =>
    {
      pathEl.setAttribute(k, attrs[k])
    })
    return pathEl
  }

  static createPolygon(points: number[], attrs: { [key: string]: string } = {}): SVGPolylineElement
  {
    const polygonEl = document.createElementNS(XMLNS, "polygon")
    polygonEl.setAttribute("points", points.join(","))
    Object.keys(attrs).forEach(k =>
    {
      polygonEl.setAttribute(k, attrs[k])
    })
    return polygonEl
  }

  static createRect(box: TBoundingBox, attrs: { [key: string]: string } = {}): SVGRectElement
  {
    const rectEl = document.createElementNS(XMLNS, "rect")
    rectEl.setAttribute("x", box.x.toString())
    rectEl.setAttribute("y", box.y.toString())
    rectEl.setAttribute("width", box.width.toString())
    rectEl.setAttribute("height", box.height.toString())
    Object.keys(attrs).forEach(k =>
    {
      rectEl.setAttribute(k, attrs[k])
    })
    return rectEl
  }

  static createTSpan(text: string, attrs: { [key: string]: string } = {}): SVGTSpanElement
  {
    const tSpanEl = document.createElementNS(XMLNS, "tspan")
    tSpanEl.textContent = text
    Object.keys(attrs).forEach(k =>
    {
      tSpanEl.setAttribute(k, attrs[k])
    })
    return tSpanEl
  }

  static createForeignObject(box: TBoundingBox, node: HTMLElement, attrs: { [key: string]: string } = {}): SVGForeignObjectElement
  {
    const objEl = document.createElementNS(XMLNS, "foreignObject")
    objEl.setAttribute("x", box.x.toString())
    objEl.setAttribute("y", box.y.toString())
    objEl.setAttribute("width", box.width.toString())
    objEl.setAttribute("height", box.height.toString())
    Object.keys(attrs).forEach(k =>
    {
      objEl.setAttribute(k, attrs[k])
    })
    objEl.appendChild(node)
    return objEl
  }

  static createText(p: TPoint, text: string, attrs: { [key: string]: string } = {}): SVGTextElement
  {
    const textEl = document.createElementNS(XMLNS, "text")
    textEl.textContent = text
    textEl.setAttribute("x", p.x.toString())
    textEl.setAttribute("y", p.y.toString())
    Object.keys(attrs).forEach(k =>
    {
      textEl.setAttribute(k, attrs[k])
    })
    return textEl
  }
}
