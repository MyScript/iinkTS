import { LoggerCategory, LoggerManager } from "../logger"
import { EditorType } from "./AbstractEditor"
import { InteractiveInkEditor, TInteractiveInkEditorOptions } from "./InteractiveInkEditor"
import { InkEditorDeprecated, TInkEditorDeprecatedOptions } from "./InkEditorDeprecated"
import { InteractiveInkSSREditor, TInteractiveInkSSREditorOptions } from "./InteractiveInkSSREditor"
import { InkEditor, TInkEditorOptions } from "./InkEditor"

/**
 * @group Editor
 * @hideconstructor
 */
export class Editor
{
  protected static logger = LoggerManager.getLogger(LoggerCategory.EDITOR)
  protected static instance: InteractiveInkEditor | InkEditorDeprecated | InteractiveInkSSREditor | InkEditor |undefined

  static async load<T extends EditorType>(rootElement: HTMLElement, type: T, options: T extends "INTERACTIVEINK" ? TInteractiveInkEditorOptions : T extends "INKV1" ? TInkEditorDeprecatedOptions : TInteractiveInkSSREditorOptions extends "INKV2" ? TInkEditorOptions : TInteractiveInkSSREditorOptions):
    Promise<T extends "INTERACTIVEINK" ? InteractiveInkEditor : T extends "INKV1" ? InkEditorDeprecated : InteractiveInkSSREditor extends "INKV2" ? InkEditor : InteractiveInkSSREditor>
  {
    Editor.logger.info("load", { type, options })
    if (!options) {
        throw new Error(`Param 'options' missing`)
    }
    if (Editor.instance) {
      await Editor.instance.destroy()
    }

    switch (type) {
      case "INTERACTIVEINK":
        Editor.instance = new InteractiveInkEditor(rootElement, options as TInteractiveInkEditorOptions)
        break
      case "INKV1":
        Editor.instance = new InkEditorDeprecated(rootElement, options as TInkEditorDeprecatedOptions)
        break
      case "INKV2":
        Editor.instance = new InkEditor(rootElement, options as TInkEditorOptions)
        break;
      // case "INTERACTIVEINKSSR":
      default:
        Editor.instance = new InteractiveInkSSREditor(rootElement, options as TInteractiveInkSSREditorOptions)
        break
    }

    await Editor.instance.initialize()

    return Editor.instance as T extends "INTERACTIVEINK" ? InteractiveInkEditor : T extends "INKV1" ? InkEditorDeprecated : InteractiveInkSSREditor extends "INKV2" ? InkEditor : InteractiveInkSSREditor
  }

  static getInstance(): InteractiveInkEditor | InkEditorDeprecated | InteractiveInkSSREditor | InkEditor | undefined
  {
    return Editor.instance
  }

}
