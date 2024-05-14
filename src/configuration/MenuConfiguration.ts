
/**
 * @group Configuration
 */
export type TMenuConfiguration = {
  enable: boolean,
  style: {
    enable: boolean,
  }
  intention: {
    enable: boolean,
  }
  action: {
    enable: boolean,
  }
  context: {
    enable: boolean,
  }
}

export const DefaultMenuConfiguration: TMenuConfiguration = {
  enable: true,
  style: {
    enable: true
  },
  intention: {
    enable: true
  },
  action: {
    enable: true
  },
  context: {
    enable: true
  },
}
