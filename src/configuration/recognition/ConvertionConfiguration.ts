
/**
 * @group Configuration
 */
export type TConvertionConfiguration = {
    force?: {
        "on-stylesheet-change": boolean
    }
}

/**
 * @group Configuration
 */
export const DefaultConvertionConfiguration: TConvertionConfiguration = {
    force: {
        "on-stylesheet-change": false
    }
}
