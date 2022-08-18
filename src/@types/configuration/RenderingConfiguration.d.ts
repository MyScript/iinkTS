

export type TSmartGuidesConfiguration = {
  enable: boolean
  fadeOut: {
    enable: boolean
    duration: number
  }
}

export type TRenderingConfiguration = {
  minHeight: number
  minWidth: number
  smartGuide: TSmartGuidesConfiguration
}