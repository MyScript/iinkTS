jest.mock('../../../src/editor/InkEditorDeprecated')
jest.mock('../../../src/editor/InteractiveInkSSREditor')
jest.mock('../../../src/editor/InteractiveInkEditor')

import { Editor, InteractiveInkEditor, InkEditorDeprecated, InteractiveInkSSREditor } from "../../../src/iink"

describe('Editor.ts', () =>
{
  const element = document.createElement("div")

  test("should thorw error if no options", async () =>
  {
    //@ts-ignore
    await expect(() => Editor.load(element, "INKV1")).rejects.toEqual(new Error(`Param 'options' missing`))
  })

  test("should load Rest Editor", async () =>
  {
    const editor = await Editor.load(element, "INKV1", { })
    expect(Editor.getInstance()).toBe(editor)
    expect(editor).toBeInstanceOf(InkEditorDeprecated)
    expect(editor).not.toBeInstanceOf(InteractiveInkSSREditor)
    expect(editor).not.toBeInstanceOf(InteractiveInkEditor)
    expect(editor.initialize).toHaveBeenCalledTimes(1)
  })
  test("should load Rest Editor", async () =>
  {
    const editor = await Editor.load(element, "INTERACTIVEINKSSR", { })
    expect(Editor.getInstance()).toBe(editor)
    expect(editor).not.toBeInstanceOf(InkEditorDeprecated)
    expect(editor).toBeInstanceOf(InteractiveInkSSREditor)
    expect(editor).not.toBeInstanceOf(InteractiveInkEditor)
    expect(editor.initialize).toHaveBeenCalledTimes(1)
  })
  test("should load Rest Editor", async () =>
  {
    const editor = await Editor.load(element, "INTERACTIVEINK", { })
    expect(Editor.getInstance()).toBe(editor)
    expect(editor).not.toBeInstanceOf(InkEditorDeprecated)
    expect(editor).not.toBeInstanceOf(InteractiveInkSSREditor)
    expect(editor).toBeInstanceOf(InteractiveInkEditor)
    expect(editor.initialize).toHaveBeenCalledTimes(1)
  })

})
