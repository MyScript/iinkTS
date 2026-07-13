import type { TCanvasType } from "./AbstractCanvas"
import type { TCanvasOptionsMap, TCanvasVariantMap } from "./CanvasFactory"
import { CanvasFactory } from "./CanvasFactory"

/**
 * @group Canvas
 * @summary Main Canvas facade for loading editor instances
 *
 * This class provides a convenient interface for loading editor instances.
 * It delegates to CanvasFactory for the actual implementation.
 *
 * @example
 * ```typescript
 * const canvas = await Canvas.load(
 *   document.getElementById("canvas"),
 *   "INTERACTIVE_INK",
 *   { configuration: {...} }
 * )
 * ```
 * @hideconstructor
 */
export class Canvas {
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
  static async load<T extends TCanvasType>(
    rootElement: HTMLElement,
    type: T,
    options: TCanvasOptionsMap[T]
  ): Promise<TCanvasVariantMap[T]> {
    return CanvasFactory.createCanvas(rootElement, type, options)
  }

  /**
   * Gets the currently active editor instance
   *
   * @returns The current editor instance or undefined if none exists
   */
  static getInstance(): TCanvasVariantMap[TCanvasType] | undefined {
    return CanvasFactory.getInstance()
  }

  /**
   * Gets a specific editor instance by type
   *
   * @template T - The editor type to retrieve
   * @param type - The editor type to retrieve
   * @returns The editor instance of the specified type or undefined
   */
  static getInstanceByType<T extends TCanvasType>(type: T): TCanvasVariantMap[T] | undefined {
    return CanvasFactory.getInstanceByType(type)
  }
}
