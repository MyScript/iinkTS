import { convertBoundingBoxMillimeterToPixel } from "@/iink"
import { InkOverlay } from "../../../../../examples/components/ink-overlay/ink-overlay.js"
import type { TBox } from "../../../../../examples/components/ink-overlay/ink-overlay.js"

describe("components/ink-overlay", () => {
  const frames: FrameRequestCallback[] = []
  const nextFrame = () => frames.shift()?.(0)
  let container: HTMLElement
  let canvasElement: HTMLElement
  let svg: SVGSVGElement

  // Shaped like the SVGMatrix Chrome returns: coefficients only, no transformPoint
  const ctm = (scale: number, dx: number, dy: number) =>
    ({ a: scale, b: 0, c: 0, d: scale, e: dx, f: dy }) as unknown as DOMMatrix

  const item = (box: TBox) => ({
    element: document.createElement("div"),
    box,
    place: jest.fn<void, [HTMLElement, TBox]>(),
  })

  beforeEach(() => {
    frames.length = 0
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback))
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => frames.splice(0))
    container = document.createElement("div")
    container.getBoundingClientRect = () => ({ left: 10, top: 20, width: 500 }) as DOMRect
    canvasElement = document.createElement("div")
    canvasElement.innerHTML = `<div class="ms-layer-rendering"><svg></svg></div>`
    svg = canvasElement.querySelector("svg") as SVGSVGElement
    svg.getScreenCTM = () => ctm(1, 0, 0)
  })

  test("should show the rendered items in the container", () => {
    const overlay = new InkOverlay(container, canvasElement, convertBoundingBoxMillimeterToPixel)
    const first = item({ x: 0, y: 0, width: 1, height: 1 })
    const second = item({ x: 0, y: 0, width: 1, height: 1 })
    overlay.render([first, second])
    expect(Array.from(container.children)).toEqual([first.element, second.element])
    overlay.clear()
    expect(container.children).toHaveLength(0)
  })

  test("should place each item on its box, converted to container pixels", () => {
    svg.getScreenCTM = () => ctm(2, 100, 50)
    const overlay = new InkOverlay(container, canvasElement, convertBoundingBoxMillimeterToPixel)
    const line = item({ x: 10, y: 5, width: 20, height: 4 })
    overlay.render([line])
    nextFrame()
    const pixels = convertBoundingBoxMillimeterToPixel(line.box)
    expect(line.place).toHaveBeenCalledWith(line.element, {
      x: expect.closeTo(pixels.x * 2 + 100 - 10),
      y: expect.closeTo(pixels.y * 2 + 50 - 20),
      width: expect.closeTo(pixels.width * 2),
      height: expect.closeTo(pixels.height * 2),
    })
  })

  test("should place the items again only when the view moved", () => {
    const overlay = new InkOverlay(container, canvasElement, convertBoundingBoxMillimeterToPixel)
    const line = item({ x: 1, y: 1, width: 1, height: 1 })
    overlay.render([line])
    nextFrame()
    nextFrame()
    expect(line.place).toHaveBeenCalledTimes(1)
    svg.getScreenCTM = () => ctm(1.5, 0, 0)
    nextFrame()
    expect(line.place).toHaveBeenCalledTimes(2)
  })

  test("should place newly rendered items even when the view did not move", () => {
    const overlay = new InkOverlay(container, canvasElement, convertBoundingBoxMillimeterToPixel)
    overlay.render([item({ x: 1, y: 1, width: 1, height: 1 })])
    nextFrame()
    const next = item({ x: 2, y: 2, width: 1, height: 1 })
    overlay.render([next])
    nextFrame()
    expect(next.place).toHaveBeenCalledTimes(1)
  })

  test("should wait for the rendering layer before placing anything", () => {
    canvasElement.innerHTML = ""
    const overlay = new InkOverlay(container, canvasElement, convertBoundingBoxMillimeterToPixel)
    const line = item({ x: 1, y: 1, width: 1, height: 1 })
    overlay.render([line])
    nextFrame()
    expect(line.place).not.toHaveBeenCalled()
  })

  test("should stop following the view once destroyed", () => {
    const overlay = new InkOverlay(container, canvasElement, convertBoundingBoxMillimeterToPixel)
    overlay.render([item({ x: 1, y: 1, width: 1, height: 1 })])
    overlay.destroy()
    expect(frames).toHaveLength(0)
    expect(container.children).toHaveLength(0)
  })
})
