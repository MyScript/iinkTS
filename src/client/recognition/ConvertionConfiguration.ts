/**
 * @group Client
 */
export type TConvertionConfiguration = {
  force?: {
    "on-stylesheet-change": boolean
  }
}

/**
 * @group Client
 * @source
 */
export const DefaultConvertionConfiguration: TConvertionConfiguration = {
  force: {
    "on-stylesheet-change": false,
  },
}
