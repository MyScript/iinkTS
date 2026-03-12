import { LoggerCategory, LoggerManager } from "../logger"
import { EditorType } from "./AbstractEditor"
import { InteractiveInkEditor, TInteractiveInkEditorOptions } from "./InteractiveInkEditor"
import { InkEditorDeprecated, TInkEditorDeprecatedOptions } from "./InkEditorDeprecated"
import { InteractiveInkSSREditor, TInteractiveInkSSREditorOptions } from "./InteractiveInkSSREditor"
import { InkEditor, TInkEditorOptions } from "./InkEditor"

/**
 * @group Editor
 * @hidden
 */
export type EditorVariantMap = {
  "INTERACTIVEINK": InteractiveInkEditor
  "INKV1": InkEditorDeprecated
  "INTERACTIVEINKSSR": InteractiveInkSSREditor
  "INKV2": InkEditor
}

/**
 * @group Editor
 * @hidden
 */
export type EditorOptionsMap = {
  "INTERACTIVEINK": TInteractiveInkEditorOptions
  "INKV1": TInkEditorDeprecatedOptions
  "INTERACTIVEINKSSR": TInteractiveInkSSREditorOptions
  "INKV2": TInkEditorOptions
}

/**
 * @group Editor
 * @hidden
 */
export class EditorFactory
{
  private static logger = LoggerManager.getLogger(LoggerCategory.EDITOR)
  private static instances = new Map<string, EditorVariantMap[EditorType]>()

  /**
   * Creates and initializes an editor instance based on the specified type
   * Replaces any previously created instance
   *
   * @template T - The editor type to create
   * @param rootElement - The HTML element to mount the editor
   * @param type - The editor variant type
   * @param options - Configuration options specific to the editor type
   * @returns Promise resolving to the initialized editor instance
   */
  static async createEditor<T extends EditorType>(
    rootElement: HTMLElement,
    type: T,
    options: EditorOptionsMap[T]
  ): Promise<EditorVariantMap[T]>
  {
    EditorFactory.logger.info("createEditor", { type, options })

    if (!options) {
      throw new Error(`Param 'options' missing`)
    }

    // Cleanup previous instance
    const previousInstance = EditorFactory.getInstance()
    if (previousInstance) {
      await previousInstance.destroy()
    }

    let instance: EditorVariantMap[EditorType]

    // Create appropriate editor variant based on type
    switch (type) {
      case "INTERACTIVEINK":
        instance = new InteractiveInkEditor(rootElement, options as TInteractiveInkEditorOptions)
        break

      case "INKV1":
        EditorFactory.logger.warn("createEditor", "InkEditorDeprecated (INKV1) is deprecated, use INKV2 instead")
        instance = new InkEditorDeprecated(rootElement, options as TInkEditorDeprecatedOptions)
        break

      case "INKV2":
        instance = new InkEditor(rootElement, options as TInkEditorOptions)
        break

      case "INTERACTIVEINKSSR":
      default:
        instance = new InteractiveInkSSREditor(rootElement, options as TInteractiveInkSSREditorOptions)
        break
    }

    // Initialize the instance
    await instance.initialize()

    // Store instance for reference
    EditorFactory.instances.set(type, instance)

    return instance as EditorVariantMap[T]
  }

  /**
   * Retrieves the currently active editor instance
   *
   * @returns The current editor instance or undefined if none exists
   */
  static getInstance(): EditorVariantMap[EditorType] | undefined
  {
    // Return the most recently created instance
    return Array.from(EditorFactory.instances.values()).pop()
  }

  /**
   * Retrieves a specific editor instance by type
   *
   * @param type - The editor type to retrieve
   * @returns The editor instance of the specified type or undefined
   */
  static getInstanceByType<T extends EditorType>(type: T): EditorVariantMap[T] | undefined
  {
    return EditorFactory.instances.get(type) as EditorVariantMap[T] | undefined
  }

  /**
   * Clears all stored editor instances
   */
  static clearInstances(): void
  {
    EditorFactory.instances.clear()
  }
}
