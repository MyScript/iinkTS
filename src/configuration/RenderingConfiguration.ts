
/**
 * @group Configuration
 */
export type TGuidesConfiguration = {
  enable: boolean,
  gap: number
}

/**
 * @group Configuration
 */
export const DefaultGuidesConfiguration: TGuidesConfiguration = {
  enable: true,
  gap: 50
}

/**
 * @group Configuration
 */
export type TSmartGuidesConfiguration = {
  enable: boolean
  fadeOut: {
    enable: boolean
    duration: number
  }
}

/**
 * @group Configuration
 */
export const DefaultSmartGuidesConfiguration: TSmartGuidesConfiguration = {
  enable: true,
  fadeOut: {
    enable: false,
    duration: 5000
  }
}

/**
 * @group Configuration
 */
export type TRenderingConfiguration = {
  minHeight: number
  minWidth: number
  smartGuide: TSmartGuidesConfiguration
  guides: TGuidesConfiguration
}

/**
 * @group Configuration
 */
export const DefaultRenderingConfiguration: TRenderingConfiguration = {
  guides: DefaultGuidesConfiguration,
  smartGuide: DefaultSmartGuidesConfiguration,
  minHeight: 100,
  minWidth: 100,
}
