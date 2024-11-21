import { Stroke, convertPartialStrokesToStrokes, DefaultPenStyle, TPenStyle, PartialDeep, TStroke } from "../../../src/iink"

describe("Stroke.ts", () =>
{
  test("should create with default pointerType", () =>
  {
    const stroke = new Stroke(DefaultPenStyle)
    expect(stroke).toBeDefined()
    expect(stroke.style["-myscript-pen-fill-color"]).toBe(DefaultPenStyle["-myscript-pen-fill-color"])
    expect(stroke.style["-myscript-pen-fill-style"]).toBe(DefaultPenStyle["-myscript-pen-fill-style"])
    expect(stroke.style["-myscript-pen-width"]).toBe(DefaultPenStyle["-myscript-pen-width"])
    expect(stroke.style.color).toBe(DefaultPenStyle.color)
    expect(stroke.style.width).toBe(DefaultPenStyle.width)
    expect(stroke.pointers).toHaveLength(0)
    expect(stroke.pointerType).toBe("pen")
    expect(stroke.type).toBe("stroke")
  })

  test("should create with pointerType mouse", () =>
  {
    const stroke = new Stroke(DefaultPenStyle, "mouse")
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

    const stroke = new Stroke(penStyle)
    expect(stroke).toBeDefined()
    expect(stroke.style["-myscript-pen-fill-color"]).toBe(penStyle["-myscript-pen-fill-color"])
    expect(stroke.style["-myscript-pen-fill-style"]).toBe(penStyle["-myscript-pen-fill-style"])
    expect(stroke.style["-myscript-pen-width"]).toBe(penStyle["-myscript-pen-width"])
    expect(stroke.style.color).toBe(penStyle.color)
    expect(stroke.style.width).toBe(penStyle.width)
  })

  describe("convertPartialStrokesToStrokes", () =>
  {
    test("should convert", () =>
    {
      const pStrokes: PartialDeep<TStroke>[] = [
        {
          pointers: [
            { x: 254, y: 37, t: 1, p: 1 },
            { x: 253, y: 42, t: 2, p: 0.7 },
          ]
        },
        {
          pointers: [
            { x: 222, y: 386, t: 3, p: 0.5 },
            { x: 226, y: 385, t: 4, p: 0.8 },
          ],
          style: { width: 3, color: "#1A8CFF" }
        }
      ]
      const strokes = convertPartialStrokesToStrokes(pStrokes)
      expect(strokes).toHaveLength(2)
      expect(strokes[0].pointers[0]).toEqual(pStrokes[0]?.pointers?.[0])
      expect(strokes[0].style).toEqual(DefaultPenStyle)
      expect(strokes[1].pointers[1]).toEqual(pStrokes[1]?.pointers?.[1])
      expect(strokes[1].style).toEqual(expect.objectContaining(pStrokes[1]?.style))
    })
    test("should throw error if no pointers", () =>
    {
      const pStrokes: PartialDeep<TStroke>[] = [
        {
        },
      ]
      expect(() => convertPartialStrokesToStrokes(pStrokes)).toThrow("stroke 1 has not pointers")
    })
    test("should throw error if pointers have empty object", () =>
    {
      const pStrokes: PartialDeep<TStroke>[] = [
        {
          pointers: [undefined]
        },
      ]
      expect(() => convertPartialStrokesToStrokes(pStrokes)).toThrow("stroke 1 has no pointer at 0")
    })
    test("should throw an error if an x ​​is missing on pointers ", () =>
    {
      const pStrokes: PartialDeep<TStroke>[] = [
        {
          pointers: [
            { x: 254, y: 37, t: 1, p: 0.5 },
            { y: 42, t: 2, p: 0.7 },
          ]
        },
      ]
      expect(() => convertPartialStrokesToStrokes(pStrokes)).toThrow("stroke 1 has no x at pointer at 1")
    })
    test("should throw an error if an y ​​is missing on pointers ", () =>
    {
      const pStrokes: PartialDeep<TStroke>[] = [
        {
          pointers: [
            { x: 254, y: 37, t: 1, p: 0.5 },
            { x: 254, t: 2, p: 0.7 },
          ]
        },
      ]
      expect(() => convertPartialStrokesToStrokes(pStrokes)).toThrow("stroke 1 has no y at pointer at 1")
    })
  })
})
