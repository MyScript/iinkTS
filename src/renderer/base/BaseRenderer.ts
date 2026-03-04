/**
 * @group Renderer
 * @summary Base renderer configuration interface
 *
 * Common configuration properties required by all renderer implementations.
 */
export interface TBaseRendererConfiguration
{
  minWidth: number
  minHeight: number
}

/**
 * @group Renderer
 * @summary Abstract base class for all renderer implementations
 *
 * Defines the common interface that both Canvas and SVG renderers
 * must implement, enabling consistent rendering behavior across
 * different output formats.
 */
export abstract class BaseRenderer<RenderContextType, ConfigType extends TBaseRendererConfiguration = TBaseRendererConfiguration>
{
  configuration: ConfigType
  parent!: HTMLElement

  constructor(configuration: ConfigType)
  {
    this.configuration = configuration
  }

  /**
   * Initialize the renderer in the given parent element
   */
  abstract init(element: HTMLElement): void

  /**
   * Clear/reset the rendering context
   */
  abstract clear(): void

  /**
   * Get the rendering context (Canvas2D, SVGElement, etc.)
   */
  abstract getRenderingContext(): RenderContextType

  /**
   * Get the bounds of the rendering area
   */
  getBounds()
  {
    return {
      x: 0,
      y: 0,
      width: this.configuration.minWidth,
      height: this.configuration.minHeight,
    }
  }
}
