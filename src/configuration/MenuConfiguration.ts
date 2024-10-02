
/**
 * @group Configuration
 * @remarks only usable in the case of offscreen
 */
export type TMenuConfiguration = {
  enable: boolean,
  style: {
    enable: boolean,
  }
  tool: {
    enable: boolean,
  }
  action: {
    enable: boolean,
  }
  context: {
    enable: boolean,
  }
}

/**
 * @group Configuration
 * @remarks only usable in the case of offscreen
 */
export const DefaultMenuConfiguration: TMenuConfiguration = {
  enable: true,
  style: {
    enable: true
  },
  tool: {
    enable: true
  },
  action: {
    enable: true
  },
  context: {
    enable: true
  },
}
