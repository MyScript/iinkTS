
/**
 * @group Recognizer
 */
export type TConvertionConfiguration = {
    force?: {
        "on-stylesheet-change": boolean
    }
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultConvertionConfiguration: TConvertionConfiguration = {
    force: {
        "on-stylesheet-change": false
    }
}
