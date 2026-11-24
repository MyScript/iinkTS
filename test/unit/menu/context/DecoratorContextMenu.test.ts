import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke, buildIIText } from "../../helpers"
import { DecoratorContextMenu, DecoratorKind, DecoratorUtil, DefaultStyle } from "@/iink"

describe("DecoratorContextMenu.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildTextSymbol = () =>
    buildIIText({
      chars: [
        {
          id: "char-1",
          label: "H",
          fontSize: 16,
          fontWeight: "normal",
          color: "#000000",
          bounds: { x: 0, y: 0, width: 10, height: 16 },
        },
      ],
      boundingBox: { x: 0, y: 0, width: 10, height: 16 },
    })

  test("should build a trigger and one submenu per decorator kind by default", () => {
    const canvas = createCanvasMock()
    const item = new DecoratorContextMenu(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-context-decorator")).toBeTruthy()
    ;[DecoratorKind.Highlight, DecoratorKind.Surround, DecoratorKind.Underline, DecoratorKind.Strikethrough].forEach(
      (kind) => {
        expect(wrapper.querySelector(`#ms-menu-context-decorator-${kind}`)).toBeTruthy()
      }
    )
  })

  test("should omit a submenu when disabled via itemsConfig", () => {
    const canvas = createCanvasMock()
    const item = new DecoratorContextMenu(asCanvas(canvas), "ms-menu-context", { highlight: false })

    const wrapper = item.getElement()

    expect(wrapper.querySelector(`#ms-menu-context-decorator-${DecoratorKind.Highlight}`)).toBeNull()
    expect(wrapper.querySelector(`#ms-menu-context-decorator-${DecoratorKind.Surround}`)).toBeTruthy()
  })

  test("symbolsDecorable should only include selected text symbols", () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(text)
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(text.id)
    canvas.model.selectSymbol(stroke.id)
    const item = new DecoratorContextMenu(asCanvas(canvas))

    expect(item.symbolsDecorable.map((s) => s.id)).toEqual([text.id])
    expect(item.showDecorator).toBe(true)
  })

  test("hasSingleMathSymbol should be true only for a single recognized-math stroke selection", () => {
    const canvas = createCanvasMock()
    const mathStroke = buildIIStroke()
    mathStroke.jiixBlockType = "Math"
    canvas.model.addSymbol(mathStroke)
    canvas.model.selectSymbol(mathStroke.id)
    const item = new DecoratorContextMenu(asCanvas(canvas))

    expect(item.hasSingleMathSymbol).toBe(true)
  })

  test("should toggle a decorator on for every decorable symbol via the enable checkbox", () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    canvas.model.addSymbol(text)
    canvas.model.selectSymbol(text.id)
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Highlight}-enable`
    ) as HTMLInputElement
    const firstColorButton = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Highlight}-color-000000-btn`
    ) as HTMLButtonElement
    expect(firstColorButton.disabled).toBe(true)

    checkbox.checked = true
    checkbox.dispatchEvent(new Event("change", { bubbles: true }))

    // IIModel.symbolsSelected clones on read, so the handler mutates a clone, not `text` itself
    const updatedSymbols = (canvas.updateSymbols as jest.Mock).mock.calls[0][0].map((id: string) => canvas.model.getSymbol(id))
    expect(updatedSymbols).toHaveLength(1)
    expect(updatedSymbols[0].decorators.some((d: { kind: string }) => d.kind === DecoratorKind.Highlight)).toBe(true)
    expect(firstColorButton.disabled).toBe(false)
    expect(firstColorButton.classList.contains("active")).toBe(true)
  })

  test("should set the decorator color for every decorable symbol on color pick", () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    text.decorators.push(DecoratorUtil.createDecorator(DecoratorKind.Highlight, DefaultStyle))
    canvas.model.addSymbol(text)
    canvas.model.selectSymbol(text.id)
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const redButton = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Highlight}-color-ff0000-btn`
    ) as HTMLButtonElement

    redButton.dispatchEvent(new Event("pointerup", { bubbles: true, cancelable: true }))

    const updatedSymbols = (canvas.updateSymbols as jest.Mock).mock.calls[0][0].map((id: string) => canvas.model.getSymbol(id))
    const decorator = updatedSymbols[0].decorators.find((d: { kind: string }) => d.kind === DecoratorKind.Highlight)
    expect(decorator?.style.color).toEqual("#ff0000")
    expect(redButton.classList.contains("active")).toBe(true)
  })

  test("should toggle the top-level and per-kind submenus open on trigger pointerdown", () => {
    const canvas = createCanvasMock()
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const topTrigger = wrapper.querySelector("#ms-menu-context-decorator") as HTMLButtonElement
    const topContent = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    const kindTrigger = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Highlight}`
    ) as HTMLButtonElement
    const kindContent = kindTrigger.closest(".sub-menu")?.querySelector(".sub-menu-content") as HTMLDivElement

    topTrigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(topContent.classList.contains("open")).toBe(true)

    kindTrigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(kindContent.classList.contains("open")).toBe(true)
  })

  test("should hide the whole menu on update() when nothing decorable is selected", () => {
    const canvas = createCanvasMock()
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()

    item.update()

    expect(wrapper.style.display).toEqual("none")
  })

  test("should show the menu and check the box on update() when every decorable symbol has the decorator", () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    text.decorators.push(DecoratorUtil.createDecorator(DecoratorKind.Highlight, DefaultStyle))
    canvas.model.addSymbol(text)
    canvas.model.selectSymbol(text.id)
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Highlight}-enable`
    ) as HTMLInputElement

    item.update()

    expect(wrapper.style.display).not.toEqual("none")
    expect(checkbox.checked).toBe(true)
    expect(checkbox.indeterminate).toBe(false)
  })

  test("should not throw and remove document listeners on destroy()", () => {
    const canvas = createCanvasMock()
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)

    item.destroy()

    expect(document.body.contains(wrapper)).toBe(false)
    expect(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))).not.toThrow()
  })
})
