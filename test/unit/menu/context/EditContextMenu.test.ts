import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIText } from "../../helpers"
import { EditContextMenu, type TText } from "@/iink"

describe("EditContextMenu.ts", () => {
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

  test("should build a trigger, a text input and a save button", () => {
    const canvas = createCanvasMock()
    const item = new EditContextMenu(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-context-edit-trigger")).toBeTruthy()
    expect(item.editInput).toBeTruthy()
    expect(item.editSaveBtn?.textContent).toEqual("Save")
  })

  test("should toggle the panel open on trigger pointerdown", () => {
    const canvas = createCanvasMock()
    const item = new EditContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#ms-menu-context-edit-trigger") as HTMLButtonElement
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(true)

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should close the panel on outside pointerdown", () => {
    const canvas = createCanvasMock()
    const item = new EditContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    content.classList.add("open")

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))

    expect(content.classList.contains("open")).toBe(false)
  })

  test("should rewrite the selected text's chars from the input value on save", async () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    canvas.model.addSymbol(text)
    canvas.model.selectSymbol(text.id)
    const item = new EditContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    item.editInput!.value = "Hi"

    item.editSaveBtn!.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }))
    await Promise.resolve()

    // IIModel.symbolsSelected clones on read, so the handler mutates a clone, not `text` itself
    const updatedText = canvas.model.getSymbol((canvas.updateSymbol as jest.Mock).mock.calls[0][0]) as TText
    expect(updatedText.chars).toHaveLength(2)
    expect(updatedText.chars.map((c: { label: string }) => c.label)).toEqual(["H", "i"])
    expect(updatedText.chars[0].color).toEqual("#000000")
    expect(canvas.selector.drawSelectedGroup).toHaveBeenCalledWith([updatedText])
  })

  test("should route a failing save through manageError instead of leaving it unhandled", async () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    canvas.model.addSymbol(text)
    canvas.model.selectSymbol(text.id)
    const boom = new Error("backend refused the update")
    canvas.updateSymbol = jest.fn().mockRejectedValue(boom)
    const item = new EditContextMenu(asCanvas(canvas))
    document.body.appendChild(item.getElement())
    item.editInput!.value = "Hi"

    item.editSaveBtn!.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }))
    await Promise.resolve()
    await Promise.resolve()

    expect(canvas.manageError).toHaveBeenCalledWith(boom)
    // The chars were already rewritten before the await, so a swallowed failure leaves the edit
    // half-applied with no redraw and no feedback.
    expect(canvas.selector.drawSelectedGroup).not.toHaveBeenCalled()
  })

  test("should do nothing on save when no text symbol is selected", async () => {
    const canvas = createCanvasMock()
    const item = new EditContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    item.editInput!.value = "Hi"

    item.editSaveBtn!.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }))
    await Promise.resolve()

    expect(canvas.updateSymbol).not.toHaveBeenCalled()
  })

  test("should not throw and remove the element on destroy()", () => {
    const canvas = createCanvasMock()
    const item = new EditContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)

    item.destroy()

    expect(document.body.contains(wrapper)).toBe(false)
    expect(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))).not.toThrow()
  })
})
