
/**
 * @group Renderer
 */
export type TGuidesConfiguration = {
  enable: boolean,
  gap: number
}

/**
 * @group Renderer
 * @source
 */
export const DefaultGuidesConfiguration: TGuidesConfiguration = {
  enable: true,
  gap: 50,
}

/**
 * @group Renderer
 */
export type TRendererConfiguration = {
  minHeight: number
  minWidth: number
  guides: TGuidesConfiguration
}

/**
 * @group Renderer
 * @source
 */
export const DefaultRendererConfiguration: TRendererConfiguration = {
  guides: DefaultGuidesConfiguration,
  minHeight: 100,
  minWidth: 100,
}

/**
 * @group Renderer
 */
export type TIIRendererConfiguration = TRendererConfiguration & {
  guides: TGuidesConfiguration & {
    type: "line" | "grid" | "point"
  },
}

/**
 * @group Renderer
 * @source
 */
export const DefaultIIRendererConfiguration: TIIRendererConfiguration = {
  guides: {
    enable: true,
    gap: 50,
    type: "point"
  },
  minHeight: 100,
  minWidth: 100,
}
