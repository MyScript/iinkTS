import { LoggerCategory, LoggerManager } from "@/logger"

import type { TCanvasType } from "./AbstractCanvas"
import type { TInkCanvasOptions } from "./variants/InkCanvas"
import { InkCanvas } from "./variants/InkCanvas"
import type { TInkCanvasDeprecatedOptions } from "./variants/InkCanvasDeprecated"
import { InkCanvasDeprecated } from "./variants/InkCanvasDeprecated"
import type { TInteractiveInkCanvasOptions } from "./variants/InteractiveInkCanvas"
import { InteractiveInkCanvas } from "./variants/InteractiveInkCanvas"
import type { TInteractiveInkSSRCanvasOptions } from "./variants/InteractiveInkSSRCanvas"
import { InteractiveInkSSRCanvas } from "./variants/InteractiveInkSSRCanvas"

/**
 * @group Canvas
 * @hidden
 */
export type TCanvasVariantMap = {
  INTERACTIVE_INK: InteractiveInkCanvas
  INK_V1: InkCanvasDeprecated
  INTERACTIVE_INK_SSR: InteractiveInkSSRCanvas
  INK_V2: InkCanvas
}

/**
 * @group Canvas
 * @hidden
 */
export type TCanvasOptionsMap = {
  INTERACTIVE_INK: TInteractiveInkCanvasOptions
  INK_V1: TInkCanvasDeprecatedOptions
  INTERACTIVE_INK_SSR: TInteractiveInkSSRCanvasOptions
  INK_V2: TInkCanvasOptions
}

/**
 * @group Canvas
 * @hidden
 */
export class CanvasFactory {
  private static logger = LoggerManager.getLogger(LoggerCategory.CANVAS)
  private static instances = new Map<string, TCanvasVariantMap[TCanvasType]>()

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
  static async createCanvas<T extends TCanvasType>(
    rootElement: HTMLElement,
    type: T,
    options: TCanvasOptionsMap[T]
  ): Promise<TCanvasVariantMap[T]> {
    CanvasFactory.logger.info("createCanvas", {
      type,
      options,
    })

    if (!options) {
      throw new Error(`Param 'options' missing`)
    }

    // Cleanup any existing instances before creating a new one
    await CanvasFactory.clearInstances()

    let instance: TCanvasVariantMap[TCanvasType]

    // Create appropriate editor variant based on type
    switch (type) {
      case "INTERACTIVE_INK":
        instance = new InteractiveInkCanvas(rootElement, options as TInteractiveInkCanvasOptions)
        break

      case "INK_V1":
        CanvasFactory.logger.warn("createCanvas", "InkCanvasDeprecated (INK_V1) is deprecated, use INK_V2 instead")
        instance = new InkCanvasDeprecated(rootElement, options as TInkCanvasDeprecatedOptions)
        break

      case "INK_V2":
        instance = new InkCanvas(rootElement, options as TInkCanvasOptions)
        break

      case "INTERACTIVE_INK_SSR":
      default:
        instance = new InteractiveInkSSRCanvas(rootElement, options as TInteractiveInkSSRCanvasOptions)
        break
    }

    // Initialize the instance
    await instance.initialize()

    // Store instance for reference
    CanvasFactory.instances.set(type, instance)

    return instance as TCanvasVariantMap[T]
  }

  /**
   * Retrieves the currently active editor instance
   *
   * @returns The current editor instance or undefined if none exists
   */
  static getInstance(): TCanvasVariantMap[TCanvasType] | undefined {
    // Return the most recently created instance
    return Array.from(CanvasFactory.instances.values()).pop()
  }

  /**
   * Retrieves a specific editor instance by type
   *
   * @param type - The editor type to retrieve
   * @returns The editor instance of the specified type or undefined
   */
  static getInstanceByType<T extends TCanvasType>(type: T): TCanvasVariantMap[T] | undefined {
    return CanvasFactory.instances.get(type) as TCanvasVariantMap[T] | undefined
  }

  /**
   * Clears all stored editor instances
   */
  static async clearInstances(): Promise<void> {
    for (const instance of CanvasFactory.instances.values()) {
      await instance.destroy()
    }
    CanvasFactory.instances.clear()
  }
}
