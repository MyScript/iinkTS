import { LoggerCategory, LoggerManager } from "../logger"
import { EditorType } from "./AbstractEditor"
import { EditorOffscreen, TEditorOffscreenOptions } from "./EditorOffscreen"
import { EditorRest, TEditorRestOptions } from "./EditorRest"
import { EditorWebSocket, TEditorWebsocketOptions } from "./EditorWebSocket"

/**
 * @group Editor
 * @hideconstructor
 */
export class Editor
{
  protected static logger = LoggerManager.getLogger(LoggerCategory.EDITOR)
  protected static instance: EditorOffscreen | EditorRest | EditorWebSocket | undefined

  static async load<T extends EditorType>(rootElement: HTMLElement, type: T, options: T extends "OFFSCREEN" ? TEditorOffscreenOptions : T extends "REST" ? TEditorRestOptions : TEditorWebsocketOptions):
    Promise<T extends "OFFSCREEN" ? EditorOffscreen : T extends "REST" ? EditorRest : EditorWebSocket>
  {
    Editor.logger.info("load", { type, options })
    if (!options) {
        throw new Error(`Param 'options' missing`)
    }
    if (Editor.instance) {
      await Editor.instance.destroy()
    }

    switch (type) {
      case "OFFSCREEN":
        Editor.instance = new EditorOffscreen(rootElement, options as TEditorOffscreenOptions)
        break
      case "REST":
        Editor.instance = new EditorRest(rootElement, options as TEditorRestOptions)
        break
      // case "RECOGNIZER":
      // break;
      // case "WEBSOCKET":
      default:
        Editor.instance = new EditorWebSocket(rootElement, options as TEditorWebsocketOptions)
        break
    }

    await Editor.instance.initialize()

    return Editor.instance as T extends "OFFSCREEN" ? EditorOffscreen : T extends "REST" ? EditorRest : EditorWebSocket
  }

  static getInstance(): EditorOffscreen | EditorRest | EditorWebSocket | undefined
  {
    return Editor.instance
  }

}
