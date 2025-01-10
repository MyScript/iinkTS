
/**
 * @group Menu
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
 * @group Menu
 * @source
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
