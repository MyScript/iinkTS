export type TConvertionConfiguration = {
    force?: {
        "on-stylesheet-change": boolean
    }
}

export const DefaultConvertionConfiguration: TConvertionConfiguration = {
    force: {
        "on-stylesheet-change": false
    }
}