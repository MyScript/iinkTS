import { TStroke, TPenStyle } from "../../../src/@types"
import { model, style } from "../../../src/iink"

describe("Stroke.ts", () =>
{
  const { Stroke } = model
  const { DefaultPenStyle } = style
  test("should create with default pointerType", () =>
  {
    const stroke: TStroke = new Stroke(DefaultPenStyle, 12)
    expect(stroke).toBeDefined()
    expect(stroke.style["-myscript-pen-fill-color"]).toBe(DefaultPenStyle["-myscript-pen-fill-color"])
    expect(stroke.style["-myscript-pen-fill-style"]).toBe(DefaultPenStyle["-myscript-pen-fill-style"])
    expect(stroke.style["-myscript-pen-width"]).toBe(DefaultPenStyle["-myscript-pen-width"])
    expect(stroke.style.color).toBe(DefaultPenStyle.color)
    expect(stroke.style.width).toBe(DefaultPenStyle.width)
    expect(stroke.elementType).toBeUndefined()
    expect(stroke.pointers).toHaveLength(0)
    expect(stroke.pointerId).toBe(12)
    expect(stroke.pointerType).toBe("pen")
    expect(stroke.type).toBe("stroke")
  })

  test("should create with pointerType mouse", () =>
  {
    const stroke: TStroke = new Stroke(DefaultPenStyle, 12, "mouse")
    expect(stroke.pointerType).toBe("mouse")
  })

  test("should create with custom PenStyle", () =>
  {
    const penStyle: TPenStyle = {
      "-myscript-pen-fill-color": "red",
      "-myscript-pen-fill-style": "purple",
      "-myscript-pen-width": 12,
      color: "green",
      width: 42
    }

    const stroke: TStroke = new Stroke(penStyle, 12)
    expect(stroke).toBeDefined()
    expect(stroke.style["-myscript-pen-fill-color"]).toBe(penStyle["-myscript-pen-fill-color"])
    expect(stroke.style["-myscript-pen-fill-style"]).toBe(penStyle["-myscript-pen-fill-style"])
    expect(stroke.style["-myscript-pen-width"]).toBe(penStyle["-myscript-pen-width"])
    expect(stroke.style.color).toBe(penStyle.color)
    expect(stroke.style.width).toBe(penStyle.width)
  })
})
