/**
 * @websocket
 */
export type TGuidesConfiguration = {
  enable: boolean,
  gap: number
}

/**
 * @websocket
 */
export type TSmartGuidesConfiguration = {
  enable: boolean
  fadeOut: {
    enable: boolean
    duration: number
  }
}

/**
 * @REST
 * @websocket
 */
export type TRenderingConfiguration = {
  minHeight: number
  minWidth: number
  smartGuide: TSmartGuidesConfiguration
  guides: TGuidesConfiguration
}
