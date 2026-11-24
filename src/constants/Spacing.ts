/**
 * Gap between a selected box and the selection frame drawn around it, its handles included.
 * @group Constants
 */
export const SELECTION_PADDING = 10 as const

/**
 * Distance on each side of a thin edge within which a pointer still hits it: a hairline drawn
 * exactly is a target nobody can hit.
 * @group Constants
 */
export const HIT_TOLERANCE = 5 as const

/**
 * Offset of a duplicate from its original, on both axes, past the original's height vertically.
 * @group Constants
 */
export const DUPLICATE_OFFSET = 10 as const
