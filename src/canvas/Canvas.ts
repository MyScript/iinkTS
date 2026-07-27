import type { TCanvasType } from "./AbstractCanvas"
import type { TCanvasOptionsMap, TCanvasVariantMap } from "./CanvasFactory"
import { CanvasFactory } from "./CanvasFactory"

/**
 * @group Canvas
 * @summary Main Canvas facade for loading canvas instances
 *
 * This class provides a convenient interface for loading canvas instances.
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
   * Loads and initializes an canvas instance
   *
   * @template T - The canvas type to load
   * @param rootElement - The HTML element to mount the canvas
   * @param type - The canvas variant type to load
   * @param options - Configuration options specific to the canvas type
   * @returns Promise resolving to the initialized canvas instance
   *
   * @remarks
   * This method will destroy any previously loaded canvas instance before creating a new one.
   * Use {@link getInstance} to access the currently active canvas.
   */
  static async load<T extends TCanvasType>(
    rootElement: HTMLElement,
    type: T,
    options: TCanvasOptionsMap[T]
  ): Promise<TCanvasVariantMap[T]> {
    return CanvasFactory.createCanvas(rootElement, type, options)
  }

  /**
   * Gets the currently active canvas instance
   *
   * @returns The current canvas instance or undefined if none exists
   */
  static getInstance(): TCanvasVariantMap[TCanvasType] | undefined {
    return CanvasFactory.getInstance()
  }

  /**
   * Gets a specific canvas instance by type
   *
   * @template T - The canvas type to retrieve
   * @param type - The canvas type to retrieve
   * @returns The canvas instance of the specified type or undefined
   */
  static getInstanceByType<T extends TCanvasType>(type: T): TCanvasVariantMap[T] | undefined {
    return CanvasFactory.getInstanceByType(type)
  }
}
