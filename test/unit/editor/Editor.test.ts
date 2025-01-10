jest.mock('../../../src/editor/EditorRest')
jest.mock('../../../src/editor/EditorWebSocket')
jest.mock('../../../src/editor/EditorOffscreen')

import { Editor, EditorOffscreen, EditorRest, EditorWebSocket } from "../../../src/iink"

describe('Editor.ts', () =>
{
  const element = document.createElement("div")

  test("should thorw error if no options", async () =>
  {
    //@ts-ignore
    await expect(() => Editor.load(element, "REST")).rejects.toEqual(new Error(`Param 'options' missing`))
  })

  test("should load Rest Editor", async () =>
  {
    const editor = await Editor.load(element, "REST", { })
    expect(Editor.getInstance()).toBe(editor)
    expect(editor).toBeInstanceOf(EditorRest)
    expect(editor).not.toBeInstanceOf(EditorWebSocket)
    expect(editor).not.toBeInstanceOf(EditorOffscreen)
    expect(editor.initialize).toHaveBeenCalledTimes(1)
  })
  test("should load Rest Editor", async () =>
  {
    const editor = await Editor.load(element, "WEBSOCKET", { })
    expect(Editor.getInstance()).toBe(editor)
    expect(editor).not.toBeInstanceOf(EditorRest)
    expect(editor).toBeInstanceOf(EditorWebSocket)
    expect(editor).not.toBeInstanceOf(EditorOffscreen)
    expect(editor.initialize).toHaveBeenCalledTimes(1)
  })
  test("should load Rest Editor", async () =>
  {
    const editor = await Editor.load(element, "OFFSCREEN", { })
    expect(Editor.getInstance()).toBe(editor)
    expect(editor).not.toBeInstanceOf(EditorRest)
    expect(editor).not.toBeInstanceOf(EditorWebSocket)
    expect(editor).toBeInstanceOf(EditorOffscreen)
    expect(editor.initialize).toHaveBeenCalledTimes(1)
  })

})
