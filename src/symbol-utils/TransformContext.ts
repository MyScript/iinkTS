import type { MatrixTransform } from "@/core"

/**
 * What moving a symbol needs beyond the symbol itself.
 *
 * One context for all three operations, because there is now nothing to tell them apart. Translate,
 * rotate and resize each used to carry something extra — a measuring port for text and math, the
 * point a rotation turns around, the fixed point of a scale — and every one of them became dead
 * weight once a transform stopped moving a symbol's coordinates: the matrix already carries the
 * centre and the origin folded in, and a typeset symbol's measured box does not change when it
 * moves. They were still being passed and read by nobody.
 *
 * Still an object rather than a bare `MatrixTransform` parameter, so that a future operation can
 * need something more without changing all three signatures.
 *
 * Deliberately carries no operation discriminator: a `switch (context.operation)` inside a util
 * would be the same dispatch this epic exists to delete, one layer down. Each operation keeps its
 * own method, and which one ran is the method you are in.
 * @group SymbolUtils
 */
export type TTransformContext = {
  matrix: MatrixTransform
}
