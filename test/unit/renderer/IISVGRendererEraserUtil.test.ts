import { IIEraser, IISVGRendererEraserUtil } from "../../../src/iink"

describe("IISVGRendererEraserUtil.ts", () =>
{
  test("should getSVGPath when no pointers", () =>
  {
    const eraserSym = new IIEraser()
    expect(IISVGRendererEraserUtil.getSVGPath(eraserSym)).toEqual("")
  })

  test("should getSVGPath when 2 pointers", () =>
  {
    const eraserSym = new IIEraser()
    eraserSym.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    eraserSym.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
    expect(IISVGRendererEraserUtil.getSVGPath(eraserSym)).toEqual("M 1 1 L 10 1")
  })

  test("should getSVGPath when more than 2 pointers", () =>
  {
    const eraserSym = new IIEraser()
    eraserSym.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    eraserSym.pointers.push({ p: 1, t: 1, x: 5, y: 5 })
    eraserSym.pointers.push({ p: 1, t: 1, x: 7, y: 5 })
    eraserSym.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
    expect(IISVGRendererEraserUtil.getSVGPath(eraserSym)).toEqual("M 1 1 L 5 5 L 7 5 L 10 1")
  })

  // test("should getSVGElement for eraser", () =>
  // {
  //   const eraserSym = new IIEraser()
  //   eraserSym.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
  //   eraserSym.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
  //   const el = renderer.getSVGElement(eraserSym)
  //   expect(el.getAttribute("id")).toEqual(eraserSym.id)
  //   expect(el.getAttribute("type")).toEqual("eraser")
  //   expect(el.getAttribute("stroke")).toEqual("grey")
  //   expect(el.getAttribute("stroke-width")).toEqual("12")
  // })
})
