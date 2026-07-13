import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { InteractiveInkCanvasConfiguration } from "@/canvas/variants/InteractiveInkCanvasConfiguration"
import type { WebSocketClient } from "@/client"
import type { Logger, LoggerCategory } from "@/logger"
import { LoggerManager } from "@/logger"
import type { IIModel } from "@/model"
import type { SVGRenderer } from "@/renderer"

/**
 * Base abstract class for all Interactive Ink managers
 * Provides common structure and utilities to reduce code duplication
 *
 * All managers in iink-ts should extend this class to ensure consistent:
 * - Logger management
 * - Canvas reference
 * - Common getters (model, renderer, client, configuration)
 * - Lifecycle hooks (onInit, onDestroy)
 *
 * @example
 * ```typescript
 * export class IIMyManager extends IIAbstractManager {
 *   protected managerName = "IIMyManager"
 *
 *   constructor(canvas: InteractiveInkCanvas) {
 *     super(canvas)
 *     // Custom initialization
 *   }
 *
 *   protected onInit(): void {
 *     // Called after constructor
 *     this.logger.info("IIMyManager initialized")
 *   }
 *
 *   myMethod() {
 *     // Use this.canvas, this.model, this.renderer, this.logger
 *     this.logger.info("Doing something")
 *   }
 *
 *   protected onDestroy(): void {
 *     // Cleanup
 *   }
 * }
 * ```
 *
 * @group Manager
 */
export abstract class IIAbstractManager {
  /**
   * Logger instance for this manager
   * Automatically uses LoggerCategory.MANAGER
   */
  protected logger: Logger

  /**
   * Name of the manager for logging purposes
   * Must be overridden in concrete classes
   *
   * @example "IITypesetManager", "IIMathManager"
   */
  protected abstract managerName: string

  /**
   * Create a new manager
   * @param canvas - The Interactive Ink Canvas instance
   */
  constructor(
    protected canvas: TInteractiveInkCanvas,
    logger: LoggerCategory
  ) {
    this.logger = LoggerManager.getLogger(logger)

    // Call optional initialization hook
    if (this.onInit) {
      this.onInit()
    }
  }

  /**
   * Get the model from the canvas
   * Convenience getter to avoid accessing canvas.model everywhere
   */
  get model(): IIModel {
    return this.canvas.model
  }

  /**
   * Get the renderer from the canvas
   * Convenience getter to avoid accessing canvas.renderer everywhere
   */
  get renderer(): SVGRenderer {
    return this.canvas.renderer
  }

  /**
   * Get the client from the canvas
   * Convenience getter to avoid accessing canvas.client everywhere
   */
  get client(): WebSocketClient {
    return this.canvas.client
  }

  /**
   * Get the configuration from the canvas
   * Convenience getter to avoid accessing canvas.configuration everywhere
   */
  get configuration(): InteractiveInkCanvasConfiguration {
    return this.canvas.configuration
  }

  /**
   * Lifecycle hook called after manager initialization
   * Override in subclasses if needed
   *
   * This is called at the end of the constructor, allowing subclasses
   * to perform initialization that requires access to this.managerName
   * or other properties set in the subclass constructor.
   *
   * @example
   * ```typescript
   * protected onInit(): void {
   *   this.logger.info(`${this.managerName} initialized`)
   *   // Setup event listeners, etc.
   * }
   * ```
   */
  protected onInit?(): void

  /**
   * Lifecycle hook called when the manager is being destroyed
   * Override in subclasses to cleanup resources
   *
   * @example
   * ```typescript
   * protected onDestroy(): void {
   *   this.logger.info(`${this.managerName} destroyed`)
   *   // Remove event listeners, clear intervals, etc.
   * }
   * ```
   */
  protected onDestroy?(): void

  /**
   * Destroy the manager and cleanup resources
   * Calls the onDestroy hook if defined
   */
  destroy(): void {
    if (this.onDestroy) {
      this.onDestroy()
    }
  }
}
