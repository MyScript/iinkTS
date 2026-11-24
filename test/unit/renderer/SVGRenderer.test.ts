import { beforeAll, describe, test, expect } from "@jest/globals"
import { buildIICircle, buildIIEraser, buildIILine, buildIIStroke, buildIIText } from "../helpers"
import { BoxOps, DefaultIIRendererConfiguration, Geometry2d, MatrixTransform, OBBOps, Polygon2d, SVGRenderer, SVGRendererConst, StrokeUtil, SymbolUtil, TBaseSymbol, TBox, TIIRendererConfiguration, TPartialDeep, TPoint, TSymbol, TSymbolChar, TTransformContext, applyMatrixToPoint, registerBuiltinSymbolUtils, symbolRegistry } from "@/iink"

beforeAll(() => {
  registerBuiltinSymbolUtils()
})

describe("SVGRenderer.ts", () => {
  test("should instanciate", () => {
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    expect(renderer).toBeDefined()
    expect(renderer.configuration).toEqual(DefaultIIRendererConfiguration)
  })

  describe("init", () => {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    renderer.init(divElement)
    test("should create layer", () => {
      const elements = divElement.getElementsByTagName("svg")
      expect(elements).toHaveLength(2) // main layer + current-symbol overlay
      const layer = elements.item(0) as SVGElement
      expect(renderer.layer).toBe(layer)
    })
    test("should create guides with default gap", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultIIRendererConfiguration)) as TIIRendererConfiguration
      customConf.minHeight = customConf.guides.gap * 2
      customConf.minWidth = customConf.guides.gap * 2
      customConf.guides.type = "point"
      const rendererCustom = new SVGRenderer(customConf)
      rendererCustom.init(divElement)
      const guidesGroup = divElement.querySelector("#guides-wrapper") as SVGGElement
      expect(guidesGroup).toBeDefined()
      // Point guide is a tiled pattern (cheap to rasterize), not one dot per point in the DOM.
      const pattern = guidesGroup.querySelector("pattern")
      const rect = guidesGroup.querySelector("rect")
      expect(pattern).not.toBeNull()
      expect(pattern?.getAttribute("width")).toBe(String(customConf.guides.gap))
      expect(rect?.getAttribute("fill")).toBe(`url(#${pattern?.id})`)
      expect(rendererCustom.horizontalGuides.length).toBeGreaterThan(0)
      expect(rendererCustom.verticalGuides.length).toBeGreaterThan(0)
    })
    test("should create guides with custom gap", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultIIRendererConfiguration)) as TIIRendererConfiguration
      customConf.minHeight = 100
      customConf.minWidth = 100
      customConf.guides.gap = 5
      const rendererCustom = new SVGRenderer(customConf)
      rendererCustom.init(divElement)
      const guidesGroup = divElement.querySelector("#guides-wrapper") as SVGGElement
      expect(guidesGroup).toBeDefined()
      const pattern = guidesGroup.querySelector("pattern")
      const rect = guidesGroup.querySelector("rect")
      expect(pattern).not.toBeNull()
      expect(pattern?.getAttribute("width")).toBe("5")
      expect(rect?.getAttribute("fill")).toBe(`url(#${pattern?.id})`)
      // Full resolution kept (no more skip-factor thinning) - pattern cost doesn't scale with point count.
      expect(rendererCustom.horizontalGuides.length).toBe(rendererCustom.verticalGuides.length)
    })
    test("should create guides line", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultIIRendererConfiguration)) as TIIRendererConfiguration
      customConf.guides.type = "line"
      customConf.minHeight = customConf.guides.gap * 2
      customConf.minWidth = customConf.guides.gap * 2
      const rendererCustom = new SVGRenderer(customConf)
      rendererCustom.init(divElement)
      const guidesGroup = divElement.querySelector("#guides-wrapper") as SVGGElement
      expect(guidesGroup).toBeDefined()
      const guideLines = guidesGroup.getElementsByTagName("path")
      expect(guideLines).toHaveLength(1)
      expect(guideLines.item(0)?.getAttribute("d")?.split("M")).toHaveLength(10)
    })
    test("should create guides grid", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultIIRendererConfiguration)) as TIIRendererConfiguration
      customConf.guides.type = "grid"
      customConf.minHeight = customConf.guides.gap * 2
      customConf.minWidth = customConf.guides.gap * 2
      const rendererCustom = new SVGRenderer(customConf)
      rendererCustom.init(divElement)
      const guidesGroup = divElement.querySelector("#guides-wrapper") as SVGGElement
      expect(guidesGroup).toBeDefined()
      const guideLines = guidesGroup.getElementsByTagName("path")
      expect(guideLines).toHaveLength(2)
      expect(guideLines.item(0)?.getAttribute("d")?.split("M")).toHaveLength(21)
      expect(guideLines.item(1)?.getAttribute("d")?.split("M")).toHaveLength(81)
    })
    test("should write error if guides.type unknow", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultIIRendererConfiguration))
      customConf.guides.type = "test"
      const rendererCustom = new SVGRenderer(customConf)
      rendererCustom.init(divElement)
      expect(console.error).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith({
        level: "error",
        message: ["Guide type unknown: test"],
        from: "RENDERER.drawGuides",
      })
    })
    test("should not create guides", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultIIRendererConfiguration))
      customConf.guides.enable = false
      const rendererCustom = new SVGRenderer(customConf)
      rendererCustom.init(divElement)
      const element = divElement.querySelector("#guides-wrapper")
      expect(element).toBeNull()
    })
  })

  describe("attribute", () => {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    renderer.init(divElement)
    const element = document.createElement("path")
    element.id = "attribut-test-id"
    renderer.layer.appendChild(element)
    const attr = { name: "attribut-test-name", value: "attribut-test-value" }

    test("should set & get attribut", () => {
      expect(renderer.getAttribute(element.id, attr.name)).toBeFalsy()

      renderer.setAttribute(element.id, attr.name, attr.value)
      expect(renderer.getAttribute(element.id, attr.name)).toEqual(attr.value)
    })

    test("should do nothing if element not exist in layer", () => {
      renderer.setAttribute("unknow-id", attr.name, attr.value)
      expect(renderer.getAttribute("unknow-id", attr.name)).toBeFalsy()
    })
  })

  describe("element", () => {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    renderer.init(divElement)

    const elementToPreprend = document.createElement("path")
    elementToPreprend.id = "preprend-id"

    const elementToAppend = document.createElement("path")
    elementToAppend.id = "append-id"

    test("should prependElement", () => {
      const nbChild = renderer.layer.childElementCount
      expect(renderer.layer.firstElementChild?.getAttribute("id")).not.toEqual(elementToPreprend.id)
      renderer.prependElement(elementToPreprend)
      expect(renderer.layer.childElementCount).toEqual(nbChild + 1)
      expect(renderer.layer.firstElementChild?.getAttribute("id")).toEqual(elementToPreprend.id)
    })

    test("should appendElement", () => {
      const nbChild = renderer.layer.childElementCount
      expect(renderer.layer.lastElementChild?.getAttribute("id")).not.toEqual(elementToAppend.id)
      renderer.appendElement(elementToAppend)
      expect(renderer.layer.childElementCount).toEqual(nbChild + 1)
      expect(renderer.layer.lastElementChild?.getAttribute("id")).toEqual(elementToAppend.id)
    })
  })

  describe("symbol", () => {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    renderer.init(divElement)

    test("should write error if symbol type unknow", () => {
      //@ts-ignore
      const unknowSym: TSymbol = {
        //@ts-ignore
        type: "unknow",
        bounds: OBBOps.fromBox({ height: 0, width: 0, x: 0, y: 0 }),
        creationTime: Date.now(),
        modificationDate: Date.now(),
        clone: jest.fn(),
        overlaps: jest.fn(),
        id: "unknow",
      }
      renderer.drawSymbol(unknowSym)
      const el = divElement.querySelector(`#${unknowSym.id}`)!
      expect(el).toBeNull()
      expect(console.error).toHaveBeenCalledTimes(1)
    })
    test("should draw eraser", () => {
      const eraser = buildIIEraser()
      renderer.drawSymbol(eraser)
      const el = divElement.querySelector(`#${eraser.id}`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(eraser.id)
      expect(el.getAttribute("type")).toEqual(eraser.type)
      expect(el.getAttribute("stroke")).toEqual("grey")
      expect(el.getAttribute("opacity")).toEqual("0.2")
      expect(el.getAttribute("stroke-width")).toEqual("5")
    })
    test("should outline a selected symbol with a class, not an SVG filter", () => {
      // WebKit's renderer crashed painting the former SVG selection filter on several strokes
      const stroke = buildIIStroke()
      renderer.drawSymbol(stroke)
      const el = divElement.querySelector(`#${stroke.id}`)!

      renderer.updateSelectedState(stroke, true)
      expect(el.classList.contains(SVGRendererConst.selectedClassName)).toBe(true)
      expect(el.hasAttribute("filter")).toBe(false)
      expect(divElement.querySelector("#selection-filter")).toBeNull()

      renderer.updateSelectedState(stroke, false)
      expect(el.classList.contains(SVGRendererConst.selectedClassName)).toBe(false)
    })
    test("should keep a selected stroke outlined when it is redrawn", () => {
      const stroke = buildIIStroke()
      renderer.drawSymbol(stroke)
      renderer.updateSelectedState(stroke, true)

      renderer.drawSymbol(stroke)
      expect(renderer.getElementById(stroke.id)?.classList.contains(SVGRendererConst.selectedClassName)).toBe(true)

      renderer.updateSelectedState(stroke, false)
    })
    describe.each([
      ["shape", () => buildIICircle({ style: { width: 3 } })],
      ["edge", () => buildIILine({ style: { width: 3 } })],
    ])("selected %s", (_type, build) => {
      // Its stroke is the line itself, so the outline cannot be painted under it with paint-order:
      // a wider copy of the path, the halo, is drawn underneath instead
      test("should be grouped with a halo drawn under it", () => {
        const symbol = build()
        renderer.drawSymbol(symbol)

        renderer.updateSelectedState(symbol, true)
        const group = renderer.getElementById(symbol.id)!
        expect(group.tagName).toEqual("g")
        expect(group.getAttribute("type")).toEqual(symbol.type)
        expect(group.classList.contains(SVGRendererConst.selectedClassName)).toBe(true)
        expect(divElement.querySelectorAll(`#${symbol.id}`)).toHaveLength(1)

        const [halo, path] = Array.from(group.children)
        expect(halo.classList.contains(SVGRendererConst.selectionHaloClassName)).toBe(true)
        expect(halo.getAttribute("stroke-width")).toEqual("7")
        expect(halo.hasAttribute("marker-end")).toBe(false)
        expect(halo.getAttribute("style")).toContain("pointer-events: none")
        expect(path.hasAttribute("id")).toBe(false)
        expect(path.hasAttribute("type")).toBe(false)
        expect(path.getAttribute("stroke-width")).toEqual("3")
      })
      test("should keep its halo when redrawn or moved", () => {
        const symbol = build()
        renderer.drawSymbol(symbol)
        renderer.updateSelectedState(symbol, true)

        renderer.drawSymbol(symbol)
        expect(renderer.getElementById(symbol.id)!.querySelector(`.${SVGRendererConst.selectionHaloClassName}`)).not.toBeNull()

        symbol.transform = MatrixTransform.identity().translate(10, 20)
        renderer.setSymbolTransform(symbol)
        const group = renderer.getElementById(symbol.id)!
        expect(group.getAttribute("transform")).toEqual(MatrixTransform.toCssString(symbol.transform))
        Array.from(group.children).forEach((child) => expect(child.hasAttribute("transform")).toBe(false))
      })
      test("should be drawn alone again once unselected", () => {
        const symbol = build()
        renderer.drawSymbol(symbol)
        renderer.updateSelectedState(symbol, true)

        renderer.updateSelectedState(symbol, false)
        const el = renderer.getElementById(symbol.id)!
        expect(el.tagName).toEqual("path")
        expect(el.classList.contains(SVGRendererConst.selectedClassName)).toBe(false)
        expect(el.parentElement).toBe(renderer.layer)
        expect(el.previousElementSibling?.classList.contains(SVGRendererConst.selectionHaloClassName)).toBeFalsy()
      })
    })
    test("should fade a symbol being erased with a class, not an SVG filter", () => {
      // WebKit's renderer crashed painting the former SVG removal filter, on as few as five strokes
      const stroke = buildIIStroke()
      renderer.drawSymbol(stroke)
      const el = divElement.querySelector(`#${stroke.id}`)!

      renderer.updateDeletingState(stroke, true)
      expect(el.classList.contains(SVGRendererConst.deletingClassName)).toBe(true)
      expect(el.hasAttribute("filter")).toBe(false)
      expect(divElement.querySelector("#removal-filter")).toBeNull()

      renderer.updateDeletingState(stroke, false)
      expect(el.classList.contains(SVGRendererConst.deletingClassName)).toBe(false)
    })
    test("should draw stroke", () => {
      const stroke = buildIIStroke()
      renderer.drawSymbol(stroke)
      const el = divElement.querySelector(`#${stroke.id}`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(stroke.id)
      expect(el.getAttribute("type")).toEqual("stroke")
      // The element found by id is the path itself: a path symbol no longer sits inside a group.
      expect(el.getAttribute("fill")).toEqual(stroke.style.color)
      expect(el.getAttribute("stroke-width")).toEqual(stroke.style.width?.toString())
    })
    test("should draw circle", () => {
      const circle = buildIICircle()
      renderer.drawSymbol(circle)
      const el = divElement.querySelector(`#${circle.id}`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(circle.id)
      expect(el.getAttribute("type")).toEqual("shape")
      expect(el.getAttribute("stroke")).toEqual(circle.style.color)
      expect(el.getAttribute("stroke-width")).toEqual(circle.style.width?.toString())
    })
    test("should draw line", () => {
      const line = buildIILine()
      renderer.drawSymbol(line)
      const el = divElement.querySelector(`#${line.id}`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual("edge")
      expect(el.getAttribute("stroke")).toEqual(line.style.color)
      expect(el.getAttribute("stroke-width")).toEqual(line.style.width?.toString())
    })
    test("should draw text", () => {
      const chars: TSymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-1",
          label: "A",
        },
        {
          bounds: { height: 10, width: 5, x: 5, y: 10 },
          color: "red",
          fontSize: 16,
          fontWeight: "bold",
          id: "char-2",
          label: "b",
        },
      ]
      const text = buildIIText({ chars, boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      renderer.drawSymbol(text)
      const el = divElement.querySelector(`#${text.id}`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(text.id)
      expect(el.getAttribute("type")).toEqual(text.type)
      const charsElements = el.querySelectorAll("tspan")
      expect(charsElements).toHaveLength(2)
      expect(charsElements[0].getAttribute("id")).toEqual(chars[0].id)
      expect(charsElements[0].getAttribute("fill")).toEqual(chars[0].color)
      expect(charsElements[0].getAttribute("font-size")).toEqual(chars[0].fontSize + "px")
      expect(charsElements[0].getAttribute("font-weight")).toEqual(chars[0].fontWeight)
    })
    test("should draw stroke already renderer", () => {
      const stroke = buildIIStroke()
      renderer.drawSymbol(stroke)
      const oldPath = divElement.querySelector(`#${stroke.id}`)!.getAttribute("d")
      for (let x = 0; x < 10; x++) {
        StrokeUtil.addPointer(stroke, {
          x,
          y: x * 2,
          p: 1,
          dt: x,
        })
      }
      renderer.drawSymbol(stroke)
      expect(divElement.querySelector(`#${stroke.id}`)!.getAttribute("d")!).not.toEqual(oldPath)
    })
    test("should replace stroke by circle", () => {
      const stroke = buildIIStroke()
      renderer.drawSymbol(stroke)
      const oldEl = divElement.querySelector(`#${stroke.id}`)!
      expect(oldEl).toBeDefined()

      const circle = buildIICircle()
      renderer.replaceSymbol(stroke.id, [circle])
      const el = divElement.querySelector(`#${circle.id}`)!
      expect(el).toBeDefined()
      expect(oldEl).not.toEqual(el)
      expect(divElement.querySelector(`#${stroke.id}`)).toBeNull()
    })
    test("should append circle if replace symbol not rendered", () => {
      const circle = buildIICircle()
      renderer.replaceSymbol("not-rendered", [circle])
      const el = divElement.querySelector(`#${circle.id}`)!
      expect(el).toBeDefined()
    })
    test("should removeSymbol stroke", () => {
      const stroke = buildIIStroke()
      renderer.drawSymbol(stroke)
      expect(divElement.querySelector(`#${stroke.id}`)).toBeDefined()
      renderer.removeSymbol(stroke.id)
      const el = divElement.querySelector(`#${stroke.id}`)!
      expect(el).toBeNull()
    })
  })

  test("should drawCircle", () => {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    renderer.init(divElement)
    renderer.drawCircle({ x: 10, y: 5 }, 42, { id: "test", fill: "red" })

    expect(divElement.children).toHaveLength(2) // main layer + current-symbol overlay
    const el = divElement.querySelector("#test")!
    expect(el.tagName).toEqual("circle")
    expect(el.getAttribute("cx")).toEqual("10")
    expect(el.getAttribute("cy")).toEqual("5")
    expect(el.getAttribute("r")).toEqual("42")
    expect(el.getAttribute("fill")).toEqual("red")
  })

  test("should drawRect", () => {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    renderer.init(divElement)
    renderer.drawRect({ height: 10, width: 5, x: 0, y: 2 }, { id: "test", stroke: "blue" })

    expect(divElement.children).toHaveLength(2) // main layer + current-symbol overlay
    const el = divElement.querySelector("#test")!
    expect(el.tagName).toEqual("rect")
    expect(el.getAttribute("x")).toEqual("0")
    expect(el.getAttribute("y")).toEqual("2")
    expect(el.getAttribute("height")).toEqual("10")
    expect(el.getAttribute("width")).toEqual("5")
    expect(el.getAttribute("stroke")).toEqual("blue")
  })

  test("should drawLine", () => {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    renderer.init(divElement)
    renderer.drawLine({ x: 0, y: 1 }, { x: 5, y: 10 }, { id: "test", stroke: "blue" })

    expect(divElement.children).toHaveLength(2) // main layer + current-symbol overlay
    const el = divElement.querySelector("#test")!
    expect(el.tagName).toEqual("line")
    expect(el.getAttribute("x1")).toEqual("0")
    expect(el.getAttribute("y1")).toEqual("1")
    expect(el.getAttribute("x2")).toEqual("5")
    expect(el.getAttribute("y2")).toEqual("10")
    expect(el.getAttribute("stroke")).toEqual("blue")
  })

  describe("resize", () => {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    renderer.init(divElement)

    test("should update height, width & viewbox", () => {
      expect(renderer.layer.getAttribute("width")).toEqual("400px")
      expect(renderer.layer.getAttribute("height")).toEqual("400px")
      expect(renderer.layer.getAttribute("viewBox")).toEqual("0, 0, 400, 400")
      renderer.resize(450, 475)
      expect(renderer.layer.getAttribute("width")).toEqual("475px")
      expect(renderer.layer.getAttribute("height")).toEqual("450px")
      expect(renderer.layer.getAttribute("viewBox")).toEqual("0, 0, 475, 450")
    })

    test("should update guides", () => {
      const nbGuideBefore = renderer.horizontalGuides.length * renderer.verticalGuides.length
      renderer.resize(2000, 2000)
      const nbGuideAfter = renderer.horizontalGuides.length * renderer.verticalGuides.length
      expect(nbGuideBefore).not.toEqual(nbGuideAfter)
    })
  })

  describe("clearElements", () => {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    renderer.init(divElement)

    test("should clearElements by tagName", () => {
      const nbPath = renderer.layer.querySelectorAll("path").length
      const stroke1 = buildIIStroke()
      renderer.drawSymbol(stroke1)
      const stroke2 = buildIIStroke()
      renderer.drawSymbol(stroke2)
      expect(renderer.layer.querySelectorAll("path")).toHaveLength(nbPath + 2)
      renderer.clearElements({ tagName: "path" })
      expect(renderer.layer.querySelectorAll("path")).toHaveLength(0)
    })
    test("should clearElements by attrs", () => {
      expect(renderer.layer.querySelectorAll("path")).toHaveLength(0)
      const stroke1 = buildIIStroke()
      renderer.drawSymbol(stroke1)
      const stroke2 = buildIIStroke()
      renderer.drawSymbol(stroke2)
      expect(renderer.layer.querySelectorAll("path")).toHaveLength(2)
      renderer.clearElements({ attrs: { id: stroke2.id } })
      expect(renderer.layer.querySelectorAll("path")).toHaveLength(1)
    })
    test("should clearElements by tagName and attrs", () => {
      renderer.clearElements({ tagName: "path" })
      const stroke1 = buildIIStroke()
      renderer.drawSymbol(stroke1)
      const stroke2 = buildIIStroke()
      renderer.drawSymbol(stroke2)
      // A stroke is a `path` now, not a `g` — the filter still narrows by tag and attribute, which
      // is what this is about.
      const nbPaths = renderer.layer.querySelectorAll("path").length
      renderer.clearElements({ tagName: "path", attrs: { id: stroke2.id } })
      expect(renderer.layer.querySelectorAll("path")).toHaveLength(nbPaths - 1)
    })
  })

  test("should clear", () => {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    renderer.init(divElement)
    const initChildNumber = renderer.layer.childElementCount
    const stroke = buildIIStroke()
    renderer.drawSymbol(stroke)
    expect(renderer.layer.childElementCount).toEqual(initChildNumber + 1)
    renderer.clear()
    expect(renderer.layer.childElementCount).toEqual(initChildNumber)
  })

  test("should destroy", () => {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
    renderer.init(divElement)
    expect(divElement.childElementCount).toEqual(2) // main layer + current-symbol overlay
    renderer.destroy()
    expect(divElement.childElementCount).toEqual(0)
  })

  describe("virtualization (viewport culling)", () => {
    const farAwayBox: TBox = { x: 10000, y: 10000, width: 10, height: 10 }

    test("culls a symbol by its computed bounds, not by a field it carries", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      const stroke = StrokeUtil.createFromPartial({
        pointers: [
          { x: 100000, y: 100000, dt: 0, p: 1 },
          { x: 100010, y: 100010, dt: 1, p: 1 },
        ],
      })
      // A bounds field that disagrees with the pointers: the renderer must trust the computed
      // geometry, not this stale/tampered field.
      Object.assign(stroke, { bounds: OBBOps.create({ x: 0, y: 0 }, 10, 10) })

      renderer.drawSymbol(stroke)

      expect(renderer.getElementById(stroke.id)?.parentNode).toBeNull()
    })

    test("should not append an off-screen symbol's element to the DOM", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)
      const initChildNumber = renderer.layer.childElementCount

      const stroke = buildIIStroke({ box: farAwayBox })
      const el = renderer.drawSymbol(stroke)

      expect(renderer.layer.childElementCount).toEqual(initChildNumber)
      expect(renderer.getElementById(stroke.id)).toBe(el)
    })

    test("should not rebuild an off-screen element that is already tracked", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      const stroke = buildIIStroke({ box: farAwayBox })
      const first = renderer.drawSymbol(stroke)
      const second = renderer.drawSymbol(stroke)

      // Building an SVG path walks every pointer of the stroke. Doing it for a symbol that is not on
      // screen is work thrown away: at 4419 strokes only 295 elements are attached, so a redraw of
      // the whole document built 4419 paths to keep 295.
      expect(second).toBe(first)
    })

    test("should attach the latest geometry when a skipped off-screen symbol is panned into view", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      const stroke = buildIIStroke({ box: farAwayBox })
      renderer.drawSymbol(stroke)

      // Same symbol, moved — the redraw that a transform commit issues.
      const moved = structuredClone(stroke)
      moved.pointers.forEach((pointer) => {
        pointer.x += 40
        pointer.y += 25
      })
      renderer.drawSymbol(moved)

      renderer.setViewBox(farAwayBox.x, farAwayBox.y, 400, 400)

      // Oracle: the same moved stroke drawn by a renderer that was already looking at it.
      const referenceDiv: HTMLDivElement = document.createElement("div")
      const reference = new SVGRenderer(DefaultIIRendererConfiguration)
      reference.init(referenceDiv)
      reference.setViewBox(farAwayBox.x, farAwayBox.y, 400, 400)
      const referenceEl = reference.drawSymbol(moved)

      const el = renderer.getElementById(stroke.id)
      expect(el?.parentNode).toBe(renderer.layer)
      // Deferring the rebuild must not defer it forever: what gets attached is the moved geometry.
      expect(el?.querySelector("path")?.getAttribute("d")).toEqual(
        referenceEl?.querySelector("path")?.getAttribute("d")
      )
    })

    test("should append a previously off-screen element once panned into view", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      const stroke = buildIIStroke({ box: farAwayBox })
      renderer.drawSymbol(stroke)

      renderer.setViewBox(farAwayBox.x, farAwayBox.y, 400, 400)

      const el = renderer.getElementById(stroke.id)
      expect(el).not.toBeNull()
      expect(el?.parentNode).toBe(renderer.layer)
    })

    test("should remove an on-screen element from the DOM once panned out of view, keeping it retrievable", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      const stroke = buildIIStroke()
      renderer.drawSymbol(stroke)
      expect(renderer.getElementById(stroke.id)?.parentNode).toBe(renderer.layer)

      renderer.setViewBox(farAwayBox.x, farAwayBox.y, 400, 400)

      const el = renderer.getElementById(stroke.id)
      expect(el).not.toBeNull()
      expect(el?.parentNode).toBeNull()
    })

    test("should append a previously off-screen element once panned into view", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      const stroke = buildIIStroke({ box: farAwayBox })
      renderer.drawSymbol(stroke)

      renderer.pan(farAwayBox.x, farAwayBox.y)

      const el = renderer.getElementById(stroke.id)
      expect(el).not.toBeNull()
      expect(el?.parentNode).toBe(renderer.layer)
    })

    test("should remove an on-screen element from the DOM once panned out of view, keeping it retrievable", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      const stroke = buildIIStroke()
      renderer.drawSymbol(stroke)
      expect(renderer.getElementById(stroke.id)?.parentNode).toBe(renderer.layer)

      renderer.pan(farAwayBox.x, farAwayBox.y)

      const el = renderer.getElementById(stroke.id)
      expect(el).not.toBeNull()
      expect(el?.parentNode).toBeNull()
    })

    test("removeSymbol should clean up an off-screen (virtualized) element", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      const stroke = buildIIStroke({ box: farAwayBox })
      renderer.drawSymbol(stroke)
      renderer.removeSymbol(stroke.id)

      renderer.setViewBox(farAwayBox.x, farAwayBox.y, 400, 400)

      expect(renderer.getElementById(stroke.id)).toBeNull()
    })
  })

  describe("setSymbolTransform", () => {
    test("rewrites the transform attribute on the same element instead of replacing it", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      const stroke = StrokeUtil.createFromPartial({
        pointers: [
          { x: 0, y: 0, dt: 0, p: 1 },
          { x: 10, y: 10, dt: 1, p: 1 },
        ],
      })
      renderer.drawSymbol(stroke)
      const element = renderer.getElementById(stroke.id)

      const moved = { ...stroke, transform: MatrixTransform.identity().translate(5, 5) }
      renderer.setSymbolTransform(moved)

      // Same node (not a rebuild) - a `replaceWith` would leave `element` detached and
      // `getElementById` pointing at a different node.
      expect(renderer.getElementById(stroke.id)).toBe(element)
      // Pinned to the exact value, not merely "changed": `matrix(1, 0, 0, 1, 5, 5)` is the CSS
      // rendering of the identity matrix translated by (5, 5), computed from `MatrixTransform`'s
      // own `xx, yx, xy, yy, tx, ty` field order - not by running `setSymbolTransform` itself.
      expect(element?.getAttribute("transform")).toBe("matrix(1, 0, 0, 1, 5, 5)")
    })

    test("draws the symbol when it is not tracked at all", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      // A non-identity transform, so the fallback `drawSymbol` is forced to write the attribute
      // (a stroke element omits it entirely for the identity matrix) - proof this went through the
      // normal draw path rather than a no-op.
      const stroke = StrokeUtil.createFromPartial({
        pointers: [
          { x: 0, y: 0, dt: 0, p: 1 },
          { x: 10, y: 10, dt: 1, p: 1 },
        ],
        transform: MatrixTransform.identity().translate(3, 4),
      })
      // Never drawn before, so nothing is tracked under this id yet.
      renderer.setSymbolTransform(stroke)

      const el = renderer.getElementById(stroke.id)
      expect(el).not.toBeNull()
      expect(el?.parentNode).toBe(renderer.layer)
      expect(el?.getAttribute("transform")).toBe("matrix(1, 0, 0, 1, 3, 4)")
    })

    test("refreshes the tracked bounds, so a stale record does not resurrect the element at its old address", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      const stroke = StrokeUtil.createFromPartial({
        pointers: [
          { x: 0, y: 0, dt: 0, p: 1 },
          { x: 10, y: 10, dt: 1, p: 1 },
        ],
      })
      renderer.drawSymbol(stroke)
      expect(renderer.getElementById(stroke.id)?.parentNode).toBe(renderer.layer)

      // Moved far outside the (0, 0, 400, 400) viewBox and its virtualization margin.
      const moved = { ...stroke, transform: MatrixTransform.identity().translate(1e6, 1e6) }
      renderer.setSymbolTransform(moved)
      expect(renderer.getElementById(stroke.id)?.parentNode).toBeNull()

      // Re-apply the *same* viewBox: this only re-runs `#reconcileVirtualization`, it does not
      // change what is in view. If the tracked bounds had not been refreshed above, reconciliation
      // would still see the original (0, 0)-(10, 10) bounds, find them inside the viewBox, and
      // re-attach the element right back where it is no longer drawn.
      renderer.setViewBox(0, 0, 400, 400)

      expect(renderer.getElementById(stroke.id)?.parentNode).toBeNull()
    })

    test("carries a pending redraw's matrix forward instead of writing onto the element it will discard", () => {
      const divElement: HTMLDivElement = document.createElement("div")
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      renderer.init(divElement)

      const farAwayBox: TBox = { x: 10000, y: 10000, width: 10, height: 10 }
      const stroke = buildIIStroke({ box: farAwayBox })
      // First draw: nothing tracked yet, so an element is always built (just left unattached).
      renderer.drawSymbol(stroke)
      // Second draw while still off screen: this is what sets `pendingRedraw`.
      renderer.drawSymbol(stroke)

      const moved = { ...stroke, transform: MatrixTransform.identity().translate(20, 15) }
      renderer.setSymbolTransform(moved)

      // Pan the pending record's own location into view, forcing `#reconcileVirtualization` to
      // perform the deferred rebuild.
      renderer.setViewBox(farAwayBox.x, farAwayBox.y, 400, 400)

      const el = renderer.getElementById(stroke.id)
      expect(el?.parentNode).toBe(renderer.layer)
      // The rebuilt element must carry the matrix from `moved`, not from the stroke as it stood
      // when the redraw was first deferred - otherwise the deferred rebuild silently drops the
      // transform commit that arrived while it was pending.
      expect(el?.getAttribute("transform")).toBe("matrix(1, 0, 0, 1, 20, 15)")
    })
  })

  /**
   * The point of making `getSVGElement` part of the contract in IIC-2006: a registered symbol type
   * the library knows nothing about becomes visible, because the renderer asks its util instead of
   * matching against a fixed list of built-ins.
   */
  describe("a symbol type the library does not know", () => {
    type TStickyNote = TBaseSymbol & { type: "sticky-note"; text: string; point: TPoint }

    class StickyNoteUtil extends SymbolUtil<TStickyNote> {
      readonly type = "sticky-note"
      create(partial: TPartialDeep<TStickyNote>): TStickyNote {
        return { ...partial, type: "sticky-note", text: partial.text ?? "" } as TStickyNote
      }
      getGeometry(symbol: TStickyNote): Geometry2d {
        return new Polygon2d(BoxOps.getCorners({ x: symbol.point.x, y: symbol.point.y, width: 10, height: 10 }))
      }
      translate(symbol: TStickyNote, { matrix }: TTransformContext): void {
        symbol.point = applyMatrixToPoint(symbol.point, matrix)
      }
      rotate(symbol: TStickyNote, { matrix }: TTransformContext): void {
        symbol.point = applyMatrixToPoint(symbol.point, matrix)
      }
      resize(symbol: TStickyNote, { matrix }: TTransformContext): void {
        symbol.point = applyMatrixToPoint(symbol.point, matrix)
      }
      overlaps(): boolean {
        return false
      }
      getSVGElement(symbol: TStickyNote): SVGGraphicsElement {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
        group.setAttribute("id", symbol.id)
        group.setAttribute("type", symbol.type)
        return group
      }
    }

    const sticky = {
      id: "sticky-1",
      type: "sticky-note",
      text: "note",
      creationTime: 0,
      modificationDate: 0,
      style: {},
    } as unknown as TSymbol

    test("should draw it by asking its util", () => {
      symbolRegistry.register(new StickyNoteUtil())
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      const element = renderer.buildElementFromSymbol(sticky)
      expect(element?.getAttribute("type")).toBe("sticky-note")
      expect(element?.getAttribute("id")).toBe("sticky-1")
    })

    test("should draw nothing when no util owns the type", () => {
      // The remaining failure mode now that the draw method cannot be missing: nothing registered.
      const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
      const orphan = { ...(sticky as unknown as TBaseSymbol), type: "no-such-type" } as unknown as TSymbol
      expect(renderer.buildElementFromSymbol(orphan)).toBeUndefined()
    })
  })
})
