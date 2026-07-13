/**
 * @group Client
 */
export type TRecognitionTypeBase = "TEXT" | "MATH" | "Raw Content"

/**
 * @group Client
 */
export type TRecognitionTypeV1 = TRecognitionTypeBase | "DIAGRAM"

/**
 * @group Client
 */
export type TRecognitionTypeV2 = TRecognitionTypeBase | "SHAPE"

/**
 * @group Client
 */
export type TConverstionState = "DIGITAL_EDIT" | "HANDWRITING"
