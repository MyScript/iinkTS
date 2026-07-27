import { buildIIStroke } from "../../../helpers"
import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { GestureHandler, GestureHelpers, TGestureType, TSymbol } from "@/iink"

class TestGestureHandler extends GestureHandler {
  readonly gestureType: TGestureType = "JOIN"
  async apply(): Promise<void> {
    return undefined
  }

  testIsSymbolAbove(source: TSymbol, target: TSymbol): boolean {
    return this.isSymbolAbove(source, target)
  }
  testIsSymbolInRow(source: TSymbol, target: TSymbol): boolean {
    return this.isSymbolInRow(source, target)
  }
  testIsSymbolBelow(source: TSymbol, target: TSymbol): boolean {
    return this.isSymbolBelow(source, target)
  }
  testGetFirstSymbol(symbols: TSymbol[]): TSymbol | undefined {
    return this.getFirstSymbol(symbols)
  }
  testGetLastSymbol(symbols: TSymbol[]): TSymbol | undefined {
    return this.getLastSymbol(symbols)
  }
}

describe("GestureHandler.ts", () => {
  const rowHeight = 10

  function setup() {
    const canvas = createCanvasMock()
    canvas.configuration.rendering.guides.gap = rowHeight
    const helpers = new GestureHelpers(asCanvas(canvas))
    const handler = new TestGestureHandler(asCanvas(canvas), helpers)
    return { canvas, handler }
  }

  describe("isSymbol", () => {
    const { handler } = setup()
    const s11 = buildIIStroke({ box: { height: rowHeight / 2, width: 5, x: 5, y: rowHeight } })
    const s12 = buildIIStroke({ box: { height: rowHeight / 2, width: 5, x: 50, y: rowHeight } })
    const s21 = buildIIStroke({ box: { height: rowHeight * 2, width: 5, x: 5, y: rowHeight } })
    const s22 = buildIIStroke({ box: { height: rowHeight * 2, width: 5, x: 50, y: rowHeight } })

    test("above should return false", () => {
      expect(handler.testIsSymbolAbove(s11, s12)).toEqual(false)
    })
    test("above should return false", () => {
      expect(handler.testIsSymbolAbove(s11, s21)).toEqual(false)
    })
    test("above should return false", () => {
      expect(handler.testIsSymbolAbove(s12, s21)).toEqual(false)
    })
    test("above should return true", () => {
      expect(handler.testIsSymbolAbove(s21, s12)).toEqual(true)
    })
    test("above should return false", () => {
      expect(handler.testIsSymbolAbove(s21, s22)).toEqual(false)
    })
    test("in row should return false", () => {
      expect(handler.testIsSymbolInRow(s11, s12)).toEqual(true)
    })
    test("in row should return false", () => {
      expect(handler.testIsSymbolInRow(s11, s21)).toEqual(false)
    })
    test("in row should return false", () => {
      expect(handler.testIsSymbolInRow(s12, s21)).toEqual(false)
    })
    test("in row should return true", () => {
      expect(handler.testIsSymbolInRow(s21, s12)).toEqual(false)
    })
    test("in row should return false", () => {
      expect(handler.testIsSymbolInRow(s21, s22)).toEqual(true)
    })
    test("below should return false", () => {
      expect(handler.testIsSymbolBelow(s11, s12)).toEqual(false)
    })
    test("below should return false", () => {
      expect(handler.testIsSymbolBelow(s11, s21)).toEqual(true)
    })
    test("below should return false", () => {
      expect(handler.testIsSymbolBelow(s12, s21)).toEqual(true)
    })
    test("below should return true", () => {
      expect(handler.testIsSymbolBelow(s21, s12)).toEqual(false)
    })
    test("below should return false", () => {
      expect(handler.testIsSymbolBelow(s21, s22)).toEqual(false)
    })
  })

  describe("get first/last symbol", () => {
    const { handler } = setup()
    const s11 = buildIIStroke({ box: { height: rowHeight / 2, width: 5, x: 5, y: rowHeight } })
    const s21 = buildIIStroke({ box: { height: rowHeight * 2, width: 5, x: 5, y: rowHeight } })
    const s22 = buildIIStroke({ box: { height: rowHeight * 2, width: 5, x: 50, y: rowHeight } })
    const s23 = buildIIStroke({ box: { height: rowHeight * 2, width: 5, x: 150, y: rowHeight } })
    const s31 = buildIIStroke({ box: { height: rowHeight * 3, width: 5, x: 5, y: rowHeight } })

    test("should return first symbol when different rows", () => {
      expect(handler.testGetFirstSymbol([s11, s21, s31])).toEqual(s11)
    })
    test("should return first symbol when in same row", () => {
      expect(handler.testGetFirstSymbol([s21, s22, s23])).toEqual(s21)
    })
    test("should return first symbol when only 1 symbol", () => {
      expect(handler.testGetFirstSymbol([s21])).toEqual(s21)
    })
    test("should return last symbol when different rows", () => {
      expect(handler.testGetLastSymbol([s11, s21, s31])).toEqual(s31)
    })
    test("should return last symbol when in same row", () => {
      expect(handler.testGetLastSymbol([s21, s22, s23])).toEqual(s23)
    })
    test("should return last symbol when only 1 symbol", () => {
      expect(handler.testGetLastSymbol([s21])).toEqual(s21)
    })
  })
})
