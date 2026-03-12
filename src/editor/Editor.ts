import { EditorType } from "./AbstractEditor"
import { EditorFactory, EditorVariantMap, EditorOptionsMap } from "./EditorFactory"

/**
 * @group Editor
 * @summary Main Editor facade for loading editor instances
 *
 * This class provides a convenient interface for loading editor instances.
 * It delegates to EditorFactory for the actual implementation.
 *
 * @example
 * ```typescript
 * const editor = await Editor.load(
 *   document.getElementById("editor"),
 *   "INTERACTIVEINK",
 *   { configuration: {...} }
 * )
 * ```
 * @hideconstructor
 */
export class Editor
{
  /**
   * Loads and initializes an editor instance
   *
   * @template T - The editor type to load
   * @param rootElement - The HTML element to mount the editor
   * @param type - The editor variant type to load
   * @param options - Configuration options specific to the editor type
   * @returns Promise resolving to the initialized editor instance
   *
   * @remarks
   * This method will destroy any previously loaded editor instance before creating a new one.
   * Use {@link getInstance} to access the currently active editor.
   */
  static async load<T extends EditorType>(
    rootElement: HTMLElement,
    type: T,
    options: EditorOptionsMap[T]
  ): Promise<EditorVariantMap[T]>
  {
    return EditorFactory.createEditor(rootElement, type, options)
  }

  /**
   * Gets the currently active editor instance
   *
   * @returns The current editor instance or undefined if none exists
   */
  static getInstance(): EditorVariantMap[EditorType] | undefined
  {
    return EditorFactory.getInstance()
  }

  /**
   * Gets a specific editor instance by type
   *
   * @template T - The editor type to retrieve
   * @param type - The editor type to retrieve
   * @returns The editor instance of the specified type or undefined
   */
  static getInstanceByType<T extends EditorType>(type: T): EditorVariantMap[T] | undefined
  {
    return EditorFactory.getInstanceByType(type)
  }
}
