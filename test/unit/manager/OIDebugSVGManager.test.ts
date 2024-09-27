import { helloJIIX, lineJIIX, rectangleJIIX } from "../__dataset__/jiix.dataset"
import { buildOIStroke, buildOIText, delay } from "../helpers"
import
{
  OIDebugSVGManager,
  TOISymbolChar,
} from "../../../src/iink"
import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"

describe("OIDebugSVGManager.ts", () =>
{
  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OIDebugSVGManager(behaviors)
    expect(manager).toBeDefined()
    expect(manager.verticesVisibility).toEqual(false)
    expect(manager.boundingBoxVisibility).toEqual(false)
    expect(manager.recognitionBoxVisibility).toEqual(false)
    expect(manager.recognitionItemBoxVisibility).toEqual(false)
  })

  describe("bounding box", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())

    const manager = new OIDebugSVGManager(behaviors)

    beforeAll(async () =>
    {
      await behaviors.init()
    })

    afterEach(() =>
    {
      behaviors.model.clear()
      behaviors.renderer.clear()
    })

    test("should show/hide stroke bounding box", async () =>
    {
      const stroke = buildOIStroke()
      manager.model.addSymbol(stroke)
      manager.renderer.drawSymbol(stroke)
      expect(manager.renderer.layer.querySelectorAll("[debug=\"bounding-box\"]")).toHaveLength(0)
      manager.boundingBoxVisibility = true
      expect(manager.renderer.layer.querySelectorAll("[debug=\"bounding-box\"]")).toHaveLength(1)
      manager.boundingBoxVisibility = false
      expect(manager.renderer.layer.querySelectorAll("[debug=\"bounding-box\"]")).toHaveLength(0)
    })

    test("should show/hide text and char bounding box", async () =>
    {
      const chars: TOISymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-1",
          label: "A"
        },
        {
          bounds: { height: 10, width: 5, x: 5, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-2",
          label: "b"
        }
      ]
      const text = buildOIText({ chars, boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      manager.model.addSymbol(text)
      manager.renderer.drawSymbol(text)
      expect(manager.renderer.layer.querySelectorAll("[debug=\"bounding-box\"]")).toHaveLength(0)
      manager.boundingBoxVisibility = true
      expect(manager.renderer.layer.querySelectorAll("[debug=\"bounding-box\"]")).toHaveLength(3)
      manager.boundingBoxVisibility = false
      expect(manager.renderer.layer.querySelectorAll("[debug=\"bounding-box\"]")).toHaveLength(0)
    })
  })

  describe("vertices", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())

    const manager = new OIDebugSVGManager(behaviors)

    beforeAll(async () =>
    {
      await behaviors.init()
    })

    test("should show/hide stroke vertices", async () =>
    {
      const stroke = buildOIStroke()
      manager.model.addSymbol(stroke)
      manager.renderer.drawSymbol(stroke)
      expect(manager.renderer.layer.querySelectorAll("[debug=\"vertices\"]")).toHaveLength(0)
      manager.verticesVisibility = true
      expect(manager.renderer.layer.querySelectorAll("[debug=\"vertices\"]")).toHaveLength(stroke.pointers.length)
      manager.verticesVisibility = false
      expect(manager.renderer.layer.querySelectorAll("[debug=\"vertices\"]")).toHaveLength(0)
    })

  })

  describe("recognition box", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    Object.defineProperty(global.SVGElement.prototype, 'getBBox', {
      writable: true,
      value: jest.fn().mockReturnValue({
        x: 0,
        y: 0,
        width: 10,
        height: 10
      }),
    })
    const manager = new OIDebugSVGManager(behaviors)

    beforeAll(async () =>
    {
      await behaviors.init()
    })

    test("should show/hide stroke recognition box", async () =>
    {
      behaviors.model.exports = { "application/vnd.myscript.jiix": helloJIIX }
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-box\"]")).toHaveLength(0)
      manager.recognitionBoxVisibility = true
      await delay(100)
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-box\"]")).toHaveLength(helloJIIX.elements!.length)
      manager.recognitionBoxVisibility = false
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-box\"]")).toHaveLength(0)
    })

    test("should show/hide node recognition box", async () =>
    {
      behaviors.model.exports = { "application/vnd.myscript.jiix": rectangleJIIX }
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-box\"]")).toHaveLength(0)
      manager.recognitionBoxVisibility = true
      await delay(100)
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-box\"]")).toHaveLength(rectangleJIIX.elements!.length)
      manager.recognitionBoxVisibility = false
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-box\"]")).toHaveLength(0)
    })

    test("should show/hide edge recognition box", async () =>
    {
      behaviors.model.exports = { "application/vnd.myscript.jiix": lineJIIX }
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-box\"]")).toHaveLength(0)
      manager.recognitionBoxVisibility = true
      await delay(100)
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-box\"]")).toHaveLength(lineJIIX.elements!.length)
      manager.recognitionBoxVisibility = false
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-box\"]")).toHaveLength(0)
    })
  })

  describe("recognition item box", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    Object.defineProperty(global.SVGElement.prototype, 'getBBox', {
      writable: true,
      value: jest.fn().mockReturnValue({
        x: 0,
        y: 0,
        width: 10,
        height: 10
      }),
    })
    const manager = new OIDebugSVGManager(behaviors)

    beforeAll(async () =>
    {
      await behaviors.init()
    })

    test("should show/hide stroke recognition box", async () =>
    {
      behaviors.model.exports = { "application/vnd.myscript.jiix": helloJIIX }
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-item-box\"]")).toHaveLength(0)
      manager.recognitionItemBoxVisibility = true
      await delay(100)
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-item-box\"]")).toHaveLength(helloJIIX.elements!.length)
      manager.recognitionItemBoxVisibility = false
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-item-box\"]")).toHaveLength(0)
    })

    test("should show/hide node recognition box", async () =>
    {
      behaviors.model.exports = { "application/vnd.myscript.jiix": rectangleJIIX }
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-item-box\"]")).toHaveLength(0)
      manager.recognitionItemBoxVisibility = true
      await delay(100)
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-item-box\"]")).toHaveLength(rectangleJIIX.elements!.length)
      manager.recognitionItemBoxVisibility = false
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-item-box\"]")).toHaveLength(0)
    })

    test("should show/hide edge recognition box", async () =>
    {
      behaviors.model.exports = { "application/vnd.myscript.jiix": lineJIIX }
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-item-box\"]")).toHaveLength(0)
      manager.recognitionItemBoxVisibility = true
      await delay(100)
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-item-box\"]")).toHaveLength(lineJIIX.elements!.length)
      manager.recognitionItemBoxVisibility = false
      expect(manager.renderer.layer.querySelectorAll("[debug=\"recognition-item-box\"]")).toHaveLength(0)
    })
  })
})
