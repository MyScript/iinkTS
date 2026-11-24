/**
 * @group Logger
 */
declare enum LoggerLevel {
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4
}
/**
 * @group Logger
 */
declare enum LoggerCategory {
    CANVAS = "CANVAS",
    CLIENT = "CLIENT",
    GRABBER = "GRABBER",
    GESTURE = "GESTURE",
    MOVE = "MOVE",
    CANVAS_EVENT = "CANVAS_EVENT",
    MODEL = "MODEL",
    RENDERER = "RENDERER",
    SMARTGUIDE = "SMARTGUIDE",
    MANAGER = "MANAGER",
    STYLE = "STYLE",
    HISTORY = "HISTORY",
    SYMBOL = "SYMBOL",
    WRITE = "WRITE",
    TRANSFORMER = "TRANSFORMER",
    CONVERTER = "CONVERTER",
    SELECTION = "SELECTION",
    SYNCHRONIZER = "SYNCHRONIZER",
    SVGDEBUG = "SVGDEBUG",
    MENU = "MENU",
    JIIX_QUERY = "JIIX_QUERY",
    KEYBOARD = "KEYBOARD",
    MATH = "MATH",
    SNAP = "SNAP",
    TEXT = "TEXT"
}
/**
 * @group Logger
 */
declare class Logger {
    category: LoggerCategory;
    level: LoggerLevel;
    constructor(category: LoggerCategory, level: LoggerLevel);
    private log;
    debug(functionName: string, ...data: unknown[]): void;
    info(functionName: string, ...data: unknown[]): void;
    warn(functionName: string, ...data: unknown[]): void;
    error(functionName: string, ...error: unknown[]): void;
}

/**
 * @group Logger
 */
type TLoggerConfiguration = {
    [key in keyof typeof LoggerCategory]: LoggerLevel;
};
/**
 * @group Logger
 * @source
 */
declare const DefaultLoggerConfiguration: TLoggerConfiguration;

/**
 * @group Logger
 */
declare class LoggerManager {
    #private;
    static getLogger(name: LoggerCategory): Logger;
    static setLoggerLevel(config: TLoggerConfiguration): void;
}

/**
 * @group Core/Std
 */
declare class DeferredPromise<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (value: Error | string) => void;
    isFullFilled: boolean;
    isPending: boolean;
    constructor();
}

/**
 * @group Core/Std
 */
type TPartialDeep<T> = T extends object ? {
    [P in keyof T]?: TPartialDeep<T[P]>;
} : T;
/**
 * A value and everything reachable from it, read-only.
 *
 * This is the shape a committed record is handed out in: the store freezes records at commit, and
 * this type is how the compiler says so, at `yarn typecheck` rather than at runtime in a browser.
 * To change a committed record, ask the store for a {@link TDraft} instead.
 * @group Core/Std
 */
type TReadonlyDeep<T> = T extends (infer TItem)[] ? readonly TReadonlyDeep<TItem>[] : T extends object ? {
    readonly [P in keyof T]: TReadonlyDeep<T[P]>;
} : T;
declare const draftBrand: unique symbol;
/**
 * A record that is yours to mutate, because the store has not committed it yet.
 *
 * The brand is what makes this worth having: a plain `T` is structurally identical to a mutable
 * record, so a structural alias would accept any committed record and enforce nothing. Only the
 * store hands out drafts, and a draft stops being one the moment it is committed.
 *
 * A draft is readable as a plain `T`, so a draft can be passed to anything that only reads.
 * @group Core/Std
 */
type TDraft<T> = T & {
    readonly [draftBrand]: true;
};

/**
 * @group Core/Std
 */
type TMergeable = Record<string, unknown> | unknown[] | unknown;
/**
 * Deep-merges `sources` (left to right) onto `target`, mutating and returning it. `target` is
 * typically an empty object/array so the caller's own default-configuration object isn't
 * mutated in place; the explicit type parameter `T` should be given at the call site (e.g.
 * `mergeDeep<TServerHTTPConfiguration>({}, DefaultServerHTTPConfiguration, override)`) since an
 * empty `target` carries no type information of its own to infer `T` from.
 * @group Core/Std
 */
declare const mergeDeep: <T extends TMergeable>(target: TPartialDeep<T>, ...sources: TMergeable[]) => T;
/**
 * Deep-assigns `override` onto `target`, mutating and returning it. Unlike {@link mergeDeep},
 * an array in `override` replaces the one in `target` instead of being appended to it, and an
 * explicit `undefined` clears the key — what updating a live configuration needs.
 * @group Core/Std
 */
declare const overrideDeep: <T extends object>(target: T, override: TPartialDeep<T>) => T;
/**
 * @group Core/Std
 */
declare const isDeepEqual: (object1: unknown, object2: unknown) => boolean;
/**
 * @group Core/Std
 */
declare const isDeepEqualIgnoring: (object1: unknown, object2: unknown, ignoredKeys: string[]) => boolean;
/**
 * @group Core/Std
 * @summary `Object.keys` typed with the keys of `T`
 * @remarks Sound only for an object built from a literal of `T`: a subtype carrying extra keys would list them too.
 */
declare const typedKeys: <T extends object>(object: T) => (keyof T)[];
/**
 * @group Core/Std
 */
declare const uniqueById: <T extends {
    id: string;
}>(items: T[]) => T[];
/**
 * Merges an incoming export payload into the current one, mutating and returning it when
 * present, or adopting `incoming` as-is when there was nothing to merge into yet.
 * @group Core/Std
 */
declare const mergeExports: <T extends object>(current: T | undefined, incoming: T) => T;

/**
 * @group Core/Std
 */
declare function createUUID(): string;

/**
 * @group Core/Std
 */
declare const isVersionSuperiorOrEqual: (source: string, target: string) => boolean;

/**
 * @group Core/Geometry
 */
type TPoint = {
    x: number;
    y: number;
};
/**
 * @group Core/Geometry
 */
type TPointer = TPoint & {
    /**
     * Milliseconds since the gesture that captured this pointer began, so the first pointer of a
     * stroke is at 0. Fractional: a pen samples faster than once per millisecond, and rounding the
     * gap between two samples to zero would tell the recognizer they were captured at the same
     * instant.
     *
     * Relative rather than absolute so it stays a two- or three-digit number. The absolute instant
     * is `stroke.creationTime + dt`, which is what goes on the wire — the recognizer needs absolute
     * times to order strokes against each other.
     */
    dt: number;
    p: number;
};
/**
 * @group Core/Geometry
 */
type TSegment = {
    p1: TPoint;
    p2: TPoint;
};
/**
 * A pointer as written before pointers stored a delta: `t` held an absolute epoch timestamp.
 * Only ever read, never produced — it exists so documents saved by an earlier version still open.
 * @group Core/Geometry
 */
type TTimedPointerLike = {
    dt?: number;
    t?: number;
};
/**
 * A pointer as read from a document: it may carry `dt`, or the absolute `t` an earlier version
 * wrote, or neither. This is the shape every import path accepts — without it the compatibility
 * read below would be unreachable, because a document in the old format would not typecheck.
 * @group Core/Geometry
 */
type TPointerImport = TPartialDeep<TPointer> & TTimedPointerLike;
/**
 * The `dt` field of the {@link TPointer} at `index`, accepting documents that predate `dt`.
 *
 * A pointer that already carries `dt` is taken as is. One that only carries the old absolute `t`
 * is rebased onto the first timed pointer of the same stroke, which reproduces the deltas the
 * capture originally had. With neither, the index stands in — a stroke with no timing at all still
 * has to come out strictly increasing, because the recognizer reads the order from it.
 * @group Core/Geometry
 */
declare function resolvePointerDelta(pointers: ReadonlyArray<TTimedPointerLike | undefined>, index: number): number;
/**
 * The epoch instant a stroke began, for a stroke read from a document.
 *
 * Its own `creationTime` when it has one. Otherwise the absolute `t` of its first pointer, which
 * is what a pre-`dt` document carries — losing it would collapse the intervals *between* strokes,
 * and those are what tell the recognizer the order they were written in.
 * @group Core/Geometry
 */
declare function resolveStrokeOrigin(pointers: ReadonlyArray<TTimedPointerLike | undefined>, creationTime?: number): number | undefined;
/**
 * @group Core/Geometry
 */
declare function isValidPoint(p?: TPartialDeep<TPoint>): boolean;

/**
 * @group Core/Geometry
 */
declare function computeAngleAxeRadian(begin: TPoint, end: TPoint): number;
/**
 * @group Core/Geometry
 */
declare function computeAngleRadian(p1: TPoint, center: TPoint, p2: TPoint): number;
/**
 * @group Core/Geometry
 */
declare function computeRotatedPoint(point: TPoint, center: TPoint, radian: number): TPoint;

/**
 * @group Core/Geometry
 */
type TBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};
/**
 * @group Core/Geometry
 */
declare const BoxOps: {
    createFromBoxes(boxes: TBox[]): TBox;
    createFromPoints(points: TPoint[]): TBox;
    getCorners(box: TBox): TPoint[];
    getSide(box: TBox): TPoint[];
    getCenter(box: TBox): TPoint;
    getSides(box: TBox): TSegment[];
    getSnapPoints(box: TBox): TPoint[];
    isContained(box: TBox, wrapper: TBox): boolean;
    containsPoint(box: TBox, point: TPoint): boolean;
    contains(box: TBox, child: TBox): boolean;
    overlaps(box1: TBox, box2: TBox): boolean;
    /**
     * Closest point on the box's boundary to the given point.
     * If the point is outside, this is the clamp of the point onto the box.
     * If the point is inside, this snaps to whichever of the 4 edges is nearest.
     */
    nearestBoundaryPoint(box: TBox, point: TPoint): TPoint;
};

/**
 * @group Core/Geometry
 */
declare function isPointInsideBox(point: TPoint, box: TBox): boolean;
/**
 * @group Core/Geometry
 */
declare function isPointInsidePolygon(point: TPoint, points: TPoint[]): boolean;

/**
 * @group Core/Geometry
 */
declare function computeDistance(p1: TPoint, p2: TPoint): number;
/**
 * @group Core/Geometry
 * @remarks Faster than computeDistance when comparing distances (avoids sqrt)
 */
declare function computeDistanceSquared(p1: TPoint, p2: TPoint): number;
/**
 * @group Core/Geometry
 */
declare function getClosestPoints(points1: TPoint[], points2: TPoint[]): {
    p1: TPoint;
    p2: TPoint;
};
/**
 * @group Core/Geometry
 */
declare function getClosestPoint(points: TPoint[], point: TPoint): {
    point?: TPoint;
    index: number;
};

/**
 * @group Core/Geometry
 */
declare function computePointOnEllipse(center: TPoint, radiusX: number, radiusY: number, phi: number, theta: number): TPoint;
/**
 * Inverse of computePointOnEllipse: compute angle θ such that the point on the ellipse
 * nearest to the given position corresponds to that angle. Projects the point onto the ellipse.
 * @group Core/Geometry
 */
declare function computeAngleFromPointOnEllipse(center: TPoint, radiusX: number, radiusY: number, phi: number, point: TPoint): number;
/**
 * @group Core/Geometry
 * @param centerPoint - Center of the ellipse
 * @param maxRadius - Maximum radius (semi-major axis)
 * @param minRadius - Minimum radius (semi-minor axis)
 * @param orientation - Rotation of the ellipse
 * @param startAngle - Starting angle
 * @param sweepAngle - Sweep angle
 * @param angleStep - Step size for calculations
 * @returns Array of points along the ellipse arc
 */
declare function computeEllipseArcPoints(centerPoint: TPoint, maxRadius: number, minRadius: number, orientation: number, startAngle: number, sweepAngle: number, angleStep?: number): TPoint[];

/**
 * @group Core/Geometry
 */
declare function findIntersectionBetween2Segment(seg1: TSegment, seg2: TSegment): TPoint | undefined;
/**
 * @group Core/Geometry
 */
declare function findIntersectBetweenSegmentAndCircle(seg: TSegment, c: TPoint, r: number): TPoint[];
/**
 * Returns the point on the box perimeter where a ray from the box center toward `target` exits.
 * Used to find natural arrow connection points between two boxes.
 * @group Core/Geometry
 */
declare function getBoxConnectionPoint(box: TBox, target: TPoint): TPoint;

/**
 * @group Core/Geometry
 * @remarks Represents a 2D affine transform, defined as a 3x3 matrix with an implicit third raw of <code>[ 0 0 1 ]</code>
 */
type TMatrixTransform = {
    /**
     * @remarks scaling x
     */
    xx: number;
    /**
     * @remarks shearing x
     */
    yx: number;
    /**
     * @remarks translation x
     */
    tx: number;
    /**
     * @remarks shearing y
     */
    xy: number;
    /**
     * @remarks scaling y
     */
    yy: number;
    /**
     * @remarks translation y
     */
    ty: number;
};
/**
 * @group Core/Geometry
 */
declare class MatrixTransform implements TMatrixTransform {
    xx: number;
    yx: number;
    xy: number;
    yy: number;
    tx: number;
    ty: number;
    constructor(xx: number, yx: number, xy: number, yy: number, tx: number, ty: number);
    static identity(): MatrixTransform;
    static applyToPoint(mat: TMatrixTransform, point: TPoint): TPoint;
    static rotation(mat: TMatrixTransform): number;
    static toCssString(matrix: TMatrixTransform): string;
    invert(): this;
    multiply(m: TMatrixTransform): MatrixTransform;
    translate(tx: number, ty: number): MatrixTransform;
    rotate(radian: number, center?: TPoint): MatrixTransform;
    scale(x: number, y: number, center?: TPoint): MatrixTransform;
    applyToPoint(point: TPoint): TPoint;
    clone(): MatrixTransform;
    toCssString(): string;
}
/**
 * A matrix applied to a point, rounded to the precision the document stores.
 *
 * Prefer this over {@link MatrixTransform.applyToPoint} whenever the result is written back into a
 * symbol: the raw form is for intermediate maths, where rounding at every step would accumulate.
 *
 * Returns a new point and leaves the argument untouched.
 *
 * @group Core/Geometry
 */
declare function applyMatrixToPoint(point: TPoint, matrix: TMatrixTransform): TPoint;
/**
 * The same, applied in place to every point of a list, so each point keeps its object identity.
 *
 * Lived as a `protected` method on the transform manager base until IIC-2010, where no symbol util
 * could reach it — which is half of why the managers rounded inconsistently.
 *
 * @group Core/Geometry
 */
declare function applyMatrixToPoints(points: TPoint[], matrix: TMatrixTransform): void;
/**
 * A document-space point mapped back into the frame a symbol's own coordinates live in.
 *
 * The mirror of {@link applyMatrixToPoint}, and needed wherever a value that came from the document
 * — a pointer position, or a point computed from another symbol's geometry — is written *into* a
 * symbol's stored coordinates. Those coordinates are raw: they are what the symbol was created with,
 * and its matrix is what puts it where the user sees it. Writing a document-space point straight
 * into them lands it wrong by exactly that matrix, which is why dragging one vertex of an
 * already-moved edge used to make it jump.
 *
 * Returns `undefined` when the matrix cannot be inverted — a symbol flattened to nothing on some
 * axis, or one whose determinant came out `NaN`. There is genuinely no raw point corresponding to a
 * document one in that state, so callers skip the write rather than storing a fabricated coordinate.
 *
 * Rounded to the three decimals the document stores, like {@link applyMatrixToPoint}: the result is
 * written back into a symbol, not used for intermediate maths.
 *
 * @group Core/Geometry
 */
declare function applyInverseMatrixToPoint(point: TPoint, matrix: TMatrixTransform): TPoint | undefined;
/**
 * Whether this matrix leaves everything where it is.
 *
 * Worth asking before doing anything with it: the vast majority of symbols in a document were never
 * moved, and both the geometry pass and the renderer can skip their whole matrix path on this.
 *
 * @group Core/Geometry
 */
declare function isIdentityMatrix(matrix: TMatrixTransform): boolean;
/**
 * A transform partially specified in incoming data, filled out with the identity for whatever field
 * it left unset.
 *
 * Mirrors `mergeSymbolStyle`'s role for `TStyle`: every `*Ops.createFromPartial` deserialises data
 * that may predate this field, or may simply describe a symbol that was never moved, so `transform`
 * has to be optional on the wire even though `TBaseSymbol.transform` is not. Without this, a
 * `createFromPartial` that dropped an incoming `transform` would silently reset every deserialised
 * symbol to identity — invisible today, since nothing yet writes a non-identity one, but silent data
 * loss the moment something does.
 *
 * @group Core/Geometry
 */
declare function mergeSymbolTransform(transform?: TPartialDeep<TMatrixTransform>): TMatrixTransform;

/**
 * Oriented Bounding Box
 * @group Core/Geometry
 */
type TOBB = {
    center: TPoint;
    width: number;
    height: number;
    angle: number;
};
/**
 * @group Core/Geometry
 */
declare const OBBOps: {
    create(center: TPoint, width: number, height: number, angle?: number): TOBB;
    fromBox(box: TBox): TOBB;
    toBox(obb: TOBB): TBox;
    /**
     * The box the OBB describes *before* its own rotation — centre, width and height, angle ignored.
     *
     * {@link toBox} cannot serve this: for a non-zero angle it returns the axis-aligned **envelope**
     * of the rotated box, which is strictly larger. Both are wanted, for different questions — the
     * envelope for "what area does this cover on screen", this one for "what box is being rotated".
     * Conflating them was IIC-1999's sibling: a typeset symbol's derived vertices were built from the
     * envelope and then rotated again, so the rotation was counted twice.
     */
    toUnrotatedBox(obb: TOBB): TBox;
    createFromPoints(points: TPoint[]): TOBB;
    /**
     * The tightest box at `angle` containing every point.
     *
     * {@link OBBOps.createFromPoints} is this with `angle` 0. The general form exists because a shape
     * carried through a rotation still has a tight box — the same box, turned — and describing it with
     * an axis-aligned one instead inflates it by up to a factor of sqrt(2) on the diagonal, which a
     * selection outline shows and a containment test then gets wrong.
     *
     * Not {@link OBBOps.fromCorners}: that takes the **centroid** of what it is given as the box's
     * centre, which is the centre only when the points are the four corners of a rectangle — the one
     * case it is ever called with. Fed a shape's vertices it would pull the box towards whichever side
     * carries more of them. Here the centre comes from the extents, so any point list works.
     */
    createFromPointsAtAngle(points: TPoint[], angle: number): TOBB;
    createFromOBBs(obbs: TOBB[]): TOBB;
    getCorners(obb: TOBB): TPoint[];
    /**
     * The four corners, named for the round trip with {@link fromCorners}.
     *
     * Same computation as {@link getCorners} — kept as its own name because a caller fitting a box
     * back from transformed corners thinks in "to/from corners" pairs, and `getCorners` predates that
     * pairing by naming itself after the shape instead.
     */
    toCorners(obb: TOBB): TPoint[];
    /**
     * Fits an OBB to four corners at a known angle — the fitting counterpart to {@link toCorners}.
     *
     * Takes the angle rather than solving for it (which a PCA or minimal-bounding-rectangle search
     * would have to) because every caller already knows it: it is the original box's own angle, plus
     * whatever rotation a matrix carried. That keeps this O(1) per call instead of O(points).
     *
     * The four corners are expected to form a box or, after a non-uniform scale applied to a rotated
     * box, a parallelogram. Projecting onto the given angle's axes and taking the extent along each
     * fits the *enclosing* OBB in the parallelogram case — exact for any similarity, an accepted
     * over-approximation otherwise (see `SymbolGeometry`'s `applyMatrix`, the only caller that can
     * produce a parallelogram here).
     */
    fromCorners(corners: TPoint[], angle: number): TOBB;
    getSides(obb: TOBB): TSegment[];
    getSnapPoints(obb: TOBB): TPoint[];
    containsPoint(obb: TOBB, point: TPoint): boolean;
    overlaps(a: TOBB, b: TOBB): boolean;
    overlapsBox(obb: TOBB, box: TBox): boolean;
    isContained(obb: TOBB, box: TBox): boolean;
    /**
     * Whether a polygon-like symbol (its `bounds` OBB and own `edges`) overlaps `box` — contained
     * OBB is an early-out, otherwise any edge crossing any side of `box` counts as an overlap.
     */
    polygonOverlapsBox(bounds: TOBB, edges: TSegment[], box: TBox): boolean;
    /**
     * Whether a polygon-like symbol (its own `vertices` and `edges`) overlaps `query`, an arbitrary
     * convex quadrilateral given as its four corners in order.
     *
     * Generalizes {@link polygonOverlapsBox} to a query a `TBox` cannot express: the image of an
     * axis-aligned box under the inverse of a rotated (and possibly also sheared) matrix is a rotated
     * rectangle or a genuine parallelogram, neither of which fits a `TBox`, and the latter does not fit
     * a `TOBB` either (which assumes right angles).
     *
     * The containment early-out tests the symbol's own `vertices`, not an axis-aligned `bounds` box —
     * `bounds` is the *raw* frame's AABB, which for anything but a plain rectangle reaches further out
     * on the diagonal than the shape itself (a circle of radius r has corners at r·√2). Once `query` is
     * rotated relative to that raw frame, a `query` that fully encloses the true shape can still miss
     * those corners, which is a real regression this fixes rather than a hypothetical: a query built
     * from `bounds` reported a rotated circle or a rotated diagonal line as unselected while a selection
     * box plainly surrounded it. `vertices` is what every geometry already tessellates a curve
     * into (or, for a straight-edged type, already is the exact boundary) — a polygon is contained in a
     * convex region iff all its vertices are, whether or not the polygon itself is convex.
     *
     * Same as `polygonOverlapsBox` otherwise: any of the symbol's own edges crossing a side of `query`
     * counts as an overlap. Neither branch catches `query` sitting entirely inside the shape without
     * crossing its boundary — `polygonOverlapsBox` has never caught that case either; it is a
     * pre-existing gap, not one this generalization introduces.
     */
    polygonOverlapsQuad(vertices: TPoint[], edges: TSegment[], query: TPoint[]): boolean;
    /**
     * Whether `point` lies inside (or on the boundary of) the convex quadrilateral `query` describes
     * by its four corners in order — the same test {@link polygonOverlapsQuad} uses for its own
     * vertices, exposed here for a type whose true overlap test is itself point-based (a stroke: "is
     * any raw pointer inside the query") rather than a bounds/edges polygon test. Using the generic
     * edges-crossing test for such a type would over-approximate: a query side can cross the segment
     * *between* two consecutive pointers without any pointer itself being inside the query, which is a
     * true overlap for a polygon but not for a stroke, whose own definition of "overlaps" was never
     * "the drawn line crosses the box" to begin with.
     */
    quadContainsPoint(query: TPoint[], point: TPoint): boolean;
    contains(a: TOBB, b: TOBB): boolean;
};

/**
 * @group Core/Geometry
 */
declare function computeLinksPointers(point: TPointer, angle: number, width: number): TPoint[];
/**
 * @group Core/Geometry
 */
declare function computeMiddlePointer(point1: TPointer, point2: TPointer): TPointer;
/**
 * Outline points on either side of a straight segment, used to build both the
 * Canvas2D and SVG stroke-outline paths for a line segment.
 * @group Core/Geometry
 */
declare function computeLineOutlinePoints(begin: TPointer, end: TPointer, width: number): {
    linkPoints1: TPoint[];
    linkPoints2: TPoint[];
};
/**
 * Outline points on either side of a quadratic segment, used to build both the
 * Canvas2D and SVG stroke-outline paths for a quadratic curve.
 * @group Core/Geometry
 */
declare function computeQuadraticOutlinePoints(begin: TPointer, end: TPointer, ctrl: TPointer, width: number): {
    linkPoints1: TPoint[];
    linkPoints2: TPoint[];
    linkPoints3: TPoint[];
};
/**
 * Fan of points closing a stroke's final end cap, used to build both the
 * Canvas2D and SVG stroke-outline paths for a stroke's last segment.
 * @group Core/Geometry
 */
declare function computeFinalOutlinePoints(begin: TPointer, end: TPointer, width: number): TPoint[];

/**
 * @group Core/Geometry
 */
declare function scalaire(v1: TPoint, v2: TPoint): number;
/**
 * @group Core/Geometry
 */
declare function createPointsOnSegment(p1: TPoint, p2: TPoint, spaceBetweenPoint?: number): TPoint[];
/**
 * @group Core/Geometry
 */
declare function computeNearestPointOnSegment(p: TPoint, seg: TSegment): TPoint;
/**
 * @group Core/Geometry
 */
declare function computeDistanceBetweenPointAndSegment(p: TPoint, seg: TSegment): number;

/**
 * @group Core/Geometry
 * @summary What a geometry is, beyond the points it is made of.
 *
 * Two independent questions, and conflating them is what left a hole in the test this replaces.
 *
 * - `isClosed` — does the last vertex join back to the first? A polygon does, a polyline does not.
 *   It decides whether {@link Geometry2d.edges} emits a closing edge, and so what the perimeter is.
 * - `isFilled` — does the inside belong to the shape? A rectangle with a fill does, the same
 *   rectangle drawn as an outline does not. It decides whether a point strictly inside, touching no
 *   edge, counts as a hit.
 *
 * Options on the base rather than separate subclasses: a filled and an unfilled polygon differ in
 * one predicate, not in how either computes anything.
 */
type TGeometry2dOptions = {
    isClosed: boolean;
    isFilled: boolean;
    /**
     * The angle, in radians, of the frame this shape's tight box is measured in. Zero — axis-aligned —
     * for a shape as it was built; whatever rotation it has been carried through afterwards.
     *
     * It exists so a turned shape keeps a *turned* box rather than the axis-aligned one that contains
     * it. The two differ by up to a factor of sqrt(2) on the diagonal, and {@link Geometry2d.bounds}
     * feeds containment and overlap, so the looser box does not merely look wrong — it selects symbols
     * a query never reached.
     */
    frameAngle?: number;
    /**
     * How far beyond its own outline this shape asks to be found, in units.
     *
     * Not decoration: a hairline is a few tenths of a unit across, and a box drawn exactly around it
     * is a target nobody can hit. An edge pads its box by `HIT_TOLERANCE` on each side for
     * that reason, and by more again when it carries an arrow head, which is drawn outside the path it
     * belongs to and would otherwise fall outside the shape's own bounds.
     *
     * It widens {@link Geometry2d.bounds} only. Edges, vertices and length stay the shape as drawn, so
     * a crossing test is unchanged and only the "is it near enough" question moves — which is the one
     * the padding is about.
     */
    padding?: number;
};
/**
 * @group Core/Geometry
 * @summary A shape that can answer questions about itself.
 *
 * Geometry used to be data — a `{ bounds, vertices, edges, length }` record each symbol type built
 * for itself — and every type then had to carry its own `overlaps`, because a record cannot be
 * asked anything. Six of the eight ended up as the same call, `polygonOverlapsBox`, and the two
 * that did not (a stroke tests its pointers, a circle tests its radius) had to be special-cased
 * elsewhere. Here the shape answers, so a symbol type only has to say what shape it is.
 *
 * **The hole this closes.** `polygonOverlapsBox` is "the shape's bounds sit inside the query, or
 * some edge crosses some side of it". Both halves are about the boundary, so a query landing
 * entirely *within* a shape without touching its outline was missed — a real miss for a filled
 * shape, and correct for an unfilled one. Nothing in a plain record could tell those apart;
 * {@link TGeometry2dOptions.isFilled} does.
 *
 * **Derived values are computed once per instance.** `vertices`, `edges`, `bounds` and `length` all
 * fall out of each other, and a caller that reads bounds usually reads vertices next. Instances are
 * themselves cached per symbol by `SymbolGeometry`, so "once per instance" is once per symbol
 * version — there is no invalidation to get wrong, because a changed symbol is a different object
 * and gets a different instance.
 */
declare abstract class Geometry2d {
    #private;
    readonly isClosed: boolean;
    readonly isFilled: boolean;
    readonly frameAngle: number;
    readonly padding: number;
    constructor({ isClosed, isFilled, frameAngle, padding }: TGeometry2dOptions);
    /**
     * The points this shape is made of, in order.
     *
     * A curve tessellates here — there is no exact vertex list for a circle, and the subclass that
     * draws one decides how finely to approximate it. A shape whose test does not need an
     * approximation overrides the methods that would use it instead.
     *
     * Implemented rather than exposed directly so the result can be held: see the class note.
     */
    protected abstract computeVertices(): TPoint[];
    get vertices(): TPoint[];
    /**
     * This shape carried through `matrix`.
     *
     * Abstract because only the shape knows what it stays under a transform: a circle scaled by
     * different factors on each axis is an ellipse, not a circle, and not a tessellation of one
     * either. Returning the exact shape is what lets a moved symbol keep an exact test, where mapping
     * a fixed vertex list forward would bake in whatever approximation the vertices already carried.
     *
     * An implementation must carry {@link frameAngle} forward too, adding the matrix's own rotation to
     * it — {@link Geometry2d.rotatedFrameAngle} does that. Dropping it silently widens the shape's box
     * the first time anything turns it.
     */
    abstract transform(matrix: TMatrixTransform): Geometry2d;
    /**
     * This shape's frame angle after `matrix` is applied — for an implementation of
     * {@link Geometry2d.transform} to hand to the shape it builds.
     */
    protected rotatedFrameAngle(matrix: TMatrixTransform): number;
    /**
     * The segments between consecutive vertices, plus the closing one when {@link isClosed}.
     *
     * That closing edge is the whole of what `isClosed` changes here, and it is not cosmetic: without
     * it a polygon's last side is missing from every edge-crossing test, so a query touching only
     * that side would report no overlap.
     */
    get edges(): TSegment[];
    /**
     * The smallest box containing every vertex, measured in this shape's own frame.
     *
     * Axis-aligned while {@link frameAngle} is zero, and turned with the shape once it is not — which
     * is what keeps a rotated shape's box tight instead of letting it grow to the axis-aligned box
     * around the turned one.
     */
    get bounds(): TOBB;
    /** Total length along the edges — a perimeter when {@link isClosed}, a path length otherwise. */
    get length(): number;
    /**
     * Whether this shape and an axis-aligned query box share any area.
     *
     * Concrete, and the generic answer for anything made of straight edges: the shape sits inside the
     * query, or an edge crosses it, or — for a filled shape only — the query sits inside the shape.
     *
     * A subclass overrides this when it has an exact test of its own that a vertex list can only
     * approximate, which for a curve it always can.
     */
    overlapsBox(box: TBox): boolean;
    /**
     * Whether `point` is inside this shape's outline.
     *
     * Always false for an unfilled shape: there is no inside to be in. Callers wanting "on or near the
     * outline" want {@link hitTestPoint}.
     */
    containsPoint(point: TPoint): boolean;
    /** The point of this shape's outline closest to `point`. */
    nearestPoint(point: TPoint): TPoint;
    /** Distance from `point` to this shape's outline. Zero on the outline, positive on either side. */
    distanceToPoint(point: TPoint): number;
    /**
     * Whether `point` hits this shape, allowing `margin` of slack around its outline.
     *
     * Inside a filled shape counts however far from the outline it is — that is what filled means.
     */
    hitTestPoint(point: TPoint, margin?: number): boolean;
}

/**
 * @group Core/Geometry
 * @summary The two vectors the unit circle's axes are sent to.
 *
 * An ellipse is the image of the unit circle under a linear map, and this is that map: the point at
 * angle `t` is `center + (xx·cos t + xy·sin t, yx·cos t + yy·sin t)`. `(xx, yx)` is where (1, 0)
 * lands and `(xy, yy)` where (0, 1) does.
 *
 * Stored this way rather than as radii and an orientation because it is what makes
 * {@link Ellipse2d.transform} exact and cheap: carrying an ellipse through a matrix is composing the
 * two maps, where radii and an angle would have to be recovered from the product — a singular value
 * decomposition, per transform, to describe the same thing.
 */
type TEllipseAxes = {
    xx: number;
    xy: number;
    yx: number;
    yy: number;
};
/**
 * @group Core/Geometry
 * @summary An ellipse, and so also a circle that a matrix has stretched out of shape.
 *
 * Two things are exact here and were approximations before: its box, and what it becomes under a
 * transform. Its overlap test is not — see {@link Ellipse2d.computeVertices}.
 */
declare class Ellipse2d extends Geometry2d {
    #private;
    readonly center: TPoint;
    readonly axes: TEllipseAxes;
    constructor(center: TPoint, axes: TEllipseAxes, isFilled?: boolean, frameAngle?: number);
    /**
     * The ellipse a symbol describes: half-widths along two perpendicular axes, turned by
     * `orientation`.
     */
    static fromRadii(center: TPoint, radiusX: number, radiusY: number, orientation?: number, isFilled?: boolean, frameAngle?: number): Ellipse2d;
    /** The point at angle `t` around the ellipse, measured in the frame its axes define. */
    pointAt(t: number): TPoint;
    /**
     * The curve, sampled into straight chords.
     *
     * This is the one approximation the class carries, and it is what {@link Geometry2d.overlapsBox}
     * and {@link Geometry2d.nearestPoint} fall back on. Each chord is a secant, so the sampled polygon
     * sits inside the true ellipse by at most that chord's sagitta — about `c²/(8r)` for a chord of
     * length `c` on a curve of local radius `r`. Spacing is `TESSELLATION_SEGMENT_LENGTH`, which puts the error
     * well under a pixel for anything drawn at a normal size.
     *
     * `bounds` does **not** go through here: an ellipse's box has a closed form, and using the sampled
     * points would make it a shade too small in every direction at once.
     */
    protected computeVertices(): TPoint[];
    /**
     * The tightest box at {@link Geometry2d.frameAngle}, in closed form.
     *
     * The half-extent along a direction is the length of the ellipse's map projected onto it, so both
     * come straight out of the axes — no sampling, and exact however the ellipse is turned or
     * stretched. Overridden rather than inherited because the inherited one measures the sampled
     * polygon, which is always a little inside the curve.
     */
    get bounds(): TOBB;
    /**
     * Exact: an affine map sends an ellipse to an ellipse, and composing the two maps is the whole of
     * it. Nothing is recovered, decomposed or resampled, so an ellipse stretched a hundred times in a
     * row is as exact as one stretched once.
     */
    transform(matrix: TMatrixTransform): Ellipse2d;
}

/**
 * @group Core/Geometry
 * @summary A circle, tested by its radius rather than by a polygon standing in for it.
 *
 * Its overlap is exact, where every other curved shape here settles for a sampled outline: a circle
 * is the one curve with a cheap closed-form answer to "does this segment cross me", so it would be
 * perverse to approximate it. Its box is exact too, and free — a circle's box is its radius.
 */
declare class Circle2d extends Geometry2d {
    readonly center: TPoint;
    readonly radius: number;
    constructor(center: TPoint, radius: number, isFilled?: boolean);
    /**
     * The curve sampled into chords — used by {@link Geometry2d.nearestPoint} and by anything reading
     * `edges`, never by {@link Circle2d.overlapsBox} or {@link Circle2d.bounds}, both of which have an
     * exact answer of their own.
     */
    protected computeVertices(): TPoint[];
    /** The radius, doubled. Exact, and without touching a single vertex. */
    get bounds(): TOBB;
    /**
     * Exact: the circle sits inside the query, or one of the query's four sides crosses it, or — when
     * filled — the query sits inside the circle.
     *
     * The sampled outline the base class would use is always a little inside the true curve, so a
     * query grazing the circle near a chord's middle would be missed.
     */
    overlapsBox(box: TBox): boolean;
    /** Exact, by distance, where the base class would ask a polygon standing in for the circle. */
    containsPoint(point: TPoint): boolean;
    /**
     * A circle only stays a circle under a similarity — a rotation with one scale for both axes.
     * Stretched unevenly it becomes an **exact** {@link Ellipse2d}, not a sampled approximation of one,
     * which is the whole reason that class exists.
     */
    transform(matrix: TMatrixTransform): Circle2d | Ellipse2d;
}

/**
 * @group Core/Geometry
 * @summary A shape defined by a list of points it stores.
 *
 * What every straight-edged geometry here has in common: it holds its vertices rather than deriving
 * them, so `computeVertices` is the list, and moving it is mapping the list. Only the flags and, for
 * one of them, the overlap test differ — which is all a subclass is left to say.
 *
 * Curved shapes do not belong here. A circle is defined by a centre and a radius, and tessellating it
 * into a point list is what it does to *approximate* itself for a generic test, not what it is.
 */
declare abstract class PointsGeometry2d extends Geometry2d {
    /**
     * Read directly rather than through {@link Geometry2d.vertices} by subclasses on a hot path: the
     * getter memoizes, so both give the same array, but hit-testing calls this once per sample.
     */
    protected readonly points: TPoint[];
    constructor(points: TPoint[], options: TGeometry2dOptions);
    protected computeVertices(): TPoint[];
    /**
     * This shape's points carried through `matrix`, for a subclass to hand to the shape it builds.
     *
     * Exact however the matrix turns or scales — a point maps to a point, with nothing to approximate
     * and no accumulated tessellation error to carry.
     */
    protected mapPoints(matrix: TMatrixTransform): TPoint[];
}

/**
 * @group Core/Geometry
 * @summary An ordered run of sampled points, caught by the samples themselves.
 *
 * The shape a stroke has. Its path, its length and its bounds all come from the same run of points,
 * so everything {@link Geometry2d} derives is already right here — only the overlap test differs,
 * and it differs on purpose.
 *
 * **Why the test is the points and not the path.** Everything else in this module answers "does the
 * query touch the shape I draw". A stroke answers a different question: "did the query catch a
 * sample". The two part company when a query slips between two consecutive samples — a box crossing
 * the segment without containing either end. Treating that as a hit is right for a drawn line and
 * wrong for a stroke, whose selection has always meant the points it captured. Preserving that is
 * not conservatism: a stroke samples sparsely where the pen moved fast, so an edge-crossing test
 * would make a quick flick selectable from far more places than a slow one drawn identically.
 *
 * `isClosed` is false — the last sample does not join back to the first, and inventing that edge
 * would add a phantom segment straight across the stroke, lengthening it and giving hit-testing
 * something to catch that was never drawn. `isFilled` is false for the same reason a line has no
 * inside.
 */
declare class PointSet2d extends PointsGeometry2d {
    constructor(points: TPoint[], frameAngle?: number);
    /**
     * Whether any sample falls inside the query, bounds included.
     *
     * Inclusive on every side, so a sample exactly on the query's edge counts — a selection dragged
     * to land precisely on a point is a selection of it.
     */
    overlapsBox(box: TBox): boolean;
    transform(matrix: TMatrixTransform): PointSet2d;
}

/**
 * @group Core/Geometry
 * @summary A closed run of vertices: the last joins back to the first.
 *
 * The shape of a polygon, and of anything a straight-edged outline approximates — a tessellated
 * ellipse, the box a typeset symbol is measured at. Everything it answers comes from
 * {@link Geometry2d}: a closed ring of straight edges is exactly the case the base class computes
 * for, so there is nothing to override but the vertices and how they move.
 *
 * **`isFilled` is a real question, not a default.** It decides whether a point inside the outline,
 * touching no edge, counts as a hit — and with it, whether a selection box lying wholly within the
 * shape selects it. The test this replaces, `OBBOps.polygonOverlapsBox`, could not ask: it is "the
 * shape's bounds sit inside the query, or an edge crosses a side of it", both of which are about the
 * boundary, so a query strictly inside was always missed. That is right for an outline and wrong for
 * a filled shape, and only the caller knows which it has.
 */
declare class Polygon2d extends PointsGeometry2d {
    constructor(points: TPoint[], isFilled?: boolean, frameAngle?: number);
    /**
     * A polygon's vertices are its exact shape, so moving them is exact however the matrix turns or
     * scales — no approximation to carry forward. The frame goes with them, because the tight box
     * around a turned polygon is only tight in a frame that turned too.
     */
    transform(matrix: TMatrixTransform): Polygon2d;
}

/**
 * @group Core/Geometry
 * @summary An open run of vertices: a drawn path that does not close.
 *
 * The shape of a line, a polyline, and of an arc once tessellated. It is a {@link Polygon2d} minus
 * the closing edge, and that edge is the whole difference: without it the last vertex joins nothing,
 * so the path has a length rather than a perimeter and no inside for anything to be in.
 *
 * Caught by a query its *path* crosses — the generic test {@link Geometry2d} provides, which is the
 * right one for a line someone drew. A stroke looks the same and is not tested this way; see
 * {@link PointSet2d} for why.
 */
declare class Polyline2d extends PointsGeometry2d {
    constructor(points: TPoint[], padding?: number, frameAngle?: number);
    transform(matrix: TMatrixTransform): Polyline2d;
}

/**
 * @group Core/Geometry
 */
declare function convertBoundingBoxMillimeterToPixel(box?: TBox): TBox;

/**
 * Check if two numbers are valid and finite
 * @group Core/Geometry
 */
declare function areValidCoordinates(x: number, y: number): boolean;

/**
 * @group Core
 * @summary Convert a LaTeX math string into a flat UnicodeMath-compatible linear string
 * @param latex - LaTeX source, e.g. a JIIX math block label
 * @returns Plain text using unicode symbols/sub/superscripts, safe to paste into a Word equation field
 */
declare function latexToUnicodeMath(latex?: string): string;

/**
 * @group Core/Math
 */
declare const TWO_PI: number;
/**
 * @group Core/Math
 */
declare function convertRadianToDegree(radian: number): number;
/**
 * @group Core/Math
 */
declare function convertDegreeToRadian(degree: number): number;
/**
 * Calculate rotation angle for ellipse arc
 * @group Core/Math
 * @param angle - The angle in radians
 * @returns Normalized angle
 */
declare function normalizeAngle(angle: number): number;

/**
 * @group Core/Math
 */
declare function isBetween(val: number, min: number, max: number): boolean;
/**
 * @group Core/Math
 * @summary Round a value to the nearest multiple of a step
 * @param value - Value to round
 * @param step - Rounding step
 * @returns Value rounded to the nearest multiple of step
 */
declare function roundTo(value: number, step: number): number;
/**
 * @group Core/Math
 */
declare function computeAverage(arr: number[]): number;
/**
 * Check if a value is a valid number (not null, not undefined, not NaN, finite)
 * @group Core/Math
 * @param x - Value to check
 * @returns True if value is a valid number
 */
declare function isValidNumber(x: unknown): boolean;

/**
 * @group Core/Math
 * @summary Compute approximate average radius of an ellipse
 * @remarks Computes sqrt((radiusX^2 + radiusY^2) / 2) - a geometric average
 * used for ellipse perimeter and arc length approximations
 * @param radiusX - Horizontal radius
 * @param radiusY - Vertical radius
 * @returns Approximate average radius
 */
declare function computeEllipseRadiusAverage(radiusX: number, radiusY: number): number;
/**
 * @group Core/Math
 * @summary Target length of one segment when a curve is approximated by a polyline
 */
declare const TESSELLATION_SEGMENT_LENGTH: 10;
/**
 * @group Core/Math
 * @summary Compute how many vertices a curve of the given length should tessellate into
 * @param length - Arc/perimeter length to cover
 * @param minSegmentLength - Target length per segment (e.g. {@link TESSELLATION_SEGMENT_LENGTH})
 * @param minPoints - Floor on the returned count, regardless of how short `length` is
 */
declare function computeTessellationCount(length: number, minSegmentLength: number, minPoints?: number): number;

/**
 * @group Core/Math
 * @summary Millimeters in one CSS pixel (96 per inch)
 */
declare const PX_TO_MM_RATIO: number;
/**
 * @group Core/Math
 */
declare function convertMillimeterToPixel(mm: number): number;
/**
 * @group Core/Math
 */
declare function convertPixelToMillimeter(px: number): number;

/**
 * @group Client
 */
type TScheme = "https" | "http";
/**
 * @group Client
 * @remarks Signs `message` (the WebSocket HMAC challenge, or the HTTP request body) and resolves
 * the signature as a lowercase hex string, so the HMAC key stays on a server you own.
 * @see computeHmac for the algorithm the server must apply
 */
type THmacSigner = (message: string, applicationKey: string) => Promise<string>;
/**
 * @group Client
 */
type TServerHTTPConfiguration = {
    scheme: TScheme;
    host: string;
    applicationKey: string;
    /**
     * @remarks Puts the HMAC key in the browser, where anyone can read it: for development only.
     * In production, leave it empty and set `sign`.
     */
    hmacKey: string;
    /**
     * @remarks Signs on a server that holds the HMAC key. Takes precedence over `hmacKey`.
     */
    sign?: THmacSigner;
    version?: string;
};
/**
 * @group Client
 * @source
 */
declare const DefaultServerHTTPConfiguration: TServerHTTPConfiguration;
/**
 * @group Client
 */
type TServerWebsocketConfiguration = TServerHTTPConfiguration & {
    websocket: {
        pingEnabled: boolean;
        pingDelay: number;
        maxPingLostCount: number;
        /**
         * Reconnect automatically after a drop. `WebSocketClient` then queues the changes made while
         * disconnected and replays them in order, and lets requests wait for the reconnection; off,
         * both reject at once while disconnected.
         */
        autoReconnect: boolean;
        /** `WebSocketSSRClient` only: reconnection attempts per send. `WebSocketClient` uses `maxReconnectAttempts`. */
        maxRetryCount: number;
        fileChunkSize: number;
        /** Max number of changes queued while disconnected; further changes reject once reached. */
        offlineQueueMaxSize: number;
        /** Delay in ms between reconnection attempts while offline. */
        reconnectDelay: number;
        /** Give up reconnecting (and reject the queue) after this many failed attempts. */
        maxReconnectAttempts: number;
    };
};
/**
 * @group Client
 * @source
 */
declare const DefaultServerWebsocketConfiguration: TServerWebsocketConfiguration;
/**
 * The URL of a server endpoint, under `/api/v4.0/iink/`. For a websocket, `http`/`https` become
 * `ws`/`wss`. Query values are URI-encoded; `endpoint` is used as given.
 * @group Client
 */
declare function serverUrl(server: Pick<TServerHTTPConfiguration, "scheme" | "host">, endpoint: string, { websocket, query }?: {
    websocket?: boolean;
    query?: Record<string, string>;
}): string;
/**
 * Assert that server config has both scheme and host. Throws if either is missing.
 * @group Client
 */
declare function assertServerConfig(server: {
    scheme?: string;
    host?: string;
} | undefined, errorPrefix: string): asserts server is {
    scheme: string;
    host: string;
};
/**
 * Returns a copy of `config` with the server credentials replaced by `[REDACTED]`, so a
 * configuration can be logged without leaking the application and HMAC keys.
 * @group Client
 */
declare const redactServerSecrets: (config: unknown) => unknown;

/**
 * @group Client
 */
declare function getAvailableFontList(configuration: TPartialDeep<{
    server: TServerHTTPConfiguration;
    recognition: {
        lang: string;
    };
}>): Promise<Array<string>>;

/**
 * The error a recognition server reports in a non-2xx response body.
 * @group Client
 */
type TApiError = {
    code?: string;
    message: string;
};
/**
 * Builds a {@link TApiError} from a non-2xx HTTP response, JSON-parsing the body only when the
 * response actually declares a JSON content type. Calling `response.json()` unconditionally
 * throws a confusing `SyntaxError` on HTML error pages, plaintext, or empty bodies (e.g. a raw
 * 502/503 from a reverse proxy in front of the recognition server).
 * @group Client
 */
declare function parseApiError(response: Response): Promise<TApiError>;

/**
 * The writing instruments a stroke can be drawn with.
 * @group Styles
 */
type TPenNib = "ballpoint" | "pencil" | "fountain" | "brush";
/**
 * How one instrument turns a captured stroke into a thickness.
 * @group Styles
 */
type TNibProfile = {
    /** How sharply speed thins the line. `0` draws a line of constant width. */
    speed: number;
    /** Floor on the half-width multiplier, so a fast stroke never disappears. */
    min: number;
    /**
     * Ceiling on the half-width multiplier. Above `1` the stroke may draw *wider* than its nominal
     * width — which is what a loaded brush does, and what a nib that can only subtract cannot.
     */
    max: number;
    /** Canvas units over which each end ramps up, capped by `TAPER_SHARE` (a quarter of the stroke's length). `0` gives blunt ends. */
    taperLength: number;
    /** Multiplier at the very tip of a stroke. */
    taperMin: number;
    /** Whether a pen's own reported pressure overrides the estimate. */
    usePressure: boolean;
    /**
     * Edge angle of a broad-edge nib, in radians, held fixed as the hand moves.
     *
     * When set, width follows the angle between the direction of travel and this edge instead of
     * following speed: pulling across the edge lays down the full width, pulling along it lays down
     * almost nothing. That is what makes a stroke look written with a pen rather than drawn with a
     * tube, and it is a property of geometry alone — it needs no timing, so it survives a document
     * that carries none.
     */
    edgeAngle?: number;
    /** Width when travelling straight along the edge. Broad-edge nibs only. */
    edgeMin?: number;
    /**
     * How many pointers on either side the width is averaged over. A tuft of hair has inertia: it
     * takes some distance to spread and to recover, so its width must not track speed point by point.
     */
    smoothing?: number;
};
/**
 * @group Styles
 * @source
 */
declare const PEN_NIBS: Record<TPenNib, TNibProfile>;
/**
 * @group Styles
 */
declare const DEFAULT_PEN_NIB: TPenNib;
/**
 * Narrows a style value to a nib. A style is a loose bag of strings and numbers, so what it holds
 * under `pen` has to be checked rather than trusted — an unknown name falls back to the default.
 * @group Styles
 */
/**
 * Per-stroke adjustments to a nib's profile, read off the style the stroke was drawn with.
 *
 * A tuned value belongs to the stroke and not to the tool, for the same reason the nib does: change
 * the setting and what is already on the canvas must keep the look it was written with, so two
 * settings can be compared side by side.
 * @group Styles
 */
type TNibOverrides = Partial<TNibProfile>;
/**
 * Reads a stroke's nib adjustments out of its style.
 *
 * `penAngle` is in degrees, because that is what a person picks from a list; the profile holds
 * radians. Anything that is not a usable number is ignored rather than coerced — a style is a loose
 * bag of strings and numbers, and a missing key must leave the nib's own value in place.
 * @group Styles
 */
declare function readNibOverrides(style: Readonly<Record<string, unknown>>): TNibOverrides;
/**
 * @group Styles
 */
declare function isPenNib(value: unknown): value is TPenNib;
/**
 * The half-width multiplier to draw at each pointer, within the nib's own `[min, max]`.
 *
 * What decides the width depends on the instrument, in this order:
 * 1. a **broad edge**, when the nib has one — the angle between travel and the edge, which is what
 *    makes a stroke look written rather than extruded, and which needs no timing at all;
 * 2. the **pressure** a pen reported, when it reported one — a measurement beats an estimate;
 * 3. otherwise the pen's **speed**.
 *
 * Speed, and not the gap between consecutive points. The two agree only while the sampling rate
 * holds steady, and it does not: the browser coalesces samples under load, and the display path
 * decimates them. Deriving width from spacing made a stroke change thickness according to how busy
 * the main thread happened to be. Distance over elapsed time reads the same however densely the
 * stroke was sampled.
 * @group Styles
 */
declare function computeWidthProfile(pointers: readonly TPointer[], pointerType: string, nib?: TPenNib, overrides?: TNibOverrides): number[];
/**
 * The pointers to build a stroke's outline from: the captured geometry, with `p` replaced by the
 * width the renderer should draw there.
 *
 * `p` on a stored pointer is what the device measured and nothing else. The outline helpers read
 * `p` as a half-width multiplier, so the substitution happens here, once, on a copy — the document
 * never holds a rendering decision.
 * @group Styles
 */
declare function computeOutlinePointers(pointers: readonly TPointer[], pointerType: string, nib?: TPenNib, overrides?: TNibOverrides): TPointer[];

/**
 * @group Styles
 * @property {String} color=#000000 Color (supported formats rgb() rgba() hsl() hsla() #rgb #rgba #rrggbb #rrggbbaa)
 * @property {String} width in px
 * @property pen The instrument the stroke is drawn with — see {@link PEN_NIBS}. Part of the style, not of the
 * tool, so a document reopened later redraws each stroke with the nib it was written with rather
 * than with whatever nib happens to be selected.
 * @property penAngle Edge angle in degrees for a broad-edge nib; overrides the nib's own. See {@link PEN_NIBS}.
 * @property penSmoothing Overrides how many pointers the nib's width is averaged over.
 * @property penSpeed Overrides how sharply speed thins the line.
 */
type TStyle = {
    [key: string]: string | number | undefined;
    width: number;
    color: string;
    opacity?: number;
    fill?: string;
    pen?: TPenNib;
    penAngle?: number;
    penSmoothing?: number;
    penSpeed?: number;
};
/**
 * @group Styles
 * @source
 */
declare const DefaultStyle: TStyle;
/**
 * Merges a partial style onto {@link DefaultStyle} and coerces `width`/`opacity` to numbers —
 * every symbol type's `create()` did this identically before extraction.
 * @group Styles
 */
declare function mergeSymbolStyle(style?: TPartialDeep<TStyle>): TStyle;

/**
 * @group Styles
 * @property {String} -myscript-pen-width=1 Width of strokes and primitives in mm (no other unit is supported yet)
 * @property {String} -myscript-pen-fill-style=none
 * @property {String} -myscript-pen-fill-color=#FFFFFF00 Color filled inside the area delimited by strokes and primitives
 */
type TPenStyle = TPartialDeep<TStyle> & {
    "-myscript-pen-width"?: number;
    "-myscript-pen-fill-style"?: string;
    "-myscript-pen-fill-color"?: string;
};
/**
 * @group Styles
 * @source
 */
declare const DefaultPenStyle: TPenStyle;

/**
 * @group Styles
 */
type TThemeMath = {
    "font-family": string;
};
/**
 * @group Styles
 */
type TThemeMathSolved = {
    "font-family": string;
    color: string;
};
/**
 * @group Styles
 */
type TThemeText = {
    "font-family": string;
    "font-size": number;
};
/**
 * @group Styles
 */
type TTheme = {
    ink: TPenStyle;
    ".math": TThemeMath;
    ".math-solved": TThemeMathSolved;
    ".text": TThemeText;
    [key: string]: unknown;
};
/**
 * @group Styles
 * @source
 */
declare const DefaultTheme: TTheme;

/**
 * @group Styles
 */
declare class StyleManager {
    #private;
    constructor(penStyle?: TPartialDeep<TPenStyle>, theme?: TPartialDeep<TTheme>);
    get currentPenStyle(): TPenStyle;
    get penStyle(): TPenStyle;
    setPenStyle(style?: TPartialDeep<TPenStyle>): void;
    get theme(): TTheme;
    setTheme(theme?: TPartialDeep<TTheme>): void;
    get penStyleClasses(): string;
    setPenStyleClasses(penStyleClass?: string): void;
}

/**
 * Anchor point on a symbol, expressed as normalized 0-1 coordinates within the symbol's bounds.
 * (0,0) = top-left, (1,1) = bottom-right.
 * Stored as normalized values so the anchor remains valid when the target symbol moves or resizes.
 * @group Symbol
 */
type TAnchor = {
    symbolId: string;
    normalizedX: number;
    normalizedY: number;
    /** Intersection of the edge with the shape border, in world coordinates. */
    entryPoint?: {
        x: number;
        y: number;
    };
};
/**
 * Resolve a normalized anchor to an absolute TPoint given the target symbol's bounding box.
 * @group Symbol
 */
declare function resolveAnchorPoint(anchor: TAnchor, bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
}): {
    x: number;
    y: number;
};
/**
 * Compute normalized anchor coordinates from an absolute point and target bounds.
 * Result is clamped to [0, 1].
 * @group Symbol
 */
declare function computeNormalizedAnchor(point: {
    x: number;
    y: number;
}, bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
}): {
    normalizedX: number;
    normalizedY: number;
};
/**
 * Assign each candidate connection to whichever of an edge's own endpoints (start/end) is
 * nearest (by distance to the target box's center), then compute a normalized anchor point
 * for each assigned connection (nearest point on the target box's boundary to the edge's
 * endpoint). Used both pre-convert (targetId = jiixBlockId) and post-convert (targetId = real
 * symbol id) — the caller decides what targetId means.
 * @group Symbol
 */
declare function resolveConnectionAnchors(ownStart: TPoint, ownEnd: TPoint, connections: {
    targetId: string;
    box: TBox;
}[]): {
    startAnchor?: TAnchor;
    endAnchor?: TAnchor;
};

/**
 * @group Symbol
 */
declare enum EdgeKind {
    Line = "line",
    PolyEdge = "polyedge",
    Arc = "arc"
}
/**
 * How an edge's end is drawn, and how the recognizer reports it in JIIX.
 * @group Symbol
 */
declare enum EdgeDecoration {
    Arrow = "arrow-head"
}
/**
 * @group Symbol
 */
declare function computeEdgeBounds(vertices: TPoint[], style: TStyle, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration): TOBB;

/**
 * @group Symbol
 */
type TEdgeArc = TBaseSymbol & {
    type: SymbolType.Edge;
    kind: EdgeKind.Arc;
    style: TStyle;
    center: TPoint;
    startAngle: number;
    sweepAngle: number;
    radiusX: number;
    radiusY: number;
    phi: number;
    startDecoration?: EdgeDecoration;
    endDecoration?: EdgeDecoration;
    startAnchor?: TAnchor;
    endAnchor?: TAnchor;
};
/**
 * Recompute startAngle/sweepAngle so that the given end ("start" or "end") of the arc lands
 * on targetPoint, keeping center/radiusX/radiusY/phi and the OTHER endpoint's angle fixed.
 * @group Symbol
 */
declare function reprojectArcEndpoint(arc: Pick<TEdgeArc, "center" | "radiusX" | "radiusY" | "phi" | "startAngle" | "sweepAngle">, changingEnd: "start" | "end", targetPoint: TPoint): {
    startAngle: number;
    sweepAngle: number;
};
/**
 * Recompute center/radiusX/radiusY (and consequently startAngle/sweepAngle) so the arc's
 * midpoint tracks targetPoint as closely as possible, while keeping phi, the radiusX:radiusY
 * ratio, AND both endpoints' world positions exactly fixed.
 *
 * There is a 1-parameter family of (center, radius) pairs satisfying "fixed phi/ratio, both
 * endpoints on the ellipse" — eliminating the shared radius from the two "endpoint on ellipse"
 * equations collapses to a single LINEAR constraint on the ellipse's (unrotated-frame) center,
 * i.e. a line; every point on that line, paired with the radius it implies, is a valid family
 * member. This searches that line for the member whose midpoint is nearest targetPoint: an
 * exact match when targetPoint is reachable, the nearest reachable point otherwise — the same
 * search handles both cases without a separate fallback path.
 * @group Symbol
 */
declare function reprojectArcMidpoint(arc: Pick<TEdgeArc, "center" | "radiusX" | "radiusY" | "phi" | "startAngle" | "sweepAngle">, targetPoint: TPoint): {
    center: TPoint;
    radiusX: number;
    radiusY: number;
    startAngle: number;
    sweepAngle: number;
};
/**
 * Recompute center/radiusX/radiusY/startAngle/sweepAngle so the given end ("start" or "end")
 * of the arc lands exactly on targetPoint, keeping phi, the radiusX:radiusY ratio, AND the
 * OTHER endpoint's world position fixed — letting the ellipse stretch or shrink freely, unlike
 * reprojectArcEndpoint, which only slides the moved endpoint's ANGLE around the ellipse's
 * current, unchanged size.
 *
 * "Other endpoint" and "target" both on the ellipse leaves a 1-parameter family of (center,
 * radius) pairs — same family reprojectArcMidpoint searches — but here there's no third point
 * to search against, so the family is instead closed by requiring the center to stay equidistant
 * from both endpoints, i.e. on their perpendicular bisector. Intersecting that bisector with the
 * family's line is a direct closed-form solve, not a search.
 * @group Symbol
 */
declare function stretchArcEndpoint(arc: Pick<TEdgeArc, "center" | "radiusX" | "radiusY" | "phi" | "startAngle" | "sweepAngle">, changingEnd: "start" | "end", targetPoint: TPoint): {
    center: TPoint;
    radiusX: number;
    radiusY: number;
    startAngle: number;
    sweepAngle: number;
};

/**
 * @group Symbol
 */
type TEdgeLine = TBaseSymbol & {
    type: SymbolType.Edge;
    kind: EdgeKind.Line;
    style: TStyle;
    startDecoration?: EdgeDecoration;
    endDecoration?: EdgeDecoration;
    startAnchor?: TAnchor;
    endAnchor?: TAnchor;
    start: TPoint;
    end: TPoint;
};

/**
 * @group Symbol
 */
type TEdgePolyLine = TBaseSymbol & {
    type: SymbolType.Edge;
    kind: EdgeKind.PolyEdge;
    style: TStyle;
    startDecoration?: EdgeDecoration;
    endDecoration?: EdgeDecoration;
    startAnchor?: TAnchor;
    endAnchor?: TAnchor;
    points: TPoint[];
};

/**
 * @group Symbol
 */
type TEdge = TEdgeArc | TEdgeLine | TEdgePolyLine;

/**
 * @group Symbol
 */
declare enum ShapeKind {
    Circle = "circle",
    Ellipse = "ellipse",
    Polygon = "polygon",
    Table = "table"
}

/**
 * @group Symbol
 */
type TShapeCircle = TBaseSymbol & {
    type: SymbolType.Shape;
    kind: ShapeKind.Circle;
    style: TStyle;
    center: TPoint;
    radius: number;
};

/**
 * @group Symbol
 */
type TShapeEllipse = TBaseSymbol & {
    type: SymbolType.Shape;
    kind: ShapeKind.Ellipse;
    style: TStyle;
    center: TPoint;
    radiusX: number;
    radiusY: number;
    orientation: number;
};

/**
 * @group Symbol
 */
type TShapePolygon = TBaseSymbol & {
    type: SymbolType.Shape;
    kind: ShapeKind.Polygon;
    style: TStyle;
    points: TPoint[];
};

/**
 * @group Symbol
 */
type TShape = TShapeCircle | TShapeEllipse | TShapePolygon;

/**
 * @group Symbol
 */
type TStrokeCapture = {
    id: string;
    pointerType: string;
    pointers: TPointer[];
};
/**
 * @group Symbol
 */
type TStroke = TBaseSymbol & TStrokeCapture & {
    readonly type: SymbolType.Stroke;
    style: TStyle;
    jiixBlockId?: string;
    jiixBlockType?: "Text" | "Math" | "Node" | "Edge" | "Decorator";
    startAnchor?: TAnchor;
    endAnchor?: TAnchor;
    isSolverOutput?: boolean;
    decoratorKind?: DecoratorKind;
};
/**
 * A stroke as read from a document. Identical to a deep-partial {@link TStroke} except that its
 * pointers may still carry the absolute `t` written before pointers stored a delta — which is what
 * lets {@link StrokeUtil.createFromPartial} open a document saved by an earlier version.
 * @group Symbol
 */
type TStrokeImport = Omit<TPartialDeep<TStroke>, "pointers"> & {
    pointers?: (TPointerImport | undefined)[];
};
/**
 * @group Symbol
 * @summary Check if symbol is a stroke
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke
 */
declare function isStroke(symbol: TBaseSymbol): symbol is TStroke;
/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Math JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Math JIIX block type
 */
declare function isRecognizedMath(symbol: TBaseSymbol): symbol is TStroke;
/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Solver Output JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Solver Output JIIX block type
 */
declare function isStrokeSolverOutput(symbol: TBaseSymbol): symbol is TStroke;
/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Text JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Text JIIX block type
 */
declare function isRecognizedText(symbol: TBaseSymbol): symbol is TStroke;

/**
 * @group Symbol
 */
type TTypesetChild = {
    id: string;
    label: string;
    color: string;
    bounds: TBox;
    fontSize: number;
    fontWeight: "normal" | "bold";
};
/**
 * The quad a typeset symbol occupies on screen, **before** its matrix is applied —
 * `OBBOps.toUnrotatedBox`, not `OBBOps.toBox`, which would hand over an envelope already grown for
 * an angle and have `SymbolGeometry` grow it a second time. Turning a typeset symbol is composing
 * its matrix now, not recording an angle here, so this is always the axis-aligned box.
 *
 * @group Symbol
 */
declare function computeTypesetVertices(bounds: TBox): TPoint[];
/**
 * @group Symbol
 */
declare function computeTypesetSnapPoints(bounds: TBox, point: TPoint): TPoint[];
/**
 * @group Symbol
 */
declare function computeClosedEdges(vertices: TPoint[]): TSegment[];
/**
 * Whether a typeset symbol (its own `vertices`/`edges`, from {@link computeTypesetVertices}/
 * {@link computeClosedEdges}) overlaps `box` — either a vertex lands inside `box`, or one of its
 * edges crosses one of `box`'s sides.
 * @group Symbol
 */
declare function typesetOverlapsBox(vertices: TPoint[], edges: TSegment[], box: TBox): boolean;
/**
 * Filters `children` (Text chars / Math elements — anything shaped like {@link TTypesetChild})
 * to those whose bounds contain at least one of `points`.
 * @group Symbol
 */
declare function computeChildrenOverlaps<T extends TTypesetChild>(children: T[], points: TPoint[]): T[];

/**
 * @group Symbol
 * @remarks Individual math element (number, operator, variable, etc.)
 */
type TMathElement = TTypesetChild & {
    fontFamily: string;
    position?: "superscript" | "subscript" | "normal";
};
/**
 * @group Symbol
 * @remarks Represents a converted mathematical expression with native rendering
 */
type TMath = TBaseSymbol & {
    type: SymbolType.Math;
    style: TStyle;
    point: TPoint;
    elements: TMathElement[];
    decorators: TDecorator[];
    bounds: TOBB;
};
/**
 * @group Symbol
 * @summary Check if symbol is math
 * @param symbol - Symbol to check
 * @returns True if symbol is math
 */
declare function isMath(symbol: TBaseSymbol): symbol is TMath;

/**
 * @group Symbol
 */
type TSymbolChar = TTypesetChild;
/**
 * @group Symbol
 */
type TText = TBaseSymbol & {
    type: SymbolType.Text;
    style: TStyle;
    point: TPoint;
    chars: TSymbolChar[];
    decorators: TDecorator[];
    bounds: TOBB;
};
/**
 * @group Symbol
 * @summary Check if symbol is text
 * @param symbol - Symbol to check
 * @returns True if symbol is text
 */
declare function isText(symbol: TBaseSymbol): symbol is TText;

/**
 * @group Symbol
 */
declare enum SymbolType {
    Stroke = "stroke",
    Shape = "shape",
    Edge = "edge",
    Text = "text",
    Math = "math",
    Eraser = "eraser",
    Decorator = "decorator"
}
/**
 * A handle a symbol offers for vertex-level resizing, and which of its vertices the handle moves.
 *
 * The shape was written out inline in four places before IIC-2009.
 *
 * @group Symbol
 */
type TResizePoint = {
    point: TPoint;
    vertexIndex: number;
};
/**
 * @group Symbol
 */
type TBaseSymbol = {
    id: string;
    creationTime: number;
    modificationDate: number;
    type: string;
    style: TPartialDeep<TStyle>;
    /**
     * Where this symbol sits, relative to the coordinates it stores.
     *
     * A transform writes here and nowhere else: the raw coordinates are what the symbol was created
     * with and never move again. That is what lets the renderer apply a change by rewriting one
     * attribute instead of rebuilding the element, and what keeps undo exact — re-applying an inverse
     * matrix restores the value bit for bit, where re-transforming coordinates accumulated rounding.
     */
    transform: TMatrixTransform;
};
/**
 * @group Symbol
 */
type TSymbol = TEdge | TShape | TStroke | TText | TMath | TDecorator;

/**
 * @group Symbol
 */
declare enum DecoratorKind {
    Highlight = "highlight",
    Surround = "surround",
    Underline = "underline",
    Strikethrough = "strikethrough"
}
/**
 * Standalone decorator symbol that references the strokes or text it decorates.
 * When standalone (in model.symbols): `targetIds` holds the referenced stroke ids and
 * `targetBounds` the box to draw across. When embedded (in `TText.decorators[]`): `targetIds` is
 * empty and `targetBounds` unset — the parent symbol's bounds are used at render time.
 * @group Symbol
 */
type TDecorator = TBaseSymbol & {
    type: SymbolType.Decorator;
    style: TStyle;
    kind: DecoratorKind;
    targetIds: string[];
    /**
     * The box this decorator is drawn across — an **input**, not a derived value, which is why it
     * survived the removal of every computable field and why it is named for where it comes from.
     *
     * A decorator holds no coordinates of its own: it is placed over other symbols. Its box arrives
     * from outside, either as the recognizer's own word box (JIIX, which is not the union of the
     * strokes' boxes and cannot be recomputed from them) or as that union when JIIX has not answered
     * yet. `DecoratorUtil.getGeometry` therefore reads this field rather than deriving anything. It is
     * in the decorator's local frame: when its targets are transformed together the decorator takes
     * their matrix in `transform` and this box is left alone; only a partial move refits it — see
     * `IIAbstractTransformManager.updateDecoratorsForTargets`.
     *
     * Unset is the "no box of its own" case, and it is the only flag: the `hasBounds` boolean that
     * used to shadow a zero-size box is gone, so presence cannot disagree with itself.
     */
    targetBounds?: TOBB;
    baseline?: number;
    xHeight?: number;
};
/**
 * @group Symbol
 * @summary Check if symbol is a standalone decorator
 */
declare function isDecorator(symbol: TBaseSymbol): symbol is TDecorator;

/**
 * @group Symbol
 */
type TEraser = {
    id: string;
    type: SymbolType.Eraser;
    style: TStyle;
    pointers: TPointer[];
};
/**
 * @group Symbol
 */
declare const EraserOps: {
    create(width?: number): TEraser;
    getBounds(eraser: TEraser): TBox;
};

/**
 * @group Symbol
 * @summary Clone any TSymbol — all types are now plain objects, use structuredClone.
 */
declare function cloneSymbol(symbol: TSymbol): TSymbol;
/**
 * @group Symbol
 * @summary Filter the stroke symbols out of a list that may contain other symbol types (text, math, shapes, ...).
 */
declare function extractStrokes(symbols: TSymbol[] | undefined): TStroke[];

/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasShapeEllipseSymbol = TBaseSymbol & {
    centerPoint: TPoint;
    maxRadius: number;
    minRadius: number;
    orientation: number;
    startAngle: number;
    sweepAngle: number;
    beginDecoration?: string;
    endDecoration?: string;
    beginTangentAngle: number;
    endTangentAngle: number;
};
/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasShapeLineSymbol = TBaseSymbol & {
    firstPoint: TPoint;
    lastPoint: TPoint;
    beginDecoration?: string;
    endDecoration?: string;
    beginTangentAngle: number;
    endTangentAngle: number;
};
/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasShapeTableLineSymbol = {
    p1: TPoint;
    p2: TPoint;
};
/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasShapeTableSymbol = TBaseSymbol & {
    lines: TCanvasShapeTableLineSymbol[];
};
/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasUnderLineSymbol = TBaseSymbol & {
    data: {
        firstCharacter: number;
        lastCharacter: number;
    };
};
/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasTextSymbol = TBaseSymbol & {
    label: string;
    data: {
        topLeftPoint: TPoint;
        height: number;
        width: number;
        textHeight: number;
        justificationType: string;
    };
};
/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasTextUnderlineSymbol = TCanvasTextSymbol & {
    underlineList: TCanvasUnderLineSymbol[];
};

/**
 * @group Symbol
 * @deprecated Use {@link TStroke} from stroke/ for new code
 */
type TLegacyStroke = TBaseSymbol & TStrokeCapture & {
    style: TPenStyle;
};
/**
 * @group Symbol
 * @deprecated Use {@link TStroke} from stroke/ for new code
 */
declare class Stroke implements TLegacyStroke {
    type: SymbolType;
    id: string;
    creationTime: number;
    modificationDate: number;
    style: TPenStyle;
    pointerType: string;
    pointers: TPointer[];
    transform: TMatrixTransform;
    constructor(style: TPenStyle, pointerType?: string);
    clone(): Stroke;
}
/**
 * @group Symbol
 * @deprecated Use {@link StrokeUtil.createFromPartial} from stroke/ for new code
 */
declare function convertPartialStrokesToStrokes(json: TPartialDeep<TLegacyStroke>[]): Stroke[];

/**
 * Where a symbol sits relative to its neighbours, for {@link SymbolStore.changeOrder}.
 * @group Store
 */
type TSymbolOrder = "first" | "last" | "forward" | "backward";
/**
 * The document's records, keyed by id and kept in stacking order.
 *
 * Generic on purpose: the constraint is {@link TBaseSymbol} because that is the type carrying `id`,
 * so the same store serves the full `TSymbol` union and any narrower record set.
 *
 * The store hands out **the records themselves**, never copies. Callers read them; to change one,
 * ask for a draft and commit it back.
 * @group Store
 */
declare class SymbolStore<T extends TBaseSymbol> {
    #private;
    /**
     * Bumped by every change to the document. Lets a derived value — a cache, an index, an in-flight
     * export — tell whether what it was computed from is still current.
     */
    get version(): number;
    get size(): number;
    /** The records in stacking order. */
    list(): T[];
    /**
     * The records grouped by whatever keys `selector` claims for each of them, memoized against
     * {@link version} so a caller on a hot path can ask every frame and only pay when the document
     * actually changed.
     *
     * `selector` must be a stable reference — a module-level or field-held function, not an inline
     * closure — because it is the cache key. An inline arrow is a new key on every call and would
     * recompute every time, which is the cost this exists to remove.
     */
    listBy(selector: (record: T) => string[]): ReadonlyMap<string, T[]>;
    get(id: string): T | undefined;
    has(id: string): boolean;
    add(record: T): void;
    /**
     * Replaces the record stored under `record.id`. Unknown ids are ignored rather than inserted, so a
     * stale caller cannot resurrect a deleted symbol.
     */
    update(record: T, markDirty?: boolean): void;
    /**
     * A mutable copy of the committed record, yours to change until you {@link commit} it.
     *
     * The copy is what makes the contract honest: the stored record is handed to readers as-is, so
     * mutating it in place would change what every other reader sees, mid-frame and without a version
     * bump. Ask for a draft, change it, commit it.
     */
    draft(id: string): TDraft<T> | undefined;
    /** Stores a draft back under its own id, in the position the record already held. */
    commit(draft: TDraft<T>, markDirty?: boolean): void;
    /** Swaps one record for several, in the position the original held. */
    replace(id: string, records: T[]): void;
    remove(id: string): void;
    /**
     * Moves a record within the stacking order. A `Map` has no reordering primitive, so the entries are
     * rebuilt in the new order — which is also why order has to be maintained here rather than by a
     * caller splicing a list it was handed.
     */
    changeOrder(id: string, position: TSymbolOrder): void;
    clear(): void;
}

/**
 * @group Model
 */
declare class IIModel {
    #private;
    readonly creationTime: number;
    constructor(creationDate?: number);
    /**
     * Bumped on every mutation that invalidates `exports` (add/remove/update/replace/order/clear).
     * Lets an in-flight export request detect that the model changed while it was waiting
     * for a server response, so a now-stale response isn't cached as if it were current.
     */
    get version(): number;
    get modificationDate(): number;
    get exports(): TExport | undefined;
    /**
     * Bumped whenever the selection changes. `selectedIds` is a live `Set` whose identity never
     * changes, so a reader that caches per-selection work has no way to notice a mutation — and
     * building a key out of the ids costs a sort and a string over the whole selection, on every
     * `pointermove` of every drag. Compare this integer instead.
     */
    get selectionVersion(): number;
    /** The ids of the selected symbols. Change the selection through {@link selectSymbol} and friends. */
    get selectedIds(): ReadonlySet<string>;
    /** How many symbols the document holds, without building — and cloning — the list to count it. */
    get symbolCount(): number;
    /**
     * The document's symbols, in stacking order.
     *
     * These are the stored records themselves, not copies: the store freezes them at commit, so a
     * reader cannot corrupt the document by holding one. To change a symbol, ask for a
     * {@link draftSymbol} and commit it back.
     */
    get symbols(): TSymbol[];
    get symbolsSelected(): TSymbol[];
    /**
     * Get all Text blocks from JIIX export
     * @returns Array of Text elements from the JIIX export, or empty array if no export available
     */
    get textBlocks(): TJIIXTextElement[];
    /**
     * Get all Math blocks from JIIX export
     * @returns Array of Math elements from the JIIX export, or empty array if no export available
     */
    get mathBlocks(): TJIIXMathElement[];
    selectSymbol(id: string): void;
    unselectSymbol(id: string): void;
    resetSelection(): void;
    /**
     * The decorators claiming each target id, memoized against {@link version}.
     *
     * Transform paths need this per `pointermove`; scanning the document for it was a full pass — and,
     * before IIC-1968, a full deep clone — on every frame.
     */
    get decoratorsByTargetId(): ReadonlyMap<string, TSymbol[]>;
    getSymbol(id: string): TSymbol | undefined;
    /**
     * A mutable copy of a committed symbol, yours to change until you {@link commitSymbol} it.
     *
     * This is the replacement for the read-a-clone-then-mutate-it pattern: same cost, but the type
     * says which side of the commit boundary you are on, so IIC-1974 can freeze committed records
     * without every caller having to be re-read to find out whether it writes.
     */
    draftSymbol(id: string): TDraft<TSymbol> | undefined;
    /** Stores a draft back into the document, in the position the symbol already held. */
    commitSymbol(draft: TDraft<TSymbol>, markDirty?: boolean): void;
    addSymbol(symbol: TSymbol): void;
    updateSymbol(updatedSymbol: TSymbol, markDirty?: boolean): void;
    replaceSymbol(id: string, symbols: TSymbol[]): void;
    changeOrderSymbol(id: string, position: TSymbolOrder): void;
    removeSymbol(id: string): void;
    /**
     * Stamps the model as changed without going through a mutator.
     *
     * Its one caller mutates committed records in place and needs the change to be visible downstream.
     * That pattern is what IIC-1970 converts to draft-then-commit and IIC-1974 makes impossible, and
     * this method goes with it.
     */
    touch(): void;
    /**
     * Force `exports` to be considered stale (e.g. after a language change), without
     * going through a symbol mutation.
     */
    invalidateExports(): void;
    mergeExport(exports: TExport): void;
    clear(): void;
}

/**
 * @group Model
 */
declare class IModel {
    #private;
    readonly creationTime: number;
    modificationDate: number;
    currentStroke?: TStroke;
    strokes: TStroke[];
    exports?: TExportV2;
    converts?: TExportV2;
    width: number;
    height: number;
    rowHeight: number;
    constructor(width?: number, height?: number, rowHeight?: number, creationDate?: number);
    addStroke(stroke: TStroke): void;
    updateStroke(updatedStroke: TStroke): void;
    removeStroke(id: string): void;
    extractDifferenceStrokes(model: IModel): {
        added: TStroke[];
        removed: TStroke[];
    };
    mergeExport(exports: TExportV2): void;
    clone(): IModel;
    clear(): void;
}

/**
 * @group Model
 */
type TRecognitionPositions = {
    lastSentPosition: number;
    lastReceivedPosition: number;
};
/**
 * @group Model
 */
declare class Model {
    #private;
    readonly creationTime: number;
    modificationDate: number;
    positions: TRecognitionPositions;
    currentSymbol?: Stroke;
    symbols: Stroke[];
    exports?: TExport;
    converts?: TExport;
    width: number;
    height: number;
    rowHeight: number;
    constructor(width?: number, height?: number, rowHeight?: number, creationDate?: number);
    protected filterPointByAcquisitionDelta(stroke: Stroke, point: TPointer, lastPointer?: TPointer): boolean;
    getStrokeFromPoint(point: TPoint): Stroke[];
    addPoint(stroke: Stroke, pointer: TPointer): void;
    addStroke(stroke: Stroke): void;
    updateStroke(updatedStroke: Stroke): void;
    removeStroke(id: string): void;
    removeStrokesFromPoint(point: TPoint): string[];
    extractUnsentStrokes(): Stroke[];
    initCurrentStroke(point: TPointer, pointerType: string, style: TPenStyle, dpi?: number): void;
    appendToCurrentStroke(point: TPointer): void;
    endCurrentStroke(point: TPointer): void;
    updatePositionSent(position?: number): void;
    updatePositionReceived(): void;
    mergeExport(exports: TExport): void;
    mergeConvert(converts: TExport): void;
    clone(): Model;
    clear(): void;
}

/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#stroke-item | Stroke item}
 */
type TJIIXStrokeItem = {
    type: "stroke";
    id: string;
    "full-id"?: string;
    timestamp?: string;
    X?: number[];
    Y?: number[];
    F?: number[];
    T?: number[];
};
/**
 * @group Client/Export
 */
type TJIIXBase = {
    "bounding-box"?: TBox;
    items?: TJIIXStrokeItem[];
};
/**
 * @group Client/Export
 */
type TJIIXElementBase<T = string> = TJIIXBase & {
    id: string;
    type: T;
    /** IDs of child elements */
    children?: string[];
    /** Positions of children in the content */
    "children-pos"?: number[];
    /** ID of parent element */
    parent?: string;
};
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#word-object | Word object}
 */
type TJIIXWord = TJIIXBase & {
    id?: string;
    label: string;
    candidates?: string[];
    "first-char"?: number;
    "last-char"?: number;
    /** References to child elements (e.g., Math elements) */
    refs?: string[];
    /** Reflow label for mixed content */
    "reflow-label"?: string;
};
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#character-object | Character object}
 */
type TJIIXChar = TJIIXBase & {
    label: string;
    candidates?: string[];
    word: number;
    grid: TPoint[];
};
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#text-interpretation | Text Element }
 */
type TJIIXLine = {
    "baseline-y": number;
    "first-char"?: number;
    "last-char"?: number;
    "x-height": number;
    "bounding-box"?: TBox;
};

/**
 * @group Client/Export
 * @remarks Math element type in JIIX
 */
declare enum JIIXMathExpressionType {
    Number = "number",
    Variable = "variable",
    Symbol = "symbol",
    Group = "group",
    Fraction = "fraction",
    Superscript = "superscript",
    Subscript = "subscript",
    Subsuperscript = "subsuperscript",
    SquareRoot = "square root",
    Root = "root",
    Power = "power",
    Underoverscript = "underoverscript",
    Add = "+",
    Subtract = "-",
    Multiply = "\u00D7",
    Divide = "/",
    Equal = "=",
    NotEqual = "\u2260",
    LessThan = "<",
    GreaterThan = ">",
    LessThanOrEqual = "\u2264",
    GreaterThanOrEqual = "\u2265"
}
/**
 * @group Client/Export
 * @remarks Union type for all possible math expression type values (derived from JIIXMathExpressionType enum)
 */
type TJIIXMathExpressionTypeValue = JIIXMathExpressionType | string;
/**
 * @group Client/Export
 * @remarks Symbol in a math expression
 */
type TJIIXMathSymbol = {
    symbol: string;
    candidates?: string[];
};
/**
 * @group Client/Export
 * @remarks Base type for math expressions
 */
type TJIIXMathExpressionBase<T = TJIIXMathExpressionTypeValue> = TJIIXBase & {
    id: string;
    type: T;
};
/**
 * @group Client/Export
 * @remarks Number expression in math
 */
type TJIIXMathNumber = TJIIXMathExpressionBase<JIIXMathExpressionType.Number> & {
    label: string;
    value: number;
    symbols?: TJIIXMathSymbol[];
};
/**
 * @group Client/Export
 * @remarks Variable expression in math (e.g., x, y, z)
 */
type TJIIXMathVariable = TJIIXMathExpressionBase<JIIXMathExpressionType.Variable> & {
    label: string;
    value?: number | string;
};
/**
 * @group Client/Export
 * @remarks Symbol expression in math
 */
type TJIIXMathSymbolExpression = TJIIXMathExpressionBase<JIIXMathExpressionType.Symbol> & {
    label: string;
    symbols?: TJIIXMathSymbol[];
};
/**
 * @group Client/Export
 * @remarks Operator expression (binary or unary)
 */
type TJIIXMathOperator = TJIIXMathExpressionBase<string> & {
    symbols?: TJIIXMathSymbol[];
    operands?: TJIIXMathExpression[];
};
/**
 * @group Client/Export
 * @remarks Group expression
 */
type TJIIXMathGroup = TJIIXMathExpressionBase<JIIXMathExpressionType.Group> & {
    operands?: TJIIXMathExpression[];
};
/**
 * @group Client/Export
 * @remarks Fraction expression
 */
type TJIIXMathFraction = TJIIXMathExpressionBase<JIIXMathExpressionType.Fraction> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Client/Export
 * @remarks Superscript expression (exponent)
 */
type TJIIXMathSuperscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Superscript> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Client/Export
 * @remarks Subscript expression
 */
type TJIIXMathSubscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Subscript> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Client/Export
 * @remarks Subsuperscript expression (both subscript and superscript)
 */
type TJIIXMathSubsuperscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Subsuperscript> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Client/Export
 * @remarks Square root expression
 */
type TJIIXMathSquareRoot = TJIIXMathExpressionBase<JIIXMathExpressionType.SquareRoot> & {
    label?: string;
    operands?: [TJIIXMathExpression];
};
/**
 * @group Client/Export
 * @remarks Root expression (nth root)
 */
type TJIIXMathRoot = TJIIXMathExpressionBase<JIIXMathExpressionType.Root> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Client/Export
 * @remarks Power expression (exponentiation)
 */
type TJIIXMathPower = TJIIXMathExpressionBase<JIIXMathExpressionType.Power> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Client/Export
 * @remarks Underoverscript expression (e.g., integrals with bounds)
 */
type TJIIXMathUnderoverscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Underoverscript> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Client/Export
 * @remarks Union type for all math expressions
 */
type TJIIXMathExpression = TJIIXMathNumber | TJIIXMathVariable | TJIIXMathSymbolExpression | TJIIXMathOperator | TJIIXMathGroup | TJIIXMathFraction | TJIIXMathSuperscript | TJIIXMathSubscript | TJIIXMathSubsuperscript | TJIIXMathSquareRoot | TJIIXMathRoot | TJIIXMathPower | TJIIXMathUnderoverscript;
/**
 * @group Client/Export
 * @remarks Math element that can be embedded in text or standalone
 */
type TJIIXMathElement = TJIIXElementBase<JIIXElementType.Math> & {
    id: string;
    "bounding-box"?: TBox;
    label?: string;
    expressions?: TJIIXMathExpression[];
};

/**
 * @group Client/Export
 * @remarks List all supported MIME types for export. Please note, the MIME types supported depend on the recognition type configured
 */
declare enum ExportType {
    JIIX = "application/vnd.myscript.jiix",
    TEXT = "text/plain",
    LATEX = "application/x-latex",
    MATHML = "application/mathml+xml",
    SVG = "image/svg+xml",
    OFFICE_DOCUMENT = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
}
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/  Element type}
 */
declare enum JIIXElementType {
    Text = "Text",
    Math = "Math",
    Node = "Node",
    Edge = "Edge",
    RawContent = "Raw Content"
}
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#diagram-item-blocks | Element node kind}
 */
declare enum JIIXNodeKind {
    Circle = "circle",
    Ellipse = "ellipse",
    Rectangle = "rectangle",
    Triangle = "triangle",
    Parallelogram = "parallelogram",
    Polygon = "polygon",
    Rhombus = "rhombus"
}
/**
 * @group Client/Export
 */
declare enum JIIXEdgeKind {
    Line = "line",
    PolyEdge = "polyedge",
    Arc = "arc"
}
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#text-interpretation | Text Element }
 */
type TJIIXTextElement = TJIIXElementBase<JIIXElementType.Text> & {
    id: string;
    "bounding-box"?: TBox;
    label: string;
    words?: TJIIXWord[];
    chars?: TJIIXChar[];
    lines?: TJIIXLine[];
};
/**
 * @group Client/Export
 */
type TJIIXNodeElementBase<K = string> = TJIIXElementBase<JIIXElementType.Node> & {
    id: string;
    kind: K;
};
/**
 * @group Client/Export
 */
type TJIIXNodeCircle = TJIIXNodeElementBase<JIIXNodeKind.Circle> & {
    id: string;
    cx: number;
    cy: number;
    r: number;
};
/**
 * @group Client/Export
 */
type TJIIXNodeEllipse = TJIIXNodeElementBase<JIIXNodeKind.Ellipse> & {
    id: string;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    orientation: number;
};
/**
 * @group Client/Export
 */
type TJIIXNodeRectangle = TJIIXNodeElementBase<JIIXNodeKind.Rectangle> & {
    id: string;
    height: number;
    width: number;
    x: number;
    y: number;
};
/**
 * @group Client/Export
 */
type TJIIXNodeTriangle = TJIIXNodeElementBase<JIIXNodeKind.Triangle> & {
    id: string;
    points: number[];
};
/**
 * @group Client/Export
 */
type TJIIXNodeParallelogram = TJIIXNodeElementBase<JIIXNodeKind.Parallelogram> & {
    id: string;
    points: number[];
};
/**
 * @group Client/Export
 */
type TJIIXNodePolygon = TJIIXNodeElementBase<JIIXNodeKind.Polygon> & {
    id: string;
    points: number[];
};
/**
 * @group Client/Export
 */
type TJIIXNodeRhombus = TJIIXNodeElementBase<JIIXNodeKind.Rhombus> & {
    id: string;
    points: number[];
};
/**
 * @group Client/Export
 */
type TJIIXNodeElement = TJIIXNodeCircle | TJIIXNodeEllipse | TJIIXNodeRectangle | TJIIXNodeTriangle | TJIIXNodeParallelogram | TJIIXNodePolygon | TJIIXNodeRhombus;
/**
 * @group Client/Export
 */
type TJIIXEdgeElementBase<K = string> = TJIIXElementBase<JIIXElementType.Edge> & {
    kind: K;
    /**
     * @remarks IDs of the Node elements this edge connects, in `ports` order. Populated by the
     * server for diagrams with more than one shape; empty for a standalone edge with nothing to
     * connect to.
     */
    connected?: string[];
    /**
     * @remarks Port index on each connected node, parallel to `connected`
     */
    ports?: number[];
};
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#line-item | Element line}
 */
type TJIIXEdgeLine = TJIIXEdgeElementBase<JIIXEdgeKind.Line> & {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    p1Decoration?: EdgeDecoration;
    p2Decoration?: EdgeDecoration;
};
/**
 * @group Client/Export
 */
type TJIIXEdgePolyEdge = TJIIXEdgeElementBase<JIIXEdgeKind.PolyEdge> & {
    edges: TJIIXEdgeLine[];
};
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#arc-item | Element arc}
 */
type TJIIXEdgeArc = TJIIXEdgeElementBase<JIIXEdgeKind.Arc> & {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    phi: number;
    startAngle: number;
    sweepAngle: number;
    startDecoration?: EdgeDecoration;
    endDecoration?: EdgeDecoration;
};
/**
 * @group Client/Export
 */
type TJIIXEdgeElement = TJIIXEdgeLine | TJIIXEdgePolyEdge | TJIIXEdgeArc;
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/ | Exports}
 */
type TJIIXElement = TJIIXTextElement | TJIIXMathElement | TJIIXNodeElement | TJIIXEdgeElement;
/**
 * @group Client/Export
 */
type TJIIXExport = {
    type: string;
    id: string;
    "bounding-box"?: TBox;
    version: string;
    elements?: TJIIXElement[];
    label?: string;
    words?: TJIIXWord[];
    chars?: TJIIXChar[];
};
/**
 * @group Client/Export
 * @remarks
 * List all supported MIME types for export.
 *
 * Attention the MIME types supported depend on the {@link TRecognitionTypeV1 | type of recognition}
 *
 * {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/ | Documentation}
 */
type TExport = {
    /** @hidden */
    [key: string]: unknown;
    /**
     * @remarks vnd.myscript.jiix is used for text and raw-content exports
     */
    "application/vnd.myscript.jiix"?: TJIIXExport;
    /**
     * @remarks text/plain is only use for text export
     */
    "text/plain"?: string;
    /**
     * @remarks x-latex is only use for math export
     * @see {@link https://katex.org/docs/browser.html | katex} to render
     */
    "application/x-latex"?: string;
    /**
     * @remarks mathml+xml is only use for math export
     * @see {@link https://www.w3.org/Math/whatIsMathML.html | Mathematical Markup Language}
     */
    "application/mathml+xml"?: string;
    /**
     * @remarks svg+xml is only use for diagram export
     */
    "image/svg+xml"?: string;
    /**
     * @remarks vnd.openxmlformats-officedocument.presentationml.presentation is only use for diagram export
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob | Blob}
     */
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"?: Blob;
};
/**
 * @group Client/Export
 * @summary Exports as the websocket protocols send them: every format a string, JIIX included
 * @remarks {@link parseExportedJIIX} turns it into a {@link TExport}.
 */
type TExportWire = {
    [mimeType: string]: string | undefined;
};
/**
 * @group Client
 * @summary Reads the exports of a websocket message, parsing the JIIX sent as a JSON string
 */
declare function parseExportedJIIX(exports: TExportWire): TExport;

/**
 * @group Client
 */
type TConvertionConfiguration = {
    force?: {
        "on-stylesheet-change": boolean;
    };
};
/**
 * @group Client
 * @source
 */
declare const DefaultConvertionConfiguration: TConvertionConfiguration;

/**
 * @group Client
 */
type TEraserConfiguration = {
    "erase-precisely": boolean;
};
/**
 * @group Client
 * @source
 */
declare const DefaultEraserConfiguration: TEraserConfiguration;

/**
 * @group Client
 */
type TMarginConfiguration = {
    bottom: number;
    left: number;
    right: number;
    top: number;
};
/**
 * @group Client
 * @source
 */
declare const DefaultMarginConfiguration: TMarginConfiguration;

/**
 * @group Client
 */
type TTextGuidesConfiguration = {
    enable: boolean;
};
/**
 * @group Client
 * @source
 */
declare const DefaultTextGuidesConfiguration: TTextGuidesConfiguration;
/**
 * @group Client
 */
type TTextConfConfiguration = {
    customResources?: string[];
    customLexicon?: string[];
    addLKText?: boolean;
};
/**
 * @group Client
 */
type TTextConfiguration = {
    text?: boolean;
    mimeTypes: ("text/plain" | "application/vnd.myscript.jiix")[];
    margin: TMarginConfiguration;
    guides?: TTextGuidesConfiguration;
    configuration?: TTextConfConfiguration;
    eraser?: TEraserConfiguration;
};
/**
 * @group Client
 * @source
 */
declare const DefaultTextConfiguration: TTextConfiguration;

/**
 * @group Client
 */
type TDiagramConvertConfiguration = {
    types?: ("text" | "shape")[];
    "match-text-size"?: boolean;
};
/**
 * @group Client
 */
type TDiagramConfiguration = {
    mimeTypes: ("application/vnd.myscript.jiix" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "image/svg+xml")[];
    "enable-sub-blocks"?: boolean;
    text?: TTextConfConfiguration;
    convert?: TDiagramConvertConfiguration;
    "session-time"?: number;
    eraser?: TEraserConfiguration;
};
/**
 * @group Client
 * @source
 */
declare const DefaultDiagramConvertConfiguration: TDiagramConvertConfiguration;
/**
 * @group Client
 * @source
 */
declare const DefaultDiagramConfiguration: TDiagramConfiguration;

/**
 * @group Client
 */
type TImageViewportConfiguration = {
    x: number;
    y: number;
    width: number;
    height: number;
};
/**
 * @group Client
 */
type TImageConfiguration = {
    guides: boolean;
    viewport: TImageViewportConfiguration;
};
/**
 * @group Client
 */
type TJiixConfiguration = {
    "bounding-box": boolean;
    strokes: boolean;
    ids: boolean;
    "full-stroke-ids": boolean;
    text: {
        chars: boolean;
        words: boolean;
        lines?: boolean;
    };
    style?: boolean;
};
/**
 * @group Client
 * @source
 */
declare const DefaultJiixConfiguration: TJiixConfiguration;
/**
 * @group Client
 */
type TMathMLFlavor = {
    name: string;
};
/**
 * @group Client
 */
type TMathMLExport = {
    flavor: TMathMLFlavor;
};
/**
 * @group Client
 */
type TExportConfiguration = {
    "image-resolution"?: number;
    image?: TImageConfiguration;
    jiix: TJiixConfiguration;
    mathml?: TMathMLExport;
};
/**
 * @group Client
 * @source
 */
declare const DefaultExportConfiguration: TExportConfiguration;

/**
 * @group Client
 */
type TRoundingMode = "half up" | "truncate";
/**
 * @group Client
 */
type TAngleUnit = "deg" | "rad";
/**
 * @group Client
 */
type TSolverOptions = "algebraic" | "numeric";
/**
 * @group Client
 */
type TScopingPolicy = "closest" | "last-modified" | "last-edited";
/**
 * @group Client
 */
type TAutoVariableManagement = {
    enable?: boolean;
    "scoping-policy"?: TScopingPolicy;
};
/**
 * @group Client
 */
type TSolverConfiguration = {
    enable?: boolean;
    "fractional-part-digits"?: number;
    "decimal-separator"?: string;
    "rounding-mode"?: TRoundingMode;
    "angle-unit"?: TAngleUnit;
    options?: TSolverOptions;
};
/**
 * @group Client
 * @source
 */
declare const DefaultSolverConfiguration: TSolverConfiguration;
/**
 * @group Client
 */
type TUndoRedoMode = "stroke" | "session";
/**
 * @group Client
 */
type TMathUndoRedoConfiguration = {
    mode: TUndoRedoMode;
};
/**
 * @group Client
 * @source
 */
declare const DefaultMathUndoRedoConfiguration: TMathUndoRedoConfiguration;
/**
 * @group Client
 */
type TMathConfiguration = {
    mimeTypes: ("application/x-latex" | "application/mathml+xml" | "application/vnd.myscript.jiix")[];
    solver?: TSolverConfiguration;
    margin: TMarginConfiguration;
    "undo-redo"?: TMathUndoRedoConfiguration;
    customGrammar?: string;
    customGrammarId?: string;
    customGrammarContent?: string;
    eraser?: TEraserConfiguration;
    "session-time"?: number;
    "recognition-timeout"?: number;
};
/**
 * @group Client
 * @source
 */
declare const DefaultMathConfiguration: TMathConfiguration;

/**
 * @group Client
 * @source
 */
declare const DefaultMathV2Configuration: TMathConfiguration;

/**
 * @group Client
 */
type TRawContentConfiguration = {
    text?: TTextConfConfiguration;
    "session-time"?: number;
    recognition: {
        types: ("text" | "shape" | "math" | "decoration")[];
    };
    classification: {
        types: ("text" | "shape" | "math" | "decoration" | "drawing")[];
    };
    eraser?: TEraserConfiguration;
};
/**
 * @group Client
 * @source
 */
declare const DefaultRawContentConfiguration: TRawContentConfiguration;

/**
 * @group Client
 * @source
 */
declare const DefaultRawContentV2Configuration: TRawContentConfiguration;

/**
 * @group Client
 */
type TRecognitionRendererDebugConfiguration = {
    "draw-text-boxes": boolean;
    "draw-image-boxes": boolean;
};
/**
 * @group Client
 * @source
 */
declare const DefaultDebugConfiguration: TRecognitionRendererDebugConfiguration;
/**
 * @group Client
 */
type TRecognitionRendererConfiguration = {
    debug: TRecognitionRendererDebugConfiguration;
};
/**
 * @group Client
 * @source
 */
declare const DefaultRecognitionRendererConfiguration: TRecognitionRendererConfiguration;

/**
 * @group Client
 */
type TShapeConvertConfiguration = {
    types?: "shape"[];
    "match-text-size"?: boolean;
};
/**
 * @group Client
 */
type TShapeBeautificationConfiguration = {
    enable?: true;
};
/**
 * @group Client
 */
type TShapeConfiguration = {
    mimeTypes: ("application/vnd.myscript.jiix" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "image/svg+xml")[];
    "enable-sub-blocks"?: boolean;
    convert?: TShapeConvertConfiguration;
    "session-time"?: number;
    eraser?: TEraserConfiguration;
    beautification?: TShapeBeautificationConfiguration;
};
/**
 * @group Client
 * @source
 */
declare const DefaultShapeConvertConfiguration: TShapeConvertConfiguration;
/**
 * @group Client
 * @source
 */
declare const DefaultShapeBeautificationConfiguration: TShapeBeautificationConfiguration;
/**
 * @group Client
 * @source
 */
declare const DefaultShapeConfiguration: TShapeConfiguration;

/**
 * @group Client
 */
type TTextGuidesConfigurationV2 = {
    enable: boolean;
    "line-gap-mm"?: number;
    "origin-y-mm"?: number;
};
/**
 * @group Client
 * @source
 */
declare const DefaultTextGuidesConfigurationV2: TTextGuidesConfigurationV2;
/**
 * @group Client
 */
type TTextHTTPClientV2ConfConfiguration = {
    customResources?: string[];
    customLexicon?: string[];
    addLKText?: boolean;
};
/**
 * @group Client
 */
type TTextHTTPClientV2Configuration = {
    text?: boolean;
    mimeTypes: ("text/plain" | "application/vnd.myscript.jiix")[];
    margin: TMarginConfiguration;
    guides: TTextGuidesConfigurationV2;
    configuration?: TTextHTTPClientV2ConfConfiguration;
    eraser?: TEraserConfiguration;
};
/**
 * @group Client
 * @source
 */
declare const DefaultTexConfigurationV2: TTextHTTPClientV2Configuration;

/**
 * @group Client
 */
type TRecognitionTypeBase = "TEXT" | "MATH" | "Raw Content";
/**
 * @group Client
 */
type TRecognitionTypeV1 = TRecognitionTypeBase | "DIAGRAM";
/**
 * @group Client
 */
type TRecognitionTypeV2 = TRecognitionTypeBase | "SHAPE";
/**
 * @group Client
 */
type TConverstionState = "DIGITAL_EDIT" | "HANDWRITING";

/**
 * The stroke shapes the recognition protocol deals in, and the one conversion between them.
 *
 * Both types are declared here rather than imported from the symbol layer on purpose: the client is
 * meant to be usable on its own, so it owns the shape of what it sends. TypeScript is structural, so
 * a `TStroke` from the symbol layer satisfies {@link TRecognitionStroke} with no import in either
 * direction and no conversion at the call site.
 */

/**
 * One captured point of a stroke. `x` and `y` are required; `t` and `p` are not, so a caller that
 * builds strokes itself — a custom renderer, an importer — can hand over geometry alone.
 * @group Client
 */
type TRecognitionPointer = {
    x: number;
    y: number;
    /**
     * Capture time in milliseconds, counted from the start of the stroke this pointer belongs to —
     * so the first pointer of a stroke sits at 0. {@link toWireStroke} adds the stroke's
     * `creationTime` back on, because the wire carries absolute instants.
     *
     * **Recognition quality depends on it.** The recognizer uses the interval between points to tell
     * a deliberate stroke from a fast one, to segment characters and to resolve ambiguous shapes.
     * Leave it out and recognition still runs, but on geometry alone — expect measurably worse
     * results, especially on cursive text and on shapes drawn in several passes. Supply it whenever
     * the capture source has it, even approximately.
     */
    dt?: number;
    /** Pen pressure, 0 to 1. Affects stroke width when rendered; recognition tolerates its absence. */
    p?: number;
};
/**
 * What a caller hands the recognizer: an identified sequence of captured pointers, and nothing else.
 * Style, bounds and derived geometry are the document's business, not the server's.
 * @group Client
 */
type TRecognitionStroke = {
    id: string;
    pointerType: string;
    pointers: TRecognitionPointer[];
    /**
     * Epoch instant the stroke began — the origin its pointers' {@link TRecognitionPointer.dt} count
     * from, and what {@link toWireStroke} adds back to reach the absolute times the wire carries.
     *
     * The recognizer reads the order strokes were written in from those absolute times, and uses it
     * for gesture detection. Omit it and the stroke's points still carry the right intervals among
     * themselves, but the stroke as a whole loses its place against the others.
     */
    creationTime?: number;
    /**
     * The stroke's affine transform, if any. Baked into absolute coordinates by {@link toWireStroke}
     * before the pointers reach the wire — the server only ever deals in absolute geometry.
     *
     * Optional so a caller with no notion of a transform — building a `TRecognitionStroke` by hand
     * rather than handing over a `TStroke` from the symbol layer — can omit it; absent is identity.
     */
    transform?: TMatrixTransform;
};
/**
 * What actually goes on the wire: the same pointers transposed into one array per component, which
 * is the form the recognition API expects.
 *
 * Timing goes either as `t` (absolute instants) or, for a server that reads it, as `t0` (the first
 * pointer's absolute instant) plus `dt` (each pointer's offset from it), which is shorter.
 * The timing and `p` are absent when the stroke did not carry them — see {@link toWireStroke} for why
 * they are omitted whole rather than padded.
 * @group Client
 */
type TWireStroke = {
    id: string;
    pointerType: string;
    x: number[];
    y: number[];
    p?: number[];
    t?: number[];
    t0?: number;
    dt?: number[];
};
/**
 * @group Client
 */
type TWireStrokeOptions = {
    /** Send `t0` + `dt` instead of `t`; see {@link supportsRelativeTimestamps} */
    relativeTimestamps?: boolean;
};
/**
 * Whether a server of this version reads `t0` + `dt`. An unknown version answers no: `t` is the form
 * every server reads.
 * @group Client
 */
declare function supportsRelativeTimestamps(serverVersion: string | undefined): boolean;
/**
 * Transposes a stroke's pointers into the protocol's column arrays.
 *
 * The output shape is part of the wire contract — every key, and the order pointers appear in each
 * array, is what the server parses. It is asserted against a literal in
 * `test/unit/client/shared/StrokeSerializer.test.ts` so it cannot drift with a refactor.
 *
 * `t` and `p` are all-or-nothing: an array is emitted only if **every** pointer supplies that value.
 * The server reads each pointer by taking the same index across the arrays, so a partially filled
 * one would misalign with `x`/`y` and silently corrupt the stroke; and padding a gap with a made-up
 * timestamp is worse than sending none, because the recognizer would treat the invention as capture
 * data. A stroke where only some points are timed is a caller bug, and dropping the column is the
 * only reading of it that cannot mislead the server.
 *
 * With `relativeTimestamps`, the same instants go as `t0` + `dt`, rounded to whole milliseconds:
 * the server reads both as integers.
 * @group Client
 */
declare function toWireStroke(stroke: TRecognitionStroke, options?: TWireStrokeOptions): TWireStroke;

/**
 * @group Client
 */
type TRecognitionHTTPV1Configuration = {
    type: TRecognitionTypeV1;
    lang: string;
    math: TMathConfiguration;
    text: TTextConfiguration;
    diagram: TDiagramConfiguration;
    "raw-content": TRawContentConfiguration;
    renderer: TRecognitionRendererConfiguration;
    export: TExportConfiguration;
    convert?: TConvertionConfiguration;
};
/**
 * @group Client
 * @source
 */
declare const DefaulRecognitionHTTPV1ConfigurationConfiguration: TRecognitionHTTPV1Configuration;
/**
 * @group Client
 */
type THTTPClientV1Configuration = {
    server: TServerHTTPConfiguration;
    recognition: TRecognitionHTTPV1Configuration;
};
/**
 * @group Client
 */
declare const DefaultHTTPClientV1Configuration: THTTPClientV1Configuration;
/**
 * @group Client
 * @source
 */
declare class HTTPClientV1Configuration implements THTTPClientV1Configuration {
    recognition: TRecognitionHTTPV1Configuration;
    server: TServerHTTPConfiguration;
    constructor(configuration?: TPartialDeep<THTTPClientV1Configuration>);
}

/**
 * @group Client
 * @deprecated Use {@link TStroke} from stroke/ for new code
 */
type TStrokeGroup = {
    penStyle: TPenStyle;
    strokes: Stroke[];
};
/**
 * @group Client
 * @deprecated Use {@link TStroke} with {@link HTTPClientV2}
 */
type TStrokeGroupToSend = {
    penStyle?: string;
    strokes: TWireStroke[];
};
/**
 * @group Client
 * @deprecated Use {@link HTTPClientV2} instead.
 */
type THTTPClientV1PostConfiguration = {
    lang: string;
    diagram?: TDiagramConfiguration;
    math?: TMathConfiguration;
    "raw-content"?: TRawContentConfiguration;
    text?: TTextConfiguration;
    export: TExportConfiguration;
};
/**
 * @group Client
 */
type THTTPClientV1PostData = {
    configuration: THTTPClientV1PostConfiguration;
    xDPI: number;
    yDPI: number;
    contentType: string;
    conversionState?: TConverstionState;
    height: number;
    width: number;
    strokeGroups: TStrokeGroupToSend[];
};
/**
 * @deprecated Use {@link HTTPClientV2} instead.
 * @group Client
 */
declare class HTTPClientV1 {
    protected logger: Logger;
    configuration: HTTPClientV1Configuration;
    constructor(config: TPartialDeep<THTTPClientV1Configuration>);
    get url(): string;
    get postConfig(): THTTPClientV1PostConfiguration;
    protected buildData(model: Model): THTTPClientV1PostData;
    protected post(data: unknown, mimeType: string): Promise<unknown>;
    protected tryFetch(data: THTTPClientV1PostData, mimeType: string): Promise<TExport>;
    protected getMimeTypes(requestedMimeTypes?: string[]): string[];
    convert(model: Model, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<Model>;
    export(model: Model, requestedMimeTypes?: string[]): Promise<Model>;
    resize(model: Model): Promise<Model>;
}

/**
 * @group Client/Export
 * @remarks List all supported MIME types for export in ClientsV2. Please note, the MIME types supported depend on the recognition type configured
 */
declare enum ExportV2Type {
    JIIX = "application/vnd.myscript.jiix",
    TEXT = "text/plain",
    LATEX = "application/x-latex"
}
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/  Element type}
 */
/**
 * @group Client/Export
 */
type TJIIXV2RangeItem = {
    from: {
        stroke: number;
    };
    to: {
        stroke: number;
    };
};
/**
 * @group Client/Export
 * @remarks Only in InkCanvas () activated with recognition.export.JIIXV2.range = true
 */
type TJIIXV2Range = TJIIXV2RangeItem[];
/**
 * @group Client/Export
 */
type TJIIXV2Base = TJIIXBase & {
    range?: TJIIXV2Range;
};
/**
 * @group Client/Export
 */
type TJIIXV2ElementBase<T = TRecognitionTypeV2> = TJIIXV2Base & {
    id: string;
    type: T;
};
/**
 * @group Client/Export
 */
type TJIIXV2LineSpan = {
    type: string;
    range: TJIIXV2RangeItem[];
    label: string;
};
/**
 * @group Client/Export
 */
type TJIIXV2Line = {
    type: string;
    range: TJIIXV2RangeItem[];
    label: string;
    spans: TJIIXV2LineSpan[];
};
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#word-object | Word object}
 */
type TJIIXV2Expression = TJIIXV2Base & TJIIXWord & {
    lines: TJIIXV2Line[];
};
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#text-interpretation | Text Element }
 */
type TJIIXV2TextElement = TJIIXV2ElementBase<"Text"> & TJIIXV2Expression;
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#text-interpretation | Math Element }
 */
type TJIIXV2MathElement = TJIIXV2ElementBase<"Math"> & TJIIXV2Expression;
/** @group Client/Export
 */
type TJIIXV2DrawingElement = TJIIXV2ElementBase<"Drawing"> & TJIIXV2Expression;
/**
 * @group Client/Export
 */
declare enum JIIXV2ShapeKind {
    Circle = "circle",
    Ellipse = "ellipse",
    Rectangle = "rectangle",
    Triangle = "triangle",
    IsoscelesTriangle = "isosceles triangle",
    RightTriangle = "right triangle",
    RightIsoscelesTriangle = "right isosceles triangle",
    EquilateralTriangle = "equilateral triangle",
    Quadrilateral = "quadrilateral",
    Trapezoid = "trapezoid",
    Square = "square",
    Parallelogram = "parallelogram",
    Polygon = "polygon",
    Rhombus = "rhombus",
    Line = "line",
    ArcOfEllipse = "arc of ellipse",
    ArcOfCircle = "arc of circle",
    PolyLine = "polyline",
    Arrow = "arrow",
    CurvedDoubleArrow = "curved double arrow",
    CurvedArrow = "curved arrow",
    PolylineArrow = "polyline arrow",
    PolylineDoubleArrow = "polyline double arrow",
    DoubleArrow = "double arrow"
}
/**
 * @group Client/Export
 */
type TJIIXV2PolygonType = "triangle" | "isosceles triangle" | "right triangle" | "right isosceles triangle" | "equilateral triangle" | "quadrilateral" | "trapezoid" | "parallelogram" | "rhombus" | "rectangle" | "square";
/**
 * @group Client/Export
 */
type TJIIXV2ShapeItemBase<K = JIIXV2ShapeKind> = TJIIXV2ElementBase<K> & {
    kind: K;
};
/**
 * @group Client/Export
 */
type TJIIXV2EllipseBase<K = JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle> = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle> & {
    kind: K;
    id: string;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    orientation: number;
    type: string;
};
/**
 * @group Client/Export
 */
type TJIIXV2Circle = TJIIXV2EllipseBase<JIIXV2ShapeKind.Circle>;
/**
 * @group Client/Export
 */
type TJIIXV2Ellipse = TJIIXV2EllipseBase<JIIXV2ShapeKind.Ellipse>;
/**
 * @group Client/Export
 */
type TJIIXV2PrimitiveArc = {
    type: "arc";
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    phi: number;
    startAngle: number;
    sweepAngle: number;
    startDecoration?: string;
    endDecoration?: string;
};
/**
 * @group Client/Export
 */
type TJIIXV2PrimitiveLine = {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    startDecoration?: string;
    endDecoration?: string;
};
/**
 * @group Client/Export
 */
type TJIIXV2PolygonBase<K = TJIIXV2PolygonType> = TJIIXV2ShapeItemBase<K> & {
    kind: K;
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygon = TJIIXV2PolygonBase<JIIXV2ShapeKind.Polygon>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygonTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.Triangle>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygonIsoscelesTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.IsoscelesTriangle>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygonRightTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.RightTriangle>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygonRightIsoscelesTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.RightIsoscelesTriangle>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygonEquilateralTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.EquilateralTriangle>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygonQuadrilateral = TJIIXV2PolygonBase<JIIXV2ShapeKind.Quadrilateral>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygonTrapezoid = TJIIXV2PolygonBase<JIIXV2ShapeKind.Trapezoid>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygonParallelogram = TJIIXV2PolygonBase<JIIXV2ShapeKind.Parallelogram>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygonRhombus = TJIIXV2PolygonBase<JIIXV2ShapeKind.Rhombus>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygonRectangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.Rectangle>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapePolygonSquare = TJIIXV2PolygonBase<JIIXV2ShapeKind.Square>;
/**
 * @group Client/Export
 */
type TJIIXV2ShapeLine = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.Line> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Client/Export
 */
type TJIIXV2ShapeLineArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.Arrow> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Client/Export
 */
type TJIIXV2ShapeLineDoubleArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.DoubleArrow> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Client/Export
 */
type TJIIXV2ShapeLinePolyline = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.PolyLine> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Client/Export
 */
type TJIIXV2ShapeLinePolylineArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineArrow> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Client/Export
 */
type TJIIXV2ShapeLinePolylineDoubleArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineDoubleArrow> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Client/Export
 */
type TJIIXV2ShapeCurvedDoubleArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedDoubleArrow> & {
    primitives: TJIIXV2PrimitiveArc[];
};
/**
 * @group Client/Export
 */
type TJIIXV2ShapeCurvedArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedArrow> & {
    primitives: TJIIXV2PrimitiveArc[];
};
/**
 * @group Client/Export
 */
type TJIIXV2ShapeArcOfEllipse = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfEllipse> & {
    primitives: TJIIXV2PrimitiveArc[];
};
/**
 * @group Client/Export
 */
type TJIIXV2ShapeArcOfCircle = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfCircle> & {
    primitives: TJIIXV2PrimitiveArc[];
};
/**
 * @group Client/Export
 */
type TJIIXV2ShapeElement = TJIIXV2Circle | TJIIXV2Ellipse | TJIIXV2ShapePolygon | TJIIXV2ShapePolygonTriangle | TJIIXV2ShapePolygonIsoscelesTriangle | TJIIXV2ShapePolygonRightTriangle | TJIIXV2ShapePolygonRightIsoscelesTriangle | TJIIXV2ShapePolygonEquilateralTriangle | TJIIXV2ShapePolygonQuadrilateral | TJIIXV2ShapePolygonTrapezoid | TJIIXV2ShapePolygonParallelogram | TJIIXV2ShapePolygonRhombus | TJIIXV2ShapePolygonRectangle | TJIIXV2ShapePolygonSquare | TJIIXV2ShapeLineArrow | TJIIXV2ShapeLineDoubleArrow | TJIIXV2ShapeLinePolyline | TJIIXV2ShapeLinePolylineArrow | TJIIXV2ShapeLinePolylineDoubleArrow | TJIIXV2ShapeCurvedDoubleArrow | TJIIXV2ShapeCurvedArrow | TJIIXV2ShapeArcOfEllipse | TJIIXV2ShapeArcOfCircle | TJIIXV2ShapeLine;
/**
 * @group Client/Export
 * @remarks Only in InkCanvas () activated with recognition.export.JIIXV2.range = true
 */
type TJIIXV2RawContentBase<T = TRecognitionTypeV2> = {
    type: T;
    range?: TJIIXV2Range;
};
/**
 * @group Client/Export
 */
type TJIIXV2RawContentItemText = TJIIXV2RawContentBase<"Text"> & TJIIXV2Expression;
/**
 * @group Client/Export
 */
type TJIIXV2RawContentTextLine = {
    type: "Line";
    label: string;
    range?: TJIIXV2RangeItem;
};
/**
 * @group Client/Export
 */
type TJIIXV2RawContentShape = TJIIXV2RawContentBase<"Shape"> & {
    label: string;
    shape: TJIIXV2RawContentItemShape[];
};
/**
 * @group Client/Export
 */
type TJIIXV2RawContentItemShape = TJIIXV2RawContentBase<"Shape"> & {
    range: TJIIXV2RangeItem[];
    elements: TJIIXV2ShapeElement[];
};
/**
 * @group Client/Export
 */
type TJIIXV2RawContentElement = TJIIXV2RawContentItemText | TJIIXV2RawContentItemShape;
/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/ | Exports}
 */
type TJIIXV2Element = TJIIXV2TextElement | TJIIXV2ShapeElement | TJIIXV2MathElement | TJIIXV2DrawingElement | TJIIXV2RawContentElement;
/**
 * @group Client/Export
 */
type TJIIXV2Export = TJIIXV2Base & {
    type: string;
    id: string;
    version: string;
    elements?: TJIIXV2Element[];
    label?: string;
    words?: TJIIXV2Expression[];
};
/**
 * @group Client/Export
 * @remarks
 * List all supported MIME types for export.
 *
 * Attention the MIME types supported depend on the {@link TRecognitionTypeV1 | type of recognition}
 *
 * {@link https://developer.myscript.com/docs/cloud/latest/interactivity-integration/import-and-export-formats/ | Documentation}
 */
type TExportV2 = {
    /** @hidden */
    [key: string]: unknown;
    /**
     * @remarks vnd.myscript.jiix is used for text and raw-content exports
     */
    "application/vnd.myscript.jiix"?: TJIIXV2Export;
    /**
     * @remarks text/plain is only use for text export
     */
    "text/plain"?: string;
    /**
     * @remarks x-latex is only use for math export
     * @see {@link https://katex.org/docs/browser.html | katex} to render
     */
    "application/x-latex"?: string;
};

/**
 * @group Client
 */
type THTTPClientV2RecognitionConfiguration = {
    type: TRecognitionTypeV2;
    lang: string;
    math: TMathConfiguration;
    text: TTextHTTPClientV2Configuration;
    shape: TShapeConfiguration;
    "raw-content": TRawContentConfiguration;
    export: TExportConfiguration;
    convert?: TConvertionConfiguration;
};
/**
 * @group Client
 * @source
 */
declare const DefaultHTTPClientV2RecognitionConfiguration: THTTPClientV2RecognitionConfiguration;
/**
 * @group Client
 */
type THTTPClientV2Configuration = {
    server: TServerHTTPConfiguration;
    recognition: THTTPClientV2RecognitionConfiguration;
};
/**
 * @group Client
 */
declare const DefaultHTTPClientV2Configuration: THTTPClientV2Configuration;
/**
 * @group Client
 * @source
 */
declare class HTTPClientV2Configuration implements THTTPClientV2Configuration {
    recognition: THTTPClientV2RecognitionConfiguration;
    server: TServerHTTPConfiguration;
    constructor(configuration?: TPartialDeep<THTTPClientV2Configuration>);
}

/**
 * @group Client
 */
type THTTPClientV2PostConfiguration = {
    lang: string;
    diagram?: TDiagramConfiguration;
    math?: TMathConfiguration;
    "raw-content"?: TRawContentConfiguration;
    text?: TTextConfiguration;
    export: TExportConfiguration;
};
/**
 * @group Client
 */
type THTTPClientV2PostData = {
    scaleX: number;
    scaleY: number;
    configuration: THTTPClientV2PostConfiguration;
    contentType: string;
    strokes: TWireStroke[];
};
/**
 * @group Client
 */
declare class HTTPClientV2 {
    protected logger: Logger;
    configuration: HTTPClientV2Configuration;
    constructor(config: TPartialDeep<THTTPClientV2Configuration>);
    get url(): string;
    get postConfig(): THTTPClientV2PostConfiguration;
    protected buildData(strokes: TRecognitionStroke[]): THTTPClientV2PostData;
    protected post(data: unknown, mimeType: string): Promise<unknown>;
    protected tryFetch(data: THTTPClientV2PostData, mimeType: string): Promise<TExportV2>;
    protected getMimeTypes(requestedMimeTypes?: string[]): string[];
    send(strokes: TRecognitionStroke[], requestedMimeTypes?: string[]): Promise<TExportV2>;
}

/**
 * @group Client
 */
type THTTPRecognitionRequest = {
    url: string;
    server: TServerHTTPConfiguration;
    /** Value of the `Accept` header */
    accept: string;
    data: unknown;
};
/**
 * @group Client
 * @summary The `contentType` a recognition request names for a recognition type: `"TEXT"` → `"Text"`, `"Raw Content"` as is
 */
declare function toRecognitionContentType(recognitionType: string): string;
/**
 * @group Client
 * @summary Reads a recognition response body according to its content type
 */
declare function parseRecognitionResponse(response: Response): Promise<unknown>;
/**
 * @group Client
 * @summary Posts a recognition request and reads its response
 * @remarks `data` is serialized once: the HMAC signs exactly the body sent. Adapt the configuration it holds to the server version before calling.
 * @throws the API error (`{ code, message }`) of a non-2xx response; see {@link toRecognitionError}
 */
declare function postRecognition({ url, server, accept, data }: THTTPRecognitionRequest): Promise<unknown>;
/**
 * @group Client
 * @summary Turns what a failed {@link postRecognition} threw into the error reported to the caller
 * @remarks An error without code never reached the server (network, CORS): it reads as a connection failure.
 */
declare function toRecognitionError(error: unknown): Error;

/**
 * Extract an edge JIIX element's own start/end points (in pixels), regardless of
 * whether the edge has been converted to a vector symbol yet. Used to resolve which
 * connected shape binds to which end of the edge, both at sync time and at convert time.
 * @group Client/Export
 */
declare function extractEdgeEndpoints(edge: TJIIXEdgeElement): {
    start: TPoint;
    end: TPoint;
} | undefined;

/**
 * @group Client
 */
declare function getAvailableLanguageList(configuration: TPartialDeep<{
    server: TServerHTTPConfiguration;
}>): Promise<{
    result: {
        [key: string]: string;
    };
}>;

/**
 * @group Client
 * @remarks List all errors generated by the backend with their descriptions
 */
declare enum ClientError {
    NO_ACTIVITY = "Session closed due to no activity. Without a connection on your part, it will be permanently lost after an hour.",
    WRONG_CREDENTIALS = "Application credentials are invalid. Please check or regenerate your application key and hmackey.",
    TOO_OLD = "Session is too old. Max Session Duration Reached.",
    NO_SESSION_FOUND = "No sessions found. Without activation for 1 hour, sessions are deleted from the server. To avoid losing your work, use the json export, then import it this will create a new session.",
    UNKNOWN = "An unknown error has occurred.",
    ABNORMAL_CLOSURE = "MyScript recognition server is not reachable.",
    CANT_ESTABLISH = "Unable to establish a connection to MyScript recognition server. Check the host and your connectivity.",
    GOING_AWAY = "MyScript recognition server is going away, either because of a server failure or because the browser is navigating away from the page that opened the connection.",
    PROTOCOL_ERROR = "MyScript recognition server terminated the connection due to a protocol error.",
    UNSUPPORTED_DATA = "MyScript recognition server terminated the connection because the endpoint received data of a type it cannot accept. (For example, a text-only endpoint received binary data.)",
    INVALID_FRAME_PAYLOAD = "MyScript recognition server terminated the connection because a message was received that contained inconsistent data (e.g., non-UTF-8 data within a text message).",
    POLICY_VIOLATION = "MyScript recognition server terminated the connection because it received a message that violates its policy.",
    MESSAGE_TOO_BIG = "MyScript recognition server terminated the connection because a data frame was received that is too large.",
    INTERNAL_ERROR = "MyScript recognition server terminated the connection because it encountered an unexpected condition that prevented it from fulfilling the request.",
    SERVICE_RESTART = "MyScript recognition server terminated the connection because it is restarting.",
    TRY_AGAIN = "MyScript recognition server terminated the connection due to a temporary condition, e.g. it is overloaded and is casting off some of its clients.",
    BAD_GATEWAY = "MyScript recognition server was acting as a gateway or proxy and received an invalid response from the upstream server.",
    TLS_HANDSHAKE = "MyScript recognition server connection was closed due to a failure to perform a TLS handshake"
}
/**
 * @group Client
 * @summary Message for an error code the server sends, `undefined` when it has none of its own
 */
declare function mapErrorCodeToMessage(code: string | number | undefined): ClientError | undefined;
/**
 * @group Client
 */
declare function mapCloseCodeToMessage(code: number): string | null;

/**
 * @group History
 */
type THistoryConfiguration = {
    maxStackSize: number;
};
/**
 * @group History
 * @source
 */
declare const DefaultHistoryConfiguration: THistoryConfiguration;

/**
 * @group History
 */
type THistoryContext = {
    canUndo: boolean;
    canRedo: boolean;
    empty: boolean;
    stackIndex: number;
    /** @remarks number of steps currently available to undo. For local canvas variants this equals `stackIndex`; for the SSR canvas variant it is populated from the backend `contentChanged` message instead, since the server is the source of truth for the undo stack. */
    possibleUndoCount: number;
};
/**
 * @group History
 */
declare const getInitialHistoryContext: () => THistoryContext;

/**
 * @group History
 * @remarks the only part of the canvas events the history uses; `CanvasEvent` satisfies it.
 */
type THistoryEvent = {
    emitChanged(context: THistoryContext): void;
};
/**
 * @group History
 * @remarks shared stack/context bookkeeping for HistoryManager, IHistoryManager and IIHistoryManager,
 * which only differ in the shape of the stack item and of the recorded changes.
 */
declare abstract class AbstractHistoryStack<TStackItem> {
    protected logger: Logger;
    configuration: THistoryConfiguration;
    event: THistoryEvent;
    context: THistoryContext;
    stack: TStackItem[];
    constructor(configuration: THistoryConfiguration, event: THistoryEvent);
    protected abstract isStackItemEmpty(item: TStackItem): boolean;
    protected updateContext(): void;
    protected initStack(item: TStackItem): void;
    protected pushToStack(item: TStackItem): void;
    protected moveStackIndex(delta: 1 | -1, allowed: boolean): void;
    pop(): void;
    clear(): void;
}

/**
 * @group History
 * @remarks shared push/undo/redo for history managers whose stack item IS the changes
 * record itself (no stored model snapshot). Subclasses only implement isChangesEmpty and
 * reverseChanges; everything else (stack bookkeeping, empty/canUndo/canRedo context) comes
 * from AbstractHistoryStack.
 */
declare abstract class AbstractDiffHistoryManager<TChanges> extends AbstractHistoryStack<TChanges> {
    protected isStackItemEmpty(item: TChanges): boolean;
    protected abstract isChangesEmpty(changes: TChanges): boolean;
    protected abstract reverseChanges(changes: TChanges): TChanges;
    push(changes: TChanges): void;
    undo(): TChanges;
    redo(): TChanges;
}

/**
 * @group History
 */
declare class HistoryManager extends AbstractHistoryStack<Model> {
    protected isStackItemEmpty(item: Model): boolean;
    push(model: Model): void;
    updateStack(model: Model): void;
    undo(): Model;
    redo(): Model;
}

/**
 * @group History
 */
type TIHistoryChanges = {
    added?: TStroke[];
    removed?: TStroke[];
};
/**
 * @group History
 */
declare class IHistoryManager extends AbstractDiffHistoryManager<TIHistoryChanges> {
    protected isChangesEmpty(changes: TIHistoryChanges): boolean;
    init(): void;
    protected reverseChanges(changes: TIHistoryChanges): TIHistoryChanges;
}

/**
 * A math variable's value before and after one step. `undefined` means the variable had no value.
 *
 * Keyed by the block's strokes, not by its `jiixBlockId`: the backend names blocks, and a block
 * whose strokes are erased then restored by undo/redo comes back under a new name. No stroke means
 * a global variable.
 *
 * @group History
 */
type TIIHistoryVariableChange = {
    strokeIds: string[];
    name: string;
    before?: number;
    after?: number;
};
/**
 * @group History
 */
type TIIHistoryChanges = {
    /**
     * Values set on the backend, which keeps them nowhere in the document: without this, undoing a
     * block away and redoing it back lost the value it had been given.
     */
    variables?: TIIHistoryVariableChange[];
    added?: TSymbol[];
    /**
     * A before/after pair, and the only way a change to an existing symbol is recorded.
     *
     * `matrix`/`translate`/`rotate`/`scale` and `style` used to sit alongside this, each describing a
     * change by its parameters — a delta, an angle, a colour — so undo could re-derive the old state
     * by applying an inverse. None is needed any more: a transform writes to `symbol.transform` and a
     * restyle to `symbol.style`, both part of the record, so the record *is* the state. Restoring it
     * is exact by construction, where inverting a parameter was arithmetic that could drift — and,
     * for a scale's `1 / scaleX`, could be `Infinity` or ignore the origin it was taken about.
     *
     * A list of pairs, not two parallel lists: `{ oldSymbols, newSymbols }` let the two fall out of
     * step, and a length mismatch silently paired the wrong symbols together on undo. Here the
     * pairing is the type.
     *
     * `before`/`after` rather than `old`/`new`: `new` reads as the operator wherever it appears, and
     * these two words are the ones the rest of this code already uses for a snapshot and its result.
     *
     * Several sources can contribute to a single undoable step — a transform records both the symbols
     * dragged and the connected edges recomputed from them — so append with {@link appendUpdated}
     * rather than assigning.
     */
    updated?: {
        before: TSymbol;
        after: TSymbol;
    }[];
    erased?: TSymbol[];
    replaced?: {
        oldSymbols: TSymbol[];
        newSymbols: TSymbol[];
    };
    order?: {
        symbols: TSymbol[];
        position: "first" | "last" | "forward" | "backward";
    };
};
/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
type TIIHistoryBackendChanges = {
    added?: TStroke[];
    erased?: TStroke[];
    replaced?: {
        oldStrokes: TStroke[];
        newStrokes: TStroke[];
    };
};
/**
 * Appends before/after pairs to `changes.updated`, creating the list if absent.
 *
 * Appending rather than assigning, because one undoable step can gather symbols from more than one
 * source: a transform records the symbols that were dragged *and* the connected edges recomputed
 * from their new position. Assigning `changes.updated` twice dropped the first set silently, which
 * is the mistake this exists to make impossible.
 *
 * @group History
 */
declare function appendUpdated(changes: TIIHistoryChanges, pairs: {
    before: TSymbol;
    after: TSymbol;
}[]): void;
/**
 * @group History
 * @remarks converts symbol-level history changes into the stroke-level format the backend
 * understands, so undo/redo can be replayed as a fallback list of explicit modifications.
 */
declare function extractIIBackendChanges(changes: TIIHistoryChanges): TIIHistoryBackendChanges;
/**
 * @group History
 */
declare class IIHistoryManager extends AbstractDiffHistoryManager<TIIHistoryChanges> {
    #private;
    protected isStackItemEmpty(): boolean;
    protected isChangesEmpty(changes: TIIHistoryChanges): boolean;
    init(model: IIModel): void;
    protected reverseChanges(changes: TIIHistoryChanges): TIIHistoryChanges;
}

/**
 * @group Client
 * @summary List all authorized gestures
 */
type TGestureType = "UNDERLINE" | "SCRATCH" | "JOIN" | "INSERT" | "STRIKETHROUGH" | "SURROUND";
/**
 * @group Client
 * @remarks
 *  when gestureType = "INSERT", subStrokes represent the two parts
 *  when gestureType = "SCRATCH", subStrokes represent the part to substract at the stroke corresponding fullStrokeId
 */
type TGesture = {
    gestureType: TGestureType;
    gestureStrokeId: string;
    strokeIds: string[];
    strokeBeforeIds: string[];
    strokeAfterIds: string[];
    subStrokes?: {
        fullStrokeId: string;
        x: number[];
        y: number[];
    }[];
};
/**
 * @group Client
 */
declare enum TWebSocketClientMessageType {
    HMAC_Challenge = "hmacChallenge",
    Authenticated = "authenticated",
    SessionDescription = "sessionDescription",
    NewPart = "newPart",
    PartChanged = "partChanged",
    ConfigurationChanged = "configurationChanged",
    ContentChanged = "contentChanged",
    Idle = "idle",
    Pong = "pong",
    Exported = "exported",
    GestureDetected = "gestureDetected",
    ContextlessGesture = "contextlessGesture",
    MathSolverResult = "mathSolverResult",
    Error = "error",
    Ack = "ack"
}
/**
 * @group Client
 */
type TWebSocketClientMessage<T = string> = {
    type: T;
    [key: string]: unknown;
};
/**
 * @group Client
 */
type TWebSocketClientMessageAuthenticated = TWebSocketClientMessage<TWebSocketClientMessageType.Authenticated>;
/**
 * @group Client
 */
type TWebSocketClientMessageHMACChallenge = TWebSocketClientMessage<TWebSocketClientMessageType.HMAC_Challenge> & {
    hmacChallenge: string;
    iinkSessionId: string;
};
/**
 * @group Client
 */
type TInteractiveInkSessionDescriptionMessage = TWebSocketClientMessage<TWebSocketClientMessageType.SessionDescription> & {
    contentPartCount: number;
    iinkSessionId: string;
};
/**
 * @group Client
 */
type TWebSocketClientMessageNewPart = TWebSocketClientMessage<TWebSocketClientMessageType.NewPart> & {
    id: string;
    idx: null;
};
/**
 * @group Client
 */
type TWebSocketClientMessagePartChange = TWebSocketClientMessage<TWebSocketClientMessageType.PartChanged> & {
    partIdx: number;
    partId: string;
    partCount: number;
};
/**
 * @group Client
 */
type TWebSocketClientMessageContentChange = TWebSocketClientMessage<TWebSocketClientMessageType.ContentChanged> & {
    partId: string;
    canUndo: boolean;
    canRedo: boolean;
    empty: boolean;
    undoStackIndex: number;
    possibleUndoCount: number;
};
/**
 * @group Client
 */
type TWebSocketClientMessageExport = TWebSocketClientMessage<TWebSocketClientMessageType.Exported> & {
    partId: string;
    exports: TExportWire;
};
/**
 * @group Client
 */
type TWebSocketClientMessageGesture = TWebSocketClientMessage<TWebSocketClientMessageType.GestureDetected> & TGesture;
/**
 * @group Client
 */
type TWebSocketClientConfigurationChanged = TWebSocketClientMessage<TWebSocketClientMessageType.ConfigurationChanged>;
/**
 * @group Client
 */
type TWebSocketClientMessageContextlessGesture = TWebSocketClientMessage<TWebSocketClientMessageType.ContextlessGesture> & {
    gestureType: "none" | "scratch" | "left-right" | "right-left" | "bottom-top" | "top-bottom" | "surround";
    strokeId: string;
};
/**
 * @group Client
 */
type TWebSocketClientMessagePong = TWebSocketClientMessage<TWebSocketClientMessageType.Pong>;
/**
 * @group Client
 */
type TWebSocketClientMessageIdle = TWebSocketClientMessage<TWebSocketClientMessageType.Idle>;
/**
 * @group Client
 */
type TWebSocketConfigurationCHanged = TWebSocketClientMessage<TWebSocketClientMessageType.ConfigurationChanged>;
/**
 * @group Client
 */
type TMathVariable = {
    name: string;
    value?: number;
    sourceType?: "UNDEFINED" | "API" | "API_GLOBAL" | "BLOCK" | "PREDEFINED";
    sourceId?: string;
    occurrenceCount?: number;
};
/**
 * @group Client
 */
type TMathEvaluable = {
    inputName: string;
    outputName: string;
};
/**
 * @group Client
 */
type TMathVariableDefinition = {
    name: string;
    value: number;
};
/**
 * @group Client
 */
type TMathVariableDefinitionInfo = {
    value: number;
    sourceType: "UNDEFINED" | "API" | "API_GLOBAL" | "BLOCK" | "PREDEFINED";
    blockId: string;
};
/**
 * @group Client
 */
type TMathVariableDefinitions = {
    name: string;
    definitions: TMathVariableDefinitionInfo[];
};
/**
 * @group Client
 * @summary `result` of a math solver message, by `action`
 * @remarks Every action of {@link TWebSocketClientMessageMathSolverResult} comes from this map: adding an entry adds the message.
 */
type TMathSolverResultMap = {
    "available-actions": string[];
    "get-diagnostic": string;
    "numerical-computation": string;
    "get-variables": TMathVariable[];
    "set-variable-value": undefined;
    "get-variable-value": number;
    "get-evaluables": TMathEvaluable[];
    "remove-variable-value": undefined;
    "as-variable-definition": TMathVariableDefinition;
    "get-variable-definitions": TMathVariableDefinitions[];
    evaluate: number[][];
};
/**
 * @group Client
 */
type TMathSolverAction = keyof TMathSolverResultMap;
/**
 * @group Client
 * @summary Math solver message for one action
 * @remarks `result` is optional when the action answers nothing; `get-variable-definitions` is not tied to a block, so it has no `blockId`.
 */
type TWebSocketClientMessageMathSolver<A extends TMathSolverAction> = TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    action: A;
} & (undefined extends TMathSolverResultMap[A] ? {
    result?: TMathSolverResultMap[A];
} : {
    result: TMathSolverResultMap[A];
}) & (A extends "get-variable-definitions" ? unknown : {
    blockId: string;
});
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverAvailableActions = TWebSocketClientMessageMathSolver<"available-actions">;
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverGetDiagnostic = TWebSocketClientMessageMathSolver<"get-diagnostic">;
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverNumericalComputation = TWebSocketClientMessageMathSolver<"numerical-computation">;
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverGetVariables = TWebSocketClientMessageMathSolver<"get-variables">;
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverSetVariableValue = TWebSocketClientMessageMathSolver<"set-variable-value">;
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverGetVariableValue = TWebSocketClientMessageMathSolver<"get-variable-value">;
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverGetEvaluables = TWebSocketClientMessageMathSolver<"get-evaluables">;
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverEvaluate = TWebSocketClientMessageMathSolver<"evaluate">;
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverRemoveVariableValue = TWebSocketClientMessageMathSolver<"remove-variable-value">;
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverAsVariableDefinition = TWebSocketClientMessageMathSolver<"as-variable-definition">;
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverGetVariableDefinitions = TWebSocketClientMessageMathSolver<"get-variable-definitions">;
/**
 * @group Client
 */
type TWebSocketClientMessageMathSolverResult = {
    [A in TMathSolverAction]: TWebSocketClientMessageMathSolver<A>;
}[TMathSolverAction];
/**
 * @group Client
 */
type TWebSocketClientMessageError = TWebSocketClientMessage<TWebSocketClientMessageType.Error> & {
    code?: number | string;
    message?: string;
    data?: {
        code: number | string;
        message: string;
    };
};
/**
 * @group Client
 */
type TWebSocketClientMessageAck = TWebSocketClientMessage<TWebSocketClientMessageType.Ack>;
/**
 * @group Client
 * @summary Message the server sends, by {@link TWebSocketClientMessageType}
 * @remarks Every member of the enum needs an entry: {@link TWebSocketClientMessageReceived} indexes this map with the whole enum, so a missing one stops compiling.
 */
type TWebSocketClientMessageReceivedMap = {
    [TWebSocketClientMessageType.HMAC_Challenge]: TWebSocketClientMessageHMACChallenge;
    [TWebSocketClientMessageType.Authenticated]: TWebSocketClientMessageAuthenticated;
    [TWebSocketClientMessageType.SessionDescription]: TInteractiveInkSessionDescriptionMessage;
    [TWebSocketClientMessageType.NewPart]: TWebSocketClientMessageNewPart;
    [TWebSocketClientMessageType.PartChanged]: TWebSocketClientMessagePartChange;
    [TWebSocketClientMessageType.ContentChanged]: TWebSocketClientMessageContentChange;
    [TWebSocketClientMessageType.Idle]: TWebSocketClientMessageIdle;
    [TWebSocketClientMessageType.Pong]: TWebSocketClientMessagePong;
    [TWebSocketClientMessageType.Exported]: TWebSocketClientMessageExport;
    [TWebSocketClientMessageType.GestureDetected]: TWebSocketClientMessageGesture;
    [TWebSocketClientMessageType.ContextlessGesture]: TWebSocketClientMessageContextlessGesture;
    [TWebSocketClientMessageType.MathSolverResult]: TWebSocketClientMessageMathSolverResult;
    [TWebSocketClientMessageType.Error]: TWebSocketClientMessageError;
    [TWebSocketClientMessageType.Ack]: TWebSocketClientMessageAck;
    [TWebSocketClientMessageType.ConfigurationChanged]: TWebSocketClientConfigurationChanged;
};
/**
 * @group Client
 */
type TWebSocketClientMessageReceived = TWebSocketClientMessageReceivedMap[TWebSocketClientMessageType];
/**
 * @group Client
 * @summary The undo/redo state a `contentChanged` message carries, both websocket protocols alike
 */
declare function readHistoryContext(message: Pick<TWebSocketClientMessageContentChange, "canUndo" | "canRedo" | "empty" | "undoStackIndex" | "possibleUndoCount">): THistoryContext;

/**
 * @group Client
 */
type TWebSocketSSRClientMessage<T extends string = string> = {
    type: T;
    [key: string]: unknown;
};
/**
 * @group Client
 */
type TWebSocketSSRClientMessageError = TWebSocketSSRClientMessage<"error"> & {
    code?: number | string;
    message?: string;
    data?: {
        code: number | string;
        message: string;
    };
};
/**
 * @group Client
 * @remarks Carries `hmacChallenge` when the server expects a signature, see {@link TWebSocketSSRClientMessageHMACChallenge}
 */
type TWebSocketSSRClientMessageAck = TWebSocketSSRClientMessage<"ack"> & {
    hmacChallenge?: string;
    iinkSessionId?: string;
};
/**
 * @group Client
 */
type TWebSocketSSRClientMessageHMACChallenge = TWebSocketSSRClientMessageAck & {
    hmacChallenge: string;
    iinkSessionId: string;
};
/**
 * @group Client
 */
type TWebSocketSSRClientMessageContentPackageDescriptionMessage = TWebSocketSSRClientMessage<"contentPackageDescription"> & {
    contentPartCount: number;
};
/**
 * @group Client
 */
type TWebSocketSSRClientMessagePartChange = TWebSocketSSRClientMessage<"partChanged"> & {
    partIdx: number;
    partId: string;
    partCount: number;
};
/**
 * @group Client
 */
type TWebSocketSSRClientMessageNewPart = TWebSocketSSRClientMessage<"newPart">;
/**
 * @group Client
 */
type TWebSocketSSRClientMessageContentChange = TWebSocketSSRClientMessage<"contentChanged"> & {
    partId: string;
    canUndo: boolean;
    canRedo: boolean;
    empty: boolean;
    undoStackIndex: number;
    possibleUndoCount: number;
};
/**
 * @group Client
 */
type TWebSocketSSRClientMessageExport = TWebSocketSSRClientMessage<"exported"> & {
    partId: string;
    exports: TExportWire;
};
/**
 * @group Client
 */
type TWebSocketSSRClientMessageIdle = TWebSocketSSRClientMessage<"idle">;
/**
 * @group Client
 */
type TWebSocketSSRClientMessagePong = TWebSocketSSRClientMessage<"pong">;
/**
 * @group Client
 */
type TUpdatePatchType = "REPLACE_ALL" | "REMOVE_ELEMENT" | "REPLACE_ELEMENT" | "REMOVE_CHILD" | "APPEND_CHILD" | "INSERT_BEFORE" | "REMOVE_ATTRIBUTE" | "SET_ATTRIBUTE";
/**
 * @group Client
 */
type TUpdatePatch = {
    type: TUpdatePatchType;
};
/**
 * @group Client
 */
type TUpdatePatchReplaceAll = TUpdatePatch & {
    type: "REPLACE_ALL";
    svg: string;
};
/**
 * @group Client
 */
type TUpdatePatchReplaceELement = TUpdatePatch & {
    type: "REPLACE_ELEMENT";
    id: string;
    svg: string;
};
/**
 * @group Client
 */
type TUpdatePatchInsertBefore = TUpdatePatch & {
    type: "INSERT_BEFORE";
    refId: string;
    svg: string;
};
/**
 * @group Client
 */
type TUpdatePatchRemoveElement = TUpdatePatch & {
    type: "REMOVE_ELEMENT";
    id: string;
};
/**
 * @group Client
 */
type TUpdatePatchAppendChild = TUpdatePatch & {
    type: "APPEND_CHILD";
    parentId?: string;
    svg: string;
};
/**
 * @group Client
 */
type TUpdatePatchRemoveChild = TUpdatePatch & {
    type: "REMOVE_CHILD";
    parentId: string;
    index: number;
};
/**
 * @group Client
 */
type TUpdatePatchRemoveAttribut = TUpdatePatch & {
    type: "REMOVE_ATTRIBUTE";
    id?: string;
    name: string;
};
/**
 * @group Client
 */
type TUpdatePatchSetAttribut = TUpdatePatch & {
    type: "SET_ATTRIBUTE";
    id?: string;
    name: string;
    value: string;
};
/**
 * @group Client
 */
type TWebSocketSSRClientMessageSVGPatch = TWebSocketSSRClientMessage<"svgPatch"> & {
    updates: TUpdatePatch[];
    layer: "MODEL" | "CAPTURE";
};
/**
 * @group Client
 * @summary Message the server sends, by `type`
 * @remarks {@link TWebSocketSSRClientMessageReceived} is built from this map: adding an entry adds the message.
 */
type TWebSocketSSRClientMessageReceivedMap = {
    ack: TWebSocketSSRClientMessageAck;
    contentPackageDescription: TWebSocketSSRClientMessageContentPackageDescriptionMessage;
    partChanged: TWebSocketSSRClientMessagePartChange;
    newPart: TWebSocketSSRClientMessageNewPart;
    contentChanged: TWebSocketSSRClientMessageContentChange;
    exported: TWebSocketSSRClientMessageExport;
    svgPatch: TWebSocketSSRClientMessageSVGPatch;
    error: TWebSocketSSRClientMessageError;
    idle: TWebSocketSSRClientMessageIdle;
    pong: TWebSocketSSRClientMessagePong;
};
/**
 * @group Client
 */
type TWebSocketSSRClientMessageReceived = TWebSocketSSRClientMessageReceivedMap[keyof TWebSocketSSRClientMessageReceivedMap];

/**
 * @group Client
 * @summary
 * Lists all events that can be listened to on the canvas or DOM element
 * @example
 * You can run code on "ClientEventName" raised by using
 * ```ts
 * client.events.addEventListener(ClientEventName.CONTENT_CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
declare enum ClientEventName {
    /**
     * @summary event emitted at the start of connection initialization
     */
    START_INITIALIZATION = "start-initialization",
    /**
     * @summary event emitted after full client initialization
     */
    END_INITIALIZATION = "end-initialization",
    /**
     * @summary event emitted after receiving an "contentChanged" message
     */
    CONTENT_CHANGED = "content-changed",
    /**
     * @summary event emitted after receiving an "idle" message
     */
    IDLE = "idle",
    /**
     * @summary event emitted after receiving an "exported" message
     */
    EXPORTED = "exported",
    /**
     * @summary event emitted when the client encounters an error
     */
    ERROR = "error",
    /**
     * @remarks event emitted after connection closed
     */
    CONNECTION_CLOSE = "connection-close",
    /**
     * @summary
     * event emitted after receiving an "svgPatch" message
     * @remarks
     * only usable in the case of websocket
     */
    SVG_PATCH = "svg-patch",
    /**
     * @summary event emitted session opened
     */
    SESSION_OPENED = "session-opened",
    /**
     * @summary event emitted when the connection status changes (e.g. going offline while queueing strokes, or reconnecting)
     */
    CONNECTION_STATUS_CHANGED = "connection-status-changed",
    /**
     * @summary event emitted after receiving a "gestureDetected" message
     */
    GESTURE_DETECTED = "gesture-detected"
}
/**
 * @group Client
 * @remarks "offline" covers both a bare disconnect and actively reconnecting/queueing.
 * "error" means reconnection attempts were exhausted and the offline queue was rejected.
 */
type TConnectionStatus = "connected" | "offline" | "error";
/**
 * @group Client
 */
declare class ClientEvent extends EventTarget {
    protected abortController: AbortController;
    constructor();
    removeAllListeners(): void;
    protected emit(type: string, data?: unknown): void;
    emitStartInitialization(): void;
    addStartInitialization(callback: () => void): void;
    emitEndInitialization(): void;
    addEndInitialization(callback: () => void): void;
    emitSessionOpened(sessionId: string): void;
    addSessionOpenedListener(callback: (sessionId: string) => void): void;
    emitContentChanged(undoRedoContext: THistoryContext): void;
    addContentChangedListener(callback: (context: THistoryContext) => void): void;
    emitIdle(idle: boolean): void;
    addIdleListener(callback: (idle: boolean) => void): void;
    emitExported(exports: TExport): void;
    addExportedListener(callback: (exports: TExport) => void): void;
    emitError(err: Error): void;
    addErrorListener(callback: (err: Error) => void): void;
    emitConnectionClose({ code, message }: {
        code: number;
        message?: string;
    }): void;
    addConnectionCloseListener(callback: ({ code, message }: {
        code: number;
        message?: string;
    }) => void): void;
    emitConnectionStatusChanged(status: TConnectionStatus): void;
    addConnectionStatusChangedListener(callback: (status: TConnectionStatus) => void): void;
    emitGestureDetected(gesture: TWebSocketClientMessageGesture): void;
    addGestureDetectedListener(callback: (gesture: TWebSocketClientMessageGesture) => void): void;
    /**
     * @remarks only use in the case of websocket
     */
    emitSVGPatch(svgPatch: TWebSocketSSRClientMessageSVGPatch): void;
    /**
     * @remarks only usable in the case of websocket
     */
    addSVGPatchListener(callback: (svgPatch: TWebSocketSSRClientMessageSVGPatch) => void): void;
}

/**
 * @group Client
 */
declare function computeHmac(message: string, applicationKey: string, hmacKey: string): Promise<string>;

/**
 * GETs a server endpoint and parses its JSON body. Rejects on a non-2xx status, rather than
 * parsing an error page as if it were the answer.
 * @group Client
 */
declare function getJSON<T>(server: Pick<TServerHTTPConfiguration, "scheme" | "host">, endpoint: string): Promise<T>;

/**
 * Resolves the HMAC signature of `message`: from the server configuration's `sign` function when
 * set, otherwise computed from its `hmacKey`. Returns `undefined` when neither yields a signature.
 * @group Client
 */
declare function resolveHmac(server: TServerHTTPConfiguration, message: string): Promise<string | undefined>;

/**
 * @group Client
 */
type TApiInfos = {
    version: string;
    gitCommit: string;
    nativeVersion: string;
};
/**
 * @group Client
 */
declare function getApiInfos(configuration?: TPartialDeep<{
    server: TServerHTTPConfiguration;
}>): Promise<TApiInfos>;
/**
 * @group Client
 * @summary The server version, fetched once and stored in the configuration
 */
declare function ensureServerVersion(configuration: {
    server: TServerHTTPConfiguration;
}): Promise<string>;

/**
 * Content kinds the Interactive Ink session can recognize.
 * @group Client
 */
type TRecognitionType = "text" | "shape" | "math";
/**
 * Gestures the Interactive Ink session can detect, as listed in `raw-content.gestures`.
 * @group Client
 */
type TRecognitionGesture = "underline" | "scratch-out" | "join" | "insert" | "strike-through" | "surround";
/**
 * @group Client
 */
type TRecognitionWebSocketConfiguration = {
    lang: string;
    alwaysConnected: boolean;
    export: TExportConfiguration;
    "raw-content": {
        text?: TTextConfConfiguration;
        "session-time"?: number;
        recognition?: {
            types: TRecognitionType[];
        };
        classification?: {
            types: TRecognitionType[];
        };
        gestures?: TRecognitionGesture[];
    };
    gesture: {
        enable: boolean;
        ignoreGestureStrokes: boolean;
    };
    math?: TSolverConfiguration & {
        solver?: TSolverConfiguration & {
            "auto-variable-management"?: TAutoVariableManagement;
        };
    };
};
/**
 * @group Client
 * @source
 */
declare const DefaultRecognitionWebSocketConfiguration: TRecognitionWebSocketConfiguration;
/**
 * @group Client
 */
type TWebSocketClientConfiguration = {
    server: TServerWebsocketConfiguration;
    recognition: TRecognitionWebSocketConfiguration;
};
/**
 * @group Client
 * @source
 */
declare const DefaultWebSocketClientConfiguration: TWebSocketClientConfiguration;
/**
 * @group Client
 */
declare class WebSocketClientConfiguration implements TWebSocketClientConfiguration {
    server: TServerWebsocketConfiguration;
    recognition: TRecognitionWebSocketConfiguration;
    constructor(configuration?: TPartialDeep<TWebSocketClientConfiguration>);
}

/**
 * @group Client
 * @summary A request waiting on an answer from the server
 * @remarks `neutral` is what it settles with when a deliberate close makes the answer moot.
 */
type TPendingRequest = {
    neutral: unknown;
    resolve(answer: unknown): void;
    reject(error: Error | string): void;
};
/**
 * @group Client
 * @summary One handler per message type the server sends
 */
type TWebSocketClientMessageHandlers = {
    [K in TWebSocketClientMessageType]: (message: TWebSocketClientMessageReceivedMap[K]) => void;
};
/**
 * A websocket dialog has this sequence. The full list of server messages is
 * {@link TWebSocketClientMessageType}; keep this sketch in line with it.
 * --------------- Client --------------------------------------------------------------- Server ---------------
 * Handshake
 * { type: "authenticate" }                           ==================>
 *                                                    <==================       { type: "hmacChallenge" }
 * { type: "hmac" }                                   ==================>
 *                                                    <==================       { type: "authenticated" }
 * { type: "initSession" | "restoreSession" }         ==================>
 *                                                    <==================       { type: "sessionDescription" }
 * { type: "newContentPart" | "openContentPart" }     ==================>
 *                                                    <==================       { type: "newPart" | "partChanged" }
 * { type: "changeConfiguration" }                    ==================>
 *                                                    <==================       { type: "configurationChanged" }
 *
 * Edition (each change is answered by a contentChanged)
 * { type: "addStrokes" }                             ==================>
 * { type: "replaceStrokes" }                         ==================>
 * { type: "eraseStrokes" }                           ==================>
 * { type: "transform" }  (TRANSLATE | ROTATE | SCALE | MATRIX) =======>
 * { type: "undo" | "redo", changes }                 ==================>
 * { type: "clear" }                                  ==================>
 *                                                    <==================       { type: "contentChanged" }
 *
 * Gestures, detected in context (addStrokes with processGestures, fewer than 3 strokes)
 * { type: "addStrokes", processGestures: true }      ==================>
 *                                                    <==================       { type: "gestureDetected", gestureType: "SCRATCH", gestureStrokeId, strokeIds, … }
 *   the gesture manager applies it, then sends the result:
 * { type: "eraseStrokes" | "replaceStrokes" }        ==================>
 *                                                    <==================       { type: "contentChanged" }
 *
 * Gestures, detected without context (stroke not added to the content)
 * { type: "contextlessGesture", scaleX, scaleY, strokes } ============>
 *                                                    <==================       { type: "contextlessGesture", gestureType, strokeId }
 *
 * Requests
 * { type: "export", partId, mimeTypes }              ==================>
 *                                                    <==================       { type: "exported" }
 * { type: "waitForIdle" }                            ==================>
 *                                                    <==================       { type: "idle" }
 * { type: "mathSolver", action, blockId }            ==================>
 *                                                    <==================       { type: "mathSolverResult" }
 * { type: "sendToSupport", metadata }                ==================>
 *                                                    <==================       { type: "ack" }
 * { type: "ping" }                                   ==================>
 *                                                    <==================       { type: "pong" }
 *
 * At any time
 *                                                    <==================       { type: "error" }
 */
/**
 * @group Client
 */
declare class WebSocketClient {
    protected logger: Logger;
    protected socket: WebSocket;
    /**
     * Largest message sent in one frame, in characters of its JSON. The backend closes the connection
     * (1009) on an incoming message over 500 KB; half of that leaves room to spare.
     */
    protected maxMessageBytes: number;
    protected pingWorker?: Worker;
    protected pingCount: number;
    protected sessionId?: string;
    protected boundOpenCallback: () => void;
    protected boundCloseCallback: (evt: CloseEvent) => void;
    protected boundMessageCallback: (message: MessageEvent<string>) => void;
    protected currentPartId?: string;
    protected currentErrorCode?: string | number;
    /**
     * Every request waiting on the server, under the key its answer is matched on (`gesture:<strokeId>`,
     * `export:<mimeType>`, `math:<action>:<blockId>`, `idle`, `support`), oldest first: the server
     * answers the requests of one key in order.
     */
    protected pendingRequests: Map<string, TPendingRequest[]>;
    protected offlineQueue: {
        message: TWebSocketClientMessage;
        deferred: DeferredPromise<void>;
    }[];
    protected reconnectTimer?: ReturnType<typeof setTimeout>;
    protected reconnectAttempts: number;
    /** Settled once the reconnect loop has reconnected and replayed the queue, or has given up. */
    protected reconnection?: DeferredPromise<void>;
    protected connectingPromise: Promise<void> | null;
    protected closingPromise: Promise<void> | null;
    /** Set on the first successful connection: a drop after it is recoverable, one before is not */
    protected hasConnected: boolean;
    protected exportQueue: Promise<unknown>;
    /** Routes each message the server sends; overriding a `manage*` method changes what its entry does. */
    protected messageHandlers: TWebSocketClientMessageHandlers;
    configuration: WebSocketClientConfiguration;
    initialized: DeferredPromise<void>;
    url: string;
    event: ClientEvent;
    constructor(config: TPartialDeep<TWebSocketClientConfiguration>, event?: ClientEvent);
    get mimeTypes(): string[];
    /**
     * Number of changes queued while disconnected, waiting to be replayed (see `server.websocket.autoReconnect`).
     */
    get offlineQueueLength(): number;
    /**
     * True while the connection is down after a first one succeeded, whether changes are queued or
     * not; false again once reconnected. `offlineQueueLength` tells how many changes wait.
     */
    get isOffline(): boolean;
    protected assertInitialized(): void;
    protected sendOnSocket(message: TWebSocketClientMessage): void;
    protected rejectDeferredPending(error: Error | string): void;
    /** Settles every request waiting on the server: none is answered now, so a later answer must not settle another one */
    protected settlePending(settle: (request: TPendingRequest) => void): void;
    /**
     * Registers a request under the key its answer will be matched on, after those already waiting there.
     * Called once the request is sent, not before: a request still waiting for a reconnection must not
     * be failed by the close of a reconnection attempt. The answer cannot be missed — it arrives in a
     * later `message` event, after the microtask that registers it.
     */
    protected waitForAnswer<T>(key: string, neutral: T): DeferredPromise<T>;
    /** Settles the oldest request waiting on `key`, or all of them, with the server's answer. */
    protected answer(key: string, answer: unknown, all?: boolean): void;
    /**
     * Settle completion-signal promises (no payload) as resolved rather than rejected — used on a
     * deliberate close (`close()`/`newSession()`), which isn't an error: the operation the caller
     * was waiting on (init, idle) is simply moot now, not failed.
     */
    protected resolveDeferredPending(): void;
    protected resetAllDeferred(): void;
    protected isDisconnected(): boolean;
    protected enqueueOfflineMessage(message: TWebSocketClientMessage, deferred: DeferredPromise<void>): void;
    protected startReconnectLoop(): void;
    protected scheduleReconnectAttempt(): void;
    /**
     * Runs once per successful connection, whoever triggered it. Cancels any reconnect attempt
     * still scheduled, replays the offline queue, and only then lets the requests waiting for the
     * reconnection go: one sent before the replay would read content the server does not have yet.
     */
    protected onConnected(): Promise<void>;
    /** Resolves once the reconnect loop has reconnected and replayed the queue; rejects if it gives up. */
    protected waitForReconnection(): Promise<void>;
    protected drainOfflineQueue(): Promise<void>;
    /**
     * Reconnection attempts exhausted: reject the queue and the requests waiting for the
     * reconnection, emit "error", and reset the attempt counter so the next change (or drop) gets a
     * fresh retry budget.
     */
    protected giveUpReconnecting(): void;
    /** Fails the queued changes and the requests waiting for the reconnection. */
    protected abandonReconnection(error: Error): void;
    protected clearOfflineQueue(error: Error): void;
    protected clearReconnectLoop(): void;
    protected clearSocketListener(): void;
    /**
     * A network drop (1006, also what each failed reconnection attempt reports) once connected,
     * with `autoReconnect` on: the changes are kept and replayed, so it is a state, not an error.
     * Reported as an error, it opened the canvas error modal over the ink every few seconds.
     */
    protected isRecoverableDrop(evt: CloseEvent): boolean;
    protected closeCallback(evt: CloseEvent): void;
    protected openCallback(): void;
    protected manageHMACChallenge(hmacChallengeMessage: TWebSocketClientMessageHMACChallenge): Promise<void>;
    /** A handshake step failed: `init()` waits on `initialized`, so it must hear of it, not only the `error` listeners */
    protected failInitialization(error: unknown): void;
    protected initPing(): void;
    protected manageAuthenticated(): void;
    protected manageSessionDescriptionMessage(sessionDescriptionMessage: TInteractiveInkSessionDescriptionMessage): void;
    protected manageNewPartMessage(newPartMessage: TWebSocketClientMessageNewPart): void;
    protected managePartChangeMessage(partChangeMessage: TWebSocketClientMessagePartChange): void;
    protected manageContentChangedMessage(contentChangeMessage: TWebSocketClientMessageContentChange): void;
    protected manageExportMessage(exportMessage: TWebSocketClientMessageExport): void;
    protected manageWaitForIdle(): void;
    protected manageConfigurationChanged(): void;
    protected manageErrorMessage(errorMessage: TWebSocketClientMessageError): void;
    protected manageAck(): void;
    protected manageGestureDetected(gestureMessage: TWebSocketClientMessageGesture): void;
    protected manageContextlessGesture(gestureMessage: TWebSocketClientMessageContextlessGesture): void;
    protected manageMathSolverResult(mathSolverMessage: TWebSocketClientMessageMathSolverResult): void;
    protected requestMathSolver<A extends TMathSolverAction>(action: A, blockId: string | undefined, parameters?: Record<string, unknown>): Promise<TMathSolverResultMap[A]>;
    protected messageCallback(message: MessageEvent<string>): void;
    protected dispatchMessage<K extends TWebSocketClientMessageType>(type: K, message: TWebSocketClientMessageReceivedMap[K]): void;
    newSession(config: TPartialDeep<TWebSocketClientConfiguration>): Promise<void>;
    changeConfiguration(config: TPartialDeep<TWebSocketClientConfiguration>): Promise<void>;
    protected mergeConfiguration(config: TPartialDeep<TWebSocketClientConfiguration>): void;
    init(): Promise<void>;
    protected connect(): Promise<void>;
    send(message: TWebSocketClientMessage): Promise<void>;
    protected toWire: (stroke: TRecognitionStroke) => TWireStroke;
    protected buildAddStrokesMessage(strokes: TWireStroke[], processGestures?: boolean): TWebSocketClientMessage;
    /**
     * @remarks Resolves once the message is sent, not once the server acks it — gesture detection
     * results (if any) arrive asynchronously via `event.addGestureDetectedListener`, not this promise.
     */
    addStrokes(strokes: TRecognitionStroke[], processGestures?: boolean): Promise<void>;
    /**
     * Sends a change to the content. While disconnected it is queued and replayed in order once
     * reconnected, rather than lost: the server must end up with every change the canvas made.
     */
    protected sendChange(message: TWebSocketClientMessage): Promise<void>;
    /**
     * Groups `items` so that each group, once sent, stays under `maxMessageBytes`, with at most
     * `maxCount` items. Order is kept; an item larger than the budget goes alone.
     */
    protected chunkBySize<T>(items: T[], sizeOf: (item: T) => number, maxCount?: number): T[][];
    /** Sends `build`'s message once per group of `strokeIds` that fits in a frame; nothing for no id. */
    protected sendPerStrokeIds(strokeIds: string[], build: (strokeIds: string[]) => TWebSocketClientMessage): Promise<void>;
    getAvailableActions(blockId: string): Promise<string[]>;
    getNumericalComputation(blockId: string): Promise<TJIIXMathElement>;
    getDiagnostic(blockId: string, task: string): Promise<string>;
    getVariables(blockId: string): Promise<TMathVariable[]>;
    getVariableValue(blockId: string, variableName: string): Promise<number>;
    setVariableValue(blockId: string, variableName: string, variableValue: number): Promise<void>;
    removeVariableValue(blockId: string, variableName: string): Promise<void>;
    asVariableDefinition(blockId: string): Promise<TMathVariableDefinition>;
    getVariableDefinitions(): Promise<TMathVariableDefinitions[]>;
    getEvaluables(blockId: string): Promise<TMathEvaluable[]>;
    evaluate(blockId: string, evaluation: {
        inputVariableName: string;
        outputVariableName: string;
        from: number;
        to: number;
        pointCount: number;
    }): Promise<Record<string, number>[][]>;
    protected buildReplaceStrokesMessage(oldStrokeIds: string[], newStrokes: TWireStroke[]): TWebSocketClientMessage;
    replaceStrokes(oldStrokeIds: string[], newStrokes: TRecognitionStroke[]): Promise<void>;
    protected buildTransformTranslateMessage(strokeIds: string[], tx: number, ty: number): TWebSocketClientMessage;
    transformTranslate(strokeIds: string[], tx: number, ty: number): Promise<void>;
    protected buildTransformRotateMessage(strokeIds: string[], angle: number, x0?: number, y0?: number): TWebSocketClientMessage;
    transformRotate(strokeIds: string[], angle: number, x0?: number, y0?: number): Promise<void>;
    protected buildTransformScaleMessage(strokeIds: string[], scaleX: number, scaleY: number, x0?: number, y0?: number): TWebSocketClientMessage;
    transformScale(strokeIds: string[], scaleX: number, scaleY: number, x0?: number, y0?: number): Promise<void>;
    protected buildTransformMatrixMessage(strokeIds: string[], matrix: TMatrixTransform): TWebSocketClientMessage;
    transformMatrix(strokeIds: string[], matrix: TMatrixTransform): Promise<void>;
    protected buildEraseStrokesMessage(strokeIds: string[]): TWebSocketClientMessage;
    eraseStrokes(strokeIds: string[]): Promise<void>;
    recognizeGesture(stroke: TRecognitionStroke): Promise<TWebSocketClientMessageContextlessGesture | undefined>;
    waitForIdle(): Promise<void>;
    protected buildUndoRedoChanges(changes: TIIHistoryBackendChanges): TWebSocketClientMessage[];
    /** Sends one step of the server's history; nothing when it changes nothing. */
    protected sendHistoryStep(type: "undo" | "redo", actions: TIIHistoryBackendChanges): Promise<void>;
    undo(actions: TIIHistoryBackendChanges): Promise<void>;
    redo(actions: TIIHistoryBackendChanges): Promise<void>;
    export(requestedMimeTypes?: string[]): Promise<TExport>;
    protected sendExport(requestedMimeTypes?: string[]): Promise<TExport>;
    clear(): Promise<void>;
    sendToSupport(data: Record<string, unknown>): Promise<void>;
    close(code: number, reason: string): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Client
 */
type TWebSocketSSRClientRecognitionConfiguration = {
    type: Omit<TRecognitionTypeV1, "DIAGRAM" | "Raw Content">;
    lang: string;
    math: TMathConfiguration;
    text: TTextConfiguration;
    renderer: TRecognitionRendererConfiguration;
    export: TExportConfiguration;
    convert?: TConvertionConfiguration;
};
/**
 * @group Client
 * @source
 */
declare const DefaultWebSocketSSRClientRecognitionConfiguration: TWebSocketSSRClientRecognitionConfiguration;
/**
 * @group Client
 */
type TWebSocketSSRClientConfiguration = {
    server: TServerWebsocketConfiguration;
    recognition: TWebSocketSSRClientRecognitionConfiguration;
};
/**
 * @group Client
 * @source
 */
declare const DefaultWebSocketSSRClientConfiguration: TWebSocketSSRClientConfiguration;
/**
 * @group Client
 */
declare class WebSocketSSRClientConfiguration implements TWebSocketSSRClientConfiguration {
    recognition: TWebSocketSSRClientRecognitionConfiguration;
    server: TServerWebsocketConfiguration;
    constructor(configuration?: TPartialDeep<TWebSocketSSRClientConfiguration>);
}

/**
 * A websocket dialog have this sequence :
 * --------------------------- Client --------------------------------------------------- Server ----------------------------------
 * init: send newContentPackage or restoreIInkSession           ==================>
 *                                                              <==================       ack
 * answer ack:
 *  send the hmac (if enable)                                   ==================>
 *  send the configuration                                      ==================>
 *                                                              <==================       contentPackageDescription
 * answer contentPackageDescription:
 *  send newContentPart or openContentPart                      ==================>
 *                                                              <==================        partChanged
 *                                                              <==================        contentChanged
 *                                                              <==================        newPart
 *                                                              <==================        svgPatch
 *
 * setPenStyle (send the parameters)                            ==================>
 * setTheme (send the parameters)                               ==================>
 * setPenStyleClasses (send the parameters)                     ==================>
 *                                                              <==================        svgPatch
 * addStrokes (send the strokes ) ============>
 *                                                              <==================        update
 */
/**
 * @group Client
 */
declare class WebSocketSSRClient {
    protected logger: Logger;
    protected socket: WebSocket;
    protected pingCount: number;
    protected reconnectionCount: number;
    protected viewSizeHeight: number;
    protected viewSizeWidth: number;
    protected sessionId?: string;
    currentPartId?: string;
    protected currentErrorCode?: string | number;
    protected penStyle?: TPenStyle;
    protected penStyleClasses?: string;
    protected theme?: TTheme;
    protected boundOpenCallback: () => void;
    protected boundCloseCallback: (evt: CloseEvent) => void;
    protected boundMessageCallback: (message: MessageEvent<string>) => void;
    protected connected?: DeferredPromise<void>;
    protected ackDeferred?: DeferredPromise<void>;
    protected addStrokeDeferred?: DeferredPromise<TExport>;
    protected exportDeferred?: DeferredPromise<TExport>;
    protected convertDeferred?: DeferredPromise<TExport>;
    protected importDeferred?: DeferredPromise<TExport>;
    protected resizeDeferred?: DeferredPromise<void>;
    protected undoDeferred?: DeferredPromise<TExport>;
    protected redoDeferred?: DeferredPromise<TExport>;
    protected clearDeferred?: DeferredPromise<TExport>;
    protected importPointEventsDeferred?: DeferredPromise<TExport>;
    protected waitForIdleDeferred?: DeferredPromise<void>;
    configuration: TWebSocketSSRClientConfiguration;
    initialized: DeferredPromise<void>;
    url: string;
    event: ClientEvent;
    constructor(config?: TPartialDeep<TWebSocketSSRClientConfiguration>);
    get mimeTypes(): string[];
    protected infinitePing(): void;
    protected openCallback(): void;
    protected rejectDeferredPending(error: Error): void;
    /**
     * Settles the requests still waiting for an answer with an empty result, as on a deliberate
     * close in {@link WebSocketClient}: the operation is moot, not failed, so callers that never
     * awaited it get no unhandled rejection.
     */
    protected resolvePendingRequests(): void;
    protected closeCallback(evt: CloseEvent): void;
    protected manageAckMessage(ackMessage: TWebSocketSSRClientMessageAck): Promise<void>;
    /** A handshake step failed: `init()` waits on `initialized`, so it must hear of it, not only the `error` listeners */
    protected failInitialization(error: unknown): void;
    protected manageContentPackageDescriptionMessage(): Promise<void>;
    protected managePartChangeMessage(partChangeMessage: TWebSocketSSRClientMessagePartChange): void;
    protected manageExportMessage(exportMessage: TWebSocketSSRClientMessageExport): void;
    protected manageWaitForIdle(): Promise<void>;
    protected manageErrorMessage(err: TWebSocketSSRClientMessageError): void;
    protected manageContentChangeMessage(contentChangeMessage: TWebSocketSSRClientMessageContentChange): void;
    protected manageSVGPatchMessage(svgPatchMessage: TWebSocketSSRClientMessageSVGPatch): void;
    protected messageCallback(message: MessageEvent<string>): void;
    init(height: number, width: number): Promise<void>;
    send(message: TWebSocketSSRClientMessage): Promise<void>;
    /** Sends again, on a new session, the styles set on the previous one; one never set stays unset */
    protected restoreStyles(): Promise<void>;
    addStrokes(strokes: Stroke[]): Promise<TExport>;
    setPenStyle(penStyle: TPenStyle): Promise<void>;
    setPenStyleClasses(penStyleClasses: string): Promise<void>;
    setTheme(theme: TTheme): Promise<void>;
    export(model: Model, requestedMimeTypes?: string[]): Promise<Model>;
    import(model: Model, data: Blob, mimeType?: string): Promise<Model>;
    resize(model: Model): Promise<Model>;
    importPointEvents(strokes: Stroke[]): Promise<TExport>;
    convert(model: Model, conversionState?: TConverstionState): Promise<Model>;
    waitForIdle(): Promise<void>;
    undo(model: Model): Promise<Model>;
    redo(model: Model): Promise<Model>;
    clear(model: Model): Promise<Model>;
    close(code: number, reason: string): void;
    destroy(): void;
    /** Drops the socket and every pending promise without settling them: `init()` starts over from here */
    protected resetConnection(): void;
}

/**
 * @group Grabber
 */
type TListenerConfiguration = {
    capture: boolean;
    passive: boolean;
};
/**
 * @group Grabber
 * @source
 */
declare const DefaultListenerConfiguration: TListenerConfiguration;
/**
 * Which pointers may draw on the canvas.
 * - "any": every pointer type (mouse, touch, pen)
 * - "pen": pen only, so a palm resting on a tablet never inks
 * - "auto": every pointer type until the first pen event, then pen only
 * @group Grabber
 */
type TGrabberInputMode = "any" | "pen" | "auto";
/**
 * @group Grabber
 */
type TGrabberConfiguration = {
    listenerOptions: TListenerConfiguration;
    xyFloatPrecision: number;
    timestampFloatPrecision: number;
    delayLongTouch: number;
    inputMode: TGrabberInputMode;
};
/**
 * @group Grabber
 * @source
 */
declare const DefaultGrabberConfiguration: TGrabberConfiguration;

/**
 * @group Grabber
 */
type TPointerInfo = {
    clientX: number;
    clientY: number;
    isPrimary: boolean;
    type: string;
    pointerType: string;
    target: HTMLElement;
    pointer: TPointer;
    button: number;
    buttons: number;
    /**
     * Epoch milliseconds of the `pointerdown` that opened the current gesture — the origin the
     * `dt` field of every {@link TPointer} in this gesture counts from. A symbol built out of these pointers takes it
     * as its `creationTime`, which is what turns their relative times back into absolute ones.
     */
    gestureStartTime: number;
};
/**
 * @group Grabber
 */
declare class PointerEventGrabber {
    #private;
    protected configuration: TGrabberConfiguration;
    protected layerCapture: HTMLElement;
    protected capturing: boolean;
    protected pointerType?: string;
    protected prevent: (e: Event) => void;
    onPointerDown?: (info: TPointerInfo) => void;
    onPointerMove?: (info: TPointerInfo) => void;
    onPointerUp?: (info: TPointerInfo) => void;
    onContextMenu?: (info: TPointerInfo) => void;
    constructor(configuration: TGrabberConfiguration);
    protected roundFloat(oneFloat: number, requestedFloatPrecision: number): number;
    /**
     * The svg pointers are mapped into. Every coalesced pointer sample needs it, so the lookup is
     * kept rather than redone per sample; it is redone only once the kept svg has left
     * `layerCapture`, which is what a renderer that rebuilds its svg does.
     */
    protected getCaptureSvg(): SVGSVGElement | null;
    /**
     * `getScreenCTM` forces the browser to flush pending layout, which gets
     * increasingly costly as the svg grows (more symbols on the canvas). Reuse
     * the last value as long as `svg`'s transform (pan/zoom/resize) hasn't changed.
     */
    protected getCachedScreenCTM(svg: SVGSVGElement): DOMMatrix | null;
    /**
     * Epoch milliseconds of the gesture currently being captured. Set on `pointerdown` and read back
     * by every pointer of that gesture, so they all count from the same origin.
     */
    protected gestureStartTime: number;
    /**
     * The instant an event was captured, in epoch milliseconds and with sub-millisecond precision.
     *
     * Read off the event rather than by calling `Date.now()` in the handler: under main-thread
     * pressure the browser hands several samples to one `pointermove`, and a clock read taken while
     * replaying them would stamp them all with the same instant — the recognizer would then see a
     * burst of points captured simultaneously, which is exactly the timing information it uses to
     * segment characters. `timeStamp` is relative to the page's time origin, so it is shifted back
     * onto the epoch to keep the same reference as `creationTime`.
     */
    protected eventTime(event: Event): number;
    protected extractDelta(event: Event): number;
    protected extractPointer(event: MouseEvent | TouchEvent): TPointer;
    protected getPointerInfos(evt: PointerEvent): TPointerInfo;
    /** Applies `inputMode`: in "auto", the first pen seen switches the grabber to pen only */
    protected acceptsPointerType(pointerType: string): boolean;
    protected pointerDownHandler: (evt: PointerEvent) => void;
    /**
     * Keeps every event of the gesture on the canvas once the pointer leaves it, until the pointer is
     * released: the page around neither starts a text selection nor reacts to a drag it never saw begin.
     */
    protected capturePointer(evt: PointerEvent): void;
    protected pointerMoveHandler: (evt: PointerEvent) => void;
    protected pointerUpHandler: (evt: PointerEvent) => void;
    protected pointerOutHandler: (evt: PointerEvent) => void;
    protected contextMenuHandler: (evt: MouseEvent) => void;
    stopPointerEvent(): void;
    attach(layerCapture: HTMLElement): void;
    detach(): void;
}

/**
 * @group Renderer
 * @summary Base renderer configuration interface
 *
 * Common configuration properties required by all renderer implementations.
 */
type TBaseRendererConfiguration = {
    minWidth: number;
    minHeight: number;
};
/**
 * @group Renderer
 * @summary Abstract base class for all renderer implementations
 *
 * Defines the common interface that both Canvas and SVG renderers
 * must implement, enabling consistent rendering behavior across
 * different output formats.
 */
declare abstract class BaseRenderer<RenderContextType, ConfigType extends TBaseRendererConfiguration = TBaseRendererConfiguration> {
    configuration: ConfigType;
    parent: HTMLElement;
    constructor(configuration: ConfigType);
    /**
     * Initialize the renderer in the given parent element
     */
    abstract init(element: HTMLElement): void;
    /**
     * Clear/reset the rendering context
     */
    abstract clear(): void;
    /**
     * Get the rendering context (Canvas2D, SVGElement, etc.)
     */
    abstract getRenderingContext(): RenderContextType;
    /**
     * Get the bounds of the rendering area
     */
    getBounds(): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/**
 * @group Renderer
 */
type TGuidesConfiguration = {
    enable: boolean;
    gap: number;
};
/**
 * @group Renderer
 * @source
 */
declare const DefaultGuidesConfiguration: TGuidesConfiguration;
/**
 * @group Renderer
 */
type TRendererConfiguration = {
    minHeight: number;
    minWidth: number;
    guides: TGuidesConfiguration;
};
/**
 * @group Renderer
 * @source
 */
declare const DefaultRendererConfiguration: TRendererConfiguration;
/**
 * @group Renderer
 */
type TIIRendererConfiguration = TRendererConfiguration & {
    guides: TGuidesConfiguration & {
        type: "line" | "grid" | "point";
    };
};
/**
 * @group Renderer
 * @source
 */
declare const DefaultIIRendererConfiguration: TIIRendererConfiguration;

/**
 * @group Renderer
 */
declare class CanvasRendererShape {
    #private;
    symbols: {
        table: string;
        ellipse: string;
        line: string;
    };
    protected drawEllipseArc(context2D: CanvasRenderingContext2D, shapeEllipse: TCanvasShapeEllipseSymbol): TPoint[];
    protected drawLine(context2D: CanvasRenderingContext2D, p1: TPoint, p2: TPoint): void;
    protected drawArrowHead(context2D: CanvasRenderingContext2D, headPoint: TPoint, angle: number, length: number): void;
    protected drawShapeEllipse(context2D: CanvasRenderingContext2D, shapeEllipse: TCanvasShapeEllipseSymbol): void;
    protected drawShapeLine(context2D: CanvasRenderingContext2D, shapeLine: TCanvasShapeLineSymbol): void;
    draw(context2D: CanvasRenderingContext2D, symbol: TBaseSymbol): void;
}

/**
 * @group Renderer
 */
declare class CanvasRendererStroke {
    #private;
    protected renderArc(context2d: CanvasRenderingContext2D, center: TPointer, radius: number): void;
    protected renderLine(context2d: CanvasRenderingContext2D, begin: TPointer, end: TPointer, width: number): void;
    protected renderFinal(context2d: CanvasRenderingContext2D, begin: TPointer, end: TPointer, width: number): void;
    protected renderQuadratic(context2d: CanvasRenderingContext2D, begin: TPointer, end: TPointer, ctrl: TPointer, width: number): void;
    draw(context2d: CanvasRenderingContext2D, stroke: Stroke): void;
}

/**
 * @group Renderer
 */
declare class CanvasRendererText {
    #private;
    symbols: {
        char: string;
        string: string;
        textLine: string;
    };
    protected drawUnderline(context2D: CanvasRenderingContext2D, textUnderline: TCanvasTextUnderlineSymbol, underline: TCanvasUnderLineSymbol): void;
    protected drawText(context2D: CanvasRenderingContext2D, text: TCanvasTextSymbol): void;
    protected drawTextLine(context2D: CanvasRenderingContext2D, textUnderline: TCanvasTextUnderlineSymbol): void;
    draw(context2D: CanvasRenderingContext2D, symbol: TBaseSymbol): void;
}

/**
 * @group Renderer
 */
declare class CanvasRenderer extends BaseRenderer<CanvasRenderingContext2D, Omit<TRendererConfiguration, "guides">> {
    #private;
    strokeRenderer: CanvasRendererStroke;
    shapeRenderer: CanvasRendererShape;
    textRenderer: CanvasRendererText;
    context: {
        parent: HTMLElement;
        renderingCanvas: HTMLCanvasElement;
        renderingCanvasContext: CanvasRenderingContext2D;
        capturingCanvas: HTMLCanvasElement;
        capturingCanvasContext: CanvasRenderingContext2D;
    };
    constructor(config: Omit<TRendererConfiguration, "guides">);
    protected createCanvas(type: string): HTMLCanvasElement;
    protected resizeContent(): void;
    /**
     * Dispatches on `isStroke` and two fixed renderer tables rather than asking `symbolRegistry` for
     * the symbol's util, so a custom registered symbol type lands in the warn branch and is never
     * drawn. Deliberate: this renderer belongs to `InkCanvasDeprecated` (INK_V1), which is deprecated
     * and not worth wiring into the plugin contract. The SVG renderer the other three variants use
     * does ask the registry.
     */
    protected drawSymbol(context2D: CanvasRenderingContext2D, symbol: TBaseSymbol): void;
    init(element: HTMLElement, guide?: {
        x?: number;
        y?: number;
    }): void;
    drawModel(model: Model): void;
    drawPendingStroke(stroke: Stroke | undefined): void;
    resize(model: Model): void;
    destroy(): void;
    clear(): void;
    getRenderingContext(): CanvasRenderingContext2D;
}

/**
 * @group Renderer
 * @summary
 * List all svg elements roles
 * @remarks
 * only usable in the case of interactive ink canvas
 */
declare enum SvgElementRole {
    Guide = "guide",
    InteractElementsGroup = "interact-elements-group",
    Translate = "translate",
    Resize = "resize",
    Rotate = "rotate"
}

/**
 * @group Renderer
 */
declare class SVGRenderer extends BaseRenderer<SVGSVGElement, TIIRendererConfiguration> {
    #private;
    groupGuidesId: string;
    layer: SVGSVGElement;
    definitionGroup: SVGGElement;
    verticalGuides: number[];
    horizontalGuides: number[];
    /**
     * Margin added around the viewBox (as a ratio of its width/height) before culling
     * a symbol's element from the DOM, so a small pan doesn't immediately pop content in/out.
     */
    static readonly VIRTUALIZATION_MARGIN_RATIO = 0.5;
    constructor(configuration: TIIRendererConfiguration);
    protected initLayer(): void;
    protected createDefs(): SVGDefsElement;
    protected createFilters(): SVGGElement;
    protected drawGuides(): void;
    protected removeGuides(): void;
    redrawGuides(): void;
    protected createSVGTools(): SVGGElement;
    init(element: HTMLElement): void;
    getAttribute(id: string, name: string): string | undefined | null;
    setAttribute(id: string, name: string, value: string): void;
    buildElementFromSymbol(symbol: TSymbol): SVGGraphicsElement | undefined;
    prependElement(el: Element): void;
    changeOrderSymbol(symbolToMove: TSymbol, position: "first" | "last" | "forward" | "backward"): void;
    appendElement(el: Element): void;
    removeElement(id: string): void;
    drawSymbol(symbol: TSymbol | TEraser): SVGGraphicsElement | undefined;
    /**
     * Re-points an already-drawn symbol at its current matrix, without rebuilding it.
     *
     * The element's geometry is the symbol's raw coordinates, which a transform never changes — so the
     * matrix is the whole of what has to reach the DOM. Committing a transform over a large selection
     * used to rebuild every element in it (`buildElementFromSymbol` walks every pointer); this writes
     * one attribute per symbol instead.
     *
     * The tracked bounds are refreshed here too. They are what `#reconcileVirtualization` culls by,
     * and leaving them behind would strand a moved symbol at its old address — attached where it is no
     * longer drawn, detached where it now is.
     */
    setSymbolTransform(symbol: TSymbol): void;
    /**
     * Draws `symbol` into the dedicated current-symbol overlay instead of the
     * main layer - used while a stroke/shape is still being drawn, so redrawing
     * it every frame doesn't repaint the rest of the canvas. See `drawSymbol`.
     */
    drawCurrentSymbol(symbol: TSymbol): SVGGraphicsElement | undefined;
    /** Clears the current-symbol overlay once its content has been merged into `layer`. */
    clearCurrentSymbolLayer(): void;
    updateSelectedState(symbol: TSymbol, isSelected: boolean): void;
    updateDeletingState(symbol: TSymbol, isDeleting: boolean): void;
    replaceSymbol(id: string, symbols: TSymbol[]): SVGGraphicsElement[] | undefined;
    removeSymbol(id: string): void;
    drawCircle(point: TPoint, radius: number, attrs?: {
        [key: string]: string;
    }): void;
    drawRect(box: TBox, attrs?: {
        [key: string]: string;
    }): void;
    drawLine(p1: TPoint, p2: TPoint, attrs?: {
        [key: string]: string;
    }): void;
    drawConnectionBetweenBox(id: string, box1: TBox, box2: TBox, position: "corners" | "sides", attrs?: {
        [key: string]: string;
    }): void;
    resize(height: number, width: number): void;
    getElementById(id: string): SVGGraphicsElement | null;
    getElements({ tagName, attrs }: {
        tagName?: string;
        attrs?: {
            [key: string]: string;
        };
    }): NodeListOf<Element>;
    clearElements({ tagName, attrs }: {
        tagName?: string;
        attrs?: {
            [key: string]: string;
        };
    }): void;
    clear(): void;
    getRenderingContext(): SVGSVGElement;
    getZoom(): number;
    setZoom(zoom: number, centerX?: number, centerY?: number): void;
    /**
     * Get current viewBox
     * @returns Current viewBox {x, y, width, height}
     */
    getViewBox(): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * Set viewBox
     * @param x X coordinate of top-left corner
     * @param y Y coordinate of top-left corner
     * @param width Width of viewBox
     * @param height Height of viewBox
     * @param redrawGuides Whether to redraw guides (default: true)
     */
    setViewBox(x: number, y: number, width: number, height: number, redrawGuides?: boolean): void;
    /**
     * Pan (translate) the viewBox
     * @param dx Horizontal translation (in viewBox coordinates)
     * @param dy Vertical translation (in viewBox coordinates)
     * @param redrawGuides Whether to redraw guides (default: true)
     */
    pan(dx: number, dy: number, redrawGuides?: boolean): void;
    /**
     * Ensure a point is visible in the viewBox by panning if necessary
     * @param point Point to make visible
     * @param margin Optional margin around the point (default: 50)
     */
    ensurePointVisible(point: TPoint, margin?: number): void;
    destroy(): void;
}

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
type TTransformContext = {
    matrix: MatrixTransform;
};

/**
 * @group SymbolUtils
 * @summary Plugin interface for registering symbol behaviour.
 *
 * Implement this class to add a new symbol type that participates in the
 * standard dispatch for factory, derived-field updates, overlap detection,
 * snap-point extraction, and capability flags.
 *
 * Register with `symbolRegistry.register(new MyUtil())`.
 *
 * @example
 * class StickyNoteUtil extends SymbolUtil<TStickyNote> {
 *   readonly type = "sticky-note"
 *   create(partial) { ... }
 *   getGeometry(s) { ... }
 *   translate(s, { matrix }) { ... }
 *   rotate(s, { matrix }) { ... }
 *   resize(s, { matrix }) { ... }
 *   getSVGElement(s) { ... }
 * }
 * symbolRegistry.register(new StickyNoteUtil())
 */
declare abstract class SymbolUtil<T extends TBaseSymbol> {
    abstract readonly type: string;
    abstract create(params: TPartialDeep<T>): T;
    /**
     * This symbol's geometry: a shape that answers overlap, containment and distance for itself.
     *
     * The one thing a symbol type has to describe. Everything the library used to ask a type for
     * separately — its bounds, its vertices, whether a query touches it — is a question this shape
     * answers, so a new type supplies this and inherits the rest.
     */
    abstract getGeometry(symbol: T): Geometry2d;
    /**
     * Whether a query box touches this symbol — the question selection and erasing both ask.
     *
     * Answered by the shape {@link getGeometry} returns, so a type describes what it is once and
     * inherits this. Every built-in used to write the same one line here. Override it only for a type
     * whose hit test is not a question about its outline.
     */
    overlaps(symbol: T, box: TBox): boolean;
    /**
     * `points`, carried through `symbol.transform` the same way a transform manager moves the symbol
     * itself — used by `getSnapPoints`/`getResizePoints` overrides, which compute in the symbol's raw
     * frame and hand the result through this once, forward, rather than every symbol type mapping its
     * own points individually.
     *
     * Forward, and exact: a point maps to a point however the matrix turns or scales, so `points` are
     * already the symbol's own geometry, and mapping a point through a matrix is always exact, however
     * that matrix turns or scales.
     */
    protected mapPointsForward(symbol: T, points: TPoint[]): TPoint[];
    /**
     * Moves, turns or scales this symbol by composing the matrix onto the one it already carries.
     *
     * One implementation for every type, where there used to be one per type per operation. A
     * symbol's coordinates are not touched: the matrix is the whole of what a transform changes, so
     * there is no per-type geometry to update and nothing derived left to refresh.
     *
     * Override only for a type whose transform is not affine — `DecoratorUtil` overrides it to a
     * no-op because a decorator follows its targets rather than moving on its own.
     */
    applyTransform(symbol: T, matrix: TMatrixTransform): void;
    /**
     * Moves this symbol by a matrix.
     *
     * Concrete rather than abstract: every built-in type composes the matrix the same way, through
     * {@link applyTransform}, and none of the six overrides this. A custom util only needs its own
     * body if it stores something a matrix cannot express.
     */
    translate(symbol: T, { matrix }: TTransformContext): void;
    /**
     * Turns this symbol. Composes through {@link applyTransform}, for the same reason
     * {@link translate} does.
     */
    rotate(symbol: T, { matrix }: TTransformContext): void;
    /**
     * Scales this symbol. Composes through {@link applyTransform}, for the same reason
     * {@link translate} does.
     */
    resize(symbol: T, { matrix }: TTransformContext): void;
    getSnapPoints(_symbol: T): TPoint[];
    /**
     * Handles for dragging one vertex of this symbol. Empty by default: most symbols resize by their
     * bounding box alone, and only the edge kinds offer per-vertex handles today.
     */
    getResizePoints(_symbol: T): TResizePoint[];
    canSelect(_symbol: T): boolean;
    canTransform(_symbol: T): boolean;
    canResize(_symbol: T): boolean;
    canRotate(_symbol: T): boolean;
    /**
     * Whether a resize of this symbol must preserve its aspect ratio.
     *
     * False by default. `IIResizeManager` decided this with
     * `isText(s) || isMath(s) || (isShape(s) && isCircleShape(s))`, which is a question about a
     * symbol asked from outside it — so a custom symbol could never require a locked ratio, however
     * badly a free scale would distort it.
     */
    keepsAspectRatio(_symbol: T): boolean;
    /**
     * The element that draws this symbol.
     *
     * Required rather than optional: a symbol nothing can draw is a symbol the canvas cannot show,
     * and when this was optional a custom util that omitted it registered successfully and then
     * silently rendered nothing. Return `undefined` only for a state deliberately left undrawn — the
     * decorator does that for a kind it does not own.
     *
     * Honoured by the SVG renderer, which `InteractiveInkCanvas`, `InkCanvas` and
     * `InteractiveInkSSRCanvas` all use. **`InkCanvasDeprecated` (INK_V1) ignores it**: it draws
     * through `CanvasRenderer`, which dispatches on `isStroke` and two fixed renderer tables instead
     * of asking the registry, so a registered custom symbol is invisible there and logs
     * "symbol type unknown". That variant is deprecated and not worth wiring up.
     */
    abstract getSVGElement(symbol: T): SVGGraphicsElement | undefined;
    /**
     * The attributes on the group every symbol is drawn inside.
     *
     * The same five for every type, plus the matrix when there is one — written once here rather than
     * copied into each `getSVGElement`, where six copies had already started to drift apart in what
     * they called the `type` attribute.
     *
     * A type that needs more overrides this and spreads the result: the shape and edge families add
     * their `kind`, and the typeset one adds what a rendered word needs that a path does not.
     */
    protected getGroupAttributes(symbol: T): Record<string, string>;
}

/**
 * @group SymbolUtils
 */
declare class DecoratorUtil extends SymbolUtil<TDecorator> {
    readonly type = SymbolType.Decorator;
    create(partial: TPartialDeep<TDecorator>): TDecorator;
    /**
     * Deliberately nothing. A standalone decorator follows the symbols it decorates: the transform
     * manager composes their matrix onto it, or refits its box when only some of them moved — moving
     * the decorator itself as well would double the displacement. `IIAbstractTransformManager.applyToSymbol` still returns early
     * for decorators, so nothing calls this yet; it becomes the live path when IIC-2014 removes that
     * early return, and stating the exception here is what keeps it from being lost.
     *
     * Overriding `applyTransform` rather than `translate`/`rotate`/`resize` individually: those three
     * are concrete on `SymbolUtil` now and all three route through this one method, so a single
     * no-op here covers all three at once instead of three separate ones.
     */
    applyTransform(): void;
    /**
     * A decorator's geometry is read, not derived: `targetBounds` is an input written by whoever
     * placed it (see `TDecorator.targetBounds`). This util is the one that reports a stored box
     * because it is the one type whose box does not come from coordinates it owns.
     *
     * No `targetBounds` means no box of its own — a decorator embedded in a `TText`/`TMath`, or
     * standalone but not yet placed. It reports empty rather than two phantom points at the origin,
     * which is what a zero-size box would produce.
     */
    /**
     * The box a decorator was placed against, as a shape.
     *
     * Its target's box rather than the line it draws: a decorator is found wherever what it decorates
     * is, which is what `DecoratorUtil.overlaps` tested against and what `targetBounds` holds. Filled,
     * so a query landing inside the decorated text catches it the way a query crossing the text's edge
     * does — again matching the box test this replaces.
     *
     * The box's own angle is handed over as the frame, so the corners come back as the very box that
     * was stored rather than as an axis-aligned one drawn around it.
     *
     * A decorator with no target has no place on the page, and an empty polygon overlaps nothing.
     */
    getGeometry(decorator: TDecorator): Geometry2d;
    /** The two ends of the line it draws, carried by the matrix it took from its targets. */
    getSnapPoints(decorator: TDecorator): TPoint[];
    canResize(_decorator: TDecorator): boolean;
    canRotate(_decorator: TDecorator): boolean;
    getSVGElement(decorator: TDecorator): SVGGeometryElement | undefined;
    static renderForSymbol(decorator: TDecorator, symbol: TBaseSymbol): SVGGeometryElement | undefined;
    static renderFromBounds(decorator: TDecorator, bounds: TOBB, baseline?: number, xHeight?: number, symbolStyle?: {
        width?: number;
        color?: string;
    }): SVGGeometryElement | undefined;
    static createDecorator(kind: DecoratorKind, style: TPartialDeep<TStyle>, targetIds?: string[], targetBounds?: TBox): TDecorator;
    static setTargetBounds(decorator: TDecorator, targetBounds: TOBB): void;
    /**
     * Refits the box around `targets` (document coordinates), expressed in the decorator's own frame
     * so that the matrix it took from earlier transforms still places it.
     */
    static refitTargetBounds(decorator: TDecorator, targets: TOBB[]): void;
    /** The two endpoints of the horizontal line a decorator's own geometry is: the middle of its bounds. */
    static computeVertices(bounds: TOBB): TPoint[];
}

/**
 * @group SymbolUtils
 */
declare const arrowHeadStartMarkerId = "arrow-head-start";
/**
 * @group SymbolUtils
 */
declare const arrowHeadEndMarkerId = "arrow-head-end";

/**
 * @group SymbolUtils
 * @summary A symbol drawn as a single `<path>`.
 *
 * The shape of most of what the library renders — a stroke, a geometric shape, an edge. Each one
 * used to build a `<g>`, append one `<path>` to it and return the group, which is three copies of an
 * assembly that differs only in what goes on the path.
 *
 * **There is no group any more.** A group holding exactly one child adds a node per symbol and
 * carries nothing the child could not carry itself: `id`, `type` and `kind` are found by attribute
 * either way, `transform` on a single child is the same transform, and `stroke-linecap` and
 * `stroke-linejoin` inherit. On a 4419-symbol document that is 4419 nodes the browser no longer
 * lays out.
 *
 * **One attribute did not merely move: `vector-effect`.** It is not an inherited property, so on the
 * group it applied to the group — which draws nothing — and never reached the path. It was inert.
 * On the path it takes effect, and `non-scaling-stroke` means what it says: stroke width stops
 * growing with the zoom, since the renderer zooms by `viewBox`. That is a deliberate change of
 * appearance, not a side effect — the attribute had been asking for this since it was written.
 *
 * A type in this family says what its path is worth drawing — its `d`, and the fill, stroke and
 * width around it — and inherits the rest.
 */
declare abstract class PathSymbolUtil<T extends TBaseSymbol> extends SymbolUtil<T> {
    #private;
    /**
     * The `d` of the path this symbol draws.
     *
     * Separate from {@link PathSymbolUtil.getPathAttributes} because it is the one part no default can
     * supply and the one part a new type always has to write: `d` *is* the shape as drawn.
     */
    protected abstract getPathData(symbol: T): string;
    /**
     * Everything on that path except `d` — fill, stroke, width, and whatever else the type paints
     * with.
     *
     * No default: the three built-in families disagree on all three of those, and they are right to.
     * A stroke is a filled outline with no stroke colour at all; an edge is a stroked line on no fill;
     * a shape is both, and its fill comes from the style. A default here would be one of the three
     * quietly imposed on the others.
     */
    protected abstract getPathAttributes(symbol: T): Record<string, string>;
    getSVGElement(symbol: T): SVGGraphicsElement;
}

/**
 * @group SymbolUtils
 */
declare class EdgeUtil extends PathSymbolUtil<TEdge> {
    readonly type = SymbolType.Edge;
    create(partial: TPartialDeep<TEdge>): TEdge;
    /**
     * An unregistered kind gets an empty path: no vertices, no edges, an empty box at the origin, and
     * so no overlap with anything — the same answer the record fallback gave.
     */
    getGeometry(edge: TEdge): Geometry2d;
    /**
     * Kind by kind, then carried through the matrix — an edge snaps on its own vertices, not on the
     * corners of a box it never drew.
     */
    getSnapPoints(edge: TEdge): TPoint[];
    /**
     * Computed raw, from the table, same as always — then carried through the matrix like any other
     * point a util hands back. A resize handle drawn straight from these has to land where the edge is
     * actually drawn, not where it was before its last translate/rotate/resize.
     */
    getResizePoints(edge: TEdge): TResizePoint[];
    static getSVGPath(edge: TEdge): string;
    /** Which of the three kinds it is, on top of what every symbol's group carries. */
    protected getGroupAttributes(edge: TEdge): Record<string, string>;
    protected getPathData(edge: TEdge): string;
    /** Stroked on no fill — a line encloses nothing — plus whichever arrow heads it carries. */
    protected getPathAttributes(edge: TEdge): Record<string, string>;
    static createLine(start: TPoint, end: TPoint, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: TPartialDeep<TStyle>): TEdgeLine;
    static createLineFromPartial(partial: TPartialDeep<TEdgeLine>): TEdgeLine;
    static getLineVertices(line: TEdgeLine): TPoint[];
    static getLineResizePoints(line: TEdgeLine): TResizePoint[];
    /**
     * Moves the vertex a resize handle owns, by writing into the geometry the line actually stores.
     *
     * A line's vertices are its `start` and `end`, and `computeVertices` returns those very objects —
     * so the drag handler used to mutate `line.vertices[i]` and reach them by aliasing. That worked
     * only as long as the array was stored and shared; a computed one would take the write and throw
     * it away, silently. This says which field a handle owns instead of relying on that.
     */
    static moveLineVertex(line: TEdgeLine, vertexIndex: number, point: TPoint): void;
    static getLinePath(line: TEdgeLine): string;
    static createArc(center: TPoint, startAngle: number, sweepAngle: number, radiusX: number, radiusY: number, phi: number, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: TPartialDeep<TStyle>): TEdgeArc;
    static createArcFromPartial(partial: TPartialDeep<TEdgeArc>): TEdgeArc;
    static getArcVertices(arc: TEdgeArc): TPoint[];
    static getArcSnapPoints(vertices: TPoint[]): TPoint[];
    static getArcResizePoints(arc: TEdgeArc): TResizePoint[];
    static getArcPath(arc: TEdgeArc): string;
    static createPolyLine(points: TPoint[], startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: TPartialDeep<TStyle>): TEdgePolyLine;
    static createPolyLineFromPartial(partial: TPartialDeep<TEdgePolyLine>): TEdgePolyLine;
    /**
     * A polyline's vertices are the points it stores, returned as-is.
     *
     * Named rather than inlined so every caller goes through one place: `getGeometry`,
     * `getResizePoints` and the edge-kind table all used to reach for the stored `vertices` field.
     */
    static getPolyLineVertices(polyline: TEdgePolyLine): TPoint[];
    static getPolyLineResizePoints(polyline: TEdgePolyLine): TResizePoint[];
    /**
     * Moves the vertex a resize handle owns, by writing into the geometry the polyline stores.
     *
     * A polyline's vertices *are* its `points`, so the drag handler used to reach them by aliasing
     * through the stored array. See `EdgeUtil.moveLineVertex` for why that is no longer relied on.
     */
    static movePolyLineVertex(polyline: TEdgePolyLine, vertexIndex: number, point: TPoint): void;
    static getPolyLinePath(polyline: TEdgePolyLine): string;
    /**
     * @group Symbol
     * @summary Check if symbol is an edge (line, arc, polyline)
     * @param symbol - Symbol to check
     * @returns True if symbol is an edge
     */
    static isEdge(symbol: TBaseSymbol): symbol is TEdge;
    /**
     * @group Symbol
     * @summary Type guard to check if an edge is a line
     * @param edge - The edge to check
     * @returns True if the edge is a line
     */
    static isLineEdge(edge: TBaseSymbol): edge is TEdgeLine;
    /**
     * @group Symbol
     * @summary Type guard to check if an edge is an arc
     * @param edge - The edge to check
     * @returns True if the edge is an arc
     */
    static isArcEdge(edge: TBaseSymbol): edge is TEdgeArc;
    /**
     * @group Symbol
     * @summary Type guard to check if an edge is a polyline
     * @param edge - The edge to check
     * @returns True if the edge is a polyline
     */
    static isPolyEdge(edge: TBaseSymbol): edge is TEdgePolyLine;
}

/**
 * Everything a family util needs to know about one kind within its family.
 *
 * A family util (`ShapeUtil`, `EdgeUtil`) owns a type; the kinds inside it used to be resolved by a
 * `switch` per method, which let a new kind be added to `create` and forgotten in `overlaps`. One
 * table of these instead makes a kind a single entry, and a missing method a compile error.
 *
 * Exported because every file is reachable from its folder barrel, but this is how the built-in
 * families are written, not yet a contract integrators may implement against.
 * @group SymbolUtils
 * @experimental
 */
type TKindDefinition<T> = {
    create(partial: TPartialDeep<T>): T;
    /**
     * This kind's shape, which answers overlap, containment and distance for itself.
     *
     * Replaces the pair of geometry and overlap methods a kind used to supply: the second was always a
     * question about the first, and splitting them let a kind describe one shape and test another.
     */
    getGeometry(symbol: T): Geometry2d;
    /**
     * Where this kind offers to snap, in its own untransformed frame — the family util carries them
     * through the symbol's matrix.
     *
     * Kind-specific because it is a decision about the symbol rather than about its outline: an edge
     * snaps on its own vertices, a shape on the corners and mid-sides of its box. Omitted means the
     * box, which is what every shape kind wants and no edge kind does.
     */
    getSnapPoints?(symbol: T): TPoint[];
    getSVGPath(symbol: T): string;
    /**
     * Extra attributes for the rendered path. Only a kind that needs them supplies this — it is what
     * replaces an `if (symbol.kind === …)` sitting inside a family's shared `getSVGElement`.
     */
    extraPathAttributes?(symbol: T): Record<string, string>;
    /**
     * Handles for vertex-level resizing. Optional in the same way: edge kinds offer them, shape kinds
     * do not, and a family util reports an empty list for a kind that leaves this out.
     */
    getResizePoints?(symbol: T): TResizePoint[];
    /**
     * Whether this kind must be resized with its ratio locked. A property of the kind rather than of
     * an instance, so it is a flag: only the circle sets it, because one radius cannot describe two
     * different scales.
     */
    keepsAspectRatio?: boolean;
};
/**
 * Narrows a definition written against one concrete kind to the union its table is keyed on.
 *
 * The switches these tables replaced carried a cast per branch per method — twelve in `ShapeUtil`,
 * twelve in `EdgeUtil`. Writing each entry against its own type collapses all of them into the one
 * cast below, which is the only place a kind's type is asserted rather than checked.
 * @group SymbolUtils
 * @experimental
 */
declare function defineKind<TFamily, TKind extends TFamily>(definition: TKindDefinition<TKind>): TKindDefinition<TFamily>;
/**
 * Looks a kind up in its family's table, throwing a message naming the family and the operation
 * when the kind is unknown.
 * @group SymbolUtils
 * @experimental
 */
declare function resolveKind<T>(table: Partial<Record<string, TKindDefinition<T>>>, kind: string | undefined, family: string, operation: string): TKindDefinition<T>;

/**
 * @group SymbolUtils
 */
declare function registerBuiltinSymbolUtils(): void;

/**
 * @group SymbolUtils
 */
declare class ShapeUtil extends PathSymbolUtil<TShape> {
    readonly type = SymbolType.Shape;
    create(partial: TPartialDeep<TShape>): TShape;
    /**
     * An unregistered kind gets an empty polygon: no vertices, no edges, an empty box at the origin,
     * and so no overlap with anything. Same answer the record fallback gave, said once instead of
     * field by field.
     */
    getGeometry(shape: TShape): Geometry2d;
    /**
     * A shape snaps on its box — corners, mid-sides and centre — whatever its outline looks like.
     *
     * None at all for a kind the table does not own: its box is an empty one at the origin, and
     * offering nine snap points there would pull anything nearby to the corner of the page.
     */
    getSnapPoints(shape: TShape): TPoint[];
    keepsAspectRatio(shape: TShape): boolean;
    static getSVGPath(shape: TShape): string;
    /** Which of the three kinds it is, on top of what every symbol's group carries. */
    protected getGroupAttributes(shape: TShape): Record<string, string>;
    protected getPathData(shape: TShape): string;
    /** Stroked *and* filled, the fill coming from the style — the only family that paints both. */
    protected getPathAttributes(shape: TShape): Record<string, string>;
    static createCircle(center: TPoint, radius: number, style?: TPartialDeep<TStyle>): TShapeCircle;
    static createCircleFromPartial(partial: TPartialDeep<TShapeCircle>): TShapeCircle;
    static createCircleBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapeCircle;
    static updateCircleBetweenPoints(circle: TShapeCircle, _origin: TPoint, target: TPoint): void;
    static getCirclePath(circle: TShapeCircle): string;
    static createEllipse(center: TPoint, radiusX: number, radiusY: number, orientation: number, style?: TPartialDeep<TStyle>): TShapeEllipse;
    static createEllipseFromPartial(partial: TPartialDeep<TShapeEllipse>): TShapeEllipse;
    static createEllipseBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapeEllipse;
    static updateEllipseBetweenPoints(ellipse: TShapeEllipse, origin: TPoint, target: TPoint): void;
    static getEllipsePath(ellipse: TShapeEllipse): string;
    static createPolygon(points: TPoint[], style?: TPartialDeep<TStyle>): TShapePolygon;
    static createPolygonFromPartial(partial: TPartialDeep<TShapePolygon>): TShapePolygon;
    static createTriangleBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon;
    static updateTriangleBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void;
    static createParallelogramBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon;
    static updateParallelogramBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void;
    static createRectangleBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon;
    static updateRectangleBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void;
    static createRhombusBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon;
    static updateRhombusBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void;
    static getPolygonPath(polygon: TShapePolygon): string;
    /**
     * @group Symbol
     * @summary Check if symbol is a shape (circle, ellipse, polygon)
     * @param symbol - Symbol to check
     * @returns True if symbol is a shape
     */
    static isShape(symbol: TBaseSymbol): symbol is TShape;
    /**
     * @group Symbol
     * @summary Type guard to check if a shape is a circle
     * @param shape - The shape to check
     * @returns True if the shape is a circle
     */
    static isCircleShape(shape: TBaseSymbol): shape is TShapeCircle;
    /**
     * @group Symbol
     * @summary Type guard to check if a shape is an ellipse
     * @param shape - The shape to check
     * @returns True if the shape is an ellipse
     */
    static isEllipseShape(shape: TBaseSymbol): shape is TShapeEllipse;
    /**
     * @group Symbol
     * @summary Type guard to check if a shape is a polygon
     * @param shape - The shape to check
     * @returns True if the shape is a polygon
     */
    static isPolygonShape(shape: TBaseSymbol): shape is TShapePolygon;
}

/**
 * @group SymbolUtils
 */
declare class StrokeUtil extends PathSymbolUtil<TStroke> {
    #private;
    readonly type = SymbolType.Stroke;
    create(partial: TPartialDeep<TStroke>): TStroke;
    /**
     * A stroke is the run of points the pen left, and {@link PointSet2d} is exactly that shape: its
     * path, length and box all come from the same samples, and it is caught by a query holding one of
     * them rather than by the drawn line crossing it — which is what a stroke's selection has always
     * meant.
     */
    getGeometry(stroke: TStroke): PointSet2d;
    /**
     * The geometry answers, so this no longer explains what a stroke's overlap means — {@link PointSet2d}
     * does, once, for anything shaped like a run of samples.
     *
     * It also drops the apparatus this type used to need: that mapped the query *backwards*
     * through the symbol's inverse matrix and needed a second, exact callback for the rotated case,
     * because the raw geometry could not be moved. A `Geometry2d` can, so the symbol goes forwards
     * instead and the axis-aligned query is tested as it stands — the same answer, without an inverse
     * to guard against, a determinant to check, or a quad to special-case.
     */
    /**
     * A stroke snaps on its box, not on the samples themselves: an ink trace has no corner anything
     * would want to land on.
     */
    getSnapPoints(stroke: TStroke): TPoint[];
    protected getPathData(stroke: TStroke): string;
    /**
     * Filled, not stroked: a stroke's path is the outline of the ink, so the colour goes on `fill` and
     * there is no stroke colour at all. `stroke-width` still carries the nominal width, which the
     * outline was built from.
     */
    protected getPathAttributes(stroke: TStroke): Record<string, string>;
    /**
     * @param creationTime - Epoch instant the stroke began, defaulting to now. Pass the instant the
     * capture actually started: it is the origin the `dt` field of every {@link TPointer} counts from, so
     * it is what turns them back into the absolute times the recognizer orders strokes by.
     */
    static createEmpty(style?: TPartialDeep<TStyle>, pointerType?: string, creationTime?: number): TStroke;
    /**
     * Whether the stroke reads as bold: wider than 2px. The rule the conversion uses to pick a text's
     * font weight, and the one the thicken gesture toggles on.
     */
    static isBold(stroke: TStroke): boolean;
    static addPointer(stroke: TStroke, pointer: TPointer): void;
    static split(strokeToSplit: TStroke, i: number): {
        before: TStroke;
        after: TStroke;
    };
    static substract(stroke: TStroke, partStroke: TStroke): {
        before?: TStroke;
        after?: TStroke;
    };
    static createFromPartial(partial: TStrokeImport): TStroke;
    static getSVGPath(stroke: TStroke): string;
}

/**
 * @group SymbolUtils
 */
declare class SVGBuilder {
    static createLayer(boundingBox: TBox, attrs?: {
        [key: string]: string;
    }): SVGSVGElement;
    static createFilter(id: string, attrs?: {
        [key: string]: string;
    }): SVGFilterElement;
    static createDefs(): SVGDefsElement;
    static createMarker(id: string, attrs?: {
        [key: string]: string;
    }): SVGMarkerElement;
    static createPattern(id: string, box: TBox, attrs?: {
        [key: string]: string;
    }): SVGPatternElement;
    static createComponentTransfert(): SVGFEComponentTransferElement;
    static createTransfertFunctionTable(type: "feFuncA" | "feFuncB" | "feFuncG" | "feFuncR", values: string): SVGFEFuncAElement;
    static createGroup(attrs?: {
        [key: string]: string;
    }): SVGGElement;
    static createLine(p1: TPoint, p2: TPoint, attrs?: {
        [key: string]: string;
    }): SVGLineElement;
    static createCircle(p: TPoint, r: number, attrs?: {
        [key: string]: string;
    }): SVGCircleElement;
    static createPath(attrs?: {
        [key: string]: string;
    }): SVGPathElement;
    static createPolygon(points: number[], attrs?: {
        [key: string]: string;
    }): SVGPolylineElement;
    static createRect(box: TBox, attrs?: {
        [key: string]: string;
    }): SVGRectElement;
    static createTSpan(text: string, attrs?: {
        [key: string]: string;
    }): SVGTSpanElement;
    static createText(p: TPoint, text: string, attrs?: {
        [key: string]: string;
    }): SVGTextElement;
}

/**
 * @group SymbolUtils
 * @summary Create any TSymbol from partial data, by asking the registry which util owns the type.
 *
 * There used to be a `switch` here with a branch per built-in type, calling each family's `Ops`
 * directly and falling back to the registry only for unknown types. That made the registry a
 * second-class path: `ShapeUtil.create` and `EdgeUtil.create` were never reached, so the `switch`
 * on `kind` inside them was dead code kept alive by a contract nobody called.
 *
 * Requires {@link registerBuiltinSymbolUtils} to have run. Both canvases that create symbols from
 * partials call it in `initialize()`, and the error below says so rather than letting a missing
 * registration surface as a `TypeError`.
 */
declare function createSymbolFromPartial(partial: TPartialDeep<TSymbol>): TSymbol;
/**
 * @group SymbolUtils
 * @summary Create multiple TSymbols from partial data — accumulates errors.
 */
declare function createSymbolsFromPartial(partials: TPartialDeep<TSymbol>[]): TSymbol[];

/**
 * A symbol's geometry straight from its util, before its matrix is applied — cached the same way
 * `of` below caches the transformed result, so a frozen symbol's geometry is still built at most
 * once no matter how many times the raw and the transformed geometry are each read.
 */
declare function rawOf(symbol: TBaseSymbol): Geometry2d;
declare function of(symbol: TBaseSymbol): Geometry2d;
/**
 * @group SymbolUtils
 * @summary Reads a symbol's derived geometry — bounds, vertices, snap points, edges, length.
 *
 * Every accessor below calls the module-level `of` directly rather than `this.of` — so
 * `const { boundsOf } = SymbolGeometry` and `symbols.map(SymbolGeometry.boundsOf)` both work. A
 * `this`-bound accessor throws the moment it is detached from the object, which is exactly the
 * shape a read-site migration across the codebase produces.
 */
declare const SymbolGeometry: {
    of: typeof of;
    rawOf: typeof rawOf;
    boundsOf(symbol: TBaseSymbol): TOBB;
    verticesOf(symbol: TBaseSymbol): TPoint[];
    /**
     * Snap points come from the util, not from the geometry.
     *
     * A `Geometry2d` describes a shape; where that shape offers to snap is a decision about the symbol,
     * not about its outline — a text snaps on its box, never on its glyphs. Every util already answered
     * this, with the same one line six times over, which is exactly what this used to recompute for
     * itself.
     */
    snapPointsOf(symbol: TBaseSymbol): TPoint[];
    edgesOf(symbol: TBaseSymbol): TSegment[];
    lengthOf(symbol: TBaseSymbol): number;
};

/**
 * @group SymbolUtils
 * @summary Registry for SymbolUtil implementations.
 *
 * Built-in types are registered via `registerBuiltinSymbolUtils()`, which the
 * canvas calls on initialisation. External consumers may register additional
 * types before or after canvas creation:
 *
 * @example
 * import { symbolRegistry } from "iink-ts"
 * symbolRegistry.register(new StickyNoteUtil())
 */
declare class SymbolRegistryClass {
    #private;
    register<T extends TBaseSymbol>(util: SymbolUtil<T>): this;
    getUtil<T extends TBaseSymbol>(type: string): SymbolUtil<T> | undefined;
    /**
     * The util that owns a symbol, or a throw naming what is registered.
     *
     * Unlike {@link getUtil} this does not return `undefined`. It serves the paths that ask a symbol
     * for its own behaviour — deriving fields after a transform, for instance — where carrying on
     * without a util would silently skip the work and leave stale geometry behind a symbol that looks
     * fine. A missing registration is a setup bug and should say so.
     */
    getUtilFor<T extends TBaseSymbol>(symbol: T): SymbolUtil<T>;
    has(type: string): boolean;
    /**
     * Every registered type. Exists so a failed lookup can say what *is* registered — the difference
     * between "you spelled the type wrong" and "registerBuiltinSymbolUtils never ran".
     */
    registeredTypes(): string[];
}
/**
 * @group SymbolUtils
 */
declare const symbolRegistry: SymbolRegistryClass;

declare abstract class TypesetUtil<T extends TText | TMath> extends SymbolUtil<T> {
    /**
     * Shared whole: `TText` and `TMath` derive identically, down to the formula. `symbol.bounds` is
     * always the raw, unrotated box a typeset symbol was measured at — the matrix, not a stored angle,
     * is what turns it, and `SymbolGeometry` applies that matrix on top of this raw geometry.
     */
    /**
     * The box the symbol was measured at, as a shape.
     *
     * An outline rather than a filled one, and that is the behaviour it had: `typesetOverlapsBox` asked
     * "a corner inside the query, or a side crossing one of its sides", both about the boundary. A
     * query landing wholly inside a word therefore did not select it, and still does not.
     *
     * `symbol.bounds` is the raw box, always measured unrotated and unscaled — turning and scaling are
     * the matrix's job — so its corners are the shape, and a frame angle would have nothing to carry.
     */
    getGeometry(symbol: T): Polygon2d;
    /**
     * Where a typeset symbol offers to snap, before its matrix: the corners of its box lifted onto the
     * baseline, and its centre. Not the box's own corners — a word is read from its baseline, and
     * lining two words up by their descenders would look wrong.
     */
    protected rawSnapPoints(symbol: T): TPoint[];
    /**
     * A rendered word carries what a path does not: `style: noSelection`, so a drag over it moves the
     * symbol instead of selecting its letters as text, and its opacity — which for a path symbol goes
     * on the path, and here has no path to go on.
     */
    protected getGroupAttributes(symbol: T): Record<string, string>;
    /**
     * The glyphs this symbol draws, in the order they go into the group.
     *
     * The only thing text and math do differently: text lays its characters out as tspans on one
     * baseline, math positions super- and subscripts itself. Everything around it — the group, its
     * attributes, the decorators and the order they are layered in — is shared below.
     */
    protected abstract buildContent(symbol: T): SVGElement[];
    /**
     * The group, the glyphs, then the decorators — highlights underneath, everything else on top.
     *
     * That layering is why decorators are appended here rather than by each subclass: a highlight
     * drawn after the text would paint over it, and the two utils had the same ten lines to avoid it.
     */
    getSVGElement(symbol: T): SVGGraphicsElement;
    /** Shared by text and math, which had the same one line each. */
    /** Shared by text and math, which had the same one line each. */
    getSnapPoints(symbol: T): TPoint[];
    /**
     * Always. A typeset symbol is drawn from glyphs at a font size, and a font size is one number —
     * scaling the axes unequally would ask for glyphs that do not exist.
     */
    keepsAspectRatio(_symbol: T): boolean;
}

/**
 * @group SymbolUtils
 */
declare class MathUtil extends TypesetUtil<TMath> {
    readonly type = SymbolType.Math;
    create(partial: TPartialDeep<TMath>): TMath;
    /**
     * One text element per element when any of them is a super- or subscript, laid out by hand;
     * otherwise one text element with a tspan each, the way text does it.
     *
     * The hand-laid branch exists because a tspan cannot be lifted off the baseline on its own here —
     * the positions are computed from each element's own font size.
     */
    protected buildContent(math: TMath): SVGElement[];
    static createMath(elements: TMathElement[], point: TPoint, boundsBox: TBox, style?: TPartialDeep<TStyle>): TMath;
    static createFromPartial(partial: TPartialDeep<TMath>): TMath;
    static getChildrenOverlaps(math: TMath, points: TPoint[]): TMathElement[];
    static updateChildrenStyle(math: TMath): void;
    static updateChildrenFont(math: TMath, { fontSize, fontWeight, fontFamily, }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold";
        fontFamily?: string;
    }): void;
    /** Whether every element of the math block is bold. An empty block is not. */
    static isBold(math: TMath): boolean;
    static getLabel(math: TMath): string;
    static toJSON(math: TMath): TPartialDeep<TMath>;
}

/**
 * @group SymbolUtils
 */
declare class TextUtil extends TypesetUtil<TText> {
    readonly type = SymbolType.Text;
    create(partial: TPartialDeep<TText>): TText;
    /** One text element on the baseline, one tspan per character. */
    protected buildContent(text: TText): SVGElement[];
    static createText(chars: TSymbolChar[], point: TPoint, boundsBox: TBox, style?: TPartialDeep<TStyle>): TText;
    static createFromPartial(partial: TPartialDeep<TText>): TText;
    static getChildrenOverlaps(text: TText, points: TPoint[]): TSymbolChar[];
    static updateChildrenStyle(text: TText): void;
    static updateChildrenFont(text: TText, { fontSize, fontWeight, }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold";
    }): void;
    /** Whether every char of the text is bold. An empty text is not. */
    static isBold(text: TText): boolean;
    static getLabel(text: TText): string;
    static toJSON(text: TText): TPartialDeep<TText>;
}

/**
 * @group Renderer
 */
declare const SVGRendererConst: {
    /** Class a selected symbol's element carries; its outline is drawn by the stylesheet */
    selectedClassName: string;
    /** Class of the wider copy drawn under a selected shape or edge; the stylesheet colours it */
    selectionHaloClassName: string;
    /** Class a symbol's element carries while the eraser passes over it; the stylesheet fades it */
    deletingClassName: string;
    crossMarker: string;
    noSelection: string;
};
/**
 * Common SVG path attribute presets for guide rendering
 * @group Renderer
 */
declare const GUIDE_PATH_ATTRS: {
    readonly "stroke-width": "1";
    readonly stroke: "grey";
    readonly fill: "none";
};
/**
 * Common SVG path attribute presets for sub-guide rendering
 * @group Renderer
 */
declare const SUB_GUIDE_PATH_ATTRS: {
    readonly "stroke-width": "0.25";
    readonly stroke: "grey";
    readonly fill: "none";
};

/**
 * @group Renderer
 */
declare class SVGStroker {
    protected getArcPath(center: TPointer, radius: number): string;
    protected getLinePath(begin: TPointer, end: TPointer, width: number): string;
    protected getFinalPath(begin: TPointer, end: TPointer, width: number): string;
    protected getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string;
    protected buildSVGPath(stroke: TLegacyStroke): string;
    drawStroke(svgElement: SVGElement, stroke: TLegacyStroke, attrs?: {
        name: string;
        value: string;
    }[]): void;
}

/**
 * @group Renderer
 */
declare class InteractiveInkSSRSVGRenderer {
    #private;
    config: TRendererConfiguration;
    stroker: SVGStroker;
    context: {
        parent: HTMLElement;
    };
    constructor(config: TRendererConfiguration);
    init(element: HTMLElement): void;
    protected drawStroke(svgElement: SVGElement, stroke: TLegacyStroke): void;
    protected replaceAll(layerName: string, update: TUpdatePatchReplaceAll): void;
    protected replaceElement(update: TUpdatePatchReplaceELement): void;
    protected appendChild(layerName: string, update: TUpdatePatchAppendChild): void;
    protected removeChild(update: TUpdatePatchRemoveChild): void;
    protected removeElement(update: TUpdatePatchRemoveElement): void;
    protected insertBefore(update: TUpdatePatchInsertBefore): void;
    protected setAttribute(update: TUpdatePatchSetAttribut): void;
    protected removeAttribute(update: TUpdatePatchRemoveAttribut): void;
    updateLayer(layerName: string, update: TUpdatePatch): void;
    updatesLayer(layerName: string, updates: TUpdatePatch[]): void;
    clearPendingStroke(): void;
    drawPendingStroke(stroke: TLegacyStroke): void;
    clearErasingStrokes(): void;
    resize(model: Model): void;
    destroy(): void;
}

/**
 * @group Manager
 */
declare abstract class AbstractWriterManager {
    #private;
    grabber: PointerEventGrabber;
    canvas: TInteractiveInkCanvas | TInkCanvas;
    currentSymbol?: TSymbol;
    detectGesture: boolean;
    constructor(canvas: TInteractiveInkCanvas | TInkCanvas);
    get renderer(): SVGRenderer;
    attach(layer: HTMLElement): void;
    detach(): void;
    protected abstract createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string, creationTime: number): TSymbol;
    protected abstract updateCurrentSymbol(pointer: TPointer): TSymbol;
    start(info: TPointerInfo): void;
    continue(info: TPointerInfo): void;
    abstract end(info: TPointerInfo): Promise<void>;
}

/**
 * @group Canvas
 * @summary
 * List the possibilities of interactions
 */
declare enum CanvasTool {
    Write = "write",
    Erase = "erase",
    /**
     * @remarks only usable in the case of interactive ink canvas
     */
    Select = "select",
    /**
     * @remarks only usable in the case of interactive ink canvas
     */
    Move = "move"
}

/**
 * @group Manager
 */
declare class ColorPaletteManager {
    #private;
    private static instance;
    private static readonly EXCEL_PALETTE;
    private constructor();
    static getInstance(): ColorPaletteManager;
    /**
     * Get color for a variable name. Same variable always gets the same color.
     */
    getColorForVariable(variableName: string): string;
    /**
     * Get all variable colors
     */
    getAllVariableColors(): Map<string, string>;
    /**
     * Clear all variable color assignments
     */
    clear(): void;
    /**
     * Remove color assignment for a specific variable
     */
    removeVariable(variableName: string): void;
    /**
     * Get the full color palette
     */
    static getPalette(): string[];
}

/**
 * @group Manager
 */
type THittable = {
    bounds: TOBB;
    vertices: TPoint[];
    edges: TSegment[];
};
/**
 * @group Manager
 */
declare class EraseManager {
    #private;
    grabber: PointerEventGrabber;
    canvas: TInteractiveInkCanvas | TInkCanvas;
    eraserWidth: number;
    currentEraser?: TEraser;
    deletingIds: Set<string>;
    charsToDelete: Map<string, Set<string>>;
    constructor(canvas: TInteractiveInkCanvas | TInkCanvas);
    get renderer(): SVGRenderer;
    attach(layer: HTMLElement): void;
    detach(): void;
    start(info: TPointerInfo): void;
    continue(info: TPointerInfo): void;
    end(info: TPointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
type TPDFPageFormat = "A4" | "Letter" | "Legal";
/**
 * @group Manager
 */
type TPDFOrientation = "portrait" | "landscape";
/**
 * @group Manager
 */
type TPDFPageSizeMm = {
    width: number;
    height: number;
};
/**
 * @group Manager
 */
type TPDFPageOptions = {
    format: TPDFPageFormat;
    orientation: TPDFOrientation;
    scale: number;
};
/**
 * @group Manager
 */
type TPDFPageCount = {
    columns: number;
    rows: number;
    total: number;
};
/**
 * @group Manager
 */
type TPDFPageMode = "single" | "multi";
/**
 * @group Manager
 */
type TPDFExportDialogOptions = {
    format: TPDFPageFormat;
    orientation: TPDFOrientation;
    mode: TPDFPageMode;
    scale: number;
};
/**
 * @group Manager
 */
declare class PDFExportManager {
    #private;
    static readonly DEFAULT_OPTIONS: TPDFExportDialogOptions;
    canvas: TInteractiveInkCanvas | TInkCanvas;
    constructor(canvas: TInteractiveInkCanvas | TInkCanvas);
    buildPrintContainer(svgContent: string): HTMLDivElement;
    removePrintContainer(): void;
    getPageDimensionsMm(format: TPDFPageFormat, orientation: TPDFOrientation): TPDFPageSizeMm;
    computePageCount(box: TBox, options: TPDFPageOptions): TPDFPageCount;
    computeFitToPageScale(box: TBox, format: TPDFPageFormat, orientation: TPDFOrientation): number;
    /**
     * Lay the content out on a single page, scaled to fit it.
     * @param scalePercent - Percentage of the fit-to-page size to use; 100 (the default) fills the
     *                       page, 50 draws the content at half that size
     */
    buildSinglePagePrintContainer(svgContent: string, box: TBox, format: TPDFPageFormat, orientation: TPDFOrientation, scalePercent?: number): HTMLDivElement;
    buildMultiPagePrintContainer(svgContent: string, box: TBox, options: TPDFPageOptions): HTMLDivElement;
    print(svgContent: string, box: TBox, options: TPDFExportDialogOptions): void;
    /**
     * Open the PDF settings dialog.
     * @param onConfirm - Called with the chosen settings when the user validates
     * @param onCancel - Called when the user dismisses the dialog, so callers awaiting the dialog
     *                   can settle instead of hanging forever
     */
    openExportDialog(onConfirm: (options: TPDFExportDialogOptions) => void, onCancel?: () => void): void;
}

/**
 * @group Export
 * @summary Sanitize a JIIX element id into a valid Mermaid/PlantUML identifier
 * @param id - JIIX element id
 * @returns Identifier containing only alphanumeric characters and underscores
 */
declare function sanitizeGraphId(id: string): string;
/**
 * @group Export
 * @summary Find the Text element whose bounding-box center lands inside a given box
 * @param box - Box to test against (typically a Node's bounding-box)
 * @param texts - Text elements to search
 * @returns The matching Text element's label, or undefined
 */
declare function findLabelInside(box: TBox | undefined, texts: TJIIXTextElement[]): string | undefined;
/**
 * Resolves which two Nodes an Edge connects. The server fills `connected`/`ports` once a
 * diagram has more than one shape — trust it first, since it reflects the actual recognition
 * rather than a geometric guess. Falls back to matching endpoints against node bounding boxes
 * when `connected` is absent (e.g. a lone edge with nothing to connect to).
 *
 * @group Export
 * @summary Resolve the two Nodes an Edge connects
 * @param edge - Edge element to resolve
 * @param nodes - Node elements to search
 * @returns Tuple of the source/target Node, or undefined if either end can't be resolved
 */
declare function resolveEdgeNodes(edge: TJIIXEdgeElement, nodes: TJIIXNodeElement[]): [TJIIXNodeElement, TJIIXNodeElement] | undefined;
/**
 * @group Export
 */
type TJIIXGraphElements = {
    nodes: TJIIXNodeElement[];
    texts: TJIIXTextElement[];
    edges: TJIIXEdgeElement[];
};
/**
 * @group Export
 * @summary Split a JIIX export's elements into diagram Nodes/Edges and their Text labels
 * @param jiix - JIIX export to inspect
 * @returns The Node, Text and Edge elements found in the export
 */
declare function extractJIIXGraphElements(jiix: TJIIXExport): TJIIXGraphElements;

/**
 * @group Export
 */
type TLLMContentBlock = {
    type: "text";
    content: string;
} | {
    type: "math";
    latex: string;
} | {
    type: "diagram";
    mermaid: string;
};
/**
 * @group Export
 */
type TLLMExport = {
    blocks: TLLMContentBlock[];
};
/**
 * @group Export
 * @summary Convert a JIIX export into a flat, prompt-ready JSON structure for LLM consumption
 * @param jiix - JIIX export to convert
 * @returns Ordered content blocks (text/math/diagram); diagram Nodes/Edges collapse into a single Mermaid block
 */
declare function jiixToLLM(jiix: TJIIXExport): TLLMExport;

/**
 * @group Export
 * @summary Convert a JIIX export into a Markdown string
 * @param jiix - JIIX export to convert
 * @returns Markdown representation of the JIIX export
 */
declare function jiixToMarkdown(jiix: TJIIXExport): string;

/**
 * @group Export
 * @summary Convert a JIIX diagram export into a Mermaid flowchart
 * @param jiix - JIIX export to convert
 * @returns Mermaid flowchart syntax
 */
declare function jiixToMermaid(jiix: TJIIXExport): string;

/**
 * @group Export
 * @summary Convert a JIIX diagram export into a PlantUML diagram
 * @param jiix - JIIX export to convert
 * @returns PlantUML `@startuml`/`@enduml` diagram syntax
 */
declare function jiixToPlantUML(jiix: TJIIXExport): string;

/**
 * Maps every export format to the type {@link TInteractiveInkCanvas.exportAs} resolves with.
 *
 * The union of export formats is intentionally **closed**: adding a format means adding an entry
 * here, so the format union, the result type and the exhaustiveness checks stay in sync.
 *
 * @group Manager
 */
type TExportResultMap = {
    /** Local model symbols, cloned */
    json: TSymbol[];
    /** Serialized SVG of the rendered symbols */
    svg: string;
    /** PNG rasterization of the rendered symbols */
    png: Blob;
    /** Plain text extracted from the JIIX index, in reading order */
    text: string;
    /** Markdown derived from the JIIX export */
    markdown: string;
    /** Mermaid flowchart derived from the JIIX export */
    mermaid: string;
    /** PlantUML diagram derived from the JIIX export */
    plantuml: string;
    /** Prompt-ready content blocks derived from the JIIX export */
    llm: TLLMExport;
    /** Raw JIIX export returned by the server */
    jiix: TJIIXExport;
};
/**
 * Formats {@link TInteractiveInkCanvas.exportAs} can return a value for.
 *
 * `pdf` is deliberately absent: printing produces no in-memory value, so it only exists on
 * {@link TInteractiveInkCanvas.download} (see {@link TDownloadFormat}).
 *
 * @group Manager
 */
type TExportFormat = keyof TExportResultMap;
/**
 * Formats {@link TInteractiveInkCanvas.download} accepts — every {@link TExportFormat} plus `pdf`.
 * @group Manager
 */
type TDownloadFormat = TExportFormat | "pdf";
/**
 * Which symbols an export covers.
 *
 * @remarks
 * When both `scope` and `symbols` are provided, `symbols` wins and `scope` is ignored — no error
 * is thrown, the explicit list is always the more specific intent.
 *
 * @group Manager
 */
type TExportOptions = {
    /** `"all"` (default) exports the whole model, `"selection"` only the selected symbols */
    scope?: "all" | "selection";
    /** Explicit symbol list to export; takes precedence over `scope` */
    symbols?: TSymbol[];
};
/**
 * Options accepted by {@link TInteractiveInkCanvas.download}.
 * @group Manager
 */
type TDownloadOptions = TExportOptions & {
    /** File name without extension; defaults to a timestamped `iink-ts-<ISO>` name */
    filename?: string;
};
/**
 * Options accepted by `download("pdf", options)`.
 *
 * @remarks
 * Passing any PDF setting skips the export dialog and prints immediately, filling in
 * {@link PDFExportManager.DEFAULT_OPTIONS} for anything omitted.
 *
 * @group Manager
 */
type TPDFDownloadOptions = TDownloadOptions & Partial<TPDFExportDialogOptions>;
/**
 * File extension used by {@link TInteractiveInkCanvas.download} for each format.
 * @group Manager
 */
declare const EXPORT_EXTENSIONS: Record<TDownloadFormat, string>;
/**
 * MIME type used when building the downloadable payload for each format.
 * @group Manager
 */
declare const EXPORT_MIME_TYPES: Record<TDownloadFormat, string>;

/**
 * One exporter per format, each resolving with the type {@link TExportResultMap} declares for it.
 *
 * The map is total over {@link TExportFormat}, which is what makes the generic dispatch in
 * {@link ExportManager.exportAs} type-safe without a cast.
 *
 * @group Manager
 */
type TExporterMap = {
    [F in TExportFormat]: (options?: TExportOptions) => Promise<TExportResultMap[F]>;
};
/**
 * Shared implementation behind the two-function export API — `exportAs` for content, `download`
 * for files. Handles the formats that need nothing but the local model and the renderer (`json`,
 * `svg`, `png`) plus the `pdf` print flow, and leaves the recognition-derived formats to
 * subclasses through {@link ExportManager.exporters}.
 *
 * @remarks
 * The canvas is typed as {@link TInteractiveInkCanvas} because every format needs symbol-level
 * access (`model.symbols`, `getSymbolsBounds`) that `InkCanvas` does not expose. Wiring another
 * variant later means widening this type, not reworking callers.
 *
 * @group Manager
 */
declare abstract class ExportManager {
    #private;
    /**
     * Delay before an object URL handed to the browser is revoked. Revoking synchronously after the
     * anchor click cancels the download in some browsers, so the URL outlives the click by a beat.
     */
    static readonly OBJECT_URL_REVOKE_DELAY_MS = 1000;
    protected logger: Logger;
    canvas: TInteractiveInkCanvas;
    pdfExport: PDFExportManager;
    constructor(canvas: TInteractiveInkCanvas, pdfExport: PDFExportManager);
    /**
     * Exporter for every format. Subclasses spread {@link ExportManager.localExporters} and add the
     * formats they can produce.
     */
    protected abstract get exporters(): TExporterMap;
    protected get model(): IIModel;
    /** Exporters that need only the local model and the renderer */
    protected get localExporters(): Pick<TExporterMap, "json" | "png" | "svg">;
    /**
     * Export the content in the given format.
     * @param format - Format to export to; the resolved type follows from it
     * @param options - Which symbols to export
     * @returns Promise resolving with the exported content
     *
     * @example
     * ```typescript
     * const symbols = await canvas.exportAs("json")
     * const svg = await canvas.exportAs("svg", { scope: "selection" })
     * ```
     */
    exportAs<F extends TExportFormat>(format: F, options?: TExportOptions): Promise<TExportResultMap[F]>;
    /**
     * Export the content and hand the resulting file to the browser.
     * @param format - Format to download; `pdf` opens the print flow instead of saving a file
     * @param options - Which symbols to export, plus the file name. The PDF settings
     *                  (`format`/`orientation`/`mode`/`scale`) are ignored by every other format.
     *
     * @example
     * ```typescript
     * await canvas.download("svg")
     * await canvas.download("markdown", { filename: "meeting-notes" })
     * await canvas.download("pdf", { orientation: "landscape" })
     * ```
     */
    download(format: TDownloadFormat, options?: TPDFDownloadOptions): Promise<void>;
    /**
     * Resolve which symbols an export covers. An explicit `symbols` list always wins over `scope`.
     */
    protected resolveSymbols(options?: TExportOptions): TSymbol[];
    /**
     * Build the download file name. The timestamp is a truncated ISO 8601 instant so the name is
     * locale-independent and free of `/` and `:`, which browsers mangle in file names.
     */
    protected getExportName(extension: string, filename?: string): string;
    protected triggerDownload(fileName: string, urlData: string): void;
    protected buildSvgStringFromSymbols(symbols: TSymbol[], box: TBox): string;
    protected buildBlobFromSymbols(symbols: TSymbol[], box: TBox): Blob;
    protected exportJson(options?: TExportOptions): TSymbol[];
    protected exportSvg(options?: TExportOptions): string;
    /**
     * Rasterize the rendered symbols to PNG.
     *
     * @remarks
     * The rasterization goes through `image.onload`, so it is genuinely asynchronous — the returned
     * promise settles only once the bitmap exists. Empty content short-circuits: a zero-sized image
     * never fires `load`, which would leave the promise pending forever.
     */
    protected exportPng(options?: TExportOptions): Promise<Blob>;
    /** Release every object URL still held and cancel the pending revocations */
    destroy(): void;
}

/**
 * @group Manager
 * @summary The places of the canvas UI where menus and other occupants sit; the center belongs to the ink
 */
declare const LAYOUT_SLOTS: readonly ["top-left", "top-center", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-center", "bottom-right"];
/**
 * @group Manager
 */
type TLayoutSlot = (typeof LAYOUT_SLOTS)[number];
/**
 * @group Manager
 * @summary The axis of a menu's bar
 */
type TMenuOrientation = "horizontal" | "vertical";
/**
 * @group Manager
 * @summary The side a menu's dropdowns open towards
 */
type TMenuDirection = "up" | "down" | "left" | "right";
/**
 * @group Manager
 * @summary The axis a slot gives its menus: vertical bars on the sides, horizontal ones at the top and bottom
 */
declare function slotOrientation(slot: TLayoutSlot): TMenuOrientation;
/**
 * @group Manager
 * @summary The side a slot's menus open towards: away from the edge they sit on
 */
declare function slotOpenTowards(slot: TLayoutSlot): TMenuDirection;
/**
 * @group Manager
 * @summary The horizontal side a slot sits against, which a dropdown grows away from
 */
declare function slotAnchor(slot: TLayoutSlot): "start" | "center" | "end";
/**
 * @group Manager
 * @summary What goes in each slot, in stacking order
 * @remarks A slot given here replaces the default one. An occupant it leaves out keeps its default slot;
 * one listed twice only shows in the first.
 * @example
 * // Undo/redo of the action bar right above the tools
 * { "bottom-center": ["action", "tool"] }
 */
type TLayoutConfiguration = Partial<Record<TLayoutSlot, string[]>>;
/**
 * @group Manager
 * @summary Where each occupant sits when the configuration does not say
 */
declare const DefaultLayoutConfiguration: Readonly<TLayoutConfiguration>;
/**
 * @group Manager
 * @summary What a custom occupant's factory knows of its slot, to fit it
 */
type TLayoutOccupantContext = {
    slot: TLayoutSlot;
    orientation: TMenuOrientation;
    openTowards: TMenuDirection;
};
/**
 * @group Manager
 * @summary Builds a custom occupant's element each time it is placed, so it can fit its slot
 */
type TLayoutOccupantFactory<TCanvas> = (canvas: TCanvas, context: TLayoutOccupantContext) => HTMLElement;
/**
 * @group Manager
 * @summary Where a custom occupant goes when the layout table does not place it already
 */
type TLayoutOccupantOptions = {
    /** Added to this slot of the table; without it, only the table can place the occupant */
    slot?: TLayoutSlot;
    /** Placed before this occupant of the slot */
    before?: string;
    /** Placed after this occupant of the slot */
    after?: string;
};
/**
 * @group Manager
 * @summary A custom occupant declared at load, in `options.extend.layout`
 */
type TLayoutOccupant<TCanvas> = TLayoutOccupantOptions & {
    key: string;
    factory: TLayoutOccupantFactory<TCanvas>;
};
/**
 * @group Manager
 * @summary Places the canvas UI occupants (menus, connection state, minimap, custom ones) in the slots of the layout
 * @remarks Each occupant gets a host element in its slot, in table order: it renders into that host, so the order
 * holds whatever order the occupants render in. When the layout changes, the hosts move with their content; an
 * occupant that changes slot is announced (see {@link onOccupantMoved}) so it can rebuild for its new slot.
 */
declare class LayoutManager<TCanvas = unknown> {
    protected logger: Logger;
    layers: CanvasLayer;
    /** The canvas custom occupants' factories receive */
    canvas?: TCanvas;
    /** The slots as configured, before the defaults fill the rest */
    configuration: TLayoutConfiguration;
    /** The built-in occupants of this canvas; a name outside of them and of the registered ones is ignored */
    occupants: readonly string[];
    /** Where each occupant sits, resolved from the configuration and the defaults */
    protected placement: Record<TLayoutSlot, string[]>;
    protected slots: Partial<Record<TLayoutSlot, HTMLDivElement>>;
    protected hosts: Map<string, HTMLDivElement>;
    /** Custom occupants, by key */
    protected registered: Map<string, TLayoutOccupantFactory<TCanvas>>;
    protected moveListeners: ((occupant: string, slot: TLayoutSlot | undefined) => void)[];
    protected rendered: boolean;
    constructor(layers: CanvasLayer, occupants: readonly string[], configuration?: TPartialDeep<TLayoutConfiguration>, canvas?: TCanvas, registered?: readonly TLayoutOccupant<TCanvas>[]);
    /** Whether the slots are in the page */
    get isRendered(): boolean;
    /** The occupants of each slot: the configured slots as given, the others from the defaults minus what moved */
    protected resolve(): Record<TLayoutSlot, string[]>;
    /** The slots the configuration gives, each occupant kept in the first slot naming it */
    protected readConfiguredSlots(placed: Set<string>): Partial<Record<TLayoutSlot, string[]>>;
    protected isKnown(occupant: string): boolean;
    /** The occupants of a slot, in stacking order */
    occupantsOf(slot: TLayoutSlot): readonly string[];
    /** The slot an occupant sits in */
    slotOf(occupant: string): TLayoutSlot | undefined;
    /** Calls `listener` with each occupant a layout change moved to another slot (undefined: placed nowhere now) */
    onOccupantMoved(listener: (occupant: string, slot: TLayoutSlot | undefined) => void): void;
    /**
     * Replaces the slots given, as at load: an occupant left out keeps its slot, one moved elsewhere leaves its default.
     * @example
     * canvas.layout.set({ "bottom-center": ["action", "tool"] })
     */
    set(configuration: TLayoutConfiguration): void;
    /**
     * Adds a custom occupant, built by `factory` each time it is placed; `options.slot` adds it to the table.
     * @throws when `key` is already an occupant of this canvas
     */
    add(key: string, factory: TLayoutOccupantFactory<TCanvas>, options?: TLayoutOccupantOptions): void;
    /** Removes a custom occupant added by {@link add}; false when there was none under that key */
    remove(key: string): boolean;
    protected register(key: string, factory: TLayoutOccupantFactory<TCanvas>, options?: TLayoutOccupantOptions): void;
    /** Adds `key` to the table's `slot`, next to `before`/`after` when that occupant is in it, else at its end */
    protected insertInTable(key: string, slot: TLayoutSlot, { before, after }: TLayoutOccupantOptions): void;
    /** Resolves the placement again and, once rendered, moves the hosts and announces who changed slot */
    protected relayout(): void;
    /** Builds the slots holding occupants, with a host per occupant, and moves the connection state into its own */
    render(): void;
    /** (Re)builds the slot containers, keeping each occupant's host — and so its content — across layouts */
    protected renderSlots(): void;
    /** Builds a custom occupant's element for its current slot; a factory that throws is logged, the rest renders */
    protected renderRegistered(key: string): void;
    /** The element an occupant renders into; undefined before render() or for an occupant placed nowhere */
    host(occupant: string): HTMLElement | undefined;
    destroy(): void;
}

/**
 * @group Manager
 */
declare class IWriterManager extends AbstractWriterManager {
    #private;
    canvas: TInkCanvas;
    constructor(canvas: TInkCanvas);
    get model(): IModel;
    protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string, creationTime: number): TSymbol;
    protected updateCurrentSymbol(pointer: TPointer): TStroke;
    end(info: TPointerInfo): Promise<void>;
}

/**
 * @group Canvas
 * @summary
 * List all the shapes that can be drawn
 * @remarks
 * only usable in the case of interactive ink canvas
 */
declare enum CanvasWriteTool {
    Pencil = "pencil",
    Rectangle = "rectangle",
    Rhombus = "rhombus",
    Circle = "circle",
    Ellipse = "ellipse",
    Triangle = "triangle",
    Parallelogram = "parallelogram",
    Line = "line",
    Arrow = "arrow",
    DoubleArrow = "double-arrow"
}

/**
 * Operation labels that identify an in-progress user gesture (pointer down through pointer up).
 * While any of these is active, synchronizing with the backend should be deferred so it never
 * contends with the gesture for the main thread.
 * @group Canvas
 */
declare const GESTURE_OPERATION_LABELS: readonly TCanvasOperationLabel[];

/**
 * Unified representation of a gesture's intent on a set of target strokes.
 * Handlers write annotations; IIGestureAnnotationProcessor executes them.
 * @group Manager
 */
type TGestureAnnotation = {
    kind: "decorator";
    decoratorKind: DecoratorKind;
} | {
    kind: "erase";
} | {
    kind: "thicken";
    /** Stroke widths to step through, the thickness menu's */
    widths: number[];
    /** Font weights to step through, the font weight menu's */
    fontWeights: ("normal" | "bold")[];
} | {
    kind: "select";
};
/**
 * Centralized executor for gesture annotations.
 * Standalone TDecorator symbols live in model.symbols with targetIds referencing strokes.
 * @group Manager
 */
declare class IIGestureAnnotationProcessor {
    #private;
    private canvas;
    constructor(canvas: TInteractiveInkCanvas);
    apply(ids: string[], annotation: TGestureAnnotation): Promise<TIIHistoryChanges | undefined>;
}

/**
 * @group Manager
 * @summary List all authorized gestures
 */

/**
 * @group Manager
 * @summary
 * List all action allowed on surround detected
 * @remarks
 * only usable in the case of interactive ink canvas
 */
declare enum SurroundAction {
    Select = "select",
    Surround = "surround",
    Highlight = "highlight"
}
/**
 * @group Manager
 * @summary
 * List all action allowed on strikeThrough detected
 * @remarks
 * only usable in the case of interactive ink canvas
 */
declare enum StrikeThroughAction {
    Erase = "erase",
    Draw = "draw"
}
/**
 * @group Manager
 * @summary
 * List all action allowed on underline detected
 * @remarks
 * only usable in the case of interactive ink canvas
 */
declare enum UnderlineAction {
    Draw = "draw",
    Thicken = "thicken"
}
/**
 * @group Manager
 * @summary
 * List all action allowed on split detected
 * @remarks
 * only usable in the case of interactive ink canvas
 */
declare enum InsertAction {
    /**
     * @remarks Add line break on gesture place
     */
    LineBreak = "line-break",
    /**
     * @remarks Insert place in gesture place
     */
    Insert = "insert"
}
/**
 * @group Manager
 * @summary
 * List all action allowed on join detected
 * @remarks
 * only usable in the case of interactive ink canvas
 */
declare enum JoinAction {
    /**
     * @remarks Glue the two words around the gesture into one, or pull the next row up to the end of the row
     */
    Join = "join",
    /**
     * @remarks Close the gap around the gesture down to a single word space, keeping words apart and rows in place
     */
    CloseGap = "close-gap"
}
/**
 * @group Manager
 * @source
 */
type TGestureConfiguration = {
    surround: SurroundAction;
    strikeThrough: StrikeThroughAction;
    underline: UnderlineAction;
    insert: InsertAction;
    join: JoinAction;
};
/**
 * @group Manager
 * @source
 */
declare const DefaultGestureConfiguration: TGestureConfiguration;

/**
 * Base abstract class for all Interactive Ink managers
 * Provides common structure and utilities to reduce code duplication
 *
 * All managers in iink-ts should extend this class to ensure consistent:
 * - Logger management
 * - Canvas reference
 * - Common getters (model, renderer, client, configuration)
 * - Lifecycle hooks (onInit, onDestroy)
 *
 * @example
 * ```typescript
 * export class IIMyManager extends IIAbstractManager {
 *   protected managerName = "IIMyManager"
 *
 *   constructor(canvas: InteractiveInkCanvas) {
 *     super(canvas)
 *     // Custom initialization
 *   }
 *
 *   protected onInit(): void {
 *     // Called after constructor
 *     this.logger.info("IIMyManager initialized")
 *   }
 *
 *   myMethod() {
 *     // Use this.canvas, this.model, this.renderer, this.logger
 *     this.logger.info("Doing something")
 *   }
 *
 *   protected onDestroy(): void {
 *     // Cleanup
 *   }
 * }
 * ```
 *
 * @group Manager
 */
declare abstract class IIAbstractManager {
    protected canvas: TInteractiveInkCanvas;
    /**
     * Logger instance for this manager
     * Automatically uses LoggerCategory.MANAGER
     */
    protected logger: Logger;
    /**
     * Name of the manager for logging purposes
     * Must be overridden in concrete classes
     *
     * @example "IITypesetManager", "IIMathManager"
     */
    protected abstract managerName: string;
    /**
     * Create a new manager
     * @param canvas - The Interactive Ink Canvas instance
     */
    constructor(canvas: TInteractiveInkCanvas, logger: LoggerCategory);
    /**
     * Get the model from the canvas
     * Convenience getter to avoid accessing canvas.model everywhere
     */
    get model(): IIModel;
    /**
     * Get the renderer from the canvas
     * Convenience getter to avoid accessing canvas.renderer everywhere
     */
    get renderer(): SVGRenderer;
    /**
     * Get the client from the canvas
     * Convenience getter to avoid accessing canvas.client everywhere
     */
    get client(): WebSocketClient;
    /**
     * Get the configuration from the canvas
     * Convenience getter to avoid accessing canvas.configuration everywhere
     */
    get configuration(): TInteractiveInkCanvas["configuration"];
    /**
     * Lifecycle hook called after manager initialization
     * Override in subclasses if needed
     *
     * This is called at the end of the constructor, allowing subclasses
     * to perform initialization that requires access to this.managerName
     * or other properties set in the subclass constructor.
     *
     * @example
     * ```typescript
     * protected onInit(): void {
     *   this.logger.info(`${this.managerName} initialized`)
     *   // Setup event listeners, etc.
     * }
     * ```
     */
    protected onInit?(): void;
    /**
     * Lifecycle hook called when the manager is being destroyed
     * Override in subclasses to cleanup resources
     *
     * @example
     * ```typescript
     * protected onDestroy(): void {
     *   this.logger.info(`${this.managerName} destroyed`)
     *   // Remove event listeners, clear intervals, etc.
     * }
     * ```
     */
    protected onDestroy?(): void;
    /**
     * Destroy the manager and cleanup resources
     * Calls the onDestroy hook if defined
     */
    destroy(): void;
}

/**
 * @group Manager
 * @remarks Orchestrator for gesture recognition and handling using Strategy Pattern
 */
declare class IIGestureManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    insertAction: InsertAction;
    surroundAction: SurroundAction;
    strikeThroughAction: StrikeThroughAction;
    underlineAction: UnderlineAction;
    joinAction: JoinAction;
    constructor(canvas: TInteractiveInkCanvas, gestureAction?: TPartialDeep<TGestureConfiguration>);
    get translator(): IITranslateManager;
    get typeset(): IITypesetManager;
    get history(): IIHistoryManager;
    /**
     * Apply a detected gesture using the appropriate handler.
     * @param gesture - The detected gesture with metadata; the triggering stroke is looked up
     * from the model via `gesture.gestureStrokeId` (works whether the gesture was detected
     * client-side/contextless or arrived asynchronously from the server).
     */
    apply(gesture: TGesture): Promise<void>;
    /**
     * Detect gesture type from a stroke using contextless recognition
     * @param gestureStroke - The stroke to analyze
     * @returns The detected gesture or undefined
     */
    getGestureFromContextLess(gestureStroke: TStroke): Promise<TGesture | undefined>;
    /**
     * Whether a gesture is listed in the recognition configuration's `raw-content.gestures`.
     * The server only detects the listed ones; the contextless path must honor the same list,
     * or a gesture turned off would still be applied next to typeset content.
     */
    isGestureEnabled(gestureType: TGestureType): boolean;
}

/**
 * @group Manager
 */
declare class IITypesetManager extends IIAbstractManager {
    protected managerName: string;
    constructor(canvas: TInteractiveInkCanvas);
    get rowHeight(): number;
    getSymbolRowIndex(symbol: TSymbol): number;
    getSymbolsByRowOrdered(): {
        rowIndex: number;
        symbols: TSymbol[];
    }[];
    protected drawSymbolHidden(symbol: TText | TMath): SVGGElement;
    setCharsBounds(text: TText, textGroupEl: SVGGElement): TText;
    setBounds(symbol: TText | TMath): void;
    getElementBoundingBox(textElement: SVGElement): TBox;
    getBoundingBox(text: TText): TBox;
    getSpaceWidth(fontSize: number): number;
    updateBounds<T extends TText | TMath>(typesetSymbol: T): T;
    /**
     * Shifts the texts that follow `text` on its row, and returns each one's before/after pair.
     *
     * Pairs rather than just the moved symbols: only this method knows which ones it picked, so it is
     * the only place a caller's history entry can get its pre-move snapshots from.
     */
    moveTextAfter(text: TText, tx: number): {
        before: TSymbol;
        after: TSymbol;
    }[] | undefined;
}

/**
 * Abstract base class for transform managers (translate, rotate, resize)
 * @group Manager
 */
declare abstract class IIAbstractTransformManager extends IIAbstractManager {
    interactElementsGroup?: SVGElement;
    constructor(canvas: TInteractiveInkCanvas);
    /**
     * The gesture's matrix, previewed on top of the one the symbol already carries.
     *
     * The live part multiplies onto the stored one rather than replacing it, so the SVG transform list
     * reads outside-in: the symbol sits where its own matrix puts it, and the gesture moves it from
     * there — the same order the commit will apply. Writing the live transform alone is what made an
     * already-moved symbol snap back to its raw coordinates for the length of a drag and jump into
     * place on release (IIC-1999). Before this epic only a rotated typeset carried a baked transform;
     * now every moved symbol does, so the same overwrite would affect all of them.
     *
     * The stored matrix is untouched here. This is a preview: `applyAndDraw` is what settles it.
     */
    protected previewTransform(symbol: TSymbol, live: MatrixTransform): void;
    /**
     * The same, for an element with no symbol behind it — the interact-elements group, or a math
     * ghost stroke. Nothing is composed because nothing is stored: these are drawn in document
     * coordinates already.
     *
     * Note both preview methods write a full `matrix(...)`, carrying their own centre. The
     * `transform-origin` attribute this class used to set cannot serve here: it applies to the whole
     * transform list, so it would displace the stored matrix, which brings its own centre.
     */
    protected previewElementTransform(id: string, live: MatrixTransform): void;
    protected resolveInteractGroup(target: Element): SVGGElement;
    /**
     * Applies a matrix transform locally (model + redraw) without touching the backend or
     * history. Used by InteractiveInkCanvas's undo/redo replay dispatcher, which sends its own
     * consolidated backend message separately.
     */
    applyMatrix(symbols: TSymbol[], matrix: MatrixTransform): void;
    /**
     * Records a transform as the before/after pair `updated` wants, resolving "after" from the
     * document by id rather than from the caller.
     *
     * By id, because a transform commits a draft: the object the caller holds is the pre-transform
     * snapshot, and reading the moved value off it would record no change at all. Resolving both
     * sides here also keeps the two lists the same length — a symbol the document no longer holds is
     * dropped from both rather than shifting every pair after it.
     *
     * Call after `applyAndDraw`, with the snapshots taken before it.
     */
    protected recordTransformed(changes: TIIHistoryChanges, snapshots: TSymbol[]): void;
    /**
     * Returns the pre-transform records of the standalone decorators that followed `symbols`, for
     * the caller to hand to {@link recordTransformed}: they are moved here, outside the selection, so
     * no caller snapshot holds them and undo would otherwise leave them where the gesture put them.
     */
    protected applyAndDraw(symbols: TSymbol[], matrix: MatrixTransform): TDecorator[];
    /**
     * The live gesture, previewed on the standalone decorators carried by `symbols`.
     *
     * Only those whose every target is in `symbols`: they are the ones the commit moves by the same
     * matrix (see `updateDecoratorsForTargets`), so previewing them any other way would show a
     * decoration that jumps on release. A decorator only partly moved has its box refitted at commit
     * instead, which a matrix cannot preview.
     */
    protected previewDecorators(symbols: TSymbol[], live: MatrixTransform): void;
    /**
     * The standalone decorators targeting any of `symbols`, each flagged `whole` when all of its
     * targets are among them. Decorators are never part of `symbolsSelected` (selection redirects to
     * their targetIds), so a transform reaches them only through here.
     */
    private decoratorsCarriedBy;
    /**
     * Keeps standalone decorators on the symbols they decorate after those were transformed.
     *
     * A decorator whose targets all moved takes the very matrix they took, composed onto its own:
     * its `targetBounds` and `baseline` stay in its local frame, so a rotation turns the decoration
     * with the ink instead of re-deriving an axis-aligned box around it. A decorator only partly
     * moved cannot follow one matrix, so its box is refitted around its targets, in its local frame.
     */
    private updateDecoratorsForTargets;
    /**
     * Refits a partly-moved decorator's box around its targets, expressed in the decorator's own frame
     * so that its stored matrix still places it. `baseline` is an absolute y in that frame, so it takes
     * the gesture's matrix as seen from that frame.
     */
    private refitDecorator;
    /**
     * Live model symbols for the pre-convert edge strokes that rigidly follow a transform
     * (see IIConnectorManager), minus any already present in `alreadyIncluded`.
     * They are transformed outside `applyAndDraw`, so history entries and backend transform
     * messages must list them explicitly or undo and the server's ink both drift out of sync.
     */
    protected resolveFollowedSymbols(followedIds: string[], alreadyIncluded: TSymbol[]): TSymbol[];
    protected finalizeTransform(): void;
    private getSelectedMathBlockIds;
    /**
     * Element ids of the ghost previews attached to the given selection's math blocks —
     * for live CSS-transform following while a translate/resize/rotate drag is in progress.
     */
    protected getGhostStrokeIdsForSelectedMath(symbols: TSymbol[]): string[];
    /**
     * Permanently applies the given transform matrix to the ghost previews attached to the
     * selection's math blocks, so they stay visually attached once the drag settles.
     */
    protected applyTransformToGhostStrokesForSelectedMath(symbols: TSymbol[], matrix: MatrixTransform): void;
    /**
     * Gradient-followed strokes were reshaped non-uniformly by the connector — their points did not
     * all move by the same delta — so the backend cannot be asked to apply this transform to them.
     * Their full new content has to be sent instead. Returns one `replaceStrokes` call per such
     * stroke, to be spread into the transform's own `Promise.all`.
     */
    protected replaceGradientFollowedStrokes(anchoredOldSymbols: TSymbol[], anchoredNewSymbols: TSymbol[]): Promise<void>[];
    /**
     * Applies this manager's own operation to a symbol, through the symbol's util.
     *
     * One member instead of the five per-type ones this class used to declare. Those existed to be
     * reached by a `switch (symbol.type)` here, which is what made a symbol type the library did not
     * know untransformable: it fell to a throwing `default` however well its util was registered.
     */
    protected abstract applyThroughUtil(symbol: TSymbol, matrix: MatrixTransform): void;
    applyToSymbol(symbol: TSymbol, matrix: MatrixTransform): TSymbol;
}

/**
 * @group Manager
 */
declare class IITranslateManager extends IIAbstractTransformManager {
    protected managerName: string;
    transformOrigin: TPoint;
    constructor(canvas: TInteractiveInkCanvas);
    /**
     * One hook instead of five per-type methods. `IIAbstractTransformManager` used to
     * declare those five so its `switch (symbol.type)` could reach them; IIC-2014 replaced both with
     * this.
     */
    protected applyThroughUtil(symbol: TSymbol, matrix: MatrixTransform): void;
    translate(symbols: TSymbol[], tx: number, ty: number, addToHistory?: boolean): Promise<void>;
    start(target: Element, origin: TPoint): void;
    continue(point: TPoint): {
        tx: number;
        ty: number;
    };
    end(point: TPoint): Promise<void>;
}

/**
 * Helper class containing all shared utility methods for gesture handlers
 * Centralizes common functionality to avoid code duplication across handlers
 * @group Manager
 */
declare class GestureHelpers {
    protected canvas: TInteractiveInkCanvas;
    constructor(canvas: TInteractiveInkCanvas);
    /**
     * Check if a symbol can have decorators applied to it
     * @param symbol - The symbol to check
     * @returns true if symbol is Stroke, Text, or RecognizedText
     */
    isDecorable(symbol: TSymbol): boolean;
}

/**
 * Base interface for gesture handlers
 * Each handler is responsible for applying a specific gesture type
 * @group Manager
 */
type TGestureHandler = {
    /**
     * The type of gesture this handler manages
     */
    readonly gestureType: TGestureType;
    /**
     * Apply the gesture to the model
     * @param gestureStroke - The stroke that forms the gesture
     * @param gesture - The detected gesture information
     * @returns Promise that resolves when the gesture is applied
     */
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void | TSymbol[]>;
};
/**
 * Abstract base class for gesture handlers
 * Provides common functionality and access to canvas services via helpers
 * @group Manager
 */
declare abstract class GestureHandler implements TGestureHandler {
    protected canvas: TInteractiveInkCanvas;
    protected helpers: GestureHelpers;
    protected readonly logger: Logger;
    protected readonly processor: IIGestureAnnotationProcessor;
    constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers);
    abstract readonly gestureType: TGestureType;
    abstract apply(gestureStroke: TStroke, gesture: TGesture): Promise<void | TSymbol[]>;
    /**
     * Get the canvas's model
     */
    protected get model(): IIModel;
    /**
     * Get the canvas's model
     */
    protected get manager(): IIGestureManager;
    /**
     * Get the canvas's renderer
     */
    protected get renderer(): SVGRenderer;
    /**
     * Get the canvas's history manager
     */
    protected get history(): IIHistoryManager;
    /**
     * Get the canvas's client
     */
    protected get client(): WebSocketClient;
    /**
     * Get the canvas's translator manager
     */
    protected get translator(): IITranslateManager;
    /**
     * Get the canvas's typeset manager
     */
    protected get typeset(): IITypesetManager;
    /**
     * Get the row height from configuration
     */
    protected get rowHeight(): number;
    private getSymbolRowIndex;
    protected isSymbolAbove(source: TSymbol, target: TSymbol): boolean;
    protected isSymbolInRow(source: TSymbol, target: TSymbol): boolean;
    protected isSymbolBelow(source: TSymbol, target: TSymbol): boolean;
    protected getFirstSymbol(symbols: TSymbol[]): TSymbol | undefined;
    protected getLastSymbol(symbols: TSymbol[]): TSymbol | undefined;
    /**
     * Get the stroke space width from configuration
     */
    protected get strokeSpaceWidth(): number;
}

/**
 * A group of symbols to shift, and by how much.
 *
 * Not a history form. It used to be one — `TIIHistoryChanges.translate` — and these handlers used
 * one object both to record the step and to drive it. History records before/after pairs now, so
 * the two parted ways: this stays as the instruction, and `apply` snapshots around it.
 * @group Manager
 */
type TShift = {
    symbols: TSymbol[];
    tx: number;
    ty: number;
};
/**
 * What a split computes: the symbols it replaces, and the groups it shifts to make room.
 * @group Manager
 */
type TSplitOutcome = {
    replaced: {
        oldSymbols: TSymbol[];
        newSymbols: TSymbol[];
    };
    shifts: TShift[];
};
/**
 * Handler for INSERT gesture type
 * Inserts line breaks or space by drawing vertical line
 * @group Manager
 */
declare class InsertGestureHandler extends GestureHandler {
    readonly gestureType: "INSERT";
    constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers);
    /**
     * The `dt` the pointer at `index` had in the stroke being split, or one step past the last
     * pointer already kept when the split runs off the end of the original.
     *
     * `??` and not `||`: the first pointer of a stroke has a `dt` of exactly 0, and `||` would read
     * that as missing and fabricate a time for a pointer that has a perfectly good one.
     */
    protected deltaAt(strokeOrigin: TStroke, index: number, kept: TPointer[]): number;
    /**
     * Create strokes from gesture substrokes
     * Reconstructs pointers with pressure and time information
     * @param strokeOrigin - The original stroke to get style and pointer info
     * @param subStrokes - Array of substroke data (x,y coordinates)
     * @returns Array of new strokes
     */
    createStrokesFromGestureSubStroke(strokeOrigin: TStroke, subStrokes: {
        x: number[];
        y: number[];
    }[]): TStroke[];
    /**
     * Compute split stroke into before/after parts
     * Applies translation to the "after" stroke
     * @param strokeOrigin - The original stroke to split
     * @param subStrokes - Array of substroke data
     * @returns Object with optional before and after strokes
     */
    computeSplitStroke(strokeOrigin: TStroke, subStrokes: {
        x: number[];
        y: number[];
    }[]): {
        before?: TStroke;
        after?: TStroke;
    };
    /**
     * Compute changes needed when splitting a stroke
     * Handles both simple Stroke symbols with child strokes
     * @param gestureStroke - The gesture stroke
     * @param strokeIdToSplit - ID of the stroke to split
     * @param subStrokes - Substroke data
     * @returns History changes object with translate and replaced arrays
     */
    computeChangesOnSplitStroke(gestureStroke: TStroke, strokeIdToSplit: string, subStrokes: {
        fullStrokeId: string;
        x: number[];
        y: number[];
    }[]): TSplitOutcome;
    /**
     * Compute changes when splitting a Text symbol
     * @param gestureStroke - The gesture stroke
     * @param textToSplit - The text symbol to split
     * @param insertAction - The insert action mode
     * @returns History changes object
     */
    computeChangesOnSplitText(gestureStroke: TStroke, textToSplit: TText, insertAction: InsertAction): TSplitOutcome;
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * Handler for JOIN gesture type
 * Joins rows of text together by removing line breaks
 * Supports two actions: Join (glue words, pull rows up) and CloseGap (one word space, rows stay)
 * @group Manager
 */
declare class JoinGestureHandler extends GestureHandler {
    readonly gestureType: "JOIN";
    constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers);
    /**
     * The right edge of what precedes the gesture in its row and the left edge of what follows it.
     */
    protected getGapEdges(before: TSymbol[], after: TSymbol[]): {
        lastXBefore: number;
        firstXAfter: number;
    };
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * Handler for SCRATCH gesture type
 * Erases or partially removes symbols by scratching over them
 * @group Manager
 */
declare class ScratchGestureHandler extends GestureHandler {
    readonly gestureType: "SCRATCH";
    constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers);
    /**
     * Compute scratch on strokes by subtracting the gesture stroke
     * @param gesture - The gesture information with subStrokes
     * @param stroke - The stroke to scratch
     * @returns Array of resulting strokes (before/after the scratch)
     */
    computeScratchOnStrokes(gesture: TGesture, stroke: TStroke): TStroke[];
    /**
     * Compute scratch on text symbol by removing overlapping characters
     * @param gestureStroke - The gesture stroke
     * @param textSymbol - The text symbol to scratch
     * @returns Updated text symbol, or undefined if all characters removed
     */
    computeScratchOnText(gestureStroke: TStroke, textSymbol: TText): TText | undefined;
    /**
     * Compute scratch on any symbol type
     * Handles different logic for each symbol type:
     * - Stroke: Uses computeScratchOnStrokes
     * - RecognizedText: Scratches child strokes, preserves decorators
     * - RecognizedMath/Diagram: Scratches child strokes, cleans solver outputs
     * - Text: Uses computeScratchOnText
     * - Math/Shape/Edge: Complete erasure
     *
     * @param gestureStroke - The gesture stroke
     * @param gesture - The gesture information
     * @param symbol - The symbol to scratch
     * @returns Object with 'erased' flag or 'replaced' array of new symbols
     */
    computeScratchOnSymbol(gestureStroke: TStroke, gesture: TGesture, symbol: TSymbol): {
        erased?: boolean;
        replaced?: TSymbol[];
    };
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * Handler for STRIKETHROUGH gesture type
 * Supports two actions: Draw (apply decorator) and Erase (remove symbols)
 * @group Manager
 */
declare class StrikeThroughGestureHandler extends GestureHandler {
    readonly gestureType: "STRIKETHROUGH";
    constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers);
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * Handler for SURROUND gesture type
 * Supports three actions: Select, Highlight, and Surround
 * @group Manager
 */
declare class SurroundGestureHandler extends GestureHandler {
    readonly gestureType: "SURROUND";
    constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers);
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * Handler for UNDERLINE gesture type
 * Supports two actions: Draw (apply decorator) and Thicken (one level up the thickness menu for a
 * stroke, the font weight menu for a text or math block, back to the first past the last)
 * @group Manager
 */
declare class UnderlineGestureHandler extends GestureHandler {
    readonly gestureType: "UNDERLINE";
    constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers);
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * A pre-convert edge stroke that should follow a transform of the moving set, and how:
 * "rigid" when both of its connected shapes are moving together (nothing shifts relatively),
 * "gradient" when only one is — `movingAnchor` identifies which one to follow toward.
 * @group Manager
 */
type TFollowedStroke = {
    symbol: TStroke;
    mode: "rigid" | "gradient";
    movingAnchor?: TAnchor;
};
/**
 * Result of committing the anchored-edges update pass (both pre-convert strokes and converted
 * Line/PolyEdge/Arc symbols).
 * `rigidStrokeIds` moved by a single uniform matrix — safe to fold into the caller's own
 * matrix-replay history entry (translate/scale/rotate), since re-applying the inverse matrix
 * correctly undoes a uniform transform.
 * `oldSymbols`/`newSymbols` are everything else: gradient-followed raw strokes, and converted
 * edges (their anchor position is *recomputed* from the target's new bounds, not transformed by
 * a matrix relative to their own prior state, so there's no inverse to replay either way). All
 * of these need their pre-mutation snapshot restored directly on undo via the `updated` history
 * entry, not re-derived.
 * @group Manager
 */
type TAnchoredEdgesUpdateResult = {
    rigidStrokeIds: string[];
    oldSymbols: TSymbol[];
    newSymbols: TSymbol[];
};
/**
 * @group Manager
 */
type TConnectorConfiguration = {
    /** Whether moving/resizing/rotating a connected shape reshapes its anchored edges (stroke or
     * converted Line/PolyEdge/Arc) to follow it. Existing anchors and connection tracking (sync,
     * survival across Convert) are unaffected either way — this only gates the visual/commit
     * follow-on-move behavior. */
    followConnectedEdges: boolean;
};
/**
 * @group Manager
 * @source
 */
declare const DefaultConnectorConfiguration: TConnectorConfiguration;
/**
 * @group Manager
 */
declare class ConnectorConfiguration implements TConnectorConfiguration {
    followConnectedEdges: boolean;
    constructor(config?: TPartialDeep<TConnectorConfiguration>);
}
/**
 * Manages anchored edges — edges whose endpoints are bound to other symbols.
 * When an anchored symbol moves, `updateAnchoredEdges` recomputes the
 * corresponding edge endpoints from their stored normalized anchor coordinates.
 * @group Manager
 */
declare class IIConnectorManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    connectorConfiguration: ConnectorConfiguration;
    constructor(canvas: TInteractiveInkCanvas, config?: TPartialDeep<TConnectorConfiguration>);
    /**
     * Find the first non-edge symbol whose bounds contain the given point.
     * `excludeId` prevents matching the edge being dragged.
     */
    findSymbolAtPoint(point: TPoint, excludeId: string): TSymbol | undefined;
    /**
     * Draw a dashed highlight rect around a symbol's bounds to indicate an
     * active anchor snap target. Clears any previously shown hint first.
     */
    showAnchorHint(point: TPoint, excludeId: string): TSymbol | undefined;
    /** Remove the anchor snap hint from the interaction layer. */
    clearAnchorHint(): void;
    /**
     * Find where the ray from `anchoredPoint` toward `otherPoint` exits the polygon
     * defined by `shapeVertices`. Using a ray (not a segment) ensures a result even when
     * shapes overlap and `otherPoint` is inside the polygon.
     */
    private computeEntryPoint;
    /**
     * Recompute `entryPoint` on every anchor currently set on `edge`.
     * Must be called after the edge endpoints and anchor target shape are in their final positions.
     */
    private recomputeAllEntryPoints;
    /**
     * Assign or clear the start/end anchor on a Line or PolyLine edge endpoint.
     * When a target shape is found, snaps the endpoint to the shape center and
     * computes `entryPoint` (intersection with shape border) for split rendering.
     * Called after the user releases an edge endpoint drag.
     */
    applyEndpointAnchor(edge: TDraft<TEdge>, pointIndex: number, point: TPoint): void;
    /**
     * Visually reposition anchored edge endpoints by applying `matrix` to the
     * stored anchor point (original position) — no model update.
     * Call from transform `continue()` for real-time edge following.
     */
    drawAnchoredEdgesForMatrix(symbolIds: string[], matrix: MatrixTransform): void;
    /**
     * Resolve an anchor to a point in `edge`'s own coordinate frame, optionally using pre-transform
     * bounds + matrix. When matrix and preTransformBoundsById are provided (rotation case), resolves
     * in the pre-transform AABB then applies the matrix — this preserves the physical point on
     * the shape regardless of AABB size change. Also updates normalizedXY on the anchor
     * so subsequent transforms resolve correctly in the new AABB.
     *
     * The anchor is resolved against the *target's* geometry, which `SymbolGeometry` reports in
     * document coordinates — the target's own matrix already applied. The result is then written into
     * `edge`'s stored `start`/`end`/`points`, which are raw: the edge's matrix is what places them. So
     * the point is mapped back through that matrix here rather than at each of the six call sites,
     * which is what keeps an already-moved edge from jumping when the shape it is anchored to moves.
     *
     * Returns `undefined` when the edge's matrix cannot be inverted, alongside the existing
     * missing-target case: callers already skip the write on `undefined`.
     */
    private resolveAndUpdateAnchor;
    /**
     * Clear anchors from any edges in `symbols` that are being directly translated.
     * An anchored edge that the user explicitly moves becomes a free edge.
     * Covers all three anchor-carrying edge kinds (Line, PolyLine, Arc).
     */
    clearAnchoredEdgesFor(symbols: TSymbol[]): void;
    /**
     * Recompute endpoints of all edges anchored to any of the given symbol IDs.
     * Called by transform managers after translate / resize / rotate.
     * Pass `matrix` and `preTransformBoundsById` when called from rotation so that
     * anchor resolution uses the pre-transform AABB rather than the post-rotation AABB.
     * @returns ids of the pre-convert edge strokes rigidly moved by this call — callers must add
     * them to their history entry and to their backend transform message.
     */
    updateAnchoredEdges(symbolIds: string[], matrix?: MatrixTransform, preTransformBoundsById?: Map<string, TOBB>): TAnchoredEdgesUpdateResult;
    /**
     * Ids of the pre-convert edge strokes that would rigidly follow a transform of `symbolIds`.
     * Read-only counterpart of the follow pass, for transform managers that need the list *before*
     * mutating anything (history snapshots, backend stroke ids).
     */
    getFollowedStrokeIds(symbolIds: string[]): string[];
    /**
     * Like `getFollowedStrokeIds`, but only the rigidly-followed ones (both connected shapes
     * moving together — safe to fold into a uniform matrix-replay transform). Gradient-followed
     * strokes are excluded: their shift isn't uniform, so callers must snapshot and undo them via
     * `updateAnchoredEdges`'s `oldSymbols`/`newSymbols` instead, and must send their new content to
     * the backend via `client.replaceStrokes` rather than a uniform transform call.
     */
    getRigidFollowedStrokeIds(symbolIds: string[]): string[];
}

/**
 * @group Manager
 */
declare class IIConversionManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    constructor(canvas: TInteractiveInkCanvas);
    get fontStyleConfiguration(): {
        size: number | "auto";
        weight: "bold" | "normal" | "auto";
    };
    get rowHeight(): number;
    protected computeFontSize(chars: TJIIXChar[]): number;
    buildChar(char: TJIIXChar, strokes: TStroke[], fontSize: number): TSymbolChar;
    buildText(word: TJIIXWord, chars: TJIIXChar[], strokes: TStroke[], size: number | "auto"): TText;
    convertText(text: TJIIXTextElement, strokes: TStroke[], onlyText: boolean): {
        symbol: TText;
        strokes: TStroke[];
    }[] | undefined;
    buildCircle(circle: TJIIXNodeCircle, strokes: TStroke[]): TShapeCircle;
    buildEllipse(ellipse: TJIIXNodeEllipse, strokes: TStroke[]): TShapeEllipse;
    buildRectangle(rectangle: TJIIXNodeRectangle, strokes: TStroke[]): TShapePolygon;
    buildPolygon(polygon: TJIIXNodePolygon, strokes: TStroke[]): TShapePolygon;
    buildRhombus(polygon: TJIIXNodeRhombus, strokes: TStroke[]): TShapePolygon;
    buildTriangle(polygon: TJIIXNodeTriangle, strokes: TStroke[]): TShapePolygon;
    buildParallelogram(polygon: TJIIXNodeParallelogram, strokes: TStroke[]): TShapePolygon;
    convertNode(node: TJIIXNodeElement, strokes: TStroke[]): {
        symbol: TShape;
        strokes: TStroke[];
    } | undefined;
    buildLine(line: TJIIXEdgeLine, strokes: TStroke[]): TEdgeLine;
    buildPolyEdge(polyline: TJIIXEdgePolyEdge, strokes: TStroke[]): TEdgePolyLine;
    buildArc(arc: TJIIXEdgeArc, strokes: TStroke[]): TEdgeArc;
    convertEdge(edge: TJIIXEdgeElement, strokes: TStroke[], blockIdToNewSymbolId?: Map<string, string>): {
        symbol: TEdge;
        strokes: TStroke[];
    } | undefined;
    buildMath(mathElement: TJIIXMathElement, strokes: TStroke[], fontSize: number): TMath;
    convertMath(mathElement: TJIIXMathElement, strokes: TStroke[]): {
        symbol: TMath;
        strokes: TStroke[];
    } | undefined;
    apply(symbols?: TSymbol[]): Promise<TSymbol[]>;
}

/**
 * Export manager for {@link InteractiveInkCanvas}.
 *
 * Adds the recognition-derived formats to the local ones handled by {@link ExportManager}: `text`
 * from the JIIX stroke index, and `jiix`/`markdown`/`mermaid`/`plantuml`/`llm` from the single
 * JIIX export the server produces.
 *
 * @group Manager
 */
declare class IIExportManager extends ExportManager {
    #private;
    protected managerName: string;
    constructor(canvas: TInteractiveInkCanvas, pdfExport: PDFExportManager);
    get renderer(): SVGRenderer;
    get client(): WebSocketClient;
    get configuration(): TInteractiveInkCanvas["configuration"];
    protected get exporters(): TExporterMap;
    /**
     * Single access point to the JIIX export — every recognition-derived format goes through it.
     *
     * @remarks
     * JIIX is produced server-side for the whole content, so the export options do not apply:
     * `scope` and `symbols` are ignored by the formats derived from it.
     */
    protected exportJiix(): Promise<TJIIXExport>;
    /**
     * Extract the recognized text of the given symbols in reading order.
     *
     * Strokes carrying JIIX metadata contribute their block label once, whatever the number of
     * strokes the block spans, and sort by their own bounding box rather than by draw order.
     */
    protected extractTextFromSymbols(symbols: TSymbol[]): string;
}

/**
 * Text metadata for a block
 * @group Manager
 */
type TBlockTextMetadata = {
    label?: string;
    word?: {
        label: string;
        firstChar?: number;
        lastChar?: number;
        bounds?: TBox;
        id?: string;
    };
    char?: {
        label: string;
        word: number;
        bounds?: TBox;
    };
    line?: {
        baseline: number;
        xHeight: number;
    };
};
/**
 * Result type for stroke queries
 * @group Manager
 */
type TStrokeQueryResult = {
    /** The stroke ID */
    strokeId: string;
    /** The JIIX element containing this stroke */
    element: TJIIXElement;
    /** The precise label for this stroke */
    label?: string;
    /** Additional context (word, char, expression, etc.) */
    context?: {
        /** For text strokes: word info */
        word?: {
            label: string;
            index: number;
        };
        /** For text strokes: char info */
        char?: {
            label: string;
            index: number;
            wordIndex: number;
        };
        /** For math strokes: expression info */
        expression?: {
            type: string;
            label?: string;
            expressionPath: string;
        };
    };
};
/**
 * Indexed JIIX data for fast queries
 * @group Manager
 */
type TJiixIndex = {
    /** Map stroke ID -> parent element */
    strokeToElement: Map<string, TJIIXElement>;
    /** Map stroke ID -> precise label */
    strokeToLabel: Map<string, string>;
    /** Map stroke ID -> context info */
    strokeToContext: Map<string, TStrokeQueryResult["context"]>;
    /** Map element ID -> all stroke IDs */
    elementToStrokes: Map<string, string[]>;
    /** Map element ID -> element (for label lookup without needing model.exports) */
    elementById: Map<string, TJIIXElement>;
    /** Cache version for invalidation */
    version: number;
};
/**
 * @group Manager
 * @remarks Manager for querying JIIX export data efficiently
 * Provides fast lookups for strokes, labels, and element groupings
 * Automatically indexes JIIX data on first access and invalidates cache when model changes
 */
declare class IIJiixQueryManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    constructor(canvas: TInteractiveInkCanvas);
    /**
     * Both the index and the text metadata hold references into the document — strokes and JIIX
     * elements — so leaving them populated retains the whole graph for as long as this manager is
     * reachable. Unlike {@link invalidateIndex}, this does not rebuild.
     */
    protected onDestroy(): void;
    /**
     * Build or rebuild the JIIX index
     * Called automatically when index is stale
     */
    protected buildIndex(): void;
    /**
     * Index a single JIIX element and its strokes
     */
    protected indexElement(element: TJIIXElement, index: TJiixIndex): void;
    /**
     * Index a text element
     */
    protected indexTextElement(element: TJIIXTextElement, index: TJiixIndex, elementStrokes: string[]): void;
    /**
     * Index a math element
     */
    protected indexMathElement(element: TJIIXMathElement, index: TJiixIndex, elementStrokes: string[]): void;
    /**
     * Index a math expression recursively
     */
    protected indexMathExpression(expression: TJIIXMathExpression, element: TJIIXMathElement, index: TJiixIndex, elementStrokes: string[], path: string): void;
    /**
     * Index a node or edge element
     */
    protected indexNodeOrEdgeElement(element: TJIIXNodeElement | TJIIXEdgeElement, index: TJiixIndex, elementStrokes: string[]): void;
    /**
     * Ensure index is up to date.
     * When model.exports is absent (cleared by updateSymbol etc.) but a valid index exists,
     * preserve it rather than overwriting with an empty rebuild.
     */
    protected ensureIndexValid(): void;
    /**
     * Invalidate and immediately rebuild the index from current exports.
     * Called after mergeExport so the rebuild happens while exports are still set,
     * before any subsequent updateSymbol calls clear them.
     */
    invalidateIndex(): void;
    /**
     * Get the JIIX element containing a stroke
     * @param strokeId - The stroke ID
     * @returns The JIIX element or undefined
     */
    getElementForStroke(strokeId: string): TJIIXElement | undefined;
    /**
     * Get the ids of the strokes that make up a given block
     * @param blockId - The id of the JIIX element (block)
     * @returns Array of stroke ids, or an empty array if the block is unknown
     */
    getStrokeIdsForBlock(blockId: string): string[];
    /**
     * Get the precise label for a stroke
     * For text: returns char label if available, word label otherwise
     * For math: returns expression label or type
     * @param strokeId - The stroke ID
     * @returns The label or undefined
     */
    getLabelForStroke(strokeId: string): string | undefined;
    /**
     * Get detailed query result for a stroke
     * @param strokeId - The stroke ID
     * @returns Full query result with element, label, and context
     */
    getStrokeInfo(strokeId: string): TStrokeQueryResult | undefined;
    /**
     * Get the JIIX word group for a stroke (for word-level decorator spanning).
     * Returns all stroke IDs in the same word and the word's pixel bounding box.
     */
    getWordGroupForStroke(strokeId: string): {
        wordKey: string;
        wordBounds: TBox | null;
        allStrokeIds: string[];
        baseline: number | null;
        xHeight: number | null;
    } | null;
    /**
     * Get the pixel-space vertical center of the JIIX line containing the given stroke.
     * Uses the line's bounding-box center, not baseline-y (baseline sits low within a
     * line, not comparable to a symbol's bounds.center.y — mixing the two anchors
     * misclassifies strokes near a line boundary as belonging to the wrong row).
     * Returns null when the stroke isn't (yet) part of a recognized text word,
     * so callers can fall back to a geometric row calculation.
     */
    getLineCenterYForStroke(strokeId: string): number | null;
    /**
     * Get all stroke IDs belonging to an element
     * @param elementId - The JIIX element ID
     * @returns Array of stroke IDs
     */
    getStrokesForElement(elementId: string): string[];
    /**
     * Get all TStroke objects belonging to an element
     * @param elementId - The JIIX element ID
     * @returns Array of TStroke symbols
     */
    getStrokeSymbolsForElement(elementId: string): TStroke[];
    /**
     * Get all strokes grouped by word (for text elements)
     * @param elementId - The text element ID
     * @returns Array of word groups, each containing stroke IDs and label
     */
    getStrokesGroupedByWord(elementId: string): Array<{
        label: string;
        strokeIds: string[];
    }>;
    /**
     * Get all strokes grouped by character (for text elements)
     * @param elementId - The text element ID
     * @returns Array of char groups, each containing stroke IDs and label
     */
    getStrokesGroupedByChar(elementId: string): Array<{
        label: string;
        strokeIds: string[];
        wordIndex: number;
    }>;
    /**
     * Get all math blocks with their strokes
     * @returns Array of math blocks with their JIIX element and stroke IDs
     */
    getAllMathBlocksWithStrokes(): Array<{
        mathBlock: TJIIXMathElement;
        strokeIds: string[];
        strokes: TStroke[];
    }>;
    /**
     * Get all text blocks with their strokes
     * @returns Array of text blocks with their JIIX element and stroke IDs
     */
    getAllTextBlocksWithStrokes(): Array<{
        textBlock: TJIIXTextElement;
        strokeIds: string[];
        strokes: TStroke[];
    }>;
    /**
     * Get the label of a JIIX block by its ID
     * @param jiixBlockId - The JIIX element ID
     * @returns The label of the block, or undefined if not found
     */
    getBlockLabel(jiixBlockId: string): string | undefined;
    /**
     * Search strokes by label
     * @param label - The label to search for (case-insensitive partial match)
     * @returns Array of matching stroke query results
     */
    searchByLabel(label: string): TStrokeQueryResult[];
    getBlocksForSymbols(symbols: TSymbol[]): TJIIXElement[];
    /**
     * Get statistics about the indexed JIIX
     * @returns Index statistics
     */
    getIndexStats(): {
        totalStrokes: number;
        totalElements: number;
        byType: Record<string, number>;
        indexed: boolean;
    };
    /**
     * Get pixel-converted text metadata for a stroke
     */
    getTextMetadata(strokeId: string): TBlockTextMetadata | undefined;
    /**
     * Update pixel-converted text metadata for a stroke (called during sync)
     */
    updateTextMetadata(stroke: TStroke, element: TJIIXTextElement): void;
    /**
     * Clear text metadata for a stroke (called when stroke is deleted)
     */
    clearTextMetadata(strokeId: string): void;
    /**
     * Get stroke groups with pixel bboxes for text selection.
     * Only groups with valid bounding boxes are returned.
     * @param level - Selection granularity: "element", "word", or "char"
     */
    getTextSelectionGroups(level: "element" | "word" | "char"): Array<{
        strokeIds: string[];
        bounds: TBox;
    }>;
    /**
     * Get stroke groups with pixel bboxes for math selection.
     * Only groups with valid bounding boxes are returned.
     * @param level - Selection granularity: "element" or "operand"
     */
    getMathSelectionGroups(level: "element" | "operand"): Array<{
        strokeIds: string[];
        bounds: TBox;
    }>;
    /**
     * Get stroke groups with pixel bboxes for shape (Node/Edge) selection.
     * "element" level: one group per Node/Edge element.
     * "stroke" level: returns empty (signals fallback to stroke overlap).
     * @param level - Selection granularity: "element" or "stroke"
     */
    getShapeSelectionGroups(level: "element" | "stroke"): Array<{
        strokeIds: string[];
        bounds: TBox;
    }>;
    /**
     * Recursively collect math expression groups with pixel bboxes
     */
    protected collectMathExpressionGroups(expressions: TJIIXMathExpression[], groups: Array<{
        strokeIds: string[];
        bounds: TBox;
    }>): void;
}

/**
 * Manages keyboard input for the Interactive Ink canvas
 * Handles tool switching via modifier keys (Ctrl/Cmd for Move mode)
 * @group Manager
 */
declare class IIKeyboardManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    static readonly ZOOM_STEP = 1.2;
    static readonly PAN_STEP = 100;
    constructor(canvas: TInteractiveInkCanvas);
    /**
     * Attach keyboard event listeners to the window
     */
    attach(): void;
    /**
     * Detach keyboard event listeners from the window
     */
    detach(): void;
    /**
     * Reset the stored tool when user manually changes tool
     * Called by the canvas when tool changes programmatically
     */
    resetStoredTool(): void;
    /**
     * Handle keydown events
     * Handles copy/paste/cut shortcuts and Delete key; switches to Move tool when Ctrl/Cmd is pressed
     */
    protected handleKeyDown: (event: KeyboardEvent) => void;
    /**
     * Handle keyup events
     * Restores previous tool when Ctrl/Cmd is released
     */
    protected handleKeyUp: (event: KeyboardEvent) => void;
}

/**
 * Result display mode for math solver output
 * - "draw": add result strokes to the model (sent to backend, interactive)
 * - "ghost": render result strokes as SVG overlays (not in model, opacity 0.5, non-interactive)
 * @group Manager
 */
type TMathResultMode = "draw" | "ghost";
/**
 * Configuration for math computation behavior
 * @group Manager
 */
type TMathComputationConfig = {
    /** How solver output is displayed */
    resultMode: TMathResultMode;
    /** Automatically compute every block the server offers numerical computation for (ending with =, or a vertical operation with an empty result row) */
    autoCompute: boolean;
    /** Color applied to result strokes (both draw and ghost modes) */
    resultColor: string;
};
/**
 * Computation data for a math block
 * @group Manager
 */
type TMathBlockComputation = {
    /** Computed result from the solver */
    computedResult?: unknown;
    /** IDs of strokes that are solver outputs */
    solverOutputStrokeIds?: string[];
    /** Last computation timestamp */
    lastComputedAt?: number;
};
/**
 * Sub-manager responsible for tracking math block computations and running numerical solver operations
 * @group Manager
 */
declare class IIMathComputationSubManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    static readonly DEFAULT_CONFIG: TMathComputationConfig;
    constructor(canvas: TInteractiveInkCanvas, config?: Partial<TMathComputationConfig>);
    getConfig(): TMathComputationConfig;
    updateConfig(config: Partial<TMathComputationConfig>): void;
    get computations(): ReadonlyMap<string, TMathBlockComputation>;
    updateComputationResult(jiixBlockId: string, result: unknown): void;
    updateSolverOutputs(jiixBlockId: string, solverOutputStrokeIds: string[]): void;
    updateSolverOutputsForAll(solverOutputStrokeIds: string[]): void;
    getMathBlock(jiixBlockId: string): TMathBlockComputation | undefined;
    removeMathBlock(jiixBlockId: string): void;
    getStoredSolverOutputs(jiixBlockId: string): string[] | undefined;
    protected buildGhostStrokePath(points: TPoint[]): string;
    protected addGhostOutputStrokes(result: TJIIXMathElement, style?: TStyle): TStroke[];
    hasSolverOutputs(jiixBlockId: string): boolean;
    /**
     * Read from the model, not from the ids recorded at compute time: undo/redo adds and removes
     * drawn results without going through this manager, so the recorded ids can name strokes that
     * are gone - which froze the block with no result on screen.
     */
    hasDrawSolverOutputs(jiixBlockId: string): boolean;
    hasGhostStrokes(jiixBlockId: string): boolean;
    /** Element ids of a block's ghost strokes, for live CSS-transform following during a drag. */
    getGhostStrokeIds(jiixBlockId: string): string[];
    /**
     * Merged bounds of a block's ghost strokes, for inclusion in the selection rectangle
     * while the block has no frozen draw result yet. Undefined if the block has no ghost.
     */
    getGhostBounds(jiixBlockId: string): TBox | undefined;
    /**
     * Moves and redraws a block's ghost strokes in place, so they passively follow a
     * translate/resize/rotate of the block's source strokes instead of visually detaching.
     */
    applyTransformToGhostStrokes(jiixBlockId: string, matrix: MatrixTransform): void;
    clearGhostStrokes(jiixBlockId: string): void;
    clearAllGhostStrokes(): void;
    /**
     * Removes a block's solver output strokes and ghosts, without recording a history step.
     * @returns The removed strokes, so a caller can record them in its own history step
     */
    clearSolverOutputs(jiixBlockId: string): Promise<TSymbol[]>;
    clearAllSolverOutputs(): Promise<void>;
    computeNumericalResult(jiixBlockId: string, mode?: TMathResultMode): Promise<{
        result: TJIIXMathElement;
        addedStrokesCount: number;
        value?: number;
        wasRecomputed: boolean;
    }>;
    computeAllNumericalResults(): Promise<void>;
    /**
     * Clear then recompute numerical results for the given math blocks, or all blocks if none given.
     */
    forceCompute(jiixBlockIds?: string[]): Promise<void>;
    protected extractSolverOutputStrokesFromExpression(expression: TJIIXMathExpression): Array<{
        X: number[];
        Y: number[];
        F?: number[];
        T?: number[];
    }>;
    /**
     * Below a solver-output node every stroke is generated, flagged or not.
     */
    protected extractAllStrokesFromExpression(expression: TJIIXMathExpression): Array<{
        X: number[];
        Y: number[];
        F?: number[];
        T?: number[];
    }>;
    protected extractSolverOutputStrokes(mathElement: TJIIXMathElement): Array<{
        X: number[];
        Y: number[];
        F?: number[];
        T?: number[];
    }>;
    /**
     * Records the replacement of a block's drawn result as one undoable step, so undo/redo restores
     * the old result instead of stacking every result ever computed.
     */
    protected pushResultSwap(erased: TSymbol[], added: TStroke[]): void;
    addSolverOutputStrokes(result: TJIIXMathElement, style?: TStyle, addToHistory?: boolean): Promise<TStroke[]>;
    clear(): void;
    protected onDestroy(): void;
}

/**
 * Sub-manager responsible for math function evaluation
 * @group Manager
 */
declare class IIMathFunctionEvaluationSubManager extends IIAbstractManager {
    protected managerName: string;
    constructor(canvas: TInteractiveInkCanvas);
    evaluateFunction(jiixBlockId: string, evaluation: {
        inputVariableName: string;
        outputVariableName: string;
        from: number;
        to: number;
        pointCount: number;
    }): Promise<{
        [key: string]: number;
    }[][]>;
    getEvaluables(jiixBlockId: string): Promise<TMathEvaluable[]>;
}

/**
 * Type representing math symbol dependencies
 * @group Manager
 */
type TMathDependencies = {
    /**
     * Map of variable names to their source block IDs
     */
    variableSources?: {
        [variableName: string]: string;
    };
    /**
     * Array of block IDs that depend on this block
     */
    dependentBlocks?: string[];
    /**
     * Variables used by this block that aren't linked to another block (API, API_GLOBAL, PREDEFINED, UNDEFINED)
     */
    externalVariables?: TMathVariable[];
};
/**
 * Configuration for math interaction features
 * @group Manager
 */
type TMathInteractionConfig = {
    showDependencyOnHover: boolean;
    highlightOnSelect: boolean;
    dimOpacity: number;
};
/**
 * One display row for a variable in a specific math block context.
 * @group Manager
 */
type TMathVariableUsage = TMathVariable & {
    id: string;
    targetBlockId: string;
    targetLabel: string;
    sourceLabel?: string;
    isDefinition: boolean;
    isEditable: boolean;
};
/**
 * Unified sub-manager for math variable state, dependency tracking, and visual interactions.
 *
 * Responsibilities:
 * - Variable values: store, set, get per block
 * - Dependency graph: variable sources, dependent blocks, enrichment, cleanup
 * - Interaction visuals: hover highlighting, selection highlighting, dependency arrows
 *
 * @group Manager
 */
declare class IIMathVariableSubManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    private static readonly DEFAULT_CONFIG;
    private static readonly HIGHLIGHT_STYLES;
    constructor(canvas: TInteractiveInkCanvas, config?: Partial<TMathInteractionConfig>);
    updateConfig(config: Partial<TMathInteractionConfig>): void;
    getConfig(): TMathInteractionConfig;
    private getMathSymbols;
    findMathSymbolsByJiixId(jiixId: string): TStroke[];
    private getBlockBounds;
    private getAllMathBlockIds;
    protected findVariableBoxesInExpressions(expressions: TJIIXMathExpression[], variableName: string): TBox[];
    getDependencies(blockId: string): TMathDependencies | null;
    enrichMathDependencies(jiixBlockId: string, isStale?: () => boolean): Promise<void>;
    cleanupMathDependencies(jiixBlockIds: string[]): void;
    invalidateCache(jiixBlockId: string): void;
    getVariables(jiixBlockId?: string): Promise<TMathVariable[]>;
    getVariableValue(jiixBlockId: string, variableName: string): Promise<number | null>;
    setVariableValue(jiixBlockId: string, variableName: string, variableValue: number): Promise<void>;
    removeVariableValue(jiixBlockId: string, variableName: string): Promise<void>;
    asVariableDefinition(jiixBlockId: string): Promise<TMathVariableDefinition | null>;
    getVariableDefinitions(): Promise<TMathVariableDefinitions[]>;
    getAllVariableUsages(): Promise<TMathVariableUsage[]>;
    getRecursiveSources(jiixBlockId: string, visited?: Set<string>): Set<string>;
    getRecursiveDependents(jiixBlockId: string, visited?: Set<string>): Set<string>;
    private buildExternalVariableItems;
    /** Highlights each listed variable's occurrence(s) in the block's ink, colored to match its encart row. */
    private highlightExternalVariableOccurrences;
    /** Shows the variable-value encart centered on the block, plus matching in-ink highlights. No-op if there's nothing to show. */
    private showExternalVariablesEncart;
    onSymbolHover(jiixBlockId: string | null): void;
    private clearHoverHighlights;
    selectBlock(jiixBlockId: string): void;
    clearBlockSelection(): void;
    private clearSelectionHighlights;
    protected drawDependencyArrowToBox(fromId: string, fromBounds: TBox, toId: string, toBox: TBox, color: string): void;
    protected ensureArrowheadMarker(color: string): string;
    clearDependencyArrows(): void;
    protected drawDependencyArrows(jiixBlockId: string, sources: Set<string>, dependents: Set<string>): void;
    clearAll(): void;
    clear(): void;
    protected onDestroy(): void;
}

/**
 * @group Manager
 */
type TMathBlockCapabilities = {
    canEditVariables: boolean;
    canCompute: boolean;
    canEvaluate: boolean;
    hasDrawSolverOutputs: boolean;
};
/**
 * @group Manager
 * @remarks Derives and caches, per math block, which math operations are available (edit variables, compute, evaluate, manage solver output strokes).
 */
declare class IIMathCapabilitiesSubManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    constructor(canvas: TInteractiveInkCanvas, variables: IIMathVariableSubManager, computation: IIMathComputationSubManager, evaluation: IIMathFunctionEvaluationSubManager);
    getBlockCapabilities(jiixBlockId: string): Promise<TMathBlockCapabilities>;
    invalidateCache(jiixBlockId: string): void;
}

/**
 * Configuration passed to {@link IIMathManager} at load time.
 * Forwarded to the relevant sub-managers.
 * @group Manager
 */
type TMathConfig = {
    /** Override defaults for the computation sub-manager (resultMode, autoCompute) */
    computation?: Partial<TMathComputationConfig>;
    /** Override defaults for the variable/interaction sub-manager (showDependencyOnHover, highlightOnSelect, dimOpacity) */
    interaction?: Partial<TMathInteractionConfig>;
};
/**
 * Main Math manager that orchestrates all math-related sub-managers.
 *
 * Sub-managers:
 * - computation: Computation cache, solver I/O, numerical result ops
 * - variables: Variable state, dependency tracking, visual interactions (hover/select)
 * - evaluation: Function evaluation
 *
 * @group Manager
 */
declare class IIMathManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    constructor(canvas: TInteractiveInkCanvas, config?: TMathConfig);
    /**
     * Compute numerical result for a math symbol
     * @param jiixBlockId - The ID of the math block
     * @param mode - Result display mode ("draw" or "ghost"). Defaults to canvas.mathResultMode
     * @returns Promise with the computation result, number of added strokes, and numeric value
     */
    computeNumericalResult(jiixBlockId: string, mode?: TMathResultMode): Promise<{
        result: TJIIXMathElement;
        addedStrokesCount: number;
        value?: number;
        wasRecomputed: boolean;
    }>;
    computeAllNumericalResults(): Promise<void>;
    clearSolverOutputs(jiixBlockId: string): Promise<void>;
    clearAllSolverOutputs(): Promise<void>;
    forceCompute(jiixBlockIds?: string[]): Promise<void>;
    getComputation(jiixBlockId: string): TMathBlockComputation | undefined;
    getStoredSolverOutputs(jiixBlockId: string): string[] | undefined;
    clearGhostStrokes(jiixBlockId: string): void;
    hasSolverOutputs(jiixBlockId: string): boolean;
    hasDrawSolverOutputs(jiixBlockId: string): boolean;
    hasGhostStrokes(jiixBlockId: string): boolean;
    getGhostStrokeIds(jiixBlockId: string): string[];
    getGhostBounds(jiixBlockId: string): TBox | undefined;
    applyTransformToGhostStrokes(jiixBlockId: string, matrix: MatrixTransform): void;
    /**
     * Set value for a specific variable in a math expression
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @param variableName - Name of the variable to set
     * @param variableValue - Value to assign to the variable
     * @returns Promise that resolves when the variable is set
     */
    setVariableValue(jiixBlockId: string, variableName: string, variableValue: number): Promise<void>;
    /**
     * Sends variable values replayed by undo/redo to the backend, which keeps them nowhere else.
     * @param afterSync - wait for the next synchronization when the same step also changed strokes:
     * the backend renames a block whose strokes come back, and only the synchronization tells the
     * strokes their new block
     */
    replayVariableChanges(changes: TIIHistoryVariableChange[], afterSync: boolean): Promise<void>;
    /**
     * Set multiple variable values for a math symbol
     * @param jiixBlockId - The ID of the math block
     * @param variableValues - Object with variable names as keys and their values
     * @returns Promise that resolves when all variables are set
     */
    setListVariableValue(jiixBlockId: string, variableValues: Record<string, number>): Promise<void>;
    /**
     * Get variables from a math expression
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @returns Promise with array of variables
     */
    getVariables(jiixBlockId: string): Promise<TMathVariable[]>;
    /**
     * Get variable value from a math expression
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @param variableName - Name of the variable
     * @returns Promise with the value of the variable
     */
    getVariableValue(jiixBlockId: string, variableName: string): Promise<number | null>;
    getDependencies(jiixBlockId: string): TMathDependencies | null;
    enrichMathDependencies(jiixBlockId: string, isStale?: () => boolean): Promise<void>;
    cleanupMathDependencies(jiixBlockIds: string[]): void;
    recalculateDependentBlocks(sourceBlockId: string): Promise<void>;
    selectBlock(jiixBlockId: string): void;
    clearBlockSelection(): void;
    onSymbolHover(jiixBlockId: string | null): void;
    getVariablesConfig(): TMathInteractionConfig;
    updateVariablesConfig(config: Partial<TMathInteractionConfig>): void;
    removeVariable(jiixBlockId: string, variableName: string): Promise<void>;
    asVariableDefinition(jiixBlockId: string): Promise<TMathVariableDefinition | null>;
    getVariableDefinitions(): Promise<TMathVariableDefinitions[]>;
    getAllVariableUsages(): Promise<TMathVariableUsage[]>;
    clearVariableInteractions(): void;
    /**
     * Evaluate a math function for a math symbol
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @param evaluation - Evaluation parameters
     * @returns Promise with evaluation points
     */
    evaluateFunction(jiixBlockId: string, evaluation: {
        inputVariableName: string;
        outputVariableName: string;
        from: number;
        to: number;
        pointCount: number;
    }): Promise<{
        [key: string]: number;
    }[][]>;
    /**
     * Get evaluables from a math expression
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @returns Promise with array of evaluables
     */
    getEvaluables(jiixBlockId: string): Promise<TMathEvaluable[]>;
    /**
     * Get diagnostic result for a specific math task
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @param task - The task to diagnose (e.g., "numerical-computation", "evaluation")
     * @returns Promise with diagnostic result (e.g., "ALLOWED", "NOT_ALLOWED")
     */
    getDiagnostic(jiixBlockId: string, task: string): Promise<string>;
    /**
     * Get available math solver actions for a specific math element
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @returns Promise with array of available actions
     */
    getAvailableActions(jiixBlockId: string): Promise<string[]>;
    /**
     * Get which math operations (edit variables, compute, evaluate, manage solver output strokes)
     * are available for a math block. Result is cached per block until the block's variables,
     * computation state, or diagnostics change.
     * @param jiixBlockId - The ID of the math block
     */
    getBlockCapabilities(jiixBlockId: string): Promise<TMathBlockCapabilities>;
    getComputationConfig(): TMathComputationConfig;
    updateComputationConfig(config: Partial<TMathComputationConfig>): void;
    tryAutoCompute(): Promise<void>;
    protected onDestroy(): void;
}

/**
 * @group Manager
 */
declare class IIMoveManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    grabber: PointerEventGrabber;
    origin?: {
        viewBoxX: number;
        viewBoxY: number;
        clientX: number;
        clientY: number;
    };
    constructor(canvas: TInteractiveInkCanvas);
    protected updateViewBox(info: TPointerInfo, redrawGuide: boolean): void;
    attach(layer: HTMLElement): void;
    detach(): void;
    start(info: TPointerInfo): void;
    continue(info: TPointerInfo): void;
    end(info: TPointerInfo): void;
}

/**
 * Visual overlay configuration
 * @group Manager
 */
type TOverlayConfig = {
    showBlockOverlays: boolean;
    badgeSize: number;
    borderWidth: number;
    panelPadding: number;
    labelMaxChars: number;
    labelFontSize: number;
};
/**
 * One row displayed in the variable-value encart (name, current value, source-type label).
 * `swatchColor` matches the highlight drawn on the variable's occurrence(s) in the block ink;
 * `typeColor` colors the source-type label text (API/Global/Predefined/Undefined).
 * @group Manager
 */
type TVariableEncartItem = {
    name: string;
    value: string;
    typeLabel: string;
    typeColor: string;
    swatchColor: string;
};
/**
 * Default overlay configuration
 * @group Manager
 */
declare const DefaultOverlayConfig: TOverlayConfig;
/**
 * Unified overlay manager for all symbol types.
 *
 * Responsibilities:
 * - Math blocks: ∑ badge, border, hover zone, highlights, dimming
 * - Text blocks: recognized text badge, border
 *
 * Owned by InteractiveInkCanvas as `canvas.overlays`.
 *
 * @group Manager
 */
declare class IIOverlayManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    private static readonly BADGE_STYLES;
    private static readonly LABEL_STYLES;
    private static readonly VARIABLE_ENCART_ID;
    private static readonly ENCART_STYLES;
    constructor(canvas: TInteractiveInkCanvas, config?: Partial<TOverlayConfig>);
    updateConfig(config: Partial<TOverlayConfig>): void;
    getConfig(): TOverlayConfig;
    protected drawBadge(box: TBox, id: string, content: string): void;
    protected drawBorder(box: TBox, id: string, color?: string, dashArray?: string): void;
    protected drawLabel(box: TBox, id: string, fullLabel: string): void;
    protected createHoverZone(bounds: TBox, blockId: string): void;
    private getMathBlockBounds;
    refresh(): void;
    protected refreshMathOverlays(): void;
    protected refreshTextOverlays(): void;
    protected refreshEdgeNodeOverlays(): void;
    clearAll(): void;
    protected sanitizeId(id: string): string;
    protected drawOverlayRect(id: string, bounds: TBox, idPrefix: string, attrs: Partial<Record<string, string>>): void;
    highlightPrimary(id: string, bounds: TBox, color?: string): void;
    highlightLinked(id: string, bounds: TBox): void;
    highlightWithColor(box: TBox, symbolId: string, colorKey: string): void;
    addHoverGlow(id: string, bounds: TBox): void;
    dimSymbol(id: string, bounds: TBox, opacity?: number): void;
    clearHighlights(): void;
    /**
     * Small box, centered on `anchor`, listing non-BLOCK-sourced variables (API/Global/Predefined/Undefined)
     * used by the hovered or selected math block. Each row's swatch matches the color of that variable's
     * highlighted occurrence(s) in the block ink (see `highlightWithColor`).
     */
    showVariableEncart(options: {
        anchor: TPoint;
        items: TVariableEncartItem[];
    }): void;
    hideVariableEncart(): void;
    clearDimming(): void;
    apply(): void;
}

/**
 * @group Manager
 */
type TPlaybackState = "idle" | "playing" | "paused";
/**
 * Replays a recorded set of strokes on the canvas, point by point, honoring
 * their original relative timing (roadmap: Stroke Playback / Animation).
 *
 * Each point is fed to `canvas.writer` (`start`/`continue`/`end`) at the
 * moment it was originally recorded (scaled by `speed`), so ink appears to
 * be drawn progressively rather than strokes popping in fully formed.
 * Play / pause / resume / stop and live speed changes are supported.
 *
 * @group Manager
 */
declare class IIPlaybackManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    /** Called after each stroke is completed, with the running count. */
    onProgress?: (current: number, total: number) => void;
    /** Called whenever play/pause/resume/stop changes the manager's state. */
    onStateChange?: (state: TPlaybackState) => void;
    /** Called once every stroke has been replayed. */
    onEnd?: () => void;
    constructor(canvas: TInteractiveInkCanvas);
    get state(): TPlaybackState;
    get progress(): {
        current: number;
        total: number;
    };
    /**
     * Start replaying `strokes` in order of their first point's timestamp.
     * Stops any run already in progress.
     * @param strokes - Recorded strokes to replay (same shape as `importPointEvents`), including
     * recordings saved before pointers stored a delta.
     * @param speed - Playback speed multiplier (1 = original timing, 2 = twice as fast).
     */
    play(strokes: TStrokeImport[], speed?: number): void;
    /**
     * Pause playback, preserving progress so `resume()` continues from here.
     * If a stroke is mid-progress, pause is deferred until that stroke completes
     * naturally - it is never cut short.
     */
    pause(): void;
    /** Resume playback from where it was paused. */
    resume(): void;
    /** Stop playback and reset progress. Already-replayed strokes remain on the canvas. */
    stop(): void;
    /**
     * Change the playback speed. If currently playing, remaining points are
     * rescheduled immediately at the new speed without losing progress.
     */
    setSpeed(speed: number): void;
    protected onDestroy(): void;
}

/**
 * @group Renderer
 * @summary
 * List all svg elements resize direction
 * @remarks
 * only usable in the case of interactive ink canvas
 */
declare const enum ResizeDirection {
    North = "n-resize",
    East = "e-resize",
    South = "s-resize",
    West = "w-resize",
    NorthEast = "ne-resize",
    NorthWest = "nw-resize",
    SouthEast = "se-resize",
    SouthWest = "sw-resize"
}

/**
 * @group Manager
 */
declare class IIResizeManager extends IIAbstractTransformManager {
    protected managerName: string;
    direction: ResizeDirection;
    boundingBox: TBox;
    transformOrigin: TPoint;
    keepRatio: boolean;
    constructor(canvas: TInteractiveInkCanvas);
    /**
     * One hook, like the other two managers'. `transformOrigin` is passed here, which is
     * what lets the ellipse and the arc scale their centre about it from inside their own util.
     */
    protected applyThroughUtil(symbol: TSymbol, matrix: MatrixTransform): void;
    start(target: Element, origin: TPoint): void;
    continue(point: TPoint): {
        scaleX: number;
        scaleY: number;
    };
    end(point: TPoint): Promise<void>;
}

/**
 * @group Manager
 */
declare class IIRotationManager extends IIAbstractTransformManager {
    protected managerName: string;
    center: TPoint;
    origin: TPoint;
    constructor(canvas: TInteractiveInkCanvas);
    /**
     * One hook, like the other two managers'. `center` is passed here rather than read
     * off `this` inside the util, which is what retired its definite-assignment assertion.
     */
    protected applyThroughUtil(symbol: TSymbol, matrix: MatrixTransform): void;
    start(target: Element, origin: TPoint): void;
    continue(point: TPoint): number;
    end(point: TPoint): Promise<void>;
}

/**
 * @group Manager
 * @remarks Level of text selection granularity
 */
type TTextSelectionLevel = "element" | "word" | "char";
/**
 * @group Manager
 * @remarks Level of math selection granularity
 */
type TMathSelectionLevel = "element" | "operand";
/**
 * @group Manager
 * @remarks Level of shape (Node/Edge) selection granularity
 */
type TShapeSelectionLevel = "element" | "stroke";
/**
 * @group Manager
 * @remarks Level of symbol selection
 */
type TSelectionConfig = {
    textLevel: TTextSelectionLevel;
    mathLevel: TMathSelectionLevel;
    shapeLevel: TShapeSelectionLevel;
};
/**
 * @group Manager
 * @remarks Default values of symbol selection
 */
declare const DefaultSelectionConfig: TSelectionConfig;
/**
 * @group Manager
 */
declare class IISelectionManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    grabber: PointerEventGrabber;
    startSelectionPoint?: TPoint;
    endSelectionPoint?: TPoint;
    selectedGroup?: SVGGElement;
    constructor(canvas: TInteractiveInkCanvas);
    get rotation(): IIRotationManager;
    get translate(): IITranslateManager;
    get resize(): IIResizeManager;
    get selectionBox(): TBox | undefined;
    attach(layer: HTMLElement): void;
    detach(): void;
    drawSelectingRect(box: TBox): void;
    clearSelectingRect(): void;
    protected getPoint(ev: PointerEvent): TPoint;
    protected createTranslateRect(box: TBox): SVGRectElement;
    protected createRotateGroup(box: TBox): SVGGElement;
    protected createResizeGroup(box: TBox): SVGGElement;
    protected createInteractElementsGroup(symbols: TSymbol[]): SVGGElement | undefined;
    /**
     * In "element" mode, bounds of any active ghost preview for a selected math block —
     * merged into the selection rectangle even though ghost strokes aren't real model symbols.
     */
    private getGhostBoxesForSelectedMath;
    /**
     * `edge` positions the handles and nothing more. The drag handlers take a **fresh draft on every
     * frame**: a draft is frozen the moment it is committed, so one draft reused across the gesture
     * would throw on the second `pointermove`.
     */
    protected createEdgeResizeGroup(edge: TEdge): SVGGElement;
    /**
     * Path-based hit area for an edge — a narrow stroke following the edge's own geometry, rather
     * than its bounding box, which on a diagonal edge would be a far larger clickable rectangle than
     * the edge itself.
     */
    protected createEdgeTranslatePath(edge: TEdge): SVGPathElement;
    protected createInteractEdgeGroup(edge: TEdge): SVGGElement | undefined;
    drawSelectedGroup(symbols: TSymbol[]): void;
    removeSelectedGroup(): void;
    redrawSelectedGroup(): void;
    hideInteractElements(): void;
    /**
     * Build selected/covered stroke ID sets from JIIX text groups.
     * Returns null when no JIIX groups exist (fallback to stroke overlap).
     */
    protected getTextGroupSets(selectionBox: TBox): {
        selected: Set<string>;
        covered: Set<string>;
    } | null;
    /**
     * Build selected/covered stroke ID sets from JIIX math groups.
     * Returns null when no JIIX groups exist (fallback to stroke overlap).
     */
    protected getMathGroupSets(selectionBox: TBox): {
        selected: Set<string>;
        covered: Set<string>;
    } | null;
    /**
     * Build selected/covered stroke ID sets from JIIX shape (Node/Edge) groups.
     * Returns null when level is "stroke" or no groups exist (fallback to stroke overlap).
     */
    protected getShapeGroupSets(selectionBox: TBox): {
        selected: Set<string>;
        covered: Set<string>;
    } | null;
    start(info: TPointerInfo): void;
    continue(info: TPointerInfo): TSymbol[];
    /**
     * JIIX block IDs currently qualifying as "selected".
     * In "element" mode: a block qualifies if any of its strokes are selected.
     * In "operand" mode: a block qualifies only if ALL its strokes are selected.
     */
    private getQualifyingMathBlockIds;
    /**
     * Find the JIIX block ID of the single fully-selected math block, if any.
     * Returns undefined when zero or more than one block qualifies.
     */
    getSelectedMathJiixBlockId(): string | undefined;
    /**
     * Whether the given math block currently qualifies as selected.
     * Reuses the same per-block coverage rule as {@link getSelectedMathJiixBlockId},
     * without the single-block constraint (supports multi-block selection).
     */
    isMathBlockSelected(jiixBlockId: string): boolean;
    /**
     * In "element" mode, grows the current selection to include, for every math block that has
     * at least one selected source stroke, all of that block's sibling source strokes plus its
     * frozen draw result stroke (if any). No-op in "operand" mode.
     */
    expandSelectionForMathBlocks(): void;
    /**
     * For every selected stroke that belongs to a Node or Edge JIIX block, pull in all sibling
     * strokes of that block — unconditionally (unlike expandSelectionForMathBlocks, this doesn't
     * gate on selection.mathLevel; shape/edge blocks always move as one rigid group so that
     * connected-edge live-follow has a consistent group bounds to work with).
     */
    expandSelectionForBlocks(): void;
    end(info: TPointerInfo): TSymbol[];
    protected onContextMenu(info: TPointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
type TSnapConfiguration = {
    guide: boolean;
    symbol: boolean;
    angle: number;
};
/**
 * @group Manager
 * @source
 */
declare const DefaultSnapConfiguration: TSnapConfiguration;
/**
 * @group Manager
 */
declare class SnapConfiguration implements TSnapConfiguration {
    guide: boolean;
    symbol: boolean;
    angle: number;
    constructor(config?: TPartialDeep<TSnapConfiguration>);
}
/**
 * @group Manager
 */
type TSnapNudge = TPoint;
/**
 * @group Manager
 */
type TSnapLineInfos = {
    nudge: TSnapNudge;
    verticales: TSegment[];
    horizontales: TSegment[];
};
/**
 * @group Manager
 */
declare class IISnapManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    snapConfiguration: SnapConfiguration;
    constructor(canvas: TInteractiveInkCanvas, config?: TPartialDeep<TSnapConfiguration>);
    /**
     * Snap points of the selection's own bounding box. Rebuilt only when the model content or the
     * selection changed — reading it lists the whole document to filter the selection out of it, and
     * a drag asks for it once per pointermove.
     */
    get selectionSnapPoints(): TPoint[];
    /**
     * Snap points of every non-selected symbol, rebuilt only when the model content or the
     * selection actually changed. Called on every pointermove while drawing/resizing/translating —
     * neither `model.version` (content) nor selection changes mid-drag, so this reuses the cache
     * for the whole gesture instead of re-scanning every symbol per move.
     */
    get otherSnapPoints(): TPoint[];
    get snapThreshold(): number;
    protected getNearestVerticalGuide(x: number): number;
    protected getNearestHorizontalGuide(y: number): number;
    protected getGuidePointToSnap(point: TPoint): TPoint;
    drawSnapToElementLines(lines: TSegment[]): void;
    clearSnapToElementLines(): void;
    protected buildXBuckets(points: TPoint[], bucketSize: number): Map<number, TPoint[]>;
    protected buildYBuckets(points: TPoint[], bucketSize: number): Map<number, TPoint[]>;
    protected getSnapLinesInfos(sourcePoints: TPoint[], targetPoints: TPoint[]): TSnapLineInfos;
    snapResize(point: TPoint, horizontal?: boolean, vertical?: boolean): TPoint;
    snapTranslate(tx: number, ty: number): TSnapNudge;
    snapRotation(angleDegree: number): number;
}

/**
 * @group Manager
 * @remarks Simplified synchronizer that only manages JIIX block IDs and stroke lifecycle
 */
declare class IISynchronizerManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    static readonly MAX_RETRY_ATTEMPTS = 3;
    static readonly RETRY_DELAY_MS = 500;
    /** How long one math block's dependency enrichment may take before the sync stops waiting for it */
    static readonly ENRICH_TIMEOUT_MS = 5000;
    /** Main-thread time `#doSynchronize`'s loop may take before yielding a frame, so a large
     * document doesn't block pending pointer input in one go. A time budget, not an element count:
     * counting yielded one frame per N elements even when the pass had nothing to do. */
    static readonly SYNC_YIELD_BUDGET_MS = 8;
    constructor(canvas: TInteractiveInkCanvas);
    synchronize(): Promise<void>;
}

/**
 * Orchestrates the three transform sub-managers (translate, resize, rotation).
 * Access via canvas.transform.translate / .resize / .rotation
 * @group Manager
 */
declare class IITransformManager extends IIAbstractManager {
    protected managerName: string;
    readonly translate: IITranslateManager;
    readonly resize: IIResizeManager;
    readonly rotation: IIRotationManager;
    constructor(canvas: TInteractiveInkCanvas);
    /**
     * Applies a matrix transform locally (model + redraw), without backend or history side
     * effects. Used by InteractiveInkCanvas's undo/redo replay dispatcher.
     */
    applyMatrix(symbols: TSymbol[], matrix: MatrixTransform): void;
}

/**
 * @group Manager
 */
declare class IIWriterManager extends AbstractWriterManager {
    #private;
    detectGesture: boolean;
    canvas: TInteractiveInkCanvas;
    currentSymbolOrigin?: TPoint;
    constructor(canvas: TInteractiveInkCanvas);
    get tool(): CanvasWriteTool;
    set tool(wt: CanvasWriteTool);
    get model(): IIModel;
    get renderer(): SVGRenderer;
    get history(): IIHistoryManager;
    get gestureManager(): IIGestureManager;
    get snaps(): IISnapManager;
    get client(): WebSocketClient;
    attach(layer: HTMLElement): void;
    /**
     * name: alice-strokes-write-latency
     */
    detach(): void;
    /**
     * Coalesces the DOM write for the current symbol to at most once per animation
     * frame: a fast pen/mouse can fire many `continue()` calls per frame (further
     * amplified by coalesced pointer samples), each of which would otherwise force
     * a real DOM replace + repaint on a canvas that may already hold many symbols.
     */
    protected scheduleRender(): void;
    protected cancelScheduledRender(): void;
    protected needContextLessGesture(stroke: TStroke): boolean;
    protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string, creationTime: number): TSymbol;
    protected updateCurrentSymbolShape(pointer: TPointer): void;
    protected updateCurrentSymbolEdge(pointer: TPointer): void;
    protected updateCurrentSymbol(pointer: TPointer): TSymbol;
    start(info: TPointerInfo): void;
    continue(info: TPointerInfo): void;
    protected interactWithBackend(stroke: TStroke): Promise<void>;
    end(info: TPointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
declare class IDebugSVGManager {
    #private;
    canvas: TInkCanvas;
    constructor(canvas: TInkCanvas);
    get model(): IModel;
    get renderer(): SVGRenderer;
    get recognitionBoxVisibility(): boolean;
    set recognitionBoxVisibility(show: boolean);
    get recognitionBoxItemsVisibility(): boolean;
    set recognitionBoxItemsVisibility(show: boolean);
    protected drawBoundingBox(symbols: TSymbol[]): void;
    protected drawRecognitionBox(box: TBox, infos: string[], color: string, debugAttr: string): void;
    protected buildInfos(obj: object, currentPath?: string): string[];
    protected showRecognitionBox(): Promise<void>;
    protected showRecognitionBoxItems(): Promise<void>;
    protected clearRecognitionBox(): void;
    protected clearRecognitionBoxItems(): void;
    debugRecognitionBox(): Promise<void>;
    debugRecognitionBoxItems(): Promise<void>;
    apply(): void;
}

/**
 * @group Canvas
 * @remarks Lists all events that can be listened to on the canvas or DOM element
 * @example
 * You can run code on "CanvasEventName" raised by using
 * ```ts
 * canvas.event.addEventListener(CanvasEventName.CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
declare enum CanvasEventName {
    /**
     * @remarks event emitted when history has changed i.e. the context of undo-redo
     */
    CHANGED = "changed",
    /**
     * @remarks event emitted when clearing is complete
     */
    CLEARED = "cleared",
    /**
     * @remarks event emitted after the conversion is complete
     */
    CONVERTED = "converted",
    /**
     * @remarks event emitted when the canvas encounters an error
     */
    ERROR = "error",
    /**
     * @remarks event emitted after
     */
    NOTIF = "notif",
    /**
     * @remarks event emitted after the end of the export
     */
    EXPORTED = "exported",
    /**
     * @remarks event emitted after the end of the import
     */
    IMPORTED = "imported",
    /**
     * @remarks event emitted when the server is idle after a job
     */
    IDLE = "idle",
    /**
     * @remarks event emitted after full canvas initialization
     */
    LOADED = "loaded",
    /**
     * @remarks event emitted session opened
     */
    SESSION_OPENED = "session-opened",
    /**
     * @remarks event emitted after selection change
     */
    SELECTED = "selected",
    /**
     * @remarks event emitted after tool change
     */
    TOOL_CHANGED = "tool-changed",
    /**
     * @remarks event emitted after mode change
     */
    UI_UPDATED = "ui-updated",
    /**
     * @remarks event emitted after stroke synchronized with jiix
     */
    SYNCHRONIZED = "synchronized",
    /**
     * @remarks event emitted after applying a gesture
     */
    GESTURED = "gestured",
    /**
     * @remarks event emitted when the connection status changes (e.g. going offline while queueing strokes, or reconnecting)
     */
    CONNECTION_STATUS_CHANGED = "connection-status-changed",
    /**
     * @remarks event emitted when the derived UI connection state changes (see {@link TCanvasConnectionState})
     */
    CONNECTION_STATE_CHANGED = "connection-state-changed"
}
/**
 * @group Canvas
 * @remarks Derived, UI-oriented connection state combining initialization, connection, offline
 * queue, and busy/idle status. See `canvas.connectionState` and `addConnectionStateChangedListener`.
 * - `initializing` — canvas not yet connected to the server for the first time
 * - `online-idle` — connected, client idle
 * - `online-working` — connected, client processing a request
 * - `syncing` — disconnected, actively reconnecting, with strokes queued to replay
 * - `offline` — disconnected, actively reconnecting, nothing queued yet
 * - `error` — reconnection attempts exhausted, queued strokes were rejected
 */
type TCanvasConnectionState = "initializing" | "online-idle" | "online-working" | "syncing" | "offline" | "error";
/**
 * @group Canvas
 */
declare class CanvasEvent extends EventTarget {
    #private;
    protected abortController: AbortController;
    element: Element;
    constructor(element: Element);
    removeAllListeners(): void;
    protected emit(type: string, data?: unknown): void;
    emitConnectionStatusChanged(status: TConnectionStatus): void;
    addConnectionStatusChangedListener(callback: (status: TConnectionStatus) => void): void;
    emitConnectionStateChanged(state: TCanvasConnectionState): void;
    addConnectionStateChangedListener(callback: (state: TCanvasConnectionState) => void): void;
    emitSessionOpened(sessionId: string): void;
    addSessionOpenedListener(callback: (sessionId: string) => void): void;
    emitLoaded(): void;
    addLoadedListener(callback: () => void): void;
    emitNotif(notif: {
        message: string;
        timeout?: number;
    }): void;
    addNotifListener(callback: (notif: {
        message: string;
        timeout?: number;
    }) => void): void;
    emitError(err: Error): void;
    addErrorListener(callback: (err: Error) => void): void;
    emitExported(exports: TExport | TExportV2): void;
    addExportedListener(callback: (exports: TExport | TExportV2) => void): void;
    emitChanged(undoRedoContext: THistoryContext): void;
    addChangedListener(callback: (context: THistoryContext) => void): void;
    emitIdle(idle: boolean): void;
    addIdleListener(callback: (idle: boolean) => void): void;
    emitCleared(): void;
    addClearedListener(callback: () => void): void;
    emitConverted(exports?: TExport): void;
    addConvertedListener(callback: (exports: TExport) => void): void;
    emitImported(exports: TExport): void;
    addImportedListener(callback: (exports: TExport) => void): void;
    emitSelected(symbols: TBaseSymbol[]): void;
    addSelectedListener(callback: (symbols: TSymbol[]) => void): void;
    emitToolChanged(mode: CanvasTool): void;
    addToolChangedListener(callback: (mode: CanvasTool) => void): void;
    emitUIpdated(): void;
    addUIpdatedListener(callback: () => void): void;
    emitSynchronized(): void;
    addSynchronizedListener(callback: () => void): void;
    emitGestured(gesture: {
        gestureType: TGestureType;
        stroke: TStroke;
    }): void;
    addGesturedListener(callback: (gesture: {
        gestureType: TGestureType;
        stroke: TStroke;
    }) => void): void;
}

/**
 * @group Canvas
 */
type TCanvasLayerUIState = {
    root: HTMLDivElement;
    icon: HTMLDivElement;
    count: HTMLSpanElement;
    tooltip: HTMLDivElement;
};
/**
 * @group Canvas
 */
type TCanvasLayerUI = {
    root: HTMLDivElement;
    loader: HTMLDivElement;
    state: TCanvasLayerUIState;
};
/**
 * @group Canvas
 */
type TCanvasStateDetail = {
    /** Number of addStrokes batches queued locally while offline (only relevant for `syncing`). */
    queuedCount: number;
    /** Labels of operations currently running (only relevant for `online-working`), e.g. `["Converting"]`. */
    activeOperations: string[];
};
/**
 * @group Canvas
 */
declare class CanvasLayer {
    #private;
    root: HTMLElement;
    ui: TCanvasLayerUI;
    rendering: HTMLElement;
    onCloseModal?: (inError?: boolean) => void;
    constructor(root: HTMLElement, rootClassCss?: string);
    render(): void;
    createLoader(): HTMLDivElement;
    showLoader(): void;
    hideLoader(): void;
    clearModal(): void;
    showMessageInfo(notif: {
        message: string;
        timeout?: number;
    }): void;
    showMessageError(err: Error | string): void;
    createState(): TCanvasLayerUIState;
    /**
     * Reflect the canvas's derived state (see `TCanvasConnectionState`) on the state badge:
     * icon, color (via CSS class), and the explanatory tooltip shown next to the badge on click
     * (including active operation labels or queued count).
     */
    updateCanvasState(state: TCanvasConnectionState, detail: TCanvasStateDetail): void;
    createLayerUI(): TCanvasLayerUI;
    createLayerRender(): HTMLDivElement;
    destroy(): void;
}

/**
 * Every label ever passed to `startOperation`/`endOperation`/`trackOperation` (shown on the
 * canvas state badge tooltip). `Writing`/`Translating`/`Resizing`/`Rotating` additionally
 * identify an in-progress user gesture — see {@link GESTURE_OPERATION_LABELS}.
 * @group Canvas
 */
type TCanvasOperationLabel = "Recognizing" | "Writing" | "Translating" | "Resizing" | "Rotating" | "Synchronizing" | "Applying gesture" | "Converting" | "Computing" | "Updating variables" | "Loading variables" | "Evaluating" | "Checking" | "Exporting" | "Importing" | "Undoing" | "Redoing" | "Clearing" | "Removing strokes";

/**
 * @hidden
 * @group Canvas
 */
type TCanvasConfiguration = {
    logger: TLoggerConfiguration;
    ui?: {
        /** Whether to show the connection-state badge (bottom-left icon). Defaults to `true`. */
        showConnectionState?: boolean;
    };
    /** Where the menus, the connection state and the minimap sit; see {@link TLayoutConfiguration} */
    layout?: TLayoutConfiguration;
};
/**
 * @group Canvas
 * @remarks "INK_V1" is deprecated use "INK_V2" instead.
 */
type TCanvasType = "INTERACTIVE_INK" | "INK_V1" | "INTERACTIVE_INK_SSR" | "INK_V2";
/**
 * @hidden
 * @group Canvas
 */
type TCanvasOptionsBase = {
    configuration: TCanvasConfiguration;
    override?: {
        cssClass?: string;
    };
};
declare global {
    interface HTMLElement {
        /** The iink canvas instance mounted on this element by {@link Canvas.load}. */
        iink?: AbstractCanvas;
    }
}
/**
 * @group Canvas
 */
declare abstract class AbstractCanvas {
    #private;
    /** Logger instance for this canvas. */
    logger: Logger;
    /** DOM layer manager handling rendering, UI, and modal elements. */
    layers: CanvasLayer;
    /** Event bus for subscribing to canvas lifecycle and content events. */
    event: CanvasEvent;
    /** Server API information (version, etc.) loaded on first connection. */
    info?: TApiInfos;
    constructor(rootElement: HTMLElement, options?: TPartialDeep<TCanvasOptionsBase>);
    /**
     * Derived, UI-oriented canvas state — see {@link TCanvasConnectionState}.
     * Listen to `event.addConnectionStateChangedListener` for change notifications.
     */
    get connectionState(): TCanvasConnectionState;
    /**
     * Run `fn`, marking `label` as an active operation for the duration (shown on the canvas
     * state badge tooltip). Safe against overlapping/concurrent calls with the same or different
     * labels, and against `fn` throwing (the operation is always ended).
     */
    trackOperation<T>(label: TCanvasOperationLabel, fn: () => Promise<T>): Promise<T>;
    /**
     * @remarks The client's `idle` event only fires in response to an explicit
     * `client.waitForIdle()` call (a request/response pair, not a push notification) — it does
     * NOT fire automatically after every `addStrokes()`/transform/etc. So it cannot be used to end
     * a "Recognizing" operation reliably. This only preserves the public `event.emitIdle` passthrough
     * for consumers who call `waitForIdle()` themselves.
     */
    protected manageIdleState(idle: boolean): void;
    /** Mark `label` as active. Prefer `trackOperation` unless the operation isn't promise-shaped. */
    startOperation(label: TCanvasOperationLabel): void;
    /** Mark one occurrence of `label` as finished. Must be paired with a prior `startOperation`. */
    endOperation(label: TCanvasOperationLabel): void;
    /**
     * Force `label` fully inactive regardless of how many `startOperation` calls are pending.
     * For level-triggered signals with a single external "done" event (e.g. the client's
     * `idle` event) rather than one end call per start call.
     */
    protected clearOperation(label: TCanvasOperationLabel): void;
    /** Whether `label` is currently active (at least one unmatched `startOperation` call). */
    hasOperation(label: TCanvasOperationLabel): boolean;
    /** Called once the canvas has connected to its backend for the first time. */
    protected markConnectedOnce(): void;
    /** Only relevant for WebSocket-backed canvas; other variants never call this. */
    protected manageConnectionStatus(status: TConnectionStatus, offlineQueueLength?: number): void;
    get loggerConfiguration(): TLoggerConfiguration;
    set loggerConfiguration(loggerConfig: TLoggerConfiguration);
    abstract initialize(): Promise<void>;
    abstract clear(): Promise<void>;
    /** The variant's rendering backend, declared here only so {@link teardownCommon} can tear it down generically. */
    abstract renderer: {
        destroy(): void;
    };
    abstract destroy(): Promise<void>;
    /**
     * Clears the `rootElement.iink` back-reference set in the constructor, guarded so it only
     * clears the reference if it's still pointing at this instance — a newer canvas mounted on
     * the same element (e.g. `Canvas.load()` replacing an instance) must not have its own
     * reference clobbered by this (older) instance's `destroy()` running after the fact.
     * Every `destroy()` implementation must call this, or the mounting DOM element keeps a
     * strong reference to the entire destroyed canvas graph.
     */
    protected clearRootElementReference(): void;
    /**
     * Common teardown shared by every variant's `destroy()`: stops the resize observer, removes
     * all `event` listeners, and destroys the DOM layers and the renderer. Each variant calls this
     * in addition to its own teardown (input-handler detach, client/menu/model/history cleanup,
     * etc.) and must still call {@link clearRootElementReference} itself afterwards.
     */
    protected teardownCommon(): void;
    abstract resize(dims?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    /**
     * Minimum height/width for `resolveDimensions`, from the variant's own rendering configuration.
     * @hidden
     */
    protected abstract get minDimensions(): {
        minHeight: number;
        minWidth: number;
    };
    /**
     * Resolves the target height/width for `resize()`: an explicit value wins, otherwise falls
     * back to the mounting root element's computed size, clamped to `minDimensions`.
     */
    protected resolveDimensions(height?: number, width?: number): {
        height: number;
        width: number;
    };
    abstract get tool(): CanvasTool;
    /**
     * Toggles the `draw`/`erase` CSS classes on the mounting root element to reflect the
     * current tool. Default 2-state (Write/Erase) implementation shared by variants with no
     * other tool; `InteractiveInkCanvas` overrides it for its 4-state tool set.
     */
    /**
     * CSS classes toggled by {@link setCursorStyle} to reflect the current tool on the mounting
     * root element. Default 2-state (`draw`/`erase`) set; override alongside {@link getCursorClass}
     * for variants with additional tools.
     */
    protected get cursorClasses(): string[];
    /** The single class from {@link cursorClasses} that should be active for the current tool. */
    protected getCursorClass(): string;
    protected setCursorStyle(): void;
    protected startResizeObserver(): void;
    protected stopResizeObserver(): void;
    loadInfo(server: TServerHTTPConfiguration): Promise<TApiInfos>;
}

/**
 * @group Canvas
 * @remarks
 * Configure when the action is triggered.
 *
 * POINTER_UP :   Action is triggered on every PenUP.
 *                This is the recommended mode for CDK V3 WebSocket recognitions.
 *
 * QUIET_PERIOD : Action is triggered after a quiet period in milli-seconds on every pointer up.
 *                The value is set to 1000 for example recognition will be triggered when the user stops writing for 1 seconds.
 *                This is the recommended mode for all REST discoveries.
 *
 * DEMAND :       Action is triggered on external demande
 */
type TCanvasTriggerConfiguration = {
    exportContent: "QUIET_PERIOD" | "POINTER_UP" | "DEMAND";
    exportContentDelay: number;
    resizeTriggerDelay: number;
};
/**
 * @group Canvas
 * @source
 */
declare const DefaultCanvasTriggerConfiguration: TCanvasTriggerConfiguration;

/**
 * @group Canvas
 */
type TInkCanvasConfiguration = TCanvasConfiguration & THTTPClientV2Configuration & {
    rendering: TIIRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TCanvasTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TStyle;
};
/**
 * @group Canvas
 * @source
 */
declare const DefaultInkCanvasConfiguration: TInkCanvasConfiguration;
/**
 * @group Canvas
 */
declare class InkCanvasConfiguration implements TInkCanvasConfiguration {
    server: TServerHTTPConfiguration;
    recognition: THTTPClientV2RecognitionConfiguration;
    rendering: TIIRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TCanvasTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TStyle;
    constructor(configuration?: TPartialDeep<InkCanvasConfiguration>);
}

/**
 * Structural type for {@link InkCanvas} — the INK_V2 canvas — and the counterpart of
 * {@link TInteractiveInkCanvas}.
 *
 * The managers under `manager/base` and `manager/debug` serve both variants, so they must be typed
 * against a shape rather than a class: `EraseManager` already takes
 * `TInteractiveInkCanvas | InkCanvas` and narrows with a type guard, which only worked because one
 * half of that union happened to be an interface. With this type the union is symmetrical, no shared
 * manager names a concrete canvas, and neither canvas has to exist for one of them to be tested.
 * @group Canvas
 */
type TInkCanvas = {
    readonly model: IModel;
    readonly configuration: InkCanvasConfiguration;
    readonly event: CanvasEvent;
    readonly layers: CanvasLayer;
    readonly layout: LayoutManager<TInkCanvas>;
    readonly renderer: SVGRenderer;
    readonly client: HTTPClientV2;
    get penStyle(): TStyle;
    set penStyle(v: TPartialDeep<TStyle>);
    tool: CanvasTool;
    get initializationPromise(): Promise<void>;
    get connectionState(): TCanvasConnectionState;
    readonly history: IHistoryManager;
    updateSymbolsStyle(symbolIds: string[], style: TPartialDeep<TStyle>): void;
    importStrokes(strokes: TPartialDeep<TStroke>[]): Promise<TExportV2>;
    removeStrokes(strokeIds: string[]): Promise<void>;
    export(requestedMimeTypes?: string[]): Promise<TExportV2>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    initialize(): Promise<void>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
    resize(dims?: {
        height?: number;
        width?: number;
    }): Promise<void>;
};

/**
 * @group Canvas
 */
type TInkCanvasOptions = TPartialDeep<TCanvasOptionsBase & {
    configuration: TInkCanvasConfiguration;
}> & {
    override?: {
        /** An `HTTPClientV2` subclass, instantiated by the canvas with its configuration */
        client?: typeof HTTPClientV2;
    };
    /** Content added at load, so it is there from the first render (functions: hence not in `configuration`) */
    extend?: {
        /** Custom occupants of the layout, like `canvas.layout.add` */
        layout?: TLayoutOccupant<TInkCanvas>[];
    };
};
/**
 * @group Canvas
 * @remarks InkCanvas is the core canvas variant focused on freeform ink input, rendering, and recognition. It provides a rich API for managing strokes, exports, and canvas state, and serves as the foundation for more specialized canvas variants.
 *
 * Key features include:
 * - Stroke management: Add, remove, and style ink strokes with real-time rendering.
 * - Recognition integration: Seamlessly send ink data to the client and handle results.
 * - Export capabilities: Support for exporting recognized content in various formats.
 * - History management: Undo/redo functionality for stroke modifications and exports.
 * - Tool support: Built-in tools for writing and erasing with customizable styles.
 *
 * The InkCanvas is designed for extensibility, allowing developers to override core components like the client or input grabber for custom behavior.
 */
declare class InkCanvas extends AbstractCanvas implements TInkCanvas {
    #private;
    renderer: SVGRenderer;
    client: HTTPClientV2;
    history: IHistoryManager;
    writer: IWriterManager;
    eraser: EraseManager;
    debugger: IDebugSVGManager;
    /** Where the connection state and custom occupants sit */
    layout: LayoutManager<TInkCanvas>;
    constructor(rootElement: HTMLElement, options?: TInkCanvasOptions);
    get penStyle(): TStyle;
    set penStyle(penStyle: TPartialDeep<TStyle>);
    get initializationPromise(): Promise<void>;
    get tool(): CanvasTool;
    set tool(i: CanvasTool);
    get model(): IModel;
    get configuration(): InkCanvasConfiguration;
    initialize(): Promise<void>;
    updateSymbolsStyle(symbolIds: string[], style: TPartialDeep<TStyle>): void;
    export(requestedMimeTypes?: string[]): Promise<TExportV2>;
    importStrokes(strokes: TPartialDeep<TStroke>[]): Promise<TExportV2>;
    resize({ height, width, }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    protected get minDimensions(): {
        minHeight: number;
        minWidth: number;
    };
    removeStrokes(strokeIds: string[]): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Canvas
 */
type TInkCanvasDeprecatedConfiguration = TCanvasConfiguration & THTTPClientV1Configuration & {
    rendering: TRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TCanvasTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
};
/**
 * @group Canvas
 * @source
 */
declare const DefaultInkCanvasDeprecatedConfiguration: TInkCanvasDeprecatedConfiguration;
/**
 * @group Canvas
 */
declare class InkCanvasDeprecatedConfiguration implements TInkCanvasDeprecatedConfiguration {
    server: TServerHTTPConfiguration;
    recognition: TRecognitionHTTPV1Configuration;
    rendering: TRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TCanvasTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
    constructor(configuration?: TPartialDeep<TInkCanvasDeprecatedConfiguration>);
}

/**
 * @group Canvas
 */
type TInkCanvasDeprecatedOptions = TPartialDeep<TCanvasOptionsBase & {
    configuration: TInkCanvasDeprecatedConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        client?: HTTPClientV1;
    };
};
/**
 * @group Canvas
 * @deprecated Use {@link InkCanvas} instead.
 */
declare class InkCanvasDeprecated extends AbstractCanvas {
    #private;
    grabber: PointerEventGrabber;
    renderer: CanvasRenderer;
    client: HTTPClientV1;
    history: HistoryManager;
    styleManager: StyleManager;
    constructor(rootElement: HTMLElement, options?: TInkCanvasDeprecatedOptions);
    protected onPointerDown(info: TPointerInfo): void;
    protected onPointerMove(info: TPointerInfo): void;
    protected onPointerUp(info: TPointerInfo): Promise<void>;
    get initializationPromise(): Promise<void>;
    get tool(): CanvasTool;
    set tool(i: CanvasTool);
    get model(): Model;
    get currentPenStyle(): TPenStyle;
    get penStyle(): TPenStyle;
    set penStyle(penStyle: TPenStyle | undefined);
    get penStyleClasses(): string;
    set penStyleClasses(penStyleClasses: string | undefined);
    get theme(): TTheme;
    set theme(theme: TPartialDeep<TTheme>);
    get configuration(): InkCanvasDeprecatedConfiguration;
    initialize(): Promise<void>;
    drawCurrentStroke(): void;
    updateModelRendering(): Promise<Model>;
    export(mimeTypes?: string[]): Promise<Model>;
    convert(params?: {
        conversionState?: TConverstionState;
        mimeTypes?: string[];
    }): Promise<Model>;
    importPointEvents(strokes: TPartialDeep<TLegacyStroke>[]): Promise<Model>;
    resize({ height, width, }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    protected get minDimensions(): {
        minHeight: number;
        minWidth: number;
    };
    undo(): Promise<void>;
    redo(): Promise<void>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/** @group DOM */
type TButtonElConfig = {
    id?: string;
    label?: string;
    html?: string;
    icon?: string;
    className?: string | string[];
    disabled?: boolean;
    title?: string;
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary" | "tertiary" | "success" | "danger" | "warning" | "info";
    onClick?: (e: MouseEvent) => void;
    onPointerUp?: (e: PointerEvent) => void;
    onPointerDown?: (e: PointerEvent) => void;
};
/** @group DOM */
declare function buildButton(config: TButtonElConfig): HTMLButtonElement;

/** @group DOM */
type TContainerElConfig = {
    id?: string;
    className?: string | string[];
    style?: string;
    text?: string;
    html?: string;
    title?: string;
};
/** @group DOM */
declare function buildDiv(config?: TContainerElConfig): HTMLDivElement;
/** @group DOM */
declare function buildSpan(config?: TContainerElConfig): HTMLSpanElement;
/** @group DOM */
declare function buildP(config?: TContainerElConfig): HTMLParagraphElement;
/** @group DOM */
declare function buildH3(config?: TContainerElConfig): HTMLHeadingElement;
/** @group DOM */
declare function buildSection(config?: TContainerElConfig): HTMLElement;
/** @group DOM */
declare function buildStyle(cssText: string, dataAttr?: Record<string, string>): HTMLStyleElement;

/** @group DOM */
type TInputElConfig = {
    id?: string;
    value?: string | number;
    placeholder?: string;
    disabled?: boolean;
    step?: string | number;
    min?: number;
    max?: number;
    name?: string;
    fullWidth?: boolean;
};
/** @group DOM */
type TCheckboxElConfig = {
    id?: string;
    checked?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
    name?: string;
};
/** @group DOM */
type TRangeElConfig = {
    id?: string;
    min: number;
    max: number;
    step: number;
    value?: number;
    name?: string;
};
/** @group DOM */
type TFileInputElConfig = {
    id?: string;
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
};
/** @group DOM */
declare function buildTextInput(config: TInputElConfig): HTMLInputElement;
/** @group DOM */
declare function buildNumberInput(config: TInputElConfig): HTMLInputElement;
/** @group DOM */
declare function buildCheckbox(config: TCheckboxElConfig): HTMLInputElement;
/** @group DOM */
declare function buildRange(config: TRangeElConfig): HTMLInputElement;
/** @group DOM */
declare function buildFileInput(config: TFileInputElConfig): HTMLInputElement;

/** @group DOM */
type TLabelElConfig = {
    text: string;
    htmlFor?: string;
    className?: string | string[];
    style?: string;
};
/** @group DOM */
declare function buildLabel(config: TLabelElConfig): HTMLLabelElement;

/** @group DOM */
type TOutputElConfig = {
    id?: string;
    htmlFor?: string;
    text?: string;
};
/** @group DOM */
declare function buildOutput(config?: TOutputElConfig): HTMLOutputElement;

/** @group DOM */
type TSelectElOption = {
    value: string;
    label: string;
    selected?: boolean;
};
/** @group DOM */
type TSelectElConfig = {
    id: string;
    options?: TSelectElOption[];
    defaultValue?: string;
    disabled?: boolean;
    className?: string;
    customStyle?: string;
    onChange?: (value: string) => void;
};
/** @group DOM */
declare function buildOption(opt: TSelectElOption): HTMLOptionElement;
/** @group DOM */
declare function buildSelect(config: TSelectElConfig): HTMLSelectElement;

/** @group DOM */
type TTableBaseElConfig = {
    id?: string;
    className?: string | string[];
    style?: string;
};
/** @group DOM */
type TTableCellElConfig = TTableBaseElConfig & {
    text?: string;
    colSpan?: number;
};
/** @group DOM */
declare function buildTable(config?: TTableBaseElConfig): HTMLTableElement;
/** @group DOM */
declare function buildTHead(config?: TTableBaseElConfig): HTMLTableSectionElement;
/** @group DOM */
declare function buildTBody(config?: TTableBaseElConfig): HTMLTableSectionElement;
/** @group DOM */
declare function buildTr(config?: TTableBaseElConfig): HTMLTableRowElement;
/** @group DOM */
declare function buildTd(config?: TTableCellElConfig): HTMLTableCellElement;
/** @group DOM */
declare function buildTh(config?: TTableCellElConfig): HTMLTableCellElement;

/**
 * @group DOM
 * @remarks Static utility class for DOM element creation.
 */
declare class DOMFactory {
    private constructor();
    static div(config?: TContainerElConfig): HTMLDivElement;
    static span(config?: TContainerElConfig): HTMLSpanElement;
    static p(config?: TContainerElConfig): HTMLParagraphElement;
    static h3(config?: TContainerElConfig): HTMLHeadingElement;
    static section(config?: TContainerElConfig): HTMLElement;
    static style(cssText: string, dataAttr?: Record<string, string>): HTMLStyleElement;
    static canvas(config?: {
        id?: string;
        className?: string;
    }): HTMLCanvasElement;
    static label(config: TLabelElConfig): HTMLLabelElement;
    static button(config: TButtonElConfig): HTMLButtonElement;
    static textInput(config: TInputElConfig): HTMLInputElement;
    static numberInput(config: TInputElConfig): HTMLInputElement;
    static checkbox(config: TCheckboxElConfig): HTMLInputElement;
    static range(config: TRangeElConfig): HTMLInputElement;
    static fileInput(config: TFileInputElConfig): HTMLInputElement;
    static select(config: TSelectElConfig): HTMLSelectElement;
    static option(opt: TSelectElOption): HTMLOptionElement;
    static output(config?: TOutputElConfig): HTMLOutputElement;
    static table(config?: TTableBaseElConfig): HTMLTableElement;
    static thead(config?: TTableBaseElConfig): HTMLTableSectionElement;
    static tbody(config?: TTableBaseElConfig): HTMLTableSectionElement;
    static tr(config?: TTableBaseElConfig): HTMLTableRowElement;
    static td(config?: TTableCellElConfig): HTMLTableCellElement;
    static th(config?: TTableCellElConfig): HTMLTableCellElement;
    static colorDot(color: string, size?: string): HTMLSpanElement;
    static statusBadge(available: boolean): HTMLSpanElement;
    static labeledInput(config: {
        id: string;
        label: string;
        type?: string;
        defaultValue?: string | number;
        placeholder?: string;
        min?: number;
        max?: number;
        step?: string | number;
        labelSize?: string;
        gap?: string;
    }): {
        wrapper: HTMLDivElement;
        input: HTMLInputElement;
        label: HTMLLabelElement;
    };
}

/** @group DOM */
declare function buildCanvas(config?: {
    id?: string;
    className?: string;
}): HTMLCanvasElement;

/**
 * Coalesces repeated `schedule()` calls to at most one `requestAnimationFrame` callback —
 * fast pointer/wheel/mutation-driven code paths otherwise fire far more often than a single
 * frame can render. Each `schedule()` call replaces the pending callback, so the one that
 * actually runs always sees whatever state the caller captured (or reads live) last.
 * @group DOM
 */
declare class RafCoalescer {
    #private;
    schedule(callback: () => void): void;
    cancel(): void;
}

/**
 * Marks `svg`'s screen transform (pan/zoom/resize) as changed, invalidating
 * any value cached against a previous {@link getSvgTransformVersion} read.
 * @group DOM
 */
declare function bumpSvgTransformVersion(svg: SVGSVGElement): void;
/**
 * Current transform version for `svg`, incremented by {@link bumpSvgTransformVersion}.
 * @group DOM
 */
declare function getSvgTransformVersion(svg: SVGSVGElement): number;

/**
 * Predefined canvas themes — passed to `canvas.setCssVars()`.
 * `vars: undefined` resets to the stylesheet defaults.
 * @group Menu
 */
type TCanvasTheme = {
    id: string;
    label: string;
    /** Representative accent color shown as a swatch in the picker */
    swatch: string;
    /** Primary color used for labels and highlights */
    color: string;
    vars: Record<string, string> | undefined;
};
/** @group Menu */
declare const THEME_STORAGE_KEY = "iink-canvas-theme";
/** @group Menu */
declare class CanvasThemes {
    static THEMES: TCanvasTheme[];
    static THEME_STORAGE_KEY: string;
    static getSavedThemeId(): string;
    static saveThemeId(id: string): void;
    static getThemeById(id: string): TCanvasTheme;
}

/**
 * @group Menu
 * @remarks Configuration for a button list
 */
type TMenuButtonList = TMenuItemBase & {
    type: "buttonlist";
    buttonType?: "square" | "round";
    options: Array<{
        label?: string;
        icon?: string;
        value: string;
    }>;
    getValue: (canvas: TInteractiveInkCanvas) => string;
    setValue: (canvas: TInteractiveInkCanvas, value: string) => void;
};
/**
 * @group Menu
 * @remarks Class for button lists
 */
declare class ButtonListMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuButtonList;
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a simple button
 */
type TMenuButton = TMenuItemBase & {
    type: "button";
    icon?: string;
    action: (canvas: TInteractiveInkCanvas) => void | Promise<void>;
};
/**
 * @group Menu
 * @remarks Class for buttons
 */
declare class ButtonMenuItem extends BaseMenuItem<HTMLButtonElement> {
    protected config: TMenuButton;
    createElement(): HTMLButtonElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a checkbox
 */
type TMenuCheckbox = TMenuItemBase & {
    type: "checkbox";
    getValue: (canvas: TInteractiveInkCanvas) => boolean;
    setValue: (canvas: TInteractiveInkCanvas, value: boolean) => void;
};
/**
 * @group Menu
 * @remarks Class for checkboxes
 */
declare class CheckboxMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuCheckbox;
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a color list menu item
 */
type TMenuColorList = TMenuItemBase & {
    type: "colorlist";
    colors: string[];
    fill: boolean;
    initValue?: string;
    onChange: (color: string, canvas: TInteractiveInkCanvas) => void;
};
/**
 * @group Menu
 * @remarks Class for color list menu items
 */
declare class ColorListMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuColorList;
    private currentValue;
    constructor(config: TMenuColorList, canvas: TInteractiveInkCanvas);
    createElement(): HTMLDivElement;
    getValue(): string;
    setValue(color: string): void;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a file input with a validation button
 */
type TMenuFileInput = TMenuItemBase & {
    type: "fileinput";
    accept?: string;
    multiple?: boolean;
    buttonLabel?: string;
    action: (canvas: TInteractiveInkCanvas, files: FileList) => void | Promise<void>;
};
/**
 * @group Menu
 * @remarks Menu item for selecting and validating a file
 */
declare class FileInputMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuFileInput;
    private inputElement;
    private buttonElement;
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a range input menu item
 */
type TMenuRange = TMenuItemBase & {
    type: "range";
    min: number;
    max: number;
    unit?: string;
    step: number;
    initValue?: number;
    onChange: (value: number, canvas: TInteractiveInkCanvas) => void;
};
/**
 * @group Menu
 * @remarks Class for range input menu items (slider)
 */
declare class RangeMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuRange;
    private currentValue;
    private input?;
    private output?;
    constructor(config: TMenuRange, canvas: TInteractiveInkCanvas);
    createElement(): HTMLDivElement;
    getValue(): number;
    setValue(value: number): void;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a select/dropdown menu item
 */
type TMenuSelect = TMenuItemBase & {
    type: "select";
    options: Array<{
        label: string;
        value: string;
    }>;
    getValue: (canvas: TInteractiveInkCanvas) => string;
    setValue: (canvas: TInteractiveInkCanvas, value: string) => void;
};
/**
 * @group Menu
 * @remarks Class for select/dropdown menu items
 */
declare class SelectMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuSelect;
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Submenu position type
 */
type TMenuPosition = "top" | "top-left" | "top-right" | "left" | "left-top" | "right" | "right-top" | "bottom" | "bottom-left" | "bottom-right";
/**
 * @group Menu
 * @remarks Union type for submenu items (without recursive submenu to avoid circularity)
 */
type TSubMenuItems = TMenuButton | TMenuCheckbox | TMenuSelect | TMenuButtonList | TMenuFileInput | TMenuRange;
/**
 * @group Menu
 * @remarks Submenu configuration
 */
type TMenuSubMenu = TMenuItemBase & {
    type: "submenu";
    icon?: string;
    position?: TMenuPosition;
    menuTitle?: string;
    items: (TSubMenuItems | TMenuSubMenu)[];
};
/**
 * @group Menu
 * @remarks Class for submenu items
 */
declare class SubMenuItem extends BaseMenuItem<HTMLDivElement> {
    #private;
    protected config: TMenuSubMenu;
    protected subMenuWrapper?: HTMLElement;
    protected subMenuContent?: HTMLDivElement;
    protected trigger?: HTMLButtonElement;
    protected arrowSpan?: HTMLSpanElement;
    protected subMenuItems: Map<string, BaseMenuItem>;
    protected closedRotation: number;
    protected openedRotation: number;
    /** The side the sub-menu opens on is the first part of its position: "right-top" opens on the right */
    protected sideOf(position: TMenuPosition): string;
    protected getArrowRotationForPosition(position: TMenuPosition): number;
    createElement(): HTMLDivElement;
    /**
     * Opens the submenu
     */
    open(): void;
    /**
     * Closes the submenu
     */
    close(): void;
    /**
     * Toggles the submenu state
     */
    toggle(): void;
    /**
     * Unwraps the submenu (mobile mode)
     */
    unwrap(): void;
    /**
     * Wraps the submenu (desktop mode)
     */
    wrap(): void;
    update(): void;
    destroy(): void;
}
/**
 * @group Menu
 * @remarks Type union enriched with all menu item types
 */
type TAllMenuItems = TSubMenuItems | TMenuSubMenu | TMenuColorList | TMenuRange | TMenuFileInput;
/**
 * @group Menu
 * @remarks Factory function to create an instance of the appropriate menu item class
 */
declare function createMenuItemInstance(config: TAllMenuItems, canvas: TInteractiveInkCanvas): BaseMenuItem;

/**
 * @group Menu
 * @remarks Base type for menu items
 */
type TMenuItemBase = {
    id: string;
    label?: string;
    disabled?: boolean | ((canvas: TInteractiveInkCanvas) => boolean);
    visible?: boolean | ((canvas: TInteractiveInkCanvas) => boolean);
};
/**
 * @group Menu
 * @remarks Union type for all menu types
 */
type TGenericMenuItem = TMenuItemBase & {
    type: string;
};
/**
 * @group Menu
 * @remarks Base class for all menu items
 */
declare abstract class BaseMenuItem<T extends HTMLElement = HTMLElement> {
    protected logger: Logger;
    protected config: TGenericMenuItem;
    protected canvas: TInteractiveInkCanvas;
    protected element?: T;
    /**
     * Where this item opens its sub-menu, set by its menu from the menu's slot before the element is built;
     * an item that opens one reads it before its own default
     */
    openPosition?: TMenuPosition;
    /** @hidden */
    protected get dom(): typeof DOMFactory;
    constructor(config: TGenericMenuItem, canvas: TInteractiveInkCanvas);
    /**
     * Creates the HTML element
     */
    abstract createElement(): T;
    /**
     * Updates the element (for reactivity)
     */
    abstract update(): void;
    /**
     * Returns the HTML element
     */
    getElement(): T;
    /**
     * Updates the disabled state
     */
    protected updateDisabled(): void;
    /**
     * Updates the visible state
     */
    protected updateVisible(): void;
    /**
     * Destroys the element and cleans up resources
     */
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Utility class to create a collapsible wrapper around menu content
 */
declare class CollapsibleWrapper {
    private wrapper;
    constructor(content: HTMLElement, title: string, id?: string);
    private createWrapper;
    getElement(): HTMLDivElement;
    setActive(active: boolean): void;
    toggle(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @summary Where an item goes in a menu: its always-visible row, or the column behind its trigger
 */
type TMenuZone = "bar" | "dropdown";
/**
 * @group Menu
 */
type TMenuItemOptions = {
    /** Defaults to the menu's {@link IIAbstractMenu.defaultZone} */
    zone?: TMenuZone;
    /** Key of the item to insert before; missing at render, the item goes to the end of its zone */
    before?: string;
    /** Key of the item to insert after; missing at render, the item goes to the end of its zone */
    after?: string;
    /** Replace the item holding the same key, in its place; without it, a taken key is refused */
    replace?: boolean;
};
/**
 * @group Menu
 * @summary How a menu sits in its slot; without them, the slot decides (see `configuration.layout`)
 */
type TMenuLayoutConfig = {
    /** The axis of the menu's bar; defaults to the slot's: vertical on the sides, horizontal elsewhere */
    orientation?: TMenuOrientation;
    /** The side every dropdown of the menu opens towards, its items' sub-menus included; defaults to away from the slot's edge */
    openTowards?: TMenuDirection;
};
/**
 * @group Menu
 * @summary Builds an item each time its menu renders: a menu destroys its items, which cannot be reused
 * @remarks A raw `HTMLElement` is for static content: it is removed with the menu, never updated. Anything that must
 * follow the canvas state is a {@link BaseMenuItem}.
 */
type TMenuItemFactory = (canvas: TInteractiveInkCanvas) => BaseMenuItem | HTMLElement;
/**
 * @group Menu
 * @summary An item registered through {@link IIMenuManager.addItem}, added after the menu's own items
 */
type TRegisteredMenuItem = {
    factory: TMenuItemFactory;
    options?: TMenuItemOptions;
};
/**
 * @group Menu
 * @summary What every menu shares: its items, their lifecycle, its zones and the dropdown mechanics
 * @remarks Every member is protected or public, never private: menus are replaced through `options.override.menu`.
 * A zone is built on its first item, so a menu shows no empty row nor an empty dropdown.
 */
declare abstract class IIAbstractMenu<TConfig extends TMenuLayoutConfig> {
    protected logger: Logger;
    canvas: TInteractiveInkCanvas;
    id: string;
    wrapper?: HTMLElement;
    config: TConfig;
    /** Where an item goes when {@link addItem} names no zone */
    abstract readonly defaultZone: TMenuZone;
    /** The name the layout places this menu by (`configuration.layout`); none for a menu outside the layout */
    readonly layoutName?: string;
    /** The rendered items, by key: updated and destroyed with the menu */
    protected items: Map<string, BaseMenuItem>;
    /** The containers of the zones built so far */
    protected zones: Partial<Record<TMenuZone, HTMLElement>>;
    /** The wrapper {@link zones} and {@link items} belong to */
    protected zonesWrapper?: HTMLElement;
    /** Closes the dropdown on a pointerdown outside it; set by {@link createDropdown} */
    protected documentPointerdownHandler?: (e: PointerEvent) => void;
    constructor(canvas: TInteractiveInkCanvas, id: string, config: TConfig);
    abstract render(layer: HTMLElement): void;
    /** Builds the container of `zone` and inserts it in `wrapper` */
    protected abstract createZone(zone: TMenuZone, wrapper: HTMLElement): HTMLElement;
    /** The slot the layout put this menu in */
    get slot(): TLayoutSlot | undefined;
    get orientation(): TMenuOrientation;
    /** Undefined for a menu outside the layout, whose items keep their own directions */
    get openTowards(): TMenuDirection | undefined;
    /** The class laying the bar out along {@link orientation} */
    protected barClassName(): string;
    /** Where a dropdown opening from the bar goes: towards {@link openTowards}, growing away from the slot's side */
    protected barOpenPosition(): TMenuPosition | undefined;
    /** Where a sub-menu opening from a dropdown's column goes: sideways, towards the inside of the canvas */
    protected columnOpenPosition(): TMenuPosition | undefined;
    protected itemOpenPosition(zone: TMenuZone): TMenuPosition | undefined;
    /** A sub-menu's config entry: `true` enables it with its defaults, an object configures it */
    protected subConfig<T>(config: boolean | T): T | undefined;
    /**
     * The wrapper items go to. A new wrapper is a new render: the zones and items of the previous one belong to the
     * old wrapper, so they are forgotten (not destroyed: they stay where that render put them).
     */
    protected currentWrapper(): HTMLElement;
    /** The container of `zone`, built on first use */
    protected getZone(zone: TMenuZone): HTMLElement;
    /** Inserts an item's element in its zone; a menu overrides it to keep its own elements in place */
    protected insertInZone(zone: TMenuZone, element: HTMLElement): void;
    /**
     * Keeps `item` with the menu's items and inserts its element: next to `before`/`after` when that item is
     * rendered, else at the end of its zone; in place of the item it replaces with `replace`.
     * A key already taken is refused (logged) unless `replace` is set.
     */
    protected addItem(key: string, item: BaseMenuItem | HTMLElement, options?: TMenuItemOptions): void;
    /** Inserts `element` before or after the item `options` names; false when there is none to name or render */
    protected insertNextTo(element: HTMLElement, options?: TMenuItemOptions): boolean;
    /**
     * Adds the items registered through {@link IIMenuManager.addItem}, after the menu's own: called once it rendered.
     * A factory that throws is logged and skipped, the other items still render.
     */
    renderRegisteredItems(registered: ReadonlyMap<string, TRegisteredMenuItem>): void;
    /**
     * Builds a dropdown: `trigger` toggles `content`, a pointerdown anywhere outside closes it.
     * @returns the dropdown element to insert, and the element holding `content`
     */
    protected createDropdown(trigger: HTMLButtonElement, content: HTMLElement, position: TMenuPosition): {
        element: HTMLDivElement;
        content: HTMLDivElement;
    };
    update(): void;
    show(): void;
    hide(): void;
    /** Whether another occupant shares this menu's slot */
    protected sharesSlot(): boolean;
    /**
     * Alone in its slot, the menu just turns invisible and keeps its room. Sharing it, its host folds away (animated in
     * CSS) so the other occupants close the gap instead of leaving a hole.
     */
    protected setHidden(hidden: boolean): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Menu action Clear
 */
declare class ClearMenuAction extends ButtonMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu action Convert
 */
declare class ConvertMenuAction extends ButtonMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu action Diagram - toggles whether moving/resizing/rotating a connected shape
 * reshapes its anchored edges (raw stroke or converted Line/PolyEdge/Arc) to follow it.
 */
declare class DiagramMenuAction extends SubMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
}

/** @group Menu */
type TExportActionItemsConfig = {
    json?: boolean;
    svg?: boolean;
    png?: boolean;
    text?: boolean;
    markdown?: boolean;
    mermaid?: boolean;
    plantuml?: boolean;
    llm?: boolean;
    jiix?: boolean;
    pdf?: boolean;
};
/** @group Menu */
type TExportActionConfig = boolean | TExportActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action Export - Export en différents formats
 */
declare class ExportMenuAction extends SubMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TExportActionItemsConfig);
}

/** @group Menu */
type TGestureActionItemsConfig = {
    detect?: boolean;
    surround?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    insert?: boolean;
    join?: boolean;
    scratchOut?: boolean;
};
/** @group Menu */
type TGestureActionConfig = boolean | TGestureActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action Gesture - Détection et actions de gestes
 */
declare class GestureMenuAction extends SubMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TGestureActionItemsConfig);
}

/** @group Menu */
type TGuideActionItemsConfig = {
    enable?: boolean;
    type?: boolean;
    size?: boolean;
};
/** @group Menu */
type TGuideActionConfig = boolean | TGuideActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action Guide - Configuration des guides
 */
declare class GuideMenuAction extends SubMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TGuideActionItemsConfig);
}

/**
 * @group Menu
 * @remarks Menu action Import - Import de fichiers JSON
 */
declare class ImportMenuAction extends SubMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    private readFileAsText;
}

/**
 * @group Menu
 * @remarks Menu action Language - Sélection de la langue
 */
declare class LanguageMenuAction extends BaseMenuItem<HTMLDivElement> {
    #private;
    private select;
    private subMenuWrapper;
    private subMenuContent;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    createElement(): HTMLDivElement;
    destroy(): void;
    /**
     * Wraps/unwraps according to screen size (mobile)
     */
    wrap(): void;
    unwrap(): void;
    update(): void;
}

/** @group Menu */
type TMathActionItemsConfig = {
    autoCompute?: boolean;
    resultMode?: boolean;
    resultColor?: boolean;
    showDependencies?: boolean;
    highlightOnSelect?: boolean;
    editVariables?: boolean;
    capabilities?: boolean;
    forceComputeAll?: boolean;
    solver?: boolean | TMathSolverItemsConfig;
};
/** @group Menu */
type TMathActionConfig = boolean | TMathActionItemsConfig;
/**
 * @group Menu
 * @remarks Solver settings shown in Math > Solver; each one is shown unless set to `false`
 */
type TMathSolverItemsConfig = {
    angleUnit?: boolean;
    fractionalDigits?: boolean;
    decimalSeparator?: boolean;
    roundingMode?: boolean;
};
/**
 * @group Menu
 * @remarks Wait after the last move of the fractional digits slider before resynchronizing
 */
declare const MATH_SOLVER_DEBOUNCE_MS = 300;
/**
 * @group Menu
 * @remarks Menu action for Math visualization and interaction controls
 */
declare class MathMenuAction extends SubMenuItem {
    #private;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TMathActionItemsConfig);
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Menu action to toggle the minimap overlay
 */
declare class MinimapMenuAction extends ButtonMenuItem {
    #private;
    constructor(canvas: TInteractiveInkCanvas, layer: HTMLElement, idPrefix?: string);
    update(): void;
    destroy(): void;
}

/** @group Menu */
type TOverlayActionItemsConfig = {
    showBlockOverlays?: boolean;
    badgeSize?: boolean;
    borderWidth?: boolean;
    labelMaxChars?: boolean;
    labelFontSize?: boolean;
};
/** @group Menu */
type TOverlayActionConfig = boolean | TOverlayActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action for overlay configuration (block overlays badge/border)
 */
declare class OverlayMenuAction extends SubMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TOverlayActionItemsConfig);
}

/** @group Menu */
type TPenActionItemsConfig = {
    angle?: boolean;
    smoothing?: boolean;
    speed?: boolean;
};
/** @group Menu */
type TPenActionConfig = boolean | TPenActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action Pen — tunes the nib the pen currently carries
 *
 * Every setting is written onto the pen style, so it travels with each stroke drawn afterwards and
 * leaves what is already on the canvas alone. That is what makes two settings comparable: draw with
 * one, change it, draw again, and both are on screen at once.
 *
 * An item that the current nib does not read is disabled rather than hidden — which nib answers to
 * which setting is itself worth showing.
 */
declare class PenMenuAction extends SubMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TPenActionItemsConfig);
}

/** @group Menu */
type TSelectionActionItemsConfig = {
    text?: boolean;
    math?: boolean;
    shape?: boolean;
};
/** @group Menu */
type TSelectionActionConfig = boolean | TSelectionActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action for configuring selection granularity (text, math and shape levels)
 */
declare class SelectionMenuAction extends SubMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TSelectionActionItemsConfig);
}

/** @group Menu */
type TSnapActionItemsConfig = {
    guide?: boolean;
    element?: boolean;
    angle?: boolean;
};
/** @group Menu */
type TSnapActionConfig = boolean | TSnapActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action Snap - Configuration du snap
 */
declare class SnapMenuAction extends SubMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TSnapActionItemsConfig);
}

/**
 * Sub-menu action for switching predefined canvas themes.
 * Selected theme is persisted to localStorage.
 * @group Menu
 */
declare class ThemeMenuAction extends SubMenuItem {
    private themes;
    private currentThemeId;
    private themeItems;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, themes?: TCanvasTheme[]);
    createElement(): HTMLDivElement;
    private buildThemeItems;
    private applyTheme;
    private applyStoredTheme;
    private updateActiveItem;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu action Undo/Redo groupé
 */
declare class UndoRedoMenuAction extends BaseMenuItem<HTMLDivElement> {
    private undoButton;
    private redoButton;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu action Zoom (In + Level + Out)
 */
declare class ZoomMenuAction extends BaseMenuItem<HTMLDivElement> {
    private zoomInButton;
    private zoomLevelButton;
    private zoomOutButton;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    createElement(): HTMLDivElement;
    private updateZoomLevel;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration to enable/disable each action menu individually.
 * Sub-menus accept `boolean` to show/hide entirely, or an object to configure individual items.
 */
type TMenuActionConfig = {
    /** Enable/disable Clear menu */
    clear?: boolean;
    /** Enable/disable Language menu */
    language?: boolean;
    /** Enable/disable Undo/Redo menus */
    undoRedo?: boolean;
    /** Enable/disable Zoom menus */
    zoom?: boolean;
    /** Enable/disable Convert menu */
    convert?: boolean;
    /** Enable/disable Gesture submenu. Pass an object to configure individual gesture items. */
    gesture?: TGestureActionConfig;
    /** Enable/disable Guide submenu. Pass an object to configure individual guide items. */
    guide?: TGuideActionConfig;
    /** Enable/disable Pen submenu. Pass an object to configure individual pen items. */
    pen?: TPenActionConfig;
    /** Enable/disable Snap submenu. Pass an object to configure individual snap items. */
    snap?: TSnapActionConfig;
    /** Enable/disable Diagram submenu (toggles whether moving a connected shape follows its anchored edges) */
    diagram?: boolean;
    /** Enable/disable Math submenu. Pass an object to configure individual math items. */
    math?: TMathActionConfig;
    /** Enable/disable Overlay submenu. Pass an object to configure individual overlay items. */
    overlay?: TOverlayActionConfig;
    /** Enable/disable Selection submenu. Pass an object to configure individual selection items. */
    selection?: TSelectionActionConfig;
    /** Enable/disable Export submenu. Pass an object to configure individual export formats. */
    export?: TExportActionConfig;
    /** Enable/disable Import submenu */
    import?: boolean;
    /** Enable/disable Minimap toggle button */
    minimap?: boolean;
    /** Enable/disable Theme picker */
    theme?: boolean;
    /** Override predefined themes shown in the theme picker */
    themes?: TCanvasTheme[];
};
/** @group Menu */
declare const DefaultMenuActionConfig: Required<Omit<TMenuActionConfig, "themes">>;
/**
 * @group Menu
 */
declare class IIMenuAction extends IIAbstractMenu<Required<Omit<TMenuActionConfig, "themes">> & Pick<TMenuActionConfig, "themes"> & TMenuLayoutConfig> {
    readonly defaultZone: TMenuZone;
    readonly layoutName = "action";
    constructor(canvas: TInteractiveInkCanvas, id?: string, config?: TMenuActionConfig & TMenuLayoutConfig);
    get model(): IIModel;
    get isMobile(): boolean;
    /** Whether the recognition configuration lets the backend recognize `type` */
    protected recognizes(type: TRecognitionType): boolean;
    render(layer: HTMLElement): void;
    protected createZone(zone: TMenuZone, wrapper: HTMLElement): HTMLElement;
    protected renderDropdownItems(): void;
    protected renderBarItems(layer: HTMLElement): void;
}

/**
 * @group Menu
 * @remarks Menu contextuel Convert - Convertit les symboles sélectionnés
 */
declare class ConvertContextMenu extends ButtonMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
}

/** @group Menu */
type TContextDecoratorItemsConfig = {
    highlight?: boolean;
    surround?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
};
/** @group Menu */
type TContextDecoratorConfig = boolean | TContextDecoratorItemsConfig;
/**
 * @group Menu
 * @remarks Menu contextuel Decorator - Décore les symboles sélectionnés
 */
declare class DecoratorContextMenu extends BaseMenuItem<HTMLElement> {
    #private;
    protected config: TGenericMenuItem & {
        idPrefix: string;
    };
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TContextDecoratorItemsConfig);
    get symbolsDecorable(): TText[];
    get showDecorator(): boolean;
    get hasSingleMathSymbol(): boolean;
    protected createDecoratorSubMenu(label: string, kind: DecoratorKind): HTMLElement;
    createElement(): HTMLElement;
    destroy(): void;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu contextuel Duplicate - Duplique les symboles sélectionnés
 */
declare class DuplicateContextMenu extends ButtonMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu contextuel Edit - Édite le texte sélectionné
 */
declare class EditContextMenu extends BaseMenuItem<HTMLElement> {
    #private;
    protected config: TGenericMenuItem;
    editInput?: HTMLInputElement;
    editSaveBtn?: HTMLButtonElement;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    createElement(): HTMLElement;
    destroy(): void;
    update(): void;
}

/** @group Menu */
type TContextExportItemsConfig = {
    json?: boolean;
    svg?: boolean;
    png?: boolean;
    text?: boolean;
    markdown?: boolean;
    mermaid?: boolean;
    plantuml?: boolean;
    llm?: boolean;
    jiix?: boolean;
    pdf?: boolean;
};
/** @group Menu */
type TContextExportConfig = boolean | TContextExportItemsConfig;
/**
 * @group Menu
 * @remarks Menu contextuel Export - Exporte les symboles sélectionnés
 */
declare class ExportContextMenu extends SubMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TContextExportItemsConfig);
}

/** @group Menu */
type TContextMathItemsConfig = {
    checkDiagnostic?: boolean;
    editVariables?: boolean;
    compute?: boolean;
    evaluate?: boolean;
    forceCompute?: boolean;
};
/** @group Menu */
type TContextMathConfig = boolean | TContextMathItemsConfig;
/**
 * @group Menu
 * @remarks Menu contextuel Math - Opérations mathématiques sur les symboles
 */
declare class MathContextMenu extends SubMenuItem {
    protected logger: Logger;
    readonly id: string;
    readonly idEditVariables: string;
    readonly idNumericalComputation: string;
    readonly idCheckDiagnostic: string;
    readonly idEvaluate: string;
    readonly idForceCompute: string;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TContextMathItemsConfig);
    setMenuVisibility(show: boolean, { canEditVariables, canCompute, canEvaluate, hasDrawSolverOutputs, }: {
        canEditVariables: boolean;
        canCompute: boolean;
        canEvaluate: boolean;
        hasDrawSolverOutputs?: boolean;
    }): void;
}

/**
 * @group Menu
 * @remarks Menu contextuel Remove - Supprime les symboles sélectionnés
 */
declare class RemoveContextMenu extends ButtonMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
}

/** @group Menu */
type TContextReorderItemsConfig = {
    front?: boolean;
    forward?: boolean;
    backward?: boolean;
    back?: boolean;
};
/** @group Menu */
type TContextReorderConfig = boolean | TContextReorderItemsConfig;
/**
 * @group Menu
 * @remarks Menu contextuel Reorder - Réordonne les symboles sélectionnés
 */
declare class ReorderContextMenu extends SubMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string, itemsConfig?: TContextReorderItemsConfig);
}

/**
 * @group Menu
 * @remarks Menu contextuel Select All - selects all symbols
 */
declare class SelectAllContextMenu extends ButtonMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Configuration to enable/disable each context menu individually.
 * Sub-menus accept `boolean` to show/hide entirely, or an object to configure individual items.
 */
type TMenuContextConfig = {
    /** Enable/disable Edit menu */
    edit?: boolean;
    /** Enable/disable Decorator menu. Pass an object to configure individual decorator types. */
    decorator?: TContextDecoratorConfig;
    /** Enable/disable Reorder menu. Pass an object to configure individual reorder actions. */
    reorder?: TContextReorderConfig;
    /** Enable/disable Export menu. Pass an object to configure individual export formats. */
    export?: TContextExportConfig;
    /** Enable/disable Convert menu */
    convert?: boolean;
    /** Enable/disable Math menu. Pass an object to configure individual math operations. */
    math?: TContextMathConfig;
    /** Enable/disable Group menu */
    group?: boolean;
    /** Enable/disable Duplicate menu */
    duplicate?: boolean;
    /** Enable/disable Remove menu */
    remove?: boolean;
    /** Enable/disable Select All menu */
    selectAll?: boolean;
};
/** @group Menu */
declare const DefaultMenuContextConfig: Required<TMenuContextConfig>;
/**
 * @group Menu
 */
declare class IIMenuContext extends IIAbstractMenu<Required<TMenuContextConfig> & TMenuLayoutConfig> {
    readonly defaultZone: TMenuZone;
    /** Hides the menu when the rendering layer scrolls, as the element it points at moves */
    protected scrollHandler?: () => void;
    position: {
        x: number;
        y: number;
    };
    constructor(canvas: TInteractiveInkCanvas, id?: string, config?: TMenuContextConfig & TMenuLayoutConfig);
    get symbolsSelected(): TSymbol[];
    get haveSymbolsSelected(): boolean;
    get symbolsDecorable(): (TStroke | TText)[];
    get showDecorator(): boolean;
    get mathBlocksSelected(): TJIIXMathElement[];
    /**
     * True when the current selection is made up of one or more fully-selected Math blocks,
     * and nothing else (no other fully-selected block type, no stroke left outside any block).
     */
    get isOnlyMathBlocksSelected(): boolean;
    protected updateMathMenu(): Promise<void>;
    update(): void;
    render(layer: HTMLElement): void;
    protected createZone(zone: TMenuZone, wrapper: HTMLElement): HTMLElement;
    protected renderDropdownItems(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @summary How the style menu sits in its slot: {@link TMenuLayoutConfig}, and whether its panel folds
 */
type TMenuStyleLayoutConfig = TMenuLayoutConfig & {
    /** Fold the panel behind its palette trigger; defaults to folding on a narrow screen or in a shared horizontal slot */
    collapsed?: boolean;
};
/**
 * @group Menu
 * @remarks Configuration to enable/disable each style element individually
 */
type TMenuStyleConfig = {
    /** Enable/disable stroke color picker */
    strokeColor?: boolean;
    /** Enable/disable fill color picker */
    fillColor?: boolean;
    /** Enable/disable stroke thickness picker */
    thickness?: boolean;
    /** Enable/disable nib picker */
    pen?: boolean;
    /** Enable/disable font size picker */
    fontSize?: boolean;
    /** Enable/disable font weight picker */
    fontWeight?: boolean;
    /** Enable/disable opacity picker */
    opacity?: boolean;
    /** Custom color palette */
    colors?: string[];
    /** Custom thickness list */
    thicknessList?: {
        label: string;
        value: number;
    }[];
    /** Custom font size list */
    fontSizeList?: {
        label: string;
        value: "auto" | number;
    }[];
    /** Custom font weight list */
    fontWeightList?: {
        label: string;
        value: "auto" | "normal" | "bold";
    }[];
};
/** @group Menu */
declare const DefaultMenuStyleConfig: Required<TMenuStyleConfig>;
/**
 * @group Menu
 */
declare class IIMenuStyle extends IIAbstractMenu<Required<TMenuStyleConfig> & TMenuStyleLayoutConfig> {
    readonly layoutName = "style";
    readonly defaultZone: TMenuZone;
    triggerBtn?: HTMLButtonElement;
    subMenuWrapper?: HTMLDivElement;
    subMenuContent?: HTMLDivElement;
    constructor(canvas: TInteractiveInkCanvas, id?: string, config?: TMenuStyleConfig & TMenuStyleLayoutConfig);
    get model(): IIModel;
    get symbolsSelected(): TSymbol[];
    get writeShape(): boolean;
    get rowHeight(): number;
    get isMobile(): boolean;
    /**
     * Whether the panel folds behind its palette trigger: `collapsed` when set, else on a narrow screen or when the menu
     * shares a horizontal slot, where an open panel would cover the ink above or below the other bars
     */
    get collapsed(): boolean;
    render(layer: HTMLElement): void;
    protected createZone(zone: TMenuZone, wrapper: HTMLElement): HTMLElement;
    protected renderDropdownItems(): void;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Configuration to enable/disable each tool individually
 */
type TMenuToolConfig = {
    /** Enable/disable Write tool (Pencil) */
    write?: boolean;
    /** Enable/disable Move tool (Hand) */
    move?: boolean;
    /** Enable/disable Select tool (Cursor) */
    select?: boolean;
    /** Enable/disable Erase tool */
    erase?: boolean;
    /** Enable/disable Shape submenu (Rectangle, Circle, etc.) */
    shape?: boolean;
    /** Enable/disable Edge submenu (Line, Arrow, etc.) */
    edge?: boolean;
};
/** @group Menu */
declare const DefaultMenuToolConfig: Required<TMenuToolConfig>;
/**
 * @group Menu
 */
declare class IIMenuTool extends IIAbstractMenu<Required<TMenuToolConfig> & TMenuLayoutConfig> {
    readonly layoutName = "tool";
    readonly defaultZone: TMenuZone;
    /** The "…" dropdown at the end of the row, once an item goes to the dropdown zone */
    protected moreDropdown?: HTMLElement;
    constructor(canvas: TInteractiveInkCanvas, id?: string, config?: TMenuToolConfig & TMenuLayoutConfig);
    render(layer: HTMLElement): void;
    protected renderBarItems(): void;
    protected createZone(zone: TMenuZone, wrapper: HTMLElement): HTMLElement;
    /** Keeps the "…" dropdown last in the row */
    protected insertInZone(zone: TMenuZone, element: HTMLElement): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Partial config accepted by {@link IIMenuManager.setConfig} after initial load.
 */
type TMenuConfigUpdate = {
    enable?: boolean;
    style?: TMenuStyleConfig & {
        enable?: boolean;
    };
    tool?: TMenuToolConfig & {
        enable?: boolean;
    };
    action?: TMenuActionConfig & {
        enable?: boolean;
    };
    context?: TMenuContextConfig & {
        enable?: boolean;
    };
};
/**
 * @group Menu
 * @summary Menu classes `options.override.menu` can replace
 * @remarks Each one is constructed like the built-in menu it replaces: `(canvas, id, config)`, at load and on every {@link IIMenuManager.setConfig}.
 */
type TMenuOverride = {
    style?: typeof IIMenuStyle;
    tool?: typeof IIMenuTool;
    action?: typeof IIMenuAction;
    context?: typeof IIMenuContext;
};
/**
 * @group Menu
 */
type TMenuName = "action" | "tool" | "style" | "context";
/**
 * @group Menu
 * @summary An item declared at load, in `options.extend.menuItems`: in its menu from the first render
 */
type TMenuItemRegistration = {
    menu: TMenuName;
    key: string;
    factory: TMenuItemFactory;
    options?: TMenuItemOptions;
};
/**
 * @group Manager
 */
declare class IIMenuManager {
    #private;
    canvas: TInteractiveInkCanvas;
    layer?: HTMLElement;
    action: IIMenuAction;
    tool: IIMenuTool;
    context: IIMenuContext;
    style: IIMenuStyle;
    /** The classes the menus are built from: the overrides, else the built-in ones */
    protected menuClasses: Required<TMenuOverride>;
    /** Items added through {@link addItem}, by menu: kept here as the menus are rebuilt on every {@link setConfig} */
    protected registry: Record<TMenuName, Map<string, TRegisteredMenuItem>>;
    constructor(canvas: TInteractiveInkCanvas, custom?: TMenuOverride, items?: readonly TMenuItemRegistration[]);
    /** A menu the layout moved rebuilds for its new slot; the minimap lives in the action menu, which rebuilds for it */
    protected onOccupantMoved(occupant: string): void;
    getMenu(name: TMenuName): IIAbstractMenu<TMenuLayoutConfig>;
    /** Builds one menu from {@link menuClasses} and the current configuration; renders nothing */
    protected createMenu(name: TMenuName): void;
    /** Renders one menu, then the items registered for it, when the menus and that menu are enabled */
    protected renderMenu(name: TMenuName): void;
    /** Destroys and rebuilds one menu; the context menu keeps its position and whether it was open */
    protected rebuildMenu(name: TMenuName): void;
    protected isContextVisible(): boolean;
    protected restoreContext({ position, visible }: {
        position: {
            x: number;
            y: number;
        };
        visible: boolean;
    }): void;
    render(layer: HTMLElement): void;
    /**
     * Update menu configuration at runtime and re-render affected sections.
     * Merges deeply into the current config — omitted keys keep their current value.
     * @example
     * // Hide only PNG and text export
     * canvas.menu.setConfig({ action: { export: { png: false, text: false } } })
     * // Disable the entire action menu
     * canvas.menu.setConfig({ action: { enable: false } })
     */
    setConfig(config: TMenuConfigUpdate): void;
    /**
     * Adds an item to a menu, built by `factory` on every render of that menu, which happens at once if it is shown.
     * It is kept across {@link setConfig}. The item goes after the menu's own items, in `options.zone` (each menu has
     * a default one), or next to `options.before`/`options.after`.
     * @throws when `key` is already registered for that menu
     * @example
     * canvas.menu.addItem("action", "download-png", () => {
     *   const button = document.createElement("button")
     *   button.textContent = "PNG"
     *   button.addEventListener("pointerdown", () => canvas.download("png"))
     *   return button
     * }, { zone: "bar" })
     */
    addItem(menu: TMenuName, key: string, factory: TMenuItemFactory, options?: TMenuItemOptions): void;
    protected register(menu: TMenuName, key: string, factory: TMenuItemFactory, options?: TMenuItemOptions): void;
    /** Removes an item added by {@link addItem}; false when there was none under that key */
    removeItem(menu: TMenuName, key: string): boolean;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 */
type TMenuConfiguration = {
    enable: boolean;
    style: TMenuStyleConfig & TMenuStyleLayoutConfig & {
        enable: boolean;
    };
    tool: TMenuToolConfig & TMenuLayoutConfig & {
        enable: boolean;
    };
    action: TMenuActionConfig & TMenuLayoutConfig & {
        enable: boolean;
    };
    context: TMenuContextConfig & {
        enable: boolean;
    };
};
/**
 * @group Menu
 * @source
 */
declare const DefaultMenuConfiguration: TMenuConfiguration;

/**
 * @group Menu
 * @remarks Constants shared across menu components
 */
/**
 * @group Menu
 * @remarks Default color palette available in menus
 */
declare const DEFAULT_MENU_COLORS: string[];
/**
 * @group Menu
 * @remarks Default thickness values for stroke styling
 */
declare const DEFAULT_THICKNESS_LIST: {
    label: string;
    value: number;
}[];
/**
 * @group Menu
 * @remarks Default eraser size values (diameter in px)
 */
declare const DEFAULT_ERASER_SIZE_LIST: {
    label: string;
    value: number;
}[];
/**
 * @group Menu
 * @remarks Default font size values
 */
declare const DEFAULT_FONT_SIZE_LIST: {
    label: string;
    value: "auto" | number;
}[];
/**
 * @group Menu
 * @remarks Default font weight values
 */
declare const DEFAULT_FONT_WEIGHT_LIST: {
    label: string;
    value: "auto" | "normal" | "bold";
}[];

/**
 * @group Menu
 * @remarks Fill color style menu
 */
declare class FillColorStyle extends BaseMenuItem<HTMLDivElement> {
    private colorItem?;
    private colors;
    constructor(canvas: TInteractiveInkCanvas, colors: string[], idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Font size style menu
 */
declare class FontSizeStyle extends BaseMenuItem<HTMLDivElement> {
    private fontSizeItem?;
    private fontSizeList;
    private rowHeight;
    constructor(canvas: TInteractiveInkCanvas, fontSizeList: {
        label: string;
        value: "auto" | number;
    }[], rowHeight: number, idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Font weight style menu
 */
declare class FontWeightStyle extends BaseMenuItem<HTMLDivElement> {
    private fontWeightItem?;
    private fontWeightList;
    constructor(canvas: TInteractiveInkCanvas, fontWeightList: {
        label: string;
        value: "auto" | "normal" | "bold";
    }[], idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Opacity style menu
 */
declare class OpacityStyle extends BaseMenuItem<HTMLDivElement> {
    private opacityItem?;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Nib style menu — picks the instrument, for the pen and for what is already selected
 *
 * The nib lives on a stroke's style, so changing it here rewrites the selected strokes and they
 * redraw with the new instrument. Without this the nib could only ever be chosen before writing.
 */
declare class PenNibStyle extends BaseMenuItem<HTMLDivElement> {
    private nibItem?;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Stroke color style menu
 */
declare class StrokeColorStyle extends BaseMenuItem<HTMLDivElement> {
    private colorItem?;
    private colors;
    constructor(canvas: TInteractiveInkCanvas, colors: string[], idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Thickness style menu
 */
declare class ThicknessStyle extends BaseMenuItem<HTMLDivElement> {
    private thicknessItem?;
    private thicknessList;
    constructor(canvas: TInteractiveInkCanvas, thicknessList: {
        label: string;
        value: number;
    }[], idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Edge tool - Sub-menu for lines and arrows
 */
declare class EdgeTool extends BaseMenuItem<HTMLDivElement> {
    #private;
    private subMenuButtons;
    private triggerButton?;
    private currentIcon;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    private createEdgeButton;
    createElement(): HTMLDivElement;
    destroy(): void;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Erase tool - Element erasure with configurable size
 */
declare class EraseTool extends BaseMenuItem<HTMLDivElement> {
    #private;
    private sizeButtons;
    private triggerButton?;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    private createEraserSizeIcon;
    private createSizeButton;
    createElement(): HTMLDivElement;
    destroy(): void;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Move tool - View movement
 */
declare class MoveTool extends ButtonMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    createElement(): HTMLButtonElement;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Select tool - Element selection
 */
declare class SelectTool extends ButtonMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    createElement(): HTMLButtonElement;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Shape tool - Sub-menu for geometric shapes
 */
declare class ShapeTool extends BaseMenuItem<HTMLDivElement> {
    #private;
    private subMenuButtons;
    private triggerButton?;
    private currentIcon;
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    private createShapeButton;
    createElement(): HTMLDivElement;
    destroy(): void;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Write tool - Pencil drawing
 */
declare class WriteTool extends ButtonMenuItem {
    constructor(canvas: TInteractiveInkCanvas, idPrefix?: string);
    createElement(): HTMLButtonElement;
    update(): void;
    private unselectAll;
}

/**
 * @group Canvas
 */
type TInteractiveInkCanvasConfiguration = TCanvasConfiguration & TWebSocketClientConfiguration & {
    "undo-redo": THistoryConfiguration;
    rendering: TIIRendererConfiguration;
    grabber: TGrabberConfiguration;
    menu: TMenuConfiguration;
    penStyle: TStyle;
    fontStyle: {
        size: number | "auto";
        weight: "bold" | "normal" | "auto";
    };
    gesture: TGestureConfiguration;
    snap: TSnapConfiguration;
    /** Whether moving/resizing/rotating a connected shape reshapes its anchored edges to follow it */
    connector: TConnectorConfiguration;
    overlays: TOverlayConfig;
    selection: TSelectionConfig;
    /** Math manager configuration (computation behavior and visual interactions) */
    math: TMathConfig;
    /** CSS custom property overrides applied to the canvas root element (e.g. `{ "--ms-ink-primary": "#ff0" }`) */
    cssVars?: Record<string, string>;
};
/**
 * @group Canvas
 * @source
 */
declare const DefaultInteractiveInkCanvasConfiguration: TInteractiveInkCanvasConfiguration;
/**
 * @group Canvas
 */
declare class InteractiveInkCanvasConfiguration implements TInteractiveInkCanvasConfiguration {
    grabber: TGrabberConfiguration;
    logger: TLoggerConfiguration;
    server: TServerWebsocketConfiguration;
    recognition: TRecognitionWebSocketConfiguration;
    rendering: TIIRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    menu: TMenuConfiguration;
    penStyle: TStyle;
    fontStyle: {
        size: number | "auto";
        weight: "bold" | "normal" | "auto";
    };
    gesture: TGestureConfiguration;
    snap: TSnapConfiguration;
    connector: TConnectorConfiguration;
    overlays: TOverlayConfig;
    selection: TSelectionConfig;
    math: TMathConfig;
    cssVars?: Record<string, string>;
    constructor(configuration?: TPartialDeep<TInteractiveInkCanvasConfiguration>);
}

/**
 * What `updateSymbols(ids, patch)` changes on each symbol it names.
 * @group Canvas
 */
type TSymbolPatch = {
    /** Merged into the symbol's style; a text hands it down to its chars */
    style?: TPartialDeep<TStyle>;
    /** Applied to the chars of a text; any other symbol ignores it. `weight: "auto"` keeps each char's own weight */
    font?: {
        size?: number;
        weight?: "normal" | "bold" | "auto";
    };
};
/**
 * What `updateSymbols(ids, patch)` does to each symbol: an object patch, or a function that changes a
 * draft of the symbol at will.
 * @group Canvas
 */
type TSymbolUpdate = TSymbolPatch | ((draft: TDraft<TSymbol>) => void);
/**
 * Structural type for InteractiveInkCanvas used by all managers.
 * Managers depend on this type rather than the concrete class to
 * enable isolation testing and future canvas variants.
 * @group Canvas
 */
type TInteractiveInkCanvas = {
    readonly model: IIModel;
    readonly configuration: InteractiveInkCanvasConfiguration;
    readonly event: CanvasEvent;
    readonly layers: CanvasLayer;
    readonly renderer: SVGRenderer;
    readonly client: WebSocketClient;
    readonly dom: typeof DOMFactory;
    get penStyle(): TStyle;
    set penStyle(v: TPartialDeep<TStyle>);
    tool: CanvasTool;
    readOnly: boolean;
    set renderingConfiguration(v: TIIRendererConfiguration);
    get connectionState(): TCanvasConnectionState;
    trackOperation<T>(label: TCanvasOperationLabel, fn: () => Promise<T>): Promise<T>;
    startOperation(label: TCanvasOperationLabel): void;
    endOperation(label: TCanvasOperationLabel): void;
    hasOperation(label: TCanvasOperationLabel): boolean;
    readonly history: IIHistoryManager;
    readonly writer: IIWriterManager;
    readonly keyboard: IIKeyboardManager;
    readonly eraser: EraseManager;
    readonly selector: IISelectionManager;
    readonly move: IIMoveManager;
    readonly gesture: IIGestureManager;
    readonly transform: IITransformManager;
    readonly converter: IIConversionManager;
    readonly typeset: IITypesetManager;
    readonly overlays: IIOverlayManager;
    readonly snaps: IISnapManager;
    readonly synchronizer: IISynchronizerManager;
    readonly jiix: IIJiixQueryManager;
    readonly exportManager: IIExportManager;
    readonly math: IIMathManager;
    readonly connector: IIConnectorManager;
    readonly layout: LayoutManager<TInteractiveInkCanvas>;
    readonly menu: IIMenuManager;
    readonly playback: IIPlaybackManager;
    createSymbols(partialSymbols: TPartialDeep<TSymbol>[]): Promise<TSymbol[]>;
    addSymbol(sym: TSymbol, addToHistory?: boolean): Promise<TSymbol>;
    addSymbols(symList: TSymbol[], addToHistory?: boolean): Promise<TSymbol[]>;
    updateSymbol(id: string, patch: TSymbolUpdate, addToHistory?: boolean): Promise<TSymbol | undefined>;
    updateSymbols(ids: string[], patch: TSymbolUpdate, addToHistory?: boolean): Promise<TSymbol[]>;
    replaceSymbols(oldSymbols: TSymbol[], newSymbols: TSymbol[], addToHistory?: boolean): Promise<void>;
    changeOrderSymbols(symbols: TSymbol[], position: "first" | "last" | "forward" | "backward"): void;
    removeSymbol(id: string, addToHistory?: boolean): Promise<void>;
    removeSymbols(ids: string[], addToHistory?: boolean): Promise<TSymbol[]>;
    extractStrokesFromSymbols(symbols: TSymbol[] | undefined): TStroke[];
    duplicate(symbols?: TSymbol[]): Promise<TSymbol[]>;
    select(ids: string[]): void;
    selectAll(): void;
    unselectAll(): void;
    getSymbolsBounds(symbols: TSymbol[], margin?: number): TBox;
    zoomToFit(symbols?: TSymbol[]): void;
    zoom(zoom: number, centerX?: number, centerY?: number): void;
    undo(): Promise<IIModel>;
    redo(): Promise<IIModel>;
    copy(): void;
    cut(): Promise<void>;
    paste(): Promise<void>;
    export(mimeTypes?: string[]): Promise<TExport>;
    convert(symbols?: TSymbol[]): Promise<void>;
    updateRecognitionConfiguration(partial: TPartialDeep<TRecognitionWebSocketConfiguration>): Promise<void>;
    exportAs<F extends TExportFormat>(format: F, options?: TExportOptions): Promise<TExportResultMap[F]>;
    download(format: TDownloadFormat, options?: TPDFDownloadOptions): Promise<void>;
    registerSymbolUtil<T extends TBaseSymbol>(util: SymbolUtil<T>): void;
    getSymbolUtil<T extends TBaseSymbol>(type: string): SymbolUtil<T> | undefined;
    clear(): Promise<void>;
    destroy(): Promise<void>;
    resize(dims?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    setCssVars(vars: Record<string, string> | undefined): void;
    manageError(error: Error): void;
};

/**
 * @group Canvas
 */
type TInteractiveInkCanvasOptions = TPartialDeep<TCanvasOptionsBase & {
    configuration: TInteractiveInkCanvasConfiguration;
}> & {
    override?: {
        /** A `WebSocketClient` subclass, instantiated by the canvas with its configuration */
        client?: typeof WebSocketClient;
        menu?: TMenuOverride;
    };
    /** Content added at load, so it is there from the first render (functions: hence not in `configuration`) */
    extend?: {
        /** Items added to the menus, like `canvas.menu.addItem` */
        menuItems?: TMenuItemRegistration[];
        /** Custom occupants of the layout, like `canvas.layout.add` */
        layout?: TLayoutOccupant<TInteractiveInkCanvas>[];
    };
};
/**
 * @group Canvas
 */
declare class InteractiveInkCanvas extends AbstractCanvas implements TInteractiveInkCanvas {
    #private;
    static readonly PASTE_OFFSET = 20;
    static readonly ZOOM_FIT_MARGIN = 40;
    static readonly EXPORT_RETRY_DEBOUNCE_MS = 300;
    /** SVG renderer responsible for drawing symbols onto the canvas layer. */
    renderer: SVGRenderer;
    /** WebSocket client handling real-time communication with the MyScript backend. */
    client: WebSocketClient;
    /** Manages undo/redo history stack for all symbol changes. */
    history: IIHistoryManager;
    /** Handles ink input: captures pointer events and creates strokes. */
    writer: IIWriterManager;
    /** Handles keyboard shortcuts and hotkey-based tool switching. */
    keyboard: IIKeyboardManager;
    /** Handles erasing strokes and symbols via pointer interaction. */
    eraser: EraseManager;
    /** Builds print-only DOM/CSS layers and drives PDF export via native browser print. */
    pdfExport: PDFExportManager;
    /** Detects and processes touch/pointer gestures (scratch-out, join, insert, etc.). */
    gesture: IIGestureManager;
    /** Orchestrates translate, resize, and rotation transforms on selected symbols. */
    transform: IITransformManager;
    /** Converts ink strokes to recognized text, math, or shape symbols. */
    converter: IIConversionManager;
    /** Manages text and math symbol layout: bounds computation and reflow after edits. */
    typeset: IITypesetManager;
    /** Handles symbol selection, selection group rendering, and hit-testing. */
    selector: IISelectionManager;
    /** Manages all visual overlays: math/text block indicators, debug visualizations. */
    overlays: IIOverlayManager;
    /** Manages snapping behavior for symbols during move/resize operations. */
    snaps: IISnapManager;
    /** Handles canvas panning when the Move tool is active. */
    move: IIMoveManager;
    /** Synchronizes the local model with the JIIX export from the backend client. */
    synchronizer: IISynchronizerManager;
    /** Queries and maps JIIX data to local symbols for math/text label resolution. */
    jiix: IIJiixQueryManager;
    /** Produces every export format and drives the file downloads. */
    exportManager: IIExportManager;
    /** Manages math recognition: variables, computation, and evaluation rendering. */
    math: IIMathManager;
    /** Manages smart connectors and anchor-based endpoint updates. */
    connector: IIConnectorManager;
    /** Where the menus, the connection state and the minimap sit */
    layout: LayoutManager<TInteractiveInkCanvas>;
    /** Manages the floating UI menu (tool selector, style panel, action buttons). */
    menu: IIMenuManager;
    /** Replays a recorded set of strokes with play/pause/speed control. */
    playback: IIPlaybackManager;
    /** Static utility class for creating DOM elements. */
    readonly dom: typeof DOMFactory;
    /**
     * Create and attach an InteractiveInk canvas to the given DOM element.
     * Use `Canvas.load()` instead of calling this constructor directly.
     * @param rootElement - Host DOM element that will contain the canvas layers
     * @param options - Canvas options: configuration, CSS vars, manager overrides
     */
    constructor(rootElement: HTMLElement, options?: TInteractiveInkCanvasOptions);
    /**
     * Promise that resolves when the WebSocket session is fully initialized.
     * Await this before calling any recognition methods.
     */
    get initializationPromise(): Promise<void>;
    /**
     * True while the connection is down after a first one succeeded, changes queued or not.
     * Listen to `event.addConnectionStatusChangedListener` for change notifications.
     */
    get isOffline(): boolean;
    /**
     * Active editing tool.
     * Setting this switches cursor style, attaches/detaches the corresponding manager,
     * clears selection, and emits a `toolChanged` event.
     */
    get tool(): CanvasTool;
    set tool(i: CanvasTool);
    /** Whether real pointer input (write/erase/select/move) is currently blocked - see `readOnly` setter. */
    get readOnly(): boolean;
    /**
     * Block or restore real pointer input across every tool at once (write/erase/select/move all
     * attach through `layers.rendering`), and reflect it with a "not-allowed" cursor. Used e.g. by
     * `canvas.playback` so a replayed stroke can't race the user's own input.
     */
    set readOnly(value: boolean);
    /**
     * Current symbol model containing all ink, text, math, and shape symbols.
     */
    get model(): IIModel;
    /**
     * Active canvas configuration (recognition, rendering, menu, math, etc.).
     */
    get configuration(): InteractiveInkCanvasConfiguration;
    /**
     * Apply a partial rendering configuration at runtime.
     * Triggers a resize and guide-row recompute.
     * @param renderingConfiguration - Partial rendering config to merge
     */
    set renderingConfiguration(renderingConfiguration: TIIRendererConfiguration);
    /**
     * Current pen style applied to new strokes.
     * Setting this merges the provided partial style with the current style.
     */
    get penStyle(): TStyle;
    set penStyle(penStyle: TPartialDeep<TStyle>);
    /**
     * Update layer UI with debouncing
     * @param timeout - Debounce timeout in milliseconds (default: 500ms)
     */
    updateLayerUI(timeout?: number): void;
    /**
     * Display an error in the canvas overlay and emit an `error` event.
     * @param error - Error to display and emit
     */
    manageError(error: unknown): void;
    registerSymbolUtil<T extends TBaseSymbol>(util: SymbolUtil<T>): void;
    getSymbolUtil<T extends TBaseSymbol>(type: string): SymbolUtil<T> | undefined;
    protected get cursorClasses(): string[];
    protected getCursorClass(): string;
    /**
     * On top of the base badge tracking, cancels the pending debounced `synchronize()` as soon
     * as a new gesture starts - so a stroke/transform beginning right as the debounce timer would
     * otherwise fire never races it (it'll be rescheduled once that gesture's own content change
     * comes in).
     */
    startOperation(label: TCanvasOperationLabel): void;
    protected onContentChanged(): Promise<void>;
    /**
     * With `ignoreGestureStrokes` the backend never emits a `contentChanged` for a gesture stroke,
     * so the debounced synchronize scheduled by `onContentChanged` has nothing left to reschedule it -
     * force one here instead of relying on that mechanism.
     */
    protected onGestured(): Promise<void>;
    /**
     * Initialize the canvas: render layers, attach input handlers, connect to the
     * WebSocket client, and load the initial session.
     * Called automatically by `Canvas.load()` — do not call manually.
     * @throws If the client connection or session setup fails
     */
    initialize(): Promise<void>;
    /**
     * Change the recognition configuration (language, math solver…) without destroying the canvas.
     * Opens a new backend session with it and re-sends every user stroke; the canvas is read-only
     * meanwhile. Calls are serialized, and those waiting for a running one are applied together.
     * @param partial - Keys to change; an array replaces the current one, `undefined` clears a key
     * @throws If the new session fails to open; the previous configuration is then restored
     * @example
     * ```ts
     * await canvas.updateRecognitionConfiguration({ lang: "fr_FR" })
     * await canvas.updateRecognitionConfiguration({ math: { solver: { "angle-unit": "deg" } } })
     * ```
     */
    updateRecognitionConfiguration(partial: TPartialDeep<TRecognitionWebSocketConfiguration>): Promise<void>;
    /**
     * Build a symbol from partial data
     * @param partialSymbol - Partial symbol data
     * @returns Complete symbol instance
     */
    protected buildSymbol(partialSymbol: TPartialDeep<TSymbol>): TSymbol;
    /**
     * Create a symbol from partial data
     * @param partialSymbol - Partial symbol data
     * @returns Promise resolving to created symbol
     */
    createSymbol(partialSymbol: TPartialDeep<TSymbol>): Promise<TSymbol>;
    /**
     * Create multiple symbols from partial data
     * @param partialSymbols - Array of partial symbol data
     * @returns Promise resolving to array of created symbols
     */
    createSymbols(partialSymbols: TPartialDeep<TSymbol>[]): Promise<TSymbol[]>;
    /** @hidden */
    protected updateTypesetBounds(symbol: TSymbol): void;
    /** @hidden */
    addSymbol(sym: TSymbol, addToHistory?: boolean): Promise<TSymbol>;
    /**
     * Add multiple symbols to the model and renderer
     * @param symList - Array of symbols to add
     * @param addToHistory - Whether to add to history (default: true)
     * @returns Promise resolving to array of added symbols
     */
    addSymbols(symList: TSymbol[], addToHistory?: boolean): Promise<TSymbol[]>;
    /**
     * Update one symbol: `updateSymbols([id], patch, addToHistory)`.
     * @returns The updated record, or undefined when no symbol has this id
     */
    updateSymbol(id: string, patch: TSymbolUpdate, addToHistory?: boolean): Promise<TSymbol | undefined>;
    /**
     * Update symbols by id, each with the same patch.
     *
     * - an object patch: `style` is merged into each symbol's style, `font` is applied to the texts
     *   (any other symbol ignores it);
     * - a function patch: called with a draft of each symbol, to change it at will.
     *
     * Texts and maths are re-measured, and a text that gets wider or narrower slides the texts after it
     * on its row. The backend hears only of strokes that appeared or disappeared: style is not
     * recognized. Only the symbols named are touched, whatever the size of the document.
     * @param addToHistory - Whether to add to history (default: true). Texts slid along are part of the same entry.
     * @returns The updated records; an id with no symbol is skipped
     * @example
     * ```ts
     * await canvas.updateSymbols(ids, { style: { color: "#ff0000" } })
     * await canvas.updateSymbols(ids, { font: { size: 18, weight: "bold" } })
     * await canvas.updateSymbols([text.id], (draft) => { if (isText(draft)) draft.decorators = [] })
     * ```
     */
    updateSymbols(ids: string[], patch: TSymbolUpdate, addToHistory?: boolean): Promise<TSymbol[]>;
    /**
     * Replace old symbols with new symbols
     * @param oldSymbols - Array of old symbols to be replaced
     * @param newSymbols - Array of new symbols to replace with
     * @param addToHistory - Whether to add this operation to history (default: true)
     */
    replaceSymbols(oldSymbols: TSymbol[], newSymbols: TSymbol[], addToHistory?: boolean): Promise<void>;
    /**
     * Change the order of a symbol in the rendering stack
     * @param symbol - Symbol to reorder
     * @param position - New position (first, last, forward, backward)
     */
    changeOrderSymbol(symbol: TSymbol, position: "first" | "last" | "forward" | "backward"): void;
    /**
     * Change the order of multiple symbols in the rendering stack
     * @param symbols - Symbols to reorder
     * @param position - New position (first, last, forward, backward)
     */
    changeOrderSymbols(symbols: TSymbol[], position: "first" | "last" | "forward" | "backward"): void;
    /**
     * Synchronize strokes with JIIX export
     */
    synchronize(): Promise<void>;
    /**
     * Remove a symbol from the model
     * @param id - ID of symbol to remove
     * @param addToHistory - Whether to add to history (default: true)
     * @returns Promise that resolves when symbol is removed
     */
    removeSymbol(id: string, addToHistory?: boolean): Promise<void>;
    /**
     * Remove multiple symbols from the model
     * @param ids - Array of symbol IDs to remove
     * @param addToHistory - Whether to add to history (default: true)
     * @returns Promise that resolves when symbols are removed
     */
    removeSymbols(ids: string[], addToHistory?: boolean): Promise<TSymbol[]>;
    /**
     * Select symbols by their IDs
     * @param ids - Array of symbol IDs to select
     */
    select(ids: string[]): void;
    /**
     * Select all symbols
     */
    selectAll(): void;
    /**
     * Unselect all currently selected symbols
     */
    unselectAll(): void;
    /**
     * Import strokes from point events
     * @param partialStrokes - Array of partial stroke data
     * @returns Promise resolving to updated model
     */
    importPointEvents(partialStrokes: TPartialDeep<TStroke>[]): Promise<IIModel>;
    /**
     * Get bounding box for a list of symbols
     * @param symbols - Symbols to calculate bounds for
     * @param margin - TMargin to add around bounds (default: SELECTION_PADDING)
     * @returns Bounding box containing all symbols
     */
    getSymbolsBounds(symbols: TSymbol[], margin?: number): TBox;
    /**
     * Set the viewport zoom level, optionally anchored to a point.
     * @param zoom - Target zoom factor (e.g. 1.5 = 150 %)
     * @param centerX - X coordinate to zoom around (pixels, default: viewport center)
     * @param centerY - Y coordinate to zoom around (pixels, default: viewport center)
     */
    zoom(zoom: number, centerX?: number, centerY?: number): void;
    /**
     * Zoom and pan the view to fit the given symbols (or all symbols) within the viewport.
     * Resets to zoom 1 if there are no symbols.
     * @param symbols - Symbols to fit (default: all model symbols)
     */
    zoomToFit(symbols?: TSymbol[]): void;
    /**
     * Get the current viewport zoom level.
     * @returns Current zoom factor (1.0 = 100 %)
     */
    getZoom(): number;
    /**
     * Shift the viewport by the given pixel delta without changing zoom.
     * @param dx - Horizontal offset in pixels (positive = pan right)
     * @param dy - Vertical offset in pixels (positive = pan down)
     */
    pan(dx: number, dy: number): void;
    /**
     * Export the content in the given format.
     *
     * `pdf` is not available here — printing produces no in-memory value, use
     * {@link InteractiveInkCanvas.download} instead.
     *
     * @param format - Format to export to; the resolved type follows from it
     * @param options - Which symbols to export (`scope`, or an explicit `symbols` list)
     * @returns Promise resolving with the exported content
     *
     * @example
     * ```typescript
     * const symbols = await canvas.exportAs("json")
     * const markdown = await canvas.exportAs("markdown")
     * const svg = await canvas.exportAs("svg", { scope: "selection" })
     * ```
     */
    exportAs<F extends TExportFormat>(format: F, options?: TExportOptions): Promise<TExportResultMap[F]>;
    /**
     * Export the content and hand the resulting file to the browser.
     *
     * @param format - Format to download; `pdf` opens the print flow instead of saving a file
     * @param options - Which symbols to export, plus the file name. The PDF settings
     *                  (`format`/`orientation`/`mode`/`scale`) are ignored by every other format.
     *
     * @example
     * ```typescript
     * await canvas.download("svg")
     * await canvas.download("text", { scope: "selection", filename: "notes" })
     * await canvas.download("pdf", { orientation: "landscape" })
     * ```
     */
    download(format: TDownloadFormat, options?: TPDFDownloadOptions): Promise<void>;
    /**
     * Extract all strokes from symbols recursively
     * @param symbols - Symbols to extract strokes from
     * @returns Array of extracted strokes
     */
    extractStrokesFromSymbols(symbols: TSymbol[] | undefined): TStroke[];
    /**
     * Extract all math symbols recursively
     * @param symbols - Symbols to extract maths from
     * @returns Array of extracted math symbols
     */
    extractMathsFromSymbols(symbols: TSymbol[] | undefined): TMath[];
    protected handleWheel: (event: WheelEvent) => void;
    /**
     * Undo the last action
     * @returns Promise resolving to updated model
     */
    undo(): Promise<IIModel>;
    /**
     * Redo the previously undone action
     * @returns Promise resolving to updated model
     */
    redo(): Promise<IIModel>;
    /**
     * Export content to specified MIME types
     * @param mimeTypes - Array of MIME types to export
     * @returns Promise resolving with exports
     */
    export(mimeTypes?: string[]): Promise<TExport>;
    /**
     * Convert specific symbols, or all symbols if none specified
     * @param symbols - Symbols to convert (defaults to all symbols)
     * @returns Promise that resolves when conversion is complete
     */
    convert(symbols?: TSymbol[]): Promise<void>;
    /**
     * Duplicate specific symbols, or all symbols if none specified
     * @param symbols - Symbols to duplicate (defaults to all symbols)
     * @returns Promise resolving with duplicated symbols
     */
    duplicate(symbols?: TSymbol[]): Promise<TSymbol[]>;
    /**
     * Wait for the client to become idle
     * @returns Promise that resolves when idle
     */
    waitForIdle(): Promise<void>;
    /**
     * Resize the canvas
     * @param dimensions - New height and/or width
     * @returns Promise that resolves when resize is complete
     */
    resize({ height, width }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    protected get minDimensions(): {
        minHeight: number;
        minWidth: number;
    };
    /**
     * Apply or replace CSS custom properties on the canvas root element.
     * Clears all existing `--ms-ink-*` properties first, then sets the provided vars.
     * Does not reinitialize — current model and session are preserved.
     * Pass `undefined` to reset to stylesheet defaults.
     * @group Canvas
     */
    setCssVars(vars: Record<string, string> | undefined): void;
    /**
     * Clear all content from the canvas
     * @returns Promise that resolves when cleared
     */
    clear(): Promise<void>;
    /**
     * Copy selected symbols (or all symbols if nothing selected) to the internal clipboard
     */
    copy(): void;
    /**
     * Paste clipboard symbols at an offset and select them
     */
    paste(): Promise<void>;
    /**
     * Cut selected symbols: copy them to clipboard, then remove from model
     */
    cut(): Promise<void>;
    /**
     * Destroy the canvas and clean up resources
     * @returns Promise that resolves when destruction is complete
     */
    destroy(): Promise<void>;
}

/**
 * The four things the smart guide asks of the canvas that hosts it.
 *
 * Declared here rather than importing `InteractiveInkSSRCanvas`, for the same reason every manager
 * takes a contract instead of a class: the concrete canvas constructs the smart guide and hands
 * itself in, so naming the class closes a cycle, and it would tie a UI component to one variant.
 * Structural typing means the SSR canvas satisfies this with nothing to declare.
 * @group SmartGuide
 */
type TSmartGuideHost = {
    readonly event: CanvasEvent;
    clear(): Promise<void>;
    convert(params?: {
        conversionState?: TConverstionState;
    }): Promise<unknown>;
    import(data: Blob | string | TJIIXExport, mimeType?: string): Promise<unknown>;
};
/**
 * @group SmartGuide
 */
declare class InteractiveInkSSRSmartGuide {
    #private;
    uuid: string;
    canvas: TSmartGuideHost;
    margin: TMarginConfiguration;
    jiix?: TJIIXExport;
    lastWord?: TJIIXWord;
    wordToChange?: TJIIXWord;
    constructor(canvas: TSmartGuideHost);
    init(domElement: HTMLElement, margin: TMarginConfiguration): void;
    resize(): void;
    update(exports: TJIIXExport): void;
    clear(): void;
    destroy(): void;
}

/**
 * @group Canvas
 */
type TInteractiveInkSSRCanvasConfiguration = TCanvasConfiguration & TWebSocketSSRClientConfiguration & {
    rendering: TRendererConfiguration;
    smartGuide: {
        enable: boolean;
    };
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TCanvasTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
};
/**
 * @group Canvas
 * @source
 */
declare const DefaultInteractiveInkSSRCanvasConfiguration: TInteractiveInkSSRCanvasConfiguration;
/**
 * @group Canvas
 */
declare class InteractiveInkSSRCanvasConfiguration implements TInteractiveInkSSRCanvasConfiguration {
    server: TServerWebsocketConfiguration;
    recognition: TWebSocketSSRClientRecognitionConfiguration;
    rendering: TRendererConfiguration;
    smartGuide: {
        enable: boolean;
    };
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TCanvasTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
    constructor(configuration?: TPartialDeep<TInteractiveInkSSRCanvasConfiguration>);
}

/**
 * @group Canvas
 */
type TInteractiveInkSSRCanvasOptions = TPartialDeep<TCanvasOptionsBase & {
    configuration: InteractiveInkSSRCanvasConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        client?: WebSocketSSRClient;
    };
};
/**
 * @group Canvas
 */
declare class InteractiveInkSSRCanvas extends AbstractCanvas {
    #private;
    smartGuide?: InteractiveInkSSRSmartGuide;
    grabber: PointerEventGrabber;
    renderer: InteractiveInkSSRSVGRenderer;
    client: WebSocketSSRClient;
    history: HistoryManager;
    styleManager: StyleManager;
    constructor(rootElement: HTMLElement, options?: TInteractiveInkSSRCanvasOptions);
    get initializationPromise(): Promise<void>;
    get tool(): CanvasTool;
    set tool(i: CanvasTool);
    get model(): Model;
    get configuration(): InteractiveInkSSRCanvasConfiguration;
    get currentPenStyle(): TPenStyle;
    get penStyle(): TPenStyle;
    set penStyle(penStyle: TPartialDeep<TPenStyle>);
    get penStyleClasses(): string;
    set penStyleClasses(penClass: string);
    get theme(): TTheme;
    set theme(theme: TPartialDeep<TTheme>);
    protected syncStyle(): Promise<void>;
    protected onExport(exports: TExport): void;
    protected onPointerDown(info: TPointerInfo): void;
    protected onPointerMove(info: TPointerInfo): void;
    protected onPointerUp(info: TPointerInfo): Promise<void>;
    protected onSVGPatch(evt: TWebSocketSSRClientMessageSVGPatch): void;
    protected initializeSmartGuide(): void;
    protected onContentChanged(undoRedoContext: THistoryContext): void;
    protected onError(error: Error): void;
    initialize(): Promise<void>;
    drawCurrentStroke(): void;
    synchronizeModelWithBackend(): Promise<Model>;
    waitForIdle(): Promise<void>;
    export(mimeTypes?: string[]): Promise<Model>;
    convert(params?: {
        conversionState?: TConverstionState;
    }): Promise<Model>;
    import(data: Blob | string | TJIIXExport, mimeType?: string): Promise<Model>;
    importPointEvents(strokes: TPartialDeep<TLegacyStroke>[]): Promise<Model>;
    resize({ height, width, }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    protected get minDimensions(): {
        minHeight: number;
        minWidth: number;
    };
    undo(): Promise<Model>;
    redo(): Promise<Model>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Canvas
 * @hidden
 */
type TCanvasVariantMap = {
    INTERACTIVE_INK: InteractiveInkCanvas;
    INK_V1: InkCanvasDeprecated;
    INTERACTIVE_INK_SSR: InteractiveInkSSRCanvas;
    INK_V2: InkCanvas;
};
/**
 * @group Canvas
 * @hidden
 */
type TCanvasOptionsMap = {
    INTERACTIVE_INK: TInteractiveInkCanvasOptions;
    INK_V1: TInkCanvasDeprecatedOptions;
    INTERACTIVE_INK_SSR: TInteractiveInkSSRCanvasOptions;
    INK_V2: TInkCanvasOptions;
};
/**
 * @group Canvas
 * @hidden
 */
declare class CanvasFactory {
    private static logger;
    private static instances;
    /**
     * Creates and initializes an canvas instance based on the specified type
     * Replaces any previously created instance
     *
     * @template T - The canvas type to create
     * @param rootElement - The HTML element to mount the canvas
     * @param type - The canvas variant type
     * @param options - Configuration options specific to the canvas type
     * @returns Promise resolving to the initialized canvas instance
     */
    static createCanvas<T extends TCanvasType>(rootElement: HTMLElement, type: T, options: TCanvasOptionsMap[T]): Promise<TCanvasVariantMap[T]>;
    /**
     * Retrieves the currently active canvas instance
     *
     * @returns The current canvas instance or undefined if none exists
     */
    static getInstance(): TCanvasVariantMap[TCanvasType] | undefined;
    /**
     * Retrieves a specific canvas instance by type
     *
     * @param type - The canvas type to retrieve
     * @returns The canvas instance of the specified type or undefined
     */
    static getInstanceByType<T extends TCanvasType>(type: T): TCanvasVariantMap[T] | undefined;
    /**
     * Clears all stored canvas instances
     */
    static clearInstances(): Promise<void>;
}

/**
 * @group Canvas
 * @summary Main Canvas facade for loading canvas instances
 *
 * This class provides a convenient interface for loading canvas instances.
 * It delegates to CanvasFactory for the actual implementation.
 *
 * @example
 * ```typescript
 * const canvas = await Canvas.load(
 *   document.getElementById("canvas"),
 *   "INTERACTIVE_INK",
 *   { configuration: {...} }
 * )
 * ```
 * @hideconstructor
 */
declare class Canvas {
    /**
     * Loads and initializes an canvas instance
     *
     * @template T - The canvas type to load
     * @param rootElement - The HTML element to mount the canvas
     * @param type - The canvas variant type to load
     * @param options - Configuration options specific to the canvas type
     * @returns Promise resolving to the initialized canvas instance
     *
     * @remarks
     * This method will destroy any previously loaded canvas instance before creating a new one.
     * Use {@link getInstance} to access the currently active canvas.
     */
    static load<T extends TCanvasType>(rootElement: HTMLElement, type: T, options: TCanvasOptionsMap[T]): Promise<TCanvasVariantMap[T]>;
    /**
     * Gets the currently active canvas instance
     *
     * @returns The current canvas instance or undefined if none exists
     */
    static getInstance(): TCanvasVariantMap[TCanvasType] | undefined;
    /**
     * Gets a specific canvas instance by type
     *
     * @template T - The canvas type to retrieve
     * @param type - The canvas type to retrieve
     * @returns The canvas instance of the specified type or undefined
     */
    static getInstanceByType<T extends TCanvasType>(type: T): TCanvasVariantMap[T] | undefined;
}

/**
 * @group Components
 */
type TMathSymbolCapabilities = {
    jiixBlockId: string;
    canCheckDiagnostic: boolean;
    canEditVariables: boolean;
    canCompute: boolean;
    canEvaluate: boolean;
};
/**
 * @group Components
 * @remarks Component for displaying math symbols capabilities in a table
 */
declare class IIMathCapabilitiesTable {
    private canvas;
    private modal?;
    private table?;
    private capabilities;
    private actionButtons;
    private logger;
    constructor(canvas: TInteractiveInkCanvas);
    /**
     * Fetch capabilities for a single math symbol
     */
    private fetchSymbolCapabilities;
    /**
     * Create the table element
     */
    private createTable;
    /**
     * Handle row selection
     */
    private handleRowSelection;
    /**
     * Update action buttons enabled/disabled state based on selected rows
     */
    private updateActionButtons;
    /**
     * Create action buttons container
     */
    private createActionButtons;
    /**
     * Execute Check Diagnostic action for selected rows
     */
    private executeCheckDiagnostic;
    /**
     * Execute Edit Variables action for selected rows
     */
    private executeEditVariables;
    /**
     * Execute Compute Result action for selected rows
     */
    private executeComputeResult;
    /**
     * Execute Evaluate Function action for selected rows
     */
    private executeEvaluateFunction;
    /**
     * Show the capabilities overview modal
     */
    show(): Promise<void>;
    /**
     * Close the modal
     */
    close(): void;
}

/**
 * @group Components
 */
type TSymbolDiagnostic = {
    jiixBlockId: string;
    computeDiagnostic: string;
    evaluationDiagnostic: string;
};
/**
 * @group Components
 * @remarks Component for checking and displaying diagnostics for multiple math symbols
 */
declare class IIMathDiagnosticChecker {
    private canvas;
    private jiixBlockIds;
    private modal?;
    private logger;
    constructor(canvas: TInteractiveInkCanvas, jiixBlockIds: string[]);
    /**
     * Show the diagnostic checker modal
     */
    show(): Promise<void>;
    /**
     * Create the modal content with diagnostics
     */
    private createModalContent;
    /**
     * Create a diagnostic section for a single symbol
     */
    private createSymbolDiagnosticSection;
    /**
     * Create a diagnostic sub-section
     */
    private createDiagnosticSubSection;
    /**
     * Close the diagnostic checker
     */
    close(): void;
}

/**
 * @group Components
 */
type TMathEvaluableFunction = {
    jiixBlockId: string;
    evaluables: Array<{
        inputName: string;
        outputName: string;
    }>;
    selectedEvaluableIndex: number;
    color: string;
};
/**
 * @group Components
 */
type TEvaluationResult = {
    func: TMathEvaluableFunction;
    points: {
        [key: string]: number;
    }[][];
};
/**
 * @group Components
 * @remarks Component for evaluating and displaying multiple math functions
 */
declare class IIMathFunctionEvaluator {
    private canvas;
    private jiixBlockIds;
    private modal?;
    private evaluationResults?;
    private tabContent?;
    private currentTab;
    private functionsToEvaluate;
    private logger;
    private static readonly COLORS;
    constructor(canvas: TInteractiveInkCanvas, jiixBlockIds: string[]);
    /**
     * Show the function evaluator modal
     */
    show(): Promise<void>;
    /**
     * Create the modal content with inputs and tabs
     */
    private createModalContent;
    /**
     * Create a single function item for display
     */
    private createFunctionItem;
    /**
     * Create the functions list display
     */
    private createFunctionsList;
    /**
     * Create the evaluation inputs grid (from, to, points, step)
     */
    private createEvaluationInputsGrid;
    /**
     * Create the evaluate button
     */
    private createEvaluateButton;
    /**
     * Create the inputs section
     */
    private createInputsSection;
    /**
     * Setup input synchronization (step/pointCount)
     */
    private setupInputSynchronization;
    /**
     * Create the tabs section (Graph and Table)
     */
    private createTabsSection;
    /**
     * Create a tab header
     */
    private createTabHeader;
    /**
     * Evaluate all functions
     */
    private evaluateFunctions;
    /**
     * Render the current tab content
     */
    private renderCurrentTab;
    /**
     * Render the graph tab
     */
    private renderGraph;
    /**
     * Group evaluation results by input variable name
     */
    private groupResultsByInputName;
    /**
     * Create table title element
     */
    private createTableTitle;
    /**
     * Create table columns for a group of results
     */
    private createTableColumns;
    /**
     * Create table rows for a group of results
     */
    private createTableRows;
    /**
     * Render the table tab
     */
    private renderTable;
    /**
     * Close the evaluator
     */
    close(): void;
}

/**
 * @group Components
 * @remarks Modal canvas for all variable definitions returned by get-variable-definitions.
 * Shows one row per (variable, block) usage. Definition rows are read-only;
 * BLOCK-provided and free (UNDEFINED) variables are editable/deletable.
 */
declare class IIMathVariableCanvas {
    private canvas;
    private modal?;
    private usages;
    private usagesById;
    private inputList?;
    private newRows;
    private logger;
    constructor(canvas: TInteractiveInkCanvas);
    show(): Promise<void>;
    private createModalContent;
    private createAddSection;
    private createNewVariableRow;
    private applyChanges;
    close(): void;
}

/**
 * @group Components
 */
type TVariableInputItem = {
    id?: string;
    name: string;
    initialValue?: number;
    sourceType?: string;
    sourceLabel?: string;
    isDefinition?: boolean;
    targetLabel?: string;
    disabled?: boolean;
    onDelete?: (name: string) => Promise<void>;
};
/**
 * @group Components
 * @remarks Color token per variable source type (UNDEFINED, API, API_GLOBAL, BLOCK, PREDEFINED). Used to color-code the source badge in the variable list UI.
 */
declare const SOURCE_TYPE_COLORS: Record<string, string>;
/**
 * @group Components
 * @remarks Human-readable label per variable source type (UNDEFINED, API, API_GLOBAL, BLOCK, PREDEFINED). Displayed next to the source badge in the variable list UI.
 */
declare const SOURCE_TYPE_LABELS: Record<string, string>;
/**
 * @group Components
 * @remarks Pure UI component — renders a list of variable input rows.
 * Use getValues() to retrieve all valid (non-empty, non-NaN) inputs.
 */
declare class IIMathVariableInputList {
    readonly element: HTMLDivElement;
    private inputs;
    constructor(items: TVariableInputItem[]);
    private createRow;
    removeRow(name: string): void;
    getValues(): Map<string, number>;
}

/**
 * @group Components
 */
type TSymbolVariables = {
    jiixBlockId: string;
    definition: TMathVariableDefinition | null;
    variables: TMathVariable[];
};
/**
 * @group Components
 * @remarks Modal canvas for variables of one or more math block symbols.
 * Fetches variables per jiixBlockId and applies changes via setListVariableValue.
 */
declare class IIMathVariablePerBlockCanvas {
    private canvas;
    private jiixBlockIds;
    private modal?;
    private blockVariables;
    private inputLists;
    private logger;
    constructor(canvas: TInteractiveInkCanvas, jiixBlockIds: string[]);
    show(): Promise<void>;
    private createModalContent;
    private createSymbolSection;
    private applyChanges;
    close(): void;
}

/**
 * @group Constants
 * @remarks Human-readable messages for MathDiagnostic error codes
 */
declare const MathDiagnosticMessages: {
    [key: string]: {
        title: string;
        message: string;
        severity: "success" | "warning" | "error" | "info";
    };
};
/**
 * @group Constants
 * @summary Get diagnostic message for a given diagnostic code
 * @param diagnostic - The diagnostic code (e.g., "ALLOWED", "DIVISION_BY_ZERO")
 * @returns Message object with title, message, and severity
 */
declare function getMathDiagnosticMessage(diagnostic: string): {
    title: string;
    message: string;
    severity: "success" | "warning" | "error" | "info";
};

/**
 * @group Components
 */
type TMinimapOptions = {
    width?: number;
    height?: number;
};
/**
 * Minimap component showing a scaled-down overview of the canvas.
 * Click or drag to navigate the canvas viewport.
 * @group Components
 */
declare class Minimap {
    #private;
    static readonly DEFAULT_WIDTH = 200;
    static readonly DEFAULT_HEIGHT = 150;
    constructor(canvas: TInteractiveInkCanvas, options?: TMinimapOptions);
    /**
     * Returns the minimap DOM element to insert into the page.
     */
    getElement(): HTMLDivElement;
    /**
     * Appends the minimap to the given element and syncs the initial state.
     */
    attach(element: HTMLElement): void;
    /**
     * Removes the minimap from its parent without cleaning up observers.
     */
    detach(): void;
    /**
     * Disconnects the observer, removes event listeners, and removes the minimap from the DOM.
     */
    destroy(): void;
}

/**
 * Gap between a selected box and the selection frame drawn around it, its handles included.
 * @group Constants
 */
declare const SELECTION_PADDING: 10;
/**
 * Distance on each side of a thin edge within which a pointer still hits it: a hairline drawn
 * exactly is a target nobody can hit.
 * @group Constants
 */
declare const HIT_TOLERANCE: 5;
/**
 * Offset of a duplicate from its original, on both axes, past the original's height vertically.
 * @group Constants
 */
declare const DUPLICATE_OFFSET: 10;

/**
 * @group Styles
 */
declare const StyleHelper: {
    themeToCSS(json: TTheme): string;
    themeToJSON(style: string): TTheme;
    penStyleToCSS(penStyle: TPenStyle): string;
    penStyleToJSON(penStyleString: string): TPenStyle;
    stringToJSON(style: string): Record<string, string>;
    JSONToString(style: Record<string, string>): string;
};

/**
 * @group UI
 */
type TChartConfig = {
    width?: number;
    height?: number;
    title?: string;
    xLabel?: string;
    yLabel?: string;
    lineColor?: string;
    lineWidth?: number;
    showGrid?: boolean;
    showPoints?: boolean;
    seriesColors?: string[];
};
/**
 * @group UI
 */
declare class Chart {
    private static readonly CHART_MARGIN;
    private static readonly SERIES_COLORS;
    private canvas;
    private ctx;
    private config;
    private series;
    private container;
    private viewport;
    private defaultViewport;
    private isDragging;
    private lastMousePos;
    private controlsContainer?;
    private drawCoalescer;
    constructor(config?: TChartConfig);
    private createControls;
    private setupInteractions;
    /**
     * Set cursor style
     */
    private setCursor;
    /**
     * Check if a point is valid (not NaN or Infinite)
     */
    private isValidPoint;
    /**
     * Get series colors
     */
    private getSeriesColors;
    private zoom;
    private pan;
    /**
     * Coalesces `draw()` to at most once per animation frame — `pan()` fires on every native
     * `mousemove` while dragging, and a full chart redraw (axes/grid/curves/points) per event
     * outpaces what a single frame can show.
     */
    private scheduleDraw;
    private resetZoom;
    /**
     * Get chart dimensions accounting for margins
     */
    private getChartDimensions;
    /**
     * Compute range with padding for axis bounds
     */
    private computeRangeWithPadding;
    /**
     * Filter outliers using IQR method
     */
    private filterOutliers;
    /**
     * Calculate default viewport based on median values
     */
    private calculateDefaultViewport;
    /**
     * Set the data points to plot
     * @param data Can be:
     *   - Single series: number[][] or { [key: string]: number }[]
     *   - Multiple series: number[][][] or { [key: string]: number }[][]
     */
    setData(data: number[][] | {
        [key: string]: number;
    }[] | number[][][] | {
        [key: string]: number;
    }[][]): void;
    private convertToPoints;
    /**
     * Get the container element (includes canvas and table)
     */
    getElement(): HTMLDivElement;
    private draw;
    /**
     * Calculate viewport bounds (with or without custom viewport)
     */
    private calculateViewportBounds;
    /**
     * Get scale functions for converting data coordinates to canvas coordinates
     */
    private getScaleFunctions;
    /**
     * Calculate axis positions (cross at origin if possible)
     */
    private calculateAxisPositions;
    /**
     * Draw chart title
     */
    private drawTitle;
    /**
     * Draw grid lines
     */
    private drawGrid;
    /**
     * Draw chart border
     */
    private drawChartBorder;
    /**
     * Draw X and Y axes
     */
    private drawAxes;
    /**
     * Draw axis labels
     */
    private drawAxisLabels;
    /**
     * Draw X-axis tick marks and labels
     */
    private drawXAxisTicks;
    /**
     * Draw Y-axis tick marks and labels
     */
    private drawYAxisTicks;
    /**
     * Draw all curve series
     */
    private drawCurves;
    /**
     * Draw points for all series
     */
    private drawPoints;
    /**
     * Update chart configuration and redraw
     */
    updateConfig(config: Partial<TChartConfig>): void;
    /**
     * Destroy the chart
     */
    destroy(): void;
}

/** @group UI */
type TModalType = "info" | "success" | "warning" | "error" | "primary";
/**
 * @group UI
 */
type TModalFieldOption = {
    value: string;
    label: string;
};
/**
 * @group UI
 */
type TModalField = {
    id: string;
    label: string;
    type: "text" | "number" | "select";
    defaultValue?: string | number;
    placeholder?: string;
    options?: TModalFieldOption[];
};
/**
 * @group UI
 */
type TModalConfig = {
    title: string;
    fields: TModalField[];
    type?: TModalType;
    buttons?: TButtonElConfig[];
    customContent?: HTMLElement;
    /** Element to mount the modal into. Defaults to document.body (viewport-fixed). */
    container?: HTMLElement;
    /** Container width (px) below which the modal opens in fullscreen. Defaults to 480. */
    mobileBreakpoint?: number;
    /** Called when the modal closes (close button, backdrop click, or timeout). */
    onClose?: () => void;
};
/**
 * @group UI
 */
declare class Modal {
    private config;
    private modal;
    private backdrop;
    private isOpen;
    private isFullscreen;
    private isDragging;
    private dragOffset;
    private modalPosition;
    private fullscreenButton?;
    private titleBar?;
    private contentWrapper?;
    private get container();
    private get isAnchored();
    constructor(config: TModalConfig);
    private createBackdrop;
    private createModal;
    private createModalContainer;
    private createTitleBar;
    private createTitleBarButtons;
    private createIconButton;
    private createContentWrapper;
    private createForm;
    private createFormField;
    private createSelectInput;
    private createTextInput;
    private createActionButtons;
    private createActionButton;
    private setupDragging;
    private computeDragPosition;
    private toggleFullscreen;
    /**
     * Open the modal. Auto-fullscreen if container width < mobileBreakpoint.
     */
    open(): void;
    /**
     * Close the modal without removing it from the DOM. Fires onClose.
     */
    close(): void;
    /**
     * Dismiss the modal programmatically without firing onClose.
     */
    dismiss(): void;
    /**
     * Close and remove the modal from the DOM. Fires onClose.
     */
    destroy(): void;
    /**
     * Remove the modal from the DOM without firing onClose.
     */
    destroySilent(): void;
}

/**
 * @group UI
 */
type TTableColumn = {
    header: string | HTMLElement;
    align?: "left" | "center" | "right";
    width?: string;
};
/**
 * @group UI
 */
type TTableCellConfig = {
    content: string | HTMLElement;
    align?: "left" | "center" | "right";
    style?: string;
};
/**
 * @group UI
 */
type TTableRow = {
    cells: (string | HTMLElement | TTableCellConfig)[];
    style?: string;
    hoverStyle?: string;
    data?: unknown;
};
/**
 * @group UI
 */
type TTableConfig = {
    columns: (string | TTableColumn)[];
    rows: TTableRow[];
    stickyHeader?: boolean;
    hoverEffect?: boolean;
    fontSize?: string;
    maxHeight?: string;
    width?: string;
    selectable?: boolean;
    multiSelect?: boolean;
    onRowClick?: (rowIndex: number, rowData?: unknown, isSelected?: boolean) => void;
};
/**
 * @group UI
 * @remarks Generic table component for displaying data in a structured format
 */
declare class Table {
    private table;
    private config;
    private rowElements;
    private selectedRows;
    constructor(config: TTableConfig);
    private createTable;
    private createHeader;
    private createBody;
    /**
     * Handle row click event
     */
    private handleRowClick;
    /**
     * Select a row by index
     */
    selectRow(rowIndex: number): void;
    /**
     * Unselect a row by index
     */
    unselectRow(rowIndex: number): void;
    /**
     * Clear all selections
     */
    clearSelection(): void;
    /**
     * Update row visual style based on selection state
     */
    private updateRowStyle;
    /**
     * Get selected row indices
     */
    getSelectedRows(): number[];
    /**
     * Get selected row data
     */
    getSelectedRowsData(): unknown[];
    /**
     * Get the table element
     */
    getElement(): HTMLTableElement;
    /**
     * Update table data and redraw
     */
    update(rows: TTableRow[]): void;
    /**
     * Destroy the table
     */
    destroy(): void;
}

export { AbstractCanvas, AbstractDiffHistoryManager, AbstractHistoryStack, AbstractWriterManager, BaseMenuItem, BaseRenderer, BoxOps, ButtonListMenuItem, ButtonMenuItem, Canvas, CanvasEvent, CanvasEventName, CanvasFactory, CanvasLayer, CanvasRenderer, CanvasRendererShape, CanvasRendererStroke, CanvasRendererText, CanvasThemes, CanvasTool, CanvasWriteTool, Chart, CheckboxMenuItem, Circle2d, ClearMenuAction, ClientError, ClientEvent, ClientEventName, CollapsibleWrapper, ColorListMenuItem, ColorPaletteManager, ConnectorConfiguration, ConvertContextMenu, ConvertMenuAction, DEFAULT_ERASER_SIZE_LIST, DEFAULT_FONT_SIZE_LIST, DEFAULT_FONT_WEIGHT_LIST, DEFAULT_MENU_COLORS, DEFAULT_PEN_NIB, DEFAULT_THICKNESS_LIST, DOMFactory, DUPLICATE_OFFSET, DecoratorContextMenu, DecoratorKind, DecoratorUtil, DefaulRecognitionHTTPV1ConfigurationConfiguration, DefaultCanvasTriggerConfiguration, DefaultConnectorConfiguration, DefaultConvertionConfiguration, DefaultDebugConfiguration, DefaultDiagramConfiguration, DefaultDiagramConvertConfiguration, DefaultEraserConfiguration, DefaultExportConfiguration, DefaultGestureConfiguration, DefaultGrabberConfiguration, DefaultGuidesConfiguration, DefaultHTTPClientV1Configuration, DefaultHTTPClientV2Configuration, DefaultHTTPClientV2RecognitionConfiguration, DefaultHistoryConfiguration, DefaultIIRendererConfiguration, DefaultInkCanvasConfiguration, DefaultInkCanvasDeprecatedConfiguration, DefaultInteractiveInkCanvasConfiguration, DefaultInteractiveInkSSRCanvasConfiguration, DefaultJiixConfiguration, DefaultLayoutConfiguration, DefaultListenerConfiguration, DefaultLoggerConfiguration, DefaultMarginConfiguration, DefaultMathConfiguration, DefaultMathUndoRedoConfiguration, DefaultMathV2Configuration, DefaultMenuActionConfig, DefaultMenuConfiguration, DefaultMenuContextConfig, DefaultMenuStyleConfig, DefaultMenuToolConfig, DefaultOverlayConfig, DefaultPenStyle, DefaultRawContentConfiguration, DefaultRawContentV2Configuration, DefaultRecognitionRendererConfiguration, DefaultRecognitionWebSocketConfiguration, DefaultRendererConfiguration, DefaultSelectionConfig, DefaultServerHTTPConfiguration, DefaultServerWebsocketConfiguration, DefaultShapeBeautificationConfiguration, DefaultShapeConfiguration, DefaultShapeConvertConfiguration, DefaultSnapConfiguration, DefaultSolverConfiguration, DefaultStyle, DefaultTexConfigurationV2, DefaultTextConfiguration, DefaultTextGuidesConfiguration, DefaultTextGuidesConfigurationV2, DefaultTheme, DefaultWebSocketClientConfiguration, DefaultWebSocketSSRClientConfiguration, DefaultWebSocketSSRClientRecognitionConfiguration, DeferredPromise, DiagramMenuAction, DuplicateContextMenu, EXPORT_EXTENSIONS, EXPORT_MIME_TYPES, EdgeDecoration, EdgeKind, EdgeTool, EdgeUtil, EditContextMenu, Ellipse2d, EraseManager, EraseTool, EraserOps, ExportContextMenu, ExportManager, ExportMenuAction, ExportType, ExportV2Type, FileInputMenuItem, FillColorStyle, FontSizeStyle, FontWeightStyle, GESTURE_OPERATION_LABELS, GUIDE_PATH_ATTRS, Geometry2d, GestureHandler, GestureHelpers, GestureMenuAction, GuideMenuAction, HIT_TOLERANCE, HTTPClientV1, HTTPClientV1Configuration, HTTPClientV2, HTTPClientV2Configuration, HistoryManager, IDebugSVGManager, IHistoryManager, IIAbstractManager, IIAbstractMenu, IIAbstractTransformManager, IIConnectorManager, IIConversionManager, IIExportManager, IIGestureAnnotationProcessor, IIGestureManager, IIHistoryManager, IIJiixQueryManager, IIKeyboardManager, IIMathCapabilitiesSubManager, IIMathCapabilitiesTable, IIMathComputationSubManager, IIMathDiagnosticChecker, IIMathFunctionEvaluationSubManager, IIMathFunctionEvaluator, IIMathManager, IIMathVariableCanvas, IIMathVariableInputList, IIMathVariablePerBlockCanvas, IIMathVariableSubManager, IIMenuAction, IIMenuContext, IIMenuManager, IIMenuStyle, IIMenuTool, IIModel, IIMoveManager, IIOverlayManager, IIPlaybackManager, IIResizeManager, IIRotationManager, IISelectionManager, IISnapManager, IISynchronizerManager, IITransformManager, IITranslateManager, IITypesetManager, IIWriterManager, IModel, IWriterManager, ImportMenuAction, InkCanvas, InkCanvasConfiguration, InkCanvasDeprecated, InkCanvasDeprecatedConfiguration, InsertAction, InsertGestureHandler, InteractiveInkCanvas, InteractiveInkCanvasConfiguration, InteractiveInkSSRCanvas, InteractiveInkSSRCanvasConfiguration, InteractiveInkSSRSVGRenderer, InteractiveInkSSRSmartGuide, JIIXEdgeKind, JIIXElementType, JIIXMathExpressionType, JIIXNodeKind, JIIXV2ShapeKind, JoinAction, JoinGestureHandler, LAYOUT_SLOTS, LanguageMenuAction, LayoutManager, Logger, LoggerCategory, LoggerLevel, LoggerManager, MATH_SOLVER_DEBOUNCE_MS, MathContextMenu, MathDiagnosticMessages, MathMenuAction, MathUtil, MatrixTransform, Minimap, MinimapMenuAction, Modal, Model, MoveTool, OBBOps, OpacityStyle, OverlayMenuAction, PDFExportManager, PEN_NIBS, PX_TO_MM_RATIO, PathSymbolUtil, PenMenuAction, PenNibStyle, PointSet2d, PointerEventGrabber, PointsGeometry2d, Polygon2d, Polyline2d, RafCoalescer, RangeMenuItem, RemoveContextMenu, ReorderContextMenu, ResizeDirection, SELECTION_PADDING, SOURCE_TYPE_COLORS, SOURCE_TYPE_LABELS, SUB_GUIDE_PATH_ATTRS, SVGBuilder, SVGRenderer, SVGRendererConst, SVGStroker, ScratchGestureHandler, SelectAllContextMenu, SelectMenuItem, SelectTool, SelectionMenuAction, ShapeKind, ShapeTool, ShapeUtil, SnapConfiguration, SnapMenuAction, StrikeThroughAction, StrikeThroughGestureHandler, Stroke, StrokeColorStyle, StrokeUtil, StyleHelper, StyleManager, SubMenuItem, SurroundAction, SurroundGestureHandler, SvgElementRole, SymbolGeometry, SymbolRegistryClass, SymbolStore, SymbolType, SymbolUtil, TESSELLATION_SEGMENT_LENGTH, THEME_STORAGE_KEY, TWO_PI, TWebSocketClientMessageType, Table, TextUtil, ThemeMenuAction, ThicknessStyle, TypesetUtil, UnderlineAction, UnderlineGestureHandler, UndoRedoMenuAction, WebSocketClient, WebSocketClientConfiguration, WebSocketSSRClient, WebSocketSSRClientConfiguration, WriteTool, ZoomMenuAction, appendUpdated, applyInverseMatrixToPoint, applyMatrixToPoint, applyMatrixToPoints, areValidCoordinates, arrowHeadEndMarkerId, arrowHeadStartMarkerId, assertServerConfig, buildButton, buildCanvas, buildCheckbox, buildDiv, buildFileInput, buildH3, buildLabel, buildNumberInput, buildOption, buildOutput, buildP, buildRange, buildSection, buildSelect, buildSpan, buildStyle, buildTBody, buildTHead, buildTable, buildTd, buildTextInput, buildTh, buildTr, bumpSvgTransformVersion, cloneSymbol, computeAngleAxeRadian, computeAngleFromPointOnEllipse, computeAngleRadian, computeAverage, computeChildrenOverlaps, computeClosedEdges, computeDistance, computeDistanceBetweenPointAndSegment, computeDistanceSquared, computeEdgeBounds, computeEllipseArcPoints, computeEllipseRadiusAverage, computeFinalOutlinePoints, computeHmac, computeLineOutlinePoints, computeLinksPointers, computeMiddlePointer, computeNearestPointOnSegment, computeNormalizedAnchor, computeOutlinePointers, computePointOnEllipse, computeQuadraticOutlinePoints, computeRotatedPoint, computeTessellationCount, computeTypesetSnapPoints, computeTypesetVertices, computeWidthProfile, convertBoundingBoxMillimeterToPixel, convertDegreeToRadian, convertMillimeterToPixel, convertPartialStrokesToStrokes, convertPixelToMillimeter, convertRadianToDegree, createMenuItemInstance, createPointsOnSegment, createSymbolFromPartial, createSymbolsFromPartial, createUUID, defineKind, ensureServerVersion, extractEdgeEndpoints, extractIIBackendChanges, extractJIIXGraphElements, extractStrokes, findIntersectBetweenSegmentAndCircle, findIntersectionBetween2Segment, findLabelInside, getApiInfos, getAvailableFontList, getAvailableLanguageList, getBoxConnectionPoint, getClosestPoint, getClosestPoints, getInitialHistoryContext, getJSON, getMathDiagnosticMessage, getSvgTransformVersion, isBetween, isDecorator, isDeepEqual, isDeepEqualIgnoring, isIdentityMatrix, isMath, isPenNib, isPointInsideBox, isPointInsidePolygon, isRecognizedMath, isRecognizedText, isStroke, isStrokeSolverOutput, isText, isValidNumber, isValidPoint, isVersionSuperiorOrEqual, jiixToLLM, jiixToMarkdown, jiixToMermaid, jiixToPlantUML, latexToUnicodeMath, mapCloseCodeToMessage, mapErrorCodeToMessage, mergeDeep, mergeExports, mergeSymbolStyle, mergeSymbolTransform, normalizeAngle, overrideDeep, parseApiError, parseExportedJIIX, parseRecognitionResponse, postRecognition, readHistoryContext, readNibOverrides, redactServerSecrets, registerBuiltinSymbolUtils, reprojectArcEndpoint, reprojectArcMidpoint, resolveAnchorPoint, resolveConnectionAnchors, resolveEdgeNodes, resolveHmac, resolveKind, resolvePointerDelta, resolveStrokeOrigin, roundTo, sanitizeGraphId, scalaire, serverUrl, slotAnchor, slotOpenTowards, slotOrientation, stretchArcEndpoint, supportsRelativeTimestamps, symbolRegistry, toRecognitionContentType, toRecognitionError, toWireStroke, typedKeys, typesetOverlapsBox, uniqueById };
export type { TAllMenuItems, TAnchor, TAnchoredEdgesUpdateResult, TAngleUnit, TApiError, TApiInfos, TAutoVariableManagement, TBaseRendererConfiguration, TBaseSymbol, TBlockTextMetadata, TBox, TButtonElConfig, TCanvasConfiguration, TCanvasConnectionState, TCanvasLayerUI, TCanvasLayerUIState, TCanvasOperationLabel, TCanvasOptionsBase, TCanvasOptionsMap, TCanvasShapeEllipseSymbol, TCanvasShapeLineSymbol, TCanvasShapeTableLineSymbol, TCanvasShapeTableSymbol, TCanvasStateDetail, TCanvasTextSymbol, TCanvasTextUnderlineSymbol, TCanvasTheme, TCanvasTriggerConfiguration, TCanvasType, TCanvasUnderLineSymbol, TCanvasVariantMap, TChartConfig, TCheckboxElConfig, TConnectionStatus, TConnectorConfiguration, TContainerElConfig, TContextDecoratorConfig, TContextDecoratorItemsConfig, TContextExportConfig, TContextExportItemsConfig, TContextMathConfig, TContextMathItemsConfig, TContextReorderConfig, TContextReorderItemsConfig, TConverstionState, TConvertionConfiguration, TDecorator, TDiagramConfiguration, TDiagramConvertConfiguration, TDownloadFormat, TDownloadOptions, TDraft, TEdge, TEdgeArc, TEdgeLine, TEdgePolyLine, TEllipseAxes, TEraser, TEraserConfiguration, TEvaluationResult, TExport, TExportActionConfig, TExportActionItemsConfig, TExportConfiguration, TExportFormat, TExportOptions, TExportResultMap, TExportV2, TExportWire, TExporterMap, TFileInputElConfig, TFollowedStroke, TGenericMenuItem, TGeometry2dOptions, TGesture, TGestureActionConfig, TGestureActionItemsConfig, TGestureAnnotation, TGestureConfiguration, TGestureHandler, TGestureType, TGrabberConfiguration, TGrabberInputMode, TGuideActionConfig, TGuideActionItemsConfig, TGuidesConfiguration, THTTPClientV1Configuration, THTTPClientV1PostConfiguration, THTTPClientV1PostData, THTTPClientV2Configuration, THTTPClientV2PostConfiguration, THTTPClientV2PostData, THTTPClientV2RecognitionConfiguration, THTTPRecognitionRequest, THistoryConfiguration, THistoryContext, THistoryEvent, THittable, THmacSigner, TIHistoryChanges, TIIHistoryBackendChanges, TIIHistoryChanges, TIIHistoryVariableChange, TIIRendererConfiguration, TImageConfiguration, TImageViewportConfiguration, TInkCanvas, TInkCanvasConfiguration, TInkCanvasDeprecatedConfiguration, TInkCanvasDeprecatedOptions, TInkCanvasOptions, TInputElConfig, TInteractiveInkCanvas, TInteractiveInkCanvasConfiguration, TInteractiveInkCanvasOptions, TInteractiveInkSSRCanvasConfiguration, TInteractiveInkSSRCanvasOptions, TInteractiveInkSessionDescriptionMessage, TJIIXBase, TJIIXChar, TJIIXEdgeArc, TJIIXEdgeElement, TJIIXEdgeElementBase, TJIIXEdgeLine, TJIIXEdgePolyEdge, TJIIXElement, TJIIXElementBase, TJIIXExport, TJIIXGraphElements, TJIIXLine, TJIIXMathElement, TJIIXMathExpression, TJIIXMathExpressionBase, TJIIXMathExpressionTypeValue, TJIIXMathFraction, TJIIXMathGroup, TJIIXMathNumber, TJIIXMathOperator, TJIIXMathPower, TJIIXMathRoot, TJIIXMathSquareRoot, TJIIXMathSubscript, TJIIXMathSubsuperscript, TJIIXMathSuperscript, TJIIXMathSymbol, TJIIXMathSymbolExpression, TJIIXMathUnderoverscript, TJIIXMathVariable, TJIIXNodeCircle, TJIIXNodeElement, TJIIXNodeElementBase, TJIIXNodeEllipse, TJIIXNodeParallelogram, TJIIXNodePolygon, TJIIXNodeRectangle, TJIIXNodeRhombus, TJIIXNodeTriangle, TJIIXStrokeItem, TJIIXTextElement, TJIIXV2Base, TJIIXV2Circle, TJIIXV2DrawingElement, TJIIXV2Element, TJIIXV2ElementBase, TJIIXV2Ellipse, TJIIXV2EllipseBase, TJIIXV2Export, TJIIXV2Expression, TJIIXV2Line, TJIIXV2LineSpan, TJIIXV2MathElement, TJIIXV2PolygonBase, TJIIXV2PolygonType, TJIIXV2PrimitiveArc, TJIIXV2PrimitiveLine, TJIIXV2Range, TJIIXV2RangeItem, TJIIXV2RawContentBase, TJIIXV2RawContentElement, TJIIXV2RawContentItemShape, TJIIXV2RawContentItemText, TJIIXV2RawContentShape, TJIIXV2RawContentTextLine, TJIIXV2ShapeArcOfCircle, TJIIXV2ShapeArcOfEllipse, TJIIXV2ShapeCurvedArrow, TJIIXV2ShapeCurvedDoubleArrow, TJIIXV2ShapeElement, TJIIXV2ShapeItemBase, TJIIXV2ShapeLine, TJIIXV2ShapeLineArrow, TJIIXV2ShapeLineDoubleArrow, TJIIXV2ShapeLinePolyline, TJIIXV2ShapeLinePolylineArrow, TJIIXV2ShapeLinePolylineDoubleArrow, TJIIXV2ShapePolygon, TJIIXV2ShapePolygonEquilateralTriangle, TJIIXV2ShapePolygonIsoscelesTriangle, TJIIXV2ShapePolygonParallelogram, TJIIXV2ShapePolygonQuadrilateral, TJIIXV2ShapePolygonRectangle, TJIIXV2ShapePolygonRhombus, TJIIXV2ShapePolygonRightIsoscelesTriangle, TJIIXV2ShapePolygonRightTriangle, TJIIXV2ShapePolygonSquare, TJIIXV2ShapePolygonTrapezoid, TJIIXV2ShapePolygonTriangle, TJIIXV2TextElement, TJIIXWord, TJiixConfiguration, TJiixIndex, TKindDefinition, TLLMContentBlock, TLLMExport, TLabelElConfig, TLayoutConfiguration, TLayoutOccupant, TLayoutOccupantContext, TLayoutOccupantFactory, TLayoutOccupantOptions, TLayoutSlot, TLegacyStroke, TListenerConfiguration, TLoggerConfiguration, TMarginConfiguration, TMath, TMathActionConfig, TMathActionItemsConfig, TMathBlockCapabilities, TMathBlockComputation, TMathComputationConfig, TMathConfig, TMathConfiguration, TMathDependencies, TMathElement, TMathEvaluable, TMathEvaluableFunction, TMathInteractionConfig, TMathMLExport, TMathMLFlavor, TMathResultMode, TMathSelectionLevel, TMathSolverAction, TMathSolverItemsConfig, TMathSolverResultMap, TMathSymbolCapabilities, TMathUndoRedoConfiguration, TMathVariable, TMathVariableDefinition, TMathVariableDefinitionInfo, TMathVariableDefinitions, TMathVariableUsage, TMatrixTransform, TMenuActionConfig, TMenuButton, TMenuButtonList, TMenuCheckbox, TMenuColorList, TMenuConfigUpdate, TMenuConfiguration, TMenuContextConfig, TMenuDirection, TMenuFileInput, TMenuItemBase, TMenuItemFactory, TMenuItemOptions, TMenuItemRegistration, TMenuLayoutConfig, TMenuName, TMenuOrientation, TMenuOverride, TMenuPosition, TMenuRange, TMenuSelect, TMenuStyleConfig, TMenuStyleLayoutConfig, TMenuSubMenu, TMenuToolConfig, TMenuZone, TMergeable, TMinimapOptions, TModalConfig, TModalField, TModalFieldOption, TModalType, TNibOverrides, TNibProfile, TOBB, TOutputElConfig, TOverlayActionConfig, TOverlayActionItemsConfig, TOverlayConfig, TPDFDownloadOptions, TPDFExportDialogOptions, TPDFOrientation, TPDFPageCount, TPDFPageFormat, TPDFPageMode, TPDFPageOptions, TPDFPageSizeMm, TPartialDeep, TPenActionConfig, TPenActionItemsConfig, TPenNib, TPenStyle, TPendingRequest, TPlaybackState, TPoint, TPointer, TPointerImport, TPointerInfo, TRangeElConfig, TRawContentConfiguration, TReadonlyDeep, TRecognitionGesture, TRecognitionHTTPV1Configuration, TRecognitionPointer, TRecognitionPositions, TRecognitionRendererConfiguration, TRecognitionRendererDebugConfiguration, TRecognitionStroke, TRecognitionType, TRecognitionTypeBase, TRecognitionTypeV1, TRecognitionTypeV2, TRecognitionWebSocketConfiguration, TRegisteredMenuItem, TRendererConfiguration, TResizePoint, TRoundingMode, TScheme, TScopingPolicy, TSegment, TSelectElConfig, TSelectElOption, TSelectionActionConfig, TSelectionActionItemsConfig, TSelectionConfig, TServerHTTPConfiguration, TServerWebsocketConfiguration, TShape, TShapeBeautificationConfiguration, TShapeCircle, TShapeConfiguration, TShapeConvertConfiguration, TShapeEllipse, TShapePolygon, TShapeSelectionLevel, TShift, TSmartGuideHost, TSnapActionConfig, TSnapActionItemsConfig, TSnapConfiguration, TSnapLineInfos, TSnapNudge, TSolverConfiguration, TSolverOptions, TSplitOutcome, TStroke, TStrokeCapture, TStrokeGroup, TStrokeGroupToSend, TStrokeImport, TStrokeQueryResult, TStyle, TSubMenuItems, TSymbol, TSymbolChar, TSymbolDiagnostic, TSymbolOrder, TSymbolPatch, TSymbolUpdate, TSymbolVariables, TTableBaseElConfig, TTableCellConfig, TTableCellElConfig, TTableColumn, TTableConfig, TTableRow, TText, TTextConfConfiguration, TTextConfiguration, TTextGuidesConfiguration, TTextGuidesConfigurationV2, TTextHTTPClientV2ConfConfiguration, TTextHTTPClientV2Configuration, TTextSelectionLevel, TTheme, TThemeMath, TThemeMathSolved, TThemeText, TTimedPointerLike, TTransformContext, TTypesetChild, TUndoRedoMode, TUpdatePatch, TUpdatePatchAppendChild, TUpdatePatchInsertBefore, TUpdatePatchRemoveAttribut, TUpdatePatchRemoveChild, TUpdatePatchRemoveElement, TUpdatePatchReplaceAll, TUpdatePatchReplaceELement, TUpdatePatchSetAttribut, TUpdatePatchType, TVariableEncartItem, TVariableInputItem, TWebSocketClientConfiguration, TWebSocketClientConfigurationChanged, TWebSocketClientMessage, TWebSocketClientMessageAck, TWebSocketClientMessageAuthenticated, TWebSocketClientMessageContentChange, TWebSocketClientMessageContextlessGesture, TWebSocketClientMessageError, TWebSocketClientMessageExport, TWebSocketClientMessageGesture, TWebSocketClientMessageHMACChallenge, TWebSocketClientMessageHandlers, TWebSocketClientMessageIdle, TWebSocketClientMessageMathSolver, TWebSocketClientMessageMathSolverAsVariableDefinition, TWebSocketClientMessageMathSolverAvailableActions, TWebSocketClientMessageMathSolverEvaluate, TWebSocketClientMessageMathSolverGetDiagnostic, TWebSocketClientMessageMathSolverGetEvaluables, TWebSocketClientMessageMathSolverGetVariableDefinitions, TWebSocketClientMessageMathSolverGetVariableValue, TWebSocketClientMessageMathSolverGetVariables, TWebSocketClientMessageMathSolverNumericalComputation, TWebSocketClientMessageMathSolverRemoveVariableValue, TWebSocketClientMessageMathSolverResult, TWebSocketClientMessageMathSolverSetVariableValue, TWebSocketClientMessageNewPart, TWebSocketClientMessagePartChange, TWebSocketClientMessagePong, TWebSocketClientMessageReceived, TWebSocketClientMessageReceivedMap, TWebSocketConfigurationCHanged, TWebSocketSSRClientConfiguration, TWebSocketSSRClientMessage, TWebSocketSSRClientMessageAck, TWebSocketSSRClientMessageContentChange, TWebSocketSSRClientMessageContentPackageDescriptionMessage, TWebSocketSSRClientMessageError, TWebSocketSSRClientMessageExport, TWebSocketSSRClientMessageHMACChallenge, TWebSocketSSRClientMessageIdle, TWebSocketSSRClientMessageNewPart, TWebSocketSSRClientMessagePartChange, TWebSocketSSRClientMessagePong, TWebSocketSSRClientMessageReceived, TWebSocketSSRClientMessageReceivedMap, TWebSocketSSRClientMessageSVGPatch, TWebSocketSSRClientRecognitionConfiguration, TWireStroke, TWireStrokeOptions };
//# sourceMappingURL=iink.d.ts.map
