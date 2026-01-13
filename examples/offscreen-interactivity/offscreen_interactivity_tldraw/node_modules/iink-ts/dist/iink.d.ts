/**
 * @group Editor
 * @summary
 * List the possibilities of interactions
 */
declare enum EditorTool {
    Write = "write",
    Erase = "erase",
    /**
     * @remarks only usable in the case of offscreen
     */
    Select = "select",
    /**
     * @remarks only usable in the case of offscreen
     */
    Move = "move"
}
/**
 * @group Editor
 * @summary
 * List all the shapes that can be drawn
 * @remarks
 * only usable in the case of offscreen
 */
declare enum EditorWriteTool {
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
 * @group Renderer
 * @summary
 * List all svg elements roles
 * @remarks
 * only usable in the case of offscreen
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
 * @summary
 * List all svg elements resize direction
 * @remarks
 * only usable in the case of offscreen
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
 * @group Renderer
 */
declare const SELECTION_MARGIN: 10;

/**
 * @group Logger
 */
declare enum LoggerLevel {
    DEBUG = "1",
    INFO = "2",
    WARN = "3",
    ERROR = "4"
}
/**
 * @group Logger
 */
declare enum LoggerCategory {
    EDITOR = "EDITOR",
    RECOGNIZER = "RECOGNIZER",
    GRABBER = "GRABBER",
    GESTURE = "GESTURE",
    EDITOR_EVENT = "EDITOR_EVENT",
    MODEL = "MODEL",
    RENDERER = "RENDERER",
    SMARTGUIDE = "SMARTGUIDE",
    STYLE = "STYLE",
    HISTORY = "HISTORY",
    SYMBOL = "SYMBOL",
    WRITE = "WRITE",
    TRANSFORMER = "TRANSFORMER",
    CONVERTER = "CONVERTER",
    SELECTION = "SELECTION",
    SVGDEBUG = "SVGDEBUG",
    MENU = "MENU"
}
/**
 * @group Logger
 */
declare class Logger {
    category: LoggerCategory;
    level: LoggerLevel;
    constructor(category: LoggerCategory, level: LoggerLevel);
    debug(functionName: string, ...data: any): void;
    info(functionName: string, ...data: any): void;
    warn(functionName: string, ...data: any): void;
    error(functionName: string, ...error: any): void;
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
 * @group Utils
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
 * @group Symbol
 */
type TPoint = {
    x: number;
    y: number;
};
/**
 * @group Symbol
 */
type TPointer = TPoint & {
    t: number;
    p: number;
};
/**
 * @group Symbol
 */
type TSegment = {
    p1: TPoint;
    p2: TPoint;
};
/**
 * @group Symbol
 */
declare function isValidPoint(p?: PartialDeep<TPoint>): boolean;

/**
 * @group Symbol
 */
type TBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};
/**
 * @group Symbol
 */
declare class Box implements TBox {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(boundindBox: TBox);
    static createFromBoxes(boxes: TBox[]): Box;
    static createFromPoints(points: TPoint[]): Box;
    static getCorners(box: TBox): TPoint[];
    static getSide(box: TBox): TPoint[];
    static getCenter(box: TBox): TPoint;
    static getSides(box: TBox): TSegment[];
    static isContained(box: TBox, wrapper: TBox): boolean;
    static containsPoint(box: TBox, point: TPoint): boolean;
    static contains(box: TBox, child: TBox): boolean;
    static overlaps(box1: TBox, box2: TBox): boolean;
    get xMin(): number;
    get xMid(): number;
    get xMax(): number;
    get yMin(): number;
    get yMid(): number;
    get yMax(): number;
    get corners(): TPoint[];
    get center(): TPoint;
    get side(): TPoint[];
    get snapPoints(): TPoint[];
    isContained(wrapper: TBox): boolean;
    contains(child: TBox): boolean;
    containsPoint(point: TPoint): boolean;
    overlaps(boundaries: TBox): boolean;
}

/**
 * @group Style
 * @property {String} color=#000000 Color (supported formats rgb() rgba() hsl() hsla() #rgb #rgba #rrggbb #rrggbbaa)
 * @property {String} width in px

 */
type TStyle = {
    [key: string]: string | number | undefined;
    width: number;
    color: string;
    opacity?: number;
    fill?: string;
};
/**
 * @group Style
 * @source
 */
declare const DefaultStyle: TStyle;

/**
 * @group Style
 * @property {String} -myscript-pen-width=1 Width of strokes and primitives in mm (no other unit is supported yet)
 * @property {String} -myscript-pen-fill-style=none
 * @property {String} -myscript-pen-fill-color=#FFFFFF00 Color filled inside the area delimited by strokes and primitives
 */
type TPenStyle = PartialDeep<TStyle> & {
    "-myscript-pen-width"?: number;
    "-myscript-pen-fill-style"?: string;
    "-myscript-pen-fill-color"?: string;
};
/**
 * @group Style
 * @source
 */
declare const DefaultPenStyle: TPenStyle;

/**
 * @group Style
 */
type TThemeMath = {
    "font-family": string;
};
/**
 * @group Style
 */
type TThemeMathSolved = {
    "font-family": string;
    color: string;
};
/**
 * @group Style
 */
type TThemeText = {
    "font-family": string;
    "font-size": number;
};
/**
 * @group Style
 */
type TTheme = {
    ink: TPenStyle;
    ".math": TThemeMath;
    ".math-solved": TThemeMathSolved;
    ".text": TThemeText;
    [key: string]: unknown;
};
/**
 * @group Style
 * @source
 */
declare const DefaultTheme: TTheme;

/**
 * @group Style
 */
declare const StyleHelper: {
    themeToCSS(json: TTheme): string;
    themeToJSON(style: string): TTheme;
    penStyleToCSS(penStyle: TPenStyle): string;
    penStyleToJSON(penStyleString: string): TPenStyle;
    stringToJSON(style: string): {
        [key: string]: string;
    };
    JSONToString(style: {
        [key: string]: string;
    }): string;
};

/**
 * @group Style
 */
declare class StyleManager {
    #private;
    constructor(penStyle?: PartialDeep<TPenStyle>, theme?: PartialDeep<TTheme>);
    get currentPenStyle(): TPenStyle;
    get penStyle(): TPenStyle;
    setPenStyle(style?: PartialDeep<TPenStyle>): void;
    get theme(): TTheme;
    setTheme(theme?: PartialDeep<TTheme>): void;
    get penStyleClasses(): string;
    setPenStyleClasses(penStyleClass?: string): void;
}

/**
 * @group Symbol
 */
declare enum SymbolType {
    Stroke = "stroke",
    Group = "group",
    Shape = "shape",
    Edge = "edge",
    Text = "text",
    Eraser = "eraser",
    Recognized = "recognized"
}
/**
 * @group Symbol
 */
interface TSymbol {
    id: string;
    creationTime: number;
    modificationDate: number;
    type: string;
    style: PartialDeep<TStyle>;
}

/**
 * @group Symbol
 */
type TCanvasShapeEllipseSymbol = TSymbol & {
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
 */
type TCanvasShapeLineSymbol = TSymbol & {
    firstPoint: TPoint;
    lastPoint: TPoint;
    beginDecoration?: string;
    endDecoration?: string;
    beginTangentAngle: number;
    endTangentAngle: number;
};
/**
 * @group Symbol
 */
type TCanvasShapeTableLineSymbol = {
    p1: TPoint;
    p2: TPoint;
};
/**
 * @group Symbol
 */
type TCanvasShapeTableSymbol = TSymbol & {
    lines: TCanvasShapeTableLineSymbol[];
};
/**
 * @group Symbol
 */
type TCanvasUnderLineSymbol = TSymbol & {
    data: {
        firstCharacter: number;
        lastCharacter: number;
    };
};
/**
 * @group Symbol
 */
type TCanvasTextSymbol = TSymbol & {
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
 */
type TCanvasTextUnderlineSymbol = TCanvasTextSymbol & {
    underlineList: TCanvasUnderLineSymbol[];
};

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
 * @group Symbol
 */
declare class IIDecorator {
    id: string;
    kind: DecoratorKind;
    style: TStyle;
    constructor(kind: DecoratorKind, style: PartialDeep<TStyle>);
    clone(): IIDecorator;
}

/**
 * @group Transform
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
 * @group Transform
 * @remarks Represents a 2D affine transform, defined as a 3x3 matrix with an implicit third raw of <code>[ 0 0 1 ]</code>
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
 * @group Symbol
 */
declare abstract class IISymbolBase<T extends string = SymbolType> implements TSymbol {
    readonly type: T;
    abstract readonly isClosed: boolean;
    style: TStyle;
    id: string;
    creationTime: number;
    modificationDate: number;
    selected: boolean;
    deleting: boolean;
    transform: MatrixTransform;
    constructor(type: T, style?: PartialDeep<TStyle>);
    abstract get vertices(): TPoint[];
    abstract get snapPoints(): TPoint[];
    get edges(): TSegment[];
    abstract overlaps(box: TBox): boolean;
    abstract clone(): IISymbolBase;
    abstract toJSON(): PartialDeep<IISymbolBase>;
    isIntersected(seg: TSegment): boolean;
}

/**
 * @group Symbol
 */
declare enum EdgeKind {
    Line = "line",
    PolyEdge = "polyedge",
    Arc = "arc"
}
/**
 * @group Symbol
 */
declare enum EdgeDecoration {
    Arrow = "arrow-head"
}
/**
 * @group Symbol
 */
declare abstract class OIEdgeBase<K = EdgeKind> extends IISymbolBase<SymbolType.Edge> {
    readonly kind: K;
    readonly isClosed = false;
    startDecoration?: EdgeDecoration;
    endDecoration?: EdgeDecoration;
    constructor(kind: K, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: PartialDeep<TStyle>);
    abstract get vertices(): TPoint[];
    get bounds(): Box;
    get snapPoints(): TPoint[];
    overlaps(box: TBox): boolean;
    abstract clone(): OIEdgeBase;
}

/**
 * @group Symbol
 */
declare class IIEdgeArc extends OIEdgeBase<EdgeKind.Arc> {
    center: TPoint;
    startAngle: number;
    sweepAngle: number;
    radiusX: number;
    radiusY: number;
    phi: number;
    protected _vertices: Map<string, TPoint[]>;
    constructor(center: TPoint, startAngle: number, sweepAngle: number, radiusX: number, radiusY: number, phi: number, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: PartialDeep<TStyle>);
    protected get verticesId(): string;
    protected computedVertices(): TPoint[];
    get vertices(): TPoint[];
    get snapPoints(): TPoint[];
    clone(): IIEdgeArc;
    toJSON(): PartialDeep<IIEdgeArc>;
    static create(partial: PartialDeep<IIEdgeArc>): IIEdgeArc;
}

/**
 * @group Symbol
 */
declare class IIEdgeLine extends OIEdgeBase<EdgeKind.Line> {
    start: TPoint;
    end: TPoint;
    constructor(start: TPoint, end: TPoint, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    clone(): IIEdgeLine;
    toJSON(): PartialDeep<IIEdgeLine>;
    static create(partial: PartialDeep<IIEdgeLine>): IIEdgeLine;
}

/**
 * @group Symbol
 */
declare class IIEdgePolyLine extends OIEdgeBase<EdgeKind.PolyEdge> {
    points: TPoint[];
    constructor(points: TPoint[], startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    clone(): IIEdgePolyLine;
    toJSON(): PartialDeep<IIEdgePolyLine>;
    static create(partial: PartialDeep<IIEdgePolyLine>): IIEdgePolyLine;
}

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
declare abstract class OIShapeBase<K = ShapeKind> extends IISymbolBase<SymbolType.Shape> {
    readonly kind: K;
    readonly isClosed = true;
    constructor(kind: K, style?: PartialDeep<TStyle>);
    get bounds(): Box;
    get snapPoints(): TPoint[];
    overlaps(box: TBox): boolean;
}

/**
 * @group Symbol
 */
declare class IIShapeCircle extends OIShapeBase<ShapeKind.Circle> {
    center: TPoint;
    radius: number;
    protected _vertices: Map<string, TPoint[]>;
    protected _bounds: Map<string, Box>;
    constructor(center: TPoint, radius: number, style?: PartialDeep<TStyle>);
    protected get verticesId(): string;
    protected computedVertices(): TPoint[];
    protected computedBondingBox(): Box;
    get bounds(): Box;
    get vertices(): TPoint[];
    overlaps(box: TBox): boolean;
    clone(): IIShapeCircle;
    toJSON(): PartialDeep<IIShapeCircle>;
    static createBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapeCircle;
    static updateBetweenPoints(circle: IIShapeCircle, origin: TPoint, target: TPoint): IIShapeCircle;
    static create(partial: PartialDeep<IIShapeCircle>): IIShapeCircle;
}

/**
 * @group Symbol
 */
declare class IIShapeEllipse extends OIShapeBase<ShapeKind.Ellipse> {
    center: TPoint;
    radiusX: number;
    radiusY: number;
    orientation: number;
    protected _vertices: Map<string, TPoint[]>;
    constructor(center: TPoint, radiusX: number, radiusY: number, orientation: number, style?: PartialDeep<TStyle>);
    protected get verticesId(): string;
    protected computedVertices(): TPoint[];
    get vertices(): TPoint[];
    overlaps(box: TBox): boolean;
    clone(): IIShapeEllipse;
    toJSON(): PartialDeep<IIShapeEllipse>;
    static createBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapeEllipse;
    static updateBetweenPoints(ellipse: IIShapeEllipse, origin: TPoint, target: TPoint): IIShapeEllipse;
    static create(partial: PartialDeep<IIShapeEllipse>): IIShapeEllipse;
}

/**
 * @group Symbol
 */
declare class IIShapePolygon extends OIShapeBase<ShapeKind.Polygon> {
    points: TPoint[];
    constructor(points: TPoint[], style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    get bounds(): Box;
    clone(): IIShapePolygon;
    toJSON(): PartialDeep<IIShapePolygon>;
    static create(partial: PartialDeep<IIShapePolygon>): IIShapePolygon;
    static createTriangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon;
    static updateTriangleBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon;
    static createParallelogramBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon;
    static updateParallelogramBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon;
    static createRectangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon;
    static updateRectangleBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon;
    static createRhombusBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon;
    static updateRhombusBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon;
}

/**
 * @group Symbol
 */
type TStrokeToSend = {
    id: string;
    pointerType: string;
    x: number[];
    y: number[];
    t: number[];
    p: number[];
};
/**
 * @group Symbol
 */
type TStrokeGroupToSend = {
    penStyle?: string;
    strokes: TStrokeToSend[];
};
/**
 * @group Symbol
 */
type TStroke = TSymbol & {
    style: TPenStyle;
    pointerType: string;
    pointers: TPointer[];
    length: number;
};
/**
 * @group Symbol
 */
type TStrokeGroup = {
    penStyle: TPenStyle;
    strokes: Stroke[];
};
/**
 * @group Symbol
 */
declare class Stroke implements TStroke {
    type: SymbolType;
    id: string;
    creationTime: number;
    modificationDate: number;
    style: TPenStyle;
    pointerType: string;
    pointers: TPointer[];
    length: number;
    constructor(style: TPenStyle, pointerType?: string);
    clone(): Stroke;
    formatToSend(): TStrokeToSend;
}
/**
 * @group Symbol
 * @group Utils
 */
declare function convertPartialStrokesToStrokes(json: PartialDeep<TStroke>[]): Stroke[];

/**
 * @group Symbol
 */
declare class IIStroke extends IISymbolBase<SymbolType.Stroke> {
    readonly isClosed = false;
    pointerType: string;
    length: number;
    decorators: IIDecorator[];
    pointers: Array<TPointer>;
    constructor(style?: PartialDeep<TStyle>, pointerType?: string);
    get bounds(): Box;
    static split(strokeToSplit: IIStroke, i: number): {
        before: IIStroke;
        after: IIStroke;
    };
    static substract(stroke: IIStroke, partStroke: IIStroke): {
        before?: IIStroke;
        after?: IIStroke;
    };
    get snapPoints(): TPoint[];
    get vertices(): TPoint[];
    protected computePressure(distance: number): number;
    protected filterPointByAcquisitionDelta(point: TPointer): boolean;
    addPointer(pointer: TPointer): void;
    overlaps(box: TBox): boolean;
    clone(): IIStroke;
    formatToSend(): TStrokeToSend;
    toJSON(): PartialDeep<IIStroke>;
    static create(partial: PartialDeep<IIStroke>): IIStroke;
}
/**
 * @group Symbol
 * @group Utils
 */
declare function convertPartialStrokesToOIStrokes(json: PartialDeep<TStroke>[]): IIStroke[];

/**
 * @group Symbol
 */
declare enum RecognizedKind {
    Text = "text",
    Line = "line",
    PolyEdge = "polyedge",
    Arc = "arc",
    Circle = "circle",
    Ellipse = "ellipse",
    Polygone = "polygone"
}
/**
 * @group Symbol
 */
declare abstract class IIRecognizedBase<K = RecognizedKind> extends IISymbolBase<SymbolType.Recognized> {
    readonly kind: K;
    strokes: IIStroke[];
    constructor(kind: K, strokes: IIStroke[], style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    get bounds(): Box;
    get snapPoints(): TPoint[];
    updateChildrenStyle(): void;
    overlaps(box: TBox): boolean;
    containsStroke(strokeId: string): boolean;
    removeStrokes(strokeIds: string[]): IIStroke[];
}

/**
 * @group Symbol
 */
declare class IIRecognizedArc extends IIRecognizedBase<RecognizedKind.Arc> {
    readonly isClosed = false;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedArc;
    toJSON(): PartialDeep<IIRecognizedArc>;
    static create(partial: PartialDeep<IIRecognizedArc>): IIRecognizedArc;
}

/**
 * @group Symbol
 */
declare class IIRecognizedCircle extends IIRecognizedBase<RecognizedKind.Circle> {
    readonly isClosed = true;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedCircle;
    toJSON(): PartialDeep<IIRecognizedCircle>;
    static create(partial: PartialDeep<IIRecognizedCircle>): IIRecognizedCircle;
}

/**
 * @group Symbol
 */
declare class IIRecognizedEllipse extends IIRecognizedBase<RecognizedKind.Ellipse> {
    readonly isClosed = true;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedEllipse;
    toJSON(): PartialDeep<IIRecognizedEllipse>;
    static create(partial: PartialDeep<IIRecognizedEllipse>): IIRecognizedEllipse;
}

/**
 * @group Symbol
 */
declare class IIRecognizedLine extends IIRecognizedBase<RecognizedKind.Line> {
    readonly isClosed = false;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedLine;
    toJSON(): PartialDeep<IIRecognizedLine>;
    static create(partial: PartialDeep<IIRecognizedLine>): IIRecognizedLine;
}

/**
 * @group Symbol
 */
declare class IIRecognizedPolyLine extends IIRecognizedBase<RecognizedKind.PolyEdge> {
    readonly isClosed = false;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedPolyLine;
    toJSON(): PartialDeep<IIRecognizedPolyLine>;
    static create(partial: PartialDeep<IIRecognizedPolyLine>): IIRecognizedPolyLine;
}

/**
 * @group Symbol
 */
declare class IIRecognizedPolygon extends IIRecognizedBase<RecognizedKind.Polygone> {
    readonly isClosed = true;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedPolygon;
    toJSON(): PartialDeep<IIRecognizedPolygon>;
    static create(partial: PartialDeep<IIRecognizedPolygon>): IIRecognizedPolygon;
}

/**
 * @group Symbol
 */
declare class IIRecognizedText extends IIRecognizedBase<RecognizedKind.Text> {
    readonly isClosed = false;
    decorators: IIDecorator[];
    baseline: number;
    xHeight: number;
    label?: string;
    constructor(strokes: IIStroke[], lines: {
        baseline: number;
        xHeight: number;
    }, style?: PartialDeep<TStyle>);
    clone(): IIRecognizedText;
    toJSON(): PartialDeep<IIRecognizedText>;
    static create(partial: PartialDeep<IIRecognizedText>): IIRecognizedText;
}

/**
 * @group Symbol
 */
type TIISymbolChar = {
    id: string;
    label: string;
    fontSize: number;
    fontWeight: "normal" | "bold";
    color: string;
    bounds: TBox;
};
/**
 * @group Symbol
 */
declare class IIText extends IISymbolBase<SymbolType.Text> {
    readonly isClosed = true;
    point: TPoint;
    chars: TIISymbolChar[];
    decorators: IIDecorator[];
    bounds: Box;
    rotation?: {
        degree: number;
        center: TPoint;
    };
    constructor(chars: TIISymbolChar[], point: TPoint, bounds: TBox, style?: PartialDeep<TStyle>);
    get label(): string;
    get vertices(): TPoint[];
    get snapPoints(): TPoint[];
    protected getCharCorners(char: TIISymbolChar): TPoint[];
    updateChildrenStyle(): void;
    updateChildrenFont({ fontSize, fontWeight }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold";
    }): void;
    getCharsOverlaps(points: TPoint[]): TIISymbolChar[];
    overlaps(box: TBox): boolean;
    clone(): IIText;
    toJSON(): PartialDeep<IIText>;
    static create(partial: PartialDeep<IIText>): IIText;
}

/**
 * @group Symbol
 */
declare class IISymbolGroup extends IISymbolBase<SymbolType.Group> {
    readonly isClosed = false;
    children: TIISymbol[];
    decorators: IIDecorator[];
    constructor(children: TIISymbol[], style?: PartialDeep<TStyle>);
    get snapPoints(): TPoint[];
    get vertices(): TPoint[];
    get bounds(): Box;
    updateChildrenStyle(): void;
    overlaps(box: TBox): boolean;
    containsSymbol(strokeId: string): boolean;
    containsOnlyStroke(): boolean;
    extractText(): IIText[];
    extractStrokes(): IIStroke[];
    removeChilds(symbolIds: string[]): IISymbolGroup;
    static containsOnlyStroke(group: IISymbolGroup): boolean;
    static extractText(group: IISymbolGroup): IIText[];
    static extractStrokes(group: IISymbolGroup): IIStroke[];
    static containsSymbol(group: IISymbolGroup, symbolId: string): boolean;
    static removeChilds(group: IISymbolGroup, symbolIds: string[]): IISymbolGroup;
    clone(): IISymbolGroup;
    toJSON(): PartialDeep<IISymbolGroup>;
}

/**
 * @group Symbol
 */
declare class IIEraser extends IISymbolBase<SymbolType.Eraser> {
    readonly isClosed = false;
    pointers: TPointer[];
    constructor();
    get bounds(): Box;
    get vertices(): TPoint[];
    get snapPoints(): TPoint[];
    clone(): IISymbolBase;
    overlaps(box: TBox): boolean;
    toJSON(): PartialDeep<IIEraser>;
}

/**
 * @group Symbol
 */
type TIIEdge = IIEdgeArc | IIEdgeLine | IIEdgePolyLine;
/**
 * @group Symbol
 */
type TIIShape = IIShapeCircle | IIShapeEllipse | IIShapePolygon;
/**
 * @group Symbol
 */
type TIIRecognized = IIRecognizedText | IIRecognizedArc | IIRecognizedCircle | IIRecognizedEllipse | IIRecognizedLine | IIRecognizedPolyLine | IIRecognizedPolygon;
/**
 * @group Symbol
 */
type TIISymbol = TIIEdge | TIIShape | IIStroke | IISymbolGroup | IIText | TIIRecognized;

/**
 * @group Utils
 */
declare function computeDistance(p1: TPoint, p2: TPoint): number;
/**
 * @group Utils
 */
declare function computeAngleAxeRadian(begin: TPoint, end: TPoint): number;
/**
 * @group Utils
 */
declare function createPointsOnSegment(p1: TPoint, p2: TPoint, spaceBetweenPoint?: number): TPoint[];
/**
 * @group Utils
 */
declare function scalaire(v1: TPoint, v2: TPoint): number;
/**
 * @group Utils
 */
declare function computeNearestPointOnSegment(p: TPoint, seg: TSegment): TPoint;
/**
 * @group Utils
 */
declare function isPointInsideBox(point: TPoint, box: TBox): boolean;
/**
 * @group Utils
 */
declare function convertRadianToDegree(radian: number): number;
/**
 * @group Utils
 */
declare function convertDegreeToRadian(degree: number): number;
/**
 * @group Utils
 */
declare function computeRotatedPoint(point: TPoint, center: TPoint, radian: number): TPoint;
/**
 * @group Utils
 */
declare function computePointOnEllipse(center: TPoint, radiusX: number, radiusY: number, phi: number, theta: number): TPoint;
/**
 * @group Utils
 */
declare function computeDistanceBetweenPointAndSegment(p: TPoint, seg: TSegment): number;
/**
 * @group Utils
 */
declare function findIntersectionBetween2Segment(seg1: TSegment, seg2: TSegment): TPoint | undefined;
/**
 * @group Utils
 */
declare function findIntersectBetweenSegmentAndCircle(seg: TSegment, c: TPoint, r: number): TPoint[];
/**
 * @group Utils
 */
declare function computeAngleRadian(p1: TPoint, center: TPoint, p2: TPoint): number;
/**
 * @group Utils
 */
declare function getClosestPoints(points1: TPoint[], points2: TPoint[]): {
    p1: TPoint;
    p2: TPoint;
};
/**
 * @group Utils
 */
declare function getClosestPoint(points: TPoint[], point: TPoint): {
    point?: TPoint;
    index: number;
};
/**
 * @group Utils
 */
declare function isPointInsidePolygon(point: TPoint, points: TPoint[]): boolean;

/**
 * @group Utils
 */
declare const isVersionSuperiorOrEqual: (source: string, target: string) => boolean;

/**
 * @group Utils
 */
declare function computeHmac(message: string, applicationKey: string, hmacKey: string): Promise<string>;

/**
 * @group Utils
 */
declare function convertMillimeterToPixel(mm: number): number;
/**
 * @group Utils
 */
declare function convertPixelToMillimeter(px: number): number;
/**
 * @group Utils
 */
declare function convertBoundingBoxMillimeterToPixel(box?: TBox): TBox;

/**
 * @group Utils
 */
declare function createUUID(): string;

/**
 * @group Utils
 */
declare function isValidNumber(x: unknown): boolean;
/**
 * @group Utils
 */
declare function isBetween(val: number, min: number, max: number): boolean;
/**
 * @group Utils
 */
declare function computeAverage(arr: number[]): number;

/**
 * @group Utils
 */
declare const mergeDeep: (target: any, ...sources: any[]) => any;
/**
 * @group Utils
 */
declare const isDeepEqual: (object1: any, object2: any) => boolean;

/**
 * @group Recognizer
 */
type TScheme = "https" | "http";
/**
 * @group Recognizer
 */
type TServerHTTPConfiguration = {
    scheme: TScheme;
    host: string;
    applicationKey: string;
    hmacKey: string | ((applicationKey: string) => Promise<string>);
    version?: string;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultServerHTTPConfiguration: TServerHTTPConfiguration;
/**
 * @group Recognizer
 */
type TServerWebsocketConfiguration = TServerHTTPConfiguration & {
    websocket: {
        pingEnabled: boolean;
        pingDelay: number;
        maxPingLostCount: number;
        autoReconnect: boolean;
        maxRetryCount: number;
        fileChunkSize: number;
    };
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultServerWebsocketConfiguration: TServerWebsocketConfiguration;

/**
 * @group Recognizer
 */
type TEraserConfiguration = {
    "erase-precisely": boolean;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultEraserConfiguration: TEraserConfiguration;

/**
 * @group Recognizer
 */
type TMarginConfiguration = {
    bottom: number;
    left: number;
    right: number;
    top: number;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultMarginConfiguration: TMarginConfiguration;

/**
 * @group Recognizer
 */
type TTextGuidesConfiguration = {
    enable: boolean;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultTextGuidesConfiguration: TTextGuidesConfiguration;
/**
 * @group Recognizer
 */
type TTextConfConfiguration = {
    customResources?: string[];
    customLexicon?: string[];
    addLKText?: boolean;
};
/**
 * @group Recognizer
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
 * @group Recognizer
 * @source
 */
declare const DefaultTextConfiguration: TTextConfiguration;

/**
 * @group Recognizer
 */
type TDiagramConvertConfiguration = {
    types?: ("text" | "shape")[];
    "match-text-size"?: boolean;
};
/**
 * @group Recognizer
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
 * @group Recognizer
 * @source
 */
declare const DefaultDiagramConvertConfiguration: TDiagramConvertConfiguration;
/**
 * @group Recognizer
 * @source
 */
declare const DefaultDiagramConfiguration: TDiagramConfiguration;

/**
 * @group Recognizer
 */
type TImageViewportConfiguration = {
    x: number;
    y: number;
    width: number;
    height: number;
};
/**
 * @group Recognizer
 */
type TImageConfiguration = {
    guides: boolean;
    viewport: TImageViewportConfiguration;
};
/**
 * @group Recognizer
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
 * @group Recognizer
 * @source
 */
declare const DefaultJiixConfiguration: TJiixConfiguration;
/**
 * @group Recognizer
 */
type TMathMLFlavor = {
    name: string;
};
/**
 * @group Recognizer
 */
type TMathMLExport = {
    flavor: TMathMLFlavor;
};
/**
 * @group Recognizer
 */
type TExportConfiguration = {
    "image-resolution"?: number;
    image?: TImageConfiguration;
    jiix: TJiixConfiguration;
    mathml?: TMathMLExport;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultExportConfiguration: TExportConfiguration;

/**
 * @group Recognizer
 */
type TRoundingMode = "half up" | "truncate";
/**
 * @group Recognizer
 */
type TAngleUnit = "deg" | "rad";
/**
 * @group Recognizer
 */
type TSolverOptions = "algebraic" | "numeric";
/**
 * @group Recognizer
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
 * @group Recognizer
 * @source
 */
declare const DefaultSolverConfiguration: TSolverConfiguration;
/**
 * @group Recognizer
 */
type TUndoRedoMode = "stroke" | "session";
/**
 * @group Recognizer
 */
type TMathUndoRedoConfiguration = {
    mode: TUndoRedoMode;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultMathUndoRedoConfiguration: TMathUndoRedoConfiguration;
/**
 * @group Recognizer
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
 * @group Recognizer
 * @source
 */
declare const DefaultMathConfiguration: TMathConfiguration;

/**
 * @group Recognizer
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
 * @group Recognizer
 * @source
 */
declare const DefaultRawContentConfiguration: TRawContentConfiguration;

/**
 * @group Recognizer
 */
type TRecognitionRendererDebugConfiguration = {
    "draw-text-boxes": boolean;
    "draw-image-boxes": boolean;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultDebugConfiguration: TRecognitionRendererDebugConfiguration;
/**
 * @group Recognizer
 */
type TRecognitionRendererConfiguration = {
    debug: TRecognitionRendererDebugConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognitionRendererConfiguration: TRecognitionRendererConfiguration;

/**
 * @group Recognizer
 */
type TTextGuidesConfigurationV2 = {
    enable: boolean;
    "line-gap-mm"?: number;
    "origin-y-mm"?: number;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultTextGuidesConfigurationV2: TTextGuidesConfigurationV2;
/**
 * @group Recognizer
 */
type TTextRecognizerHTTPV2ConfConfiguration = {
    customResources?: string[];
    customLexicon?: string[];
    addLKText?: boolean;
};
/**
 * @group Recognizer
 */
type TTextRecognizerHTTPV2Configuration = {
    text?: boolean;
    mimeTypes: ("text/plain" | "application/vnd.myscript.jiix")[];
    margin: TMarginConfiguration;
    guides: TTextGuidesConfigurationV2;
    configuration?: TTextRecognizerHTTPV2ConfConfiguration;
    eraser?: TEraserConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultTexConfigurationV2: TTextRecognizerHTTPV2Configuration;

/**
 * @group Recognizer
 */
type TConvertionConfiguration = {
    force?: {
        "on-stylesheet-change": boolean;
    };
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultConvertionConfiguration: TConvertionConfiguration;

/**
 * @group Recognizer
 */
type TShapeConvertConfiguration = {
    types?: ("shape")[];
    "match-text-size"?: boolean;
};
type TShapeBeautificationConfiguration = {
    enable?: true;
};
/**
 * @group Recognizer
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
 * @group Recognizer
 * @source
 */
declare const DefaultShapeConvertConfiguration: TShapeConvertConfiguration;
declare const DefaultShapeBeautificationConfiguration: TShapeBeautificationConfiguration;
/**
 * @group Recognizer
 * @source
 */
declare const DefaultShapeConfiguration: TShapeConfiguration;

declare const DefaultMathV2Configuration: TMathConfiguration;

/**
 * @group Recognizer
 * @source
 */
declare const DefaultRawContentV2Configuration: TRawContentConfiguration;

/**
 * @group History
 */
type THistoryContext = {
    canUndo: boolean;
    canRedo: boolean;
    empty: boolean;
    stackIndex: number;
    possibleUndoCount: number;
};
/**
 * @group History
 */
declare const getInitialHistoryContext: () => THistoryContext;

/**
 * @group Exports
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
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix  Element type}
 */
declare enum JIIXELementType {
    Text = "Text",
    Node = "Node",
    Edge = "Edge",
    RawContent = "Raw Content"
}
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#diagram-item-blocks | Element node kind}
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
 * @group Exports
 */
declare enum JIIXEdgeKind {
    Line = "line",
    PolyEdge = "polyedge",
    Arc = "arc"
}
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#stroke-item | Stroke item}
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
 * @group Exports
 */
type TJIIXBase = {
    "bounding-box"?: TBox;
    items?: TJIIXStrokeItem[];
};
/**
 * @group Exports
 */
type TJIIXElementBase<T = string> = TJIIXBase & {
    id: string;
    type: T;
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#word-object | Word object}
 */
type TJIIXWord = TJIIXBase & {
    id?: string;
    label: string;
    candidates?: string[];
    "first-char"?: number;
    "last-char"?: number;
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#character-object | Character object}
 */
type TJIIXChar = TJIIXBase & {
    label: string;
    candidates?: string[];
    word: number;
    grid: TPoint[];
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#text-interpretation | Text Element }
 */
type TJIIXLine = {
    "baseline-y": number;
    "first-char"?: number;
    "last-char"?: number;
    "x-height": number;
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#text-interpretation | Text Element }
 */
type TJIIXTextElement = TJIIXElementBase<JIIXELementType.Text> & {
    id: string;
    "bounding-box"?: TBox;
    label: string;
    words?: TJIIXWord[];
    chars?: TJIIXChar[];
    lines?: TJIIXLine[];
};
/**
 * @group Exports
 */
type TJIIXNodeElementBase<K = string> = TJIIXElementBase<JIIXELementType.Node> & {
    id: string;
    kind: K;
};
/**
 * @group Exports
 */
type TJIIXNodeCircle = TJIIXNodeElementBase<JIIXNodeKind.Circle> & {
    id: string;
    cx: number;
    cy: number;
    r: number;
};
/**
 * @group Exports
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
 * @group Exports
 */
type TJIIXNodeRectangle = TJIIXNodeElementBase<JIIXNodeKind.Rectangle> & {
    id: string;
    height: number;
    width: number;
    x: number;
    y: number;
};
/**
 * @group Exports
 */
type TJIIXNodeTriangle = TJIIXNodeElementBase<JIIXNodeKind.Triangle> & {
    id: string;
    points: number[];
};
/**
 * @group Exports
 */
type TJIIXNodeParrallelogram = TJIIXNodeElementBase<JIIXNodeKind.Parallelogram> & {
    id: string;
    points: number[];
};
/**
 * @group Exports
 */
type TJIIXNodePolygon = TJIIXNodeElementBase<JIIXNodeKind.Polygon> & {
    id: string;
    points: number[];
};
/**
 * @group Exports
 */
type TJIIXNodeRhombus = TJIIXNodeElementBase<JIIXNodeKind.Rhombus> & {
    id: string;
    points: number[];
};
/**
 * @group Exports
 */
type TJIIXNodeElement = TJIIXNodeCircle | TJIIXNodeEllipse | TJIIXNodeRectangle | TJIIXNodeTriangle | TJIIXNodeParrallelogram | TJIIXNodePolygon | TJIIXNodeRhombus;
/**
 * @group Exports
 */
type TJIIXEdgeElementBase<K = string> = TJIIXElementBase<JIIXELementType.Edge> & {
    kind: K;
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#line-item | Element line}
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
 * @group Exports
 */
type TJIIXEdgePolyEdge = TJIIXEdgeElementBase<JIIXEdgeKind.PolyEdge> & {
    edges: TJIIXEdgeLine[];
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#arc-item | Element arc}
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
 * @group Exports
 */
type TJIIXEdgeElement = TJIIXEdgeLine | TJIIXEdgePolyEdge | TJIIXEdgeArc;
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/web/jiix | Exports}
 */
type TJIIXElement = TJIIXTextElement | TJIIXNodeElement | TJIIXEdgeElement;
/**
 * @group Exports
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
 * @group Exports
 * @remarks
 * List all supported MIME types for export.
 *
 * Attention the MIME types supported depend on the {@link TRecognitionType | type of recognition}
 *
 * {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix | Documentation}
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
 * @group Exports
 * @remarks List all supported MIME types for export in RecognizersV2. Please note, the MIME types supported depend on the recognition type configured
 */
declare enum ExportV2Type {
    JIIX = "application/vnd.myscript.jiix",
    TEXT = "text/plain",
    LATEX = "application/x-latex"
}
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix  Element type}
 */
/**
 * @group Exports
*/
type JIIXV2RangeItem = {
    from: {
        stroke: number;
    };
    to: {
        stroke: number;
    };
};
/**
 * @group Exports
 * @remarks Only in InkRecognizer () activated with recognition.export.JIIXV2.range = true
 */
type JIIXV2Range = JIIXV2RangeItem[];
/**
 * @group Exports
 */
type JIIXV2Base = TJIIXBase & {
    range?: JIIXV2Range;
};
/**
 * @group Exports
 */
type JIIXV2ElementBase<T = TRecognitionV2Type> = JIIXV2Base & {
    id: string;
    type: T;
};
/**
 * @group Exports
 */
type JIIXV2LineSpan = {
    type: string;
    range: JIIXV2RangeItem[];
    label: string;
};
/**
 * @group Exports
 */
type JIIXV2Line = {
    type: string;
    range: JIIXV2RangeItem[];
    label: string;
    spans: JIIXV2LineSpan[];
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#word-object | Word object}
 */
type JIIXV2Expression = JIIXV2Base & TJIIXWord & {
    lines: JIIXV2Line[];
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix#text-interpretation | Text Element }
 */
type JIIXV2TextElement = JIIXV2ElementBase<"Text"> & JIIXV2Expression;
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix#text-interpretation | Math Element }
 */
type JIIXV2MathElement = JIIXV2ElementBase<"Math"> & JIIXV2Expression;
/** @group Exports
 */
type JIIXV2DrawingElement = JIIXV2ElementBase<"Drawing"> & JIIXV2Expression;
/**
 * @group Exports
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
   * @group Exports
   */
type JIIXV2PolygonType = "triangle" | "isosceles triangle" | "right triangle" | "right isosceles triangle" | "equilateral triangle" | "quadrilateral" | "trapezoid" | "parallelogram" | "rhombus" | "rectangle" | "square";
/**
   * @group Exports
   */
type JIIXV2ShapeItemBase<K = JIIXV2ShapeKind> = JIIXV2ElementBase<K> & {
    kind: K;
};
/**
 * @group Exports
 */
type JIIXV2EllipseBase<K = JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle> = JIIXV2ShapeItemBase<JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle> & {
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
 * @group Exports
 */
type JIIXV2Circle = JIIXV2EllipseBase<JIIXV2ShapeKind.Circle>;
/**
 * @group Exports
 */
type JIIXV2Ellipse = JIIXV2EllipseBase<JIIXV2ShapeKind.Ellipse>;
/**
 * @group Exports
 */
type JIIXV2PrimitiveArc = {
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
 * @group Exports
 */
type JIIXV2PrimitiveLine = {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    startDecoration?: string;
    endDecoration?: string;
};
/**
 * @group Exports
 */
type JIIXV2PolygonBase<K = JIIXV2PolygonType> = JIIXV2ShapeItemBase<K> & {
    kind: K;
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapePolygon = JIIXV2PolygonBase<JIIXV2ShapeKind.Polygon>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.Triangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonIsoscelesTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.IsoscelesTriangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonRightTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.RightTriangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonRightIsoscelesTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.RightIsoscelesTriangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonEquilateralTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.EquilateralTriangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonQuadrilateral = JIIXV2PolygonBase<JIIXV2ShapeKind.Quadrilateral>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonTrapezoid = JIIXV2PolygonBase<JIIXV2ShapeKind.Trapezoid>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonParallelogram = JIIXV2PolygonBase<JIIXV2ShapeKind.Parallelogram>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonRhombus = JIIXV2PolygonBase<JIIXV2ShapeKind.Rhombus>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonRectangle = JIIXV2PolygonBase<JIIXV2ShapeKind.Rectangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonSquare = JIIXV2PolygonBase<JIIXV2ShapeKind.Square>;
/**
 * @group Exports
 */
type JIIXV2ShapeLine = JIIXV2ShapeItemBase<JIIXV2ShapeKind.Line> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeLineArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.Arrow> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeLineDoubleArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.DoubleArrow> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeLinePolyline = JIIXV2ShapeItemBase<JIIXV2ShapeKind.PolyLine> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeLinePolylineArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineArrow> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeLinePolylineDoubleArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineDoubleArrow> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeCurvedDoubleArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedDoubleArrow> & {
    primitives: JIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeCurvedArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedArrow> & {
    primitives: JIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeArcOfEllipse = JIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfEllipse> & {
    primitives: JIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeArcOfCircle = JIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfCircle> & {
    primitives: JIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeElement = JIIXV2Circle | JIIXV2Ellipse | JIIXV2ShapePolygon | JIIXV2ShapePolygonTriangle | JIIXV2ShapePolygonIsoscelesTriangle | JIIXV2ShapePolygonRightTriangle | JIIXV2ShapePolygonRightIsoscelesTriangle | JIIXV2ShapePolygonEquilateralTriangle | JIIXV2ShapePolygonQuadrilateral | JIIXV2ShapePolygonTrapezoid | JIIXV2ShapePolygonParallelogram | JIIXV2ShapePolygonRhombus | JIIXV2ShapePolygonRectangle | JIIXV2ShapePolygonSquare | JIIXV2ShapeLineArrow | JIIXV2ShapeLineDoubleArrow | JIIXV2ShapeLinePolyline | JIIXV2ShapeLinePolylineArrow | JIIXV2ShapeLinePolylineDoubleArrow | JIIXV2ShapeCurvedDoubleArrow | JIIXV2ShapeCurvedArrow | JIIXV2ShapeArcOfEllipse | JIIXV2ShapeArcOfCircle | JIIXV2ShapeLine;
/**
 * @group Exports
 * @remarks Only in InkRecognizer () activated with recognition.export.JIIXV2.range = true
 */
type JIIXV2RawContentBase<T = TRecognitionV2Type> = {
    type: T;
    range?: JIIXV2Range;
};
/**
 * @group Exports
 */
type JIIXV2RawContentItemText = JIIXV2RawContentBase<"Text"> & JIIXV2Expression;
/**
 * @group Exports
 */
type JIIXV2RawContentTextLine = {
    type: "Line";
    label: string;
    range?: JIIXV2RangeItem;
};
/**
 * @group Exports
 */
type JIIXV2RawContentShape = JIIXV2RawContentBase<"Shape"> & {
    label: string;
    shape: JIIXV2RawContentItemShape[];
};
/**
 * @group Exports
 */
type JIIXV2RawContentItemShape = JIIXV2RawContentBase<"Shape"> & {
    range: JIIXV2RangeItem[];
    elements: JIIXV2ShapeElement[];
};
type JIIXV2RawContentElement = JIIXV2RawContentItemText | JIIXV2RawContentItemShape;
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/web/JIIXV2 | Exports}
 */
type JIIXV2Element = JIIXV2TextElement | JIIXV2ShapeElement | JIIXV2MathElement | JIIXV2DrawingElement | JIIXV2RawContentElement;
/**
 * @group Exports
 */
type JIIXV2Export = JIIXV2Base & {
    type: string;
    id: string;
    version: string;
    elements?: JIIXV2Element[];
    label?: string;
    words?: JIIXV2Expression[];
};
/**
 * @group Exports
 * @remarks
 * List all supported MIME types for export.
 *
 * Attention the MIME types supported depend on the {@link TRecognitionType | type of recognition}
 *
 * {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/JIIXV2 | Documentation}
 */
type TExportV2 = {
    /** @hidden */
    [key: string]: unknown;
    /**
     * @remarks vnd.myscript.jiix is used for text and raw-content exports
     */
    "application/vnd.myscript.jiix"?: JIIXV2Export;
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
    idle: boolean;
    constructor(width?: number, height?: number, rowHeight?: number, creationDate?: number);
    protected computePressure(distance: number, globalDistance: number): number;
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
 * @group Model
 */
declare class IIModel {
    #private;
    readonly creationTime: number;
    modificationDate: number;
    currentSymbol?: TIISymbol;
    symbols: TIISymbol[];
    exports?: TExport;
    converts?: TExport;
    width: number;
    height: number;
    rowHeight: number;
    idle: boolean;
    constructor(width?: number, height?: number, rowHeight?: number, creationDate?: number);
    get symbolsSelected(): TIISymbol[];
    get symbolsToDelete(): TIISymbol[];
    selectSymbol(id: string): void;
    unselectSymbol(id: string): void;
    resetSelection(): void;
    getRootSymbol(id: string): TIISymbol | undefined;
    getSymbolRowIndex(symbol: TIISymbol): number;
    getSymbolsByRowOrdered(): {
        rowIndex: number;
        symbols: TIISymbol[];
    }[];
    roundToLineGuide(y: number): number;
    isSymbolAbove(source: TIISymbol, target: TIISymbol): boolean;
    isSymbolInRow(source: TIISymbol, target: TIISymbol): boolean;
    isSymbolBelow(source: TIISymbol, target: TIISymbol): boolean;
    getFirstSymbol(symbols: TIISymbol[]): TIISymbol | undefined;
    getLastSymbol(symbols: TIISymbol[]): TIISymbol | undefined;
    addSymbol(symbol: TIISymbol): void;
    updateSymbol(updatedSymbol: TIISymbol): void;
    replaceSymbol(id: string, symbols: TIISymbol[]): void;
    changeOrderSymbol(id: string, position: "first" | "last" | "forward" | "backward"): void;
    removeSymbol(id: string): void;
    extractDifferenceSymbols(model: IIModel): {
        added: TIISymbol[];
        removed: TIISymbol[];
    };
    mergeExport(exports: TExport): void;
    clone(): IIModel;
    clear(): void;
}

/**
 * @group Model
 */
declare class IModel {
    #private;
    readonly creationTime: number;
    modificationDate: number;
    currentStroke?: IIStroke;
    strokes: IIStroke[];
    exports?: TExportV2;
    converts?: TExportV2;
    width: number;
    height: number;
    rowHeight: number;
    idle: boolean;
    constructor(width?: number, height?: number, rowHeight?: number, creationDate?: number);
    get strokesToDelete(): IIStroke[];
    addStroke(stroke: IIStroke): void;
    updateStroke(updatedStroke: IIStroke): void;
    removeStroke(id: string): void;
    extractDifferenceStrokes(model: IModel): {
        added: IIStroke[];
        removed: IIStroke[];
    };
    mergeExport(exports: TExportV2): void;
    clone(): IModel;
    clear(): void;
}

/**
 * @group Gesture
 * @summary List all authorized gestures
 */
type TGestureType = "UNDERLINE" | "SCRATCH" | "JOIN" | "INSERT" | "STRIKETHROUGH" | "SURROUND";
/**
 * @group Gesture
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
 * @group Gesture
 * @summary
 * List all action allowed on surround detected
 * @remarks
 * only usable in the case of offscreen
 */
declare enum SurroundAction {
    Select = "select",
    Surround = "surround",
    Highlight = "highlight"
}
/**
 * @group Gesture
 * @summary
 * List all action allowed on strikeThrough detected
 * @remarks
 * only usable in the case of offscreen
 */
declare enum StrikeThroughAction {
    Erase = "erase",
    Draw = "draw"
}
/**
 * @group Gesture
 * @summary
 * List all action allowed on split detected
 * @remarks
 * only usable in the case of offscreen
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
 * @group Gesture
 * @source
 */
type TGestureConfiguration = {
    surround: SurroundAction;
    strikeThrough: StrikeThroughAction;
    insert: InsertAction;
};
/**
 * @group Gesture
 * @source
 */
declare const DefaultGestureConfiguration: TGestureConfiguration;

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
    protected phi(angle: number): number;
    protected drawEllipseArc(context2D: CanvasRenderingContext2D, shapeEllipse: TCanvasShapeEllipseSymbol): TPoint[];
    protected drawLine(context2D: CanvasRenderingContext2D, p1: TPoint, p2: TPoint): void;
    protected drawArrowHead(context2D: CanvasRenderingContext2D, headPoint: TPoint, angle: number, length: number): void;
    protected drawShapeEllipse(context2D: CanvasRenderingContext2D, shapeEllipse: TCanvasShapeEllipseSymbol): void;
    protected drawShapeLine(context2D: CanvasRenderingContext2D, shapeLine: TCanvasShapeLineSymbol): void;
    draw(context2D: CanvasRenderingContext2D, symbol: TSymbol): void;
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
    draw(context2D: CanvasRenderingContext2D, symbol: TSymbol): void;
}

/**
 * @group Renderer
 */
declare class CanvasRenderer {
    #private;
    configuration: Omit<TRendererConfiguration, "guides">;
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
    protected drawSymbol(context2D: CanvasRenderingContext2D, symbol: TSymbol): void;
    init(element: HTMLElement, guide?: {
        x?: number;
        y?: number;
    }): void;
    drawModel(model: Model): void;
    drawPendingStroke(stroke: Stroke | undefined): void;
    resize(model: Model): void;
    destroy(): void;
}

/**
 * @group Renderer
 */
declare class SVGRenderer {
    #private;
    groupGuidesId: string;
    configuration: TIIRendererConfiguration;
    parent: HTMLElement;
    layer: SVGSVGElement;
    definitionGroup: SVGGElement;
    verticalGuides: number[];
    horizontalGuides: number[];
    constructor(configuration: TIIRendererConfiguration);
    protected initLayer(): void;
    protected createDefs(): SVGDefsElement;
    protected createFilters(): SVGGElement;
    protected drawGuides(): void;
    protected removeGuides(): void;
    protected createSVGTools(): SVGGElement;
    init(element: HTMLElement): void;
    getAttribute(id: string, name: string): string | undefined | null;
    setAttribute(id: string, name: string, value: string): void;
    buildElementFromSymbol(symbol: TIISymbol | IIEraser): SVGGraphicsElement | undefined;
    prependElement(el: Element): void;
    changeOrderSymbol(symbolToMove: TIISymbol, position: "first" | "last" | "forward" | "backward"): void;
    appendElement(el: Element): void;
    removeElement(id: string): void;
    drawSymbol(symbol: TIISymbol | IIEraser): SVGGraphicsElement | undefined;
    replaceSymbol(id: string, symbols: TIISymbol[]): SVGGraphicsElement[] | undefined;
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
    destroy(): void;
}

/**
 * @group Renderer
 */
declare const SVGRendererConst: {
    arrowHeadStartMarker: string;
    arrowHeadEndMaker: string;
    selectionFilterId: string;
    removalFilterId: string;
    crossMarker: string;
    noSelection: string;
};

/**
 * @group Renderer
 */
declare class SVGRendererDecoratorUtil {
    static getSVGElement(decorator: IIDecorator, symbol: TIISymbol): SVGGeometryElement | undefined;
}

/**
 * @group Renderer
 */
declare class SVGRendererEdgeUtil {
    static getLinePath(line: IIEdgeLine): string;
    static getPolyLinePath(line: IIEdgePolyLine): string;
    static getArcPath(arc: IIEdgeArc): string;
    static getSVGPath(edge: TIIEdge): string;
    static getSVGElement(edge: TIIEdge): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererEraserUtil {
    static getSVGPath(eraser: IIEraser): string;
    static getSVGElement(eraser: IIEraser): SVGPathElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererGroupUtil {
    static getChildElement(symbol: TIISymbol | IIEraser): SVGGraphicsElement | undefined;
    static getSVGElement(symbolGroup: IISymbolGroup): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererTextUtil {
    static getSVGElement(text: IIText): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererShapeUtil {
    static getPolygonePath(polygon: IIShapePolygon): string;
    static getCirclePath(circle: IIShapeCircle): string;
    static getEllipsePath(ellipse: IIShapeEllipse): string;
    static getSVGPath(shape: TIIShape): string;
    static getSVGElement(shape: TIIShape): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererStrokeUtil {
    protected static getArcPath(center: TPointer, radius: number): string;
    protected static getLinePath(begin: TPointer, end: TPointer, width: number): string;
    protected static getFinalPath(begin: TPointer, end: TPointer, width: number): string;
    protected static getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string;
    static getSVGPath(stroke: IIStroke): string;
    static getSVGElement(stroke: IIStroke): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererRecognizedUtil {
    static getSVGElement(recognizedSymbol: TIIRecognized): SVGGraphicsElement;
}

/**
 * @group Renderer
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
    static createComponentTransfert(): SVGFEComponentTransferElement;
    static createDropShadow({ dx, dy, deviation, color, opacity }: {
        dx?: number | undefined;
        dy?: number | undefined;
        deviation?: number | undefined;
        color?: string | undefined;
        opacity?: number | undefined;
    }): SVGFEDropShadowElement;
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
    static createForeignObject(box: TBox, node: HTMLElement, attrs?: {
        [key: string]: string;
    }): SVGForeignObjectElement;
    static createText(p: TPoint, text: string, attrs?: {
        [key: string]: string;
    }): SVGTextElement;
}

/**
 * @group Renderer
 */
declare class SVGStroker {
    protected getArcPath(center: TPointer, radius: number): string;
    protected getLinePath(begin: TPointer, end: TPointer, width: number): string;
    protected getFinalPath(begin: TPointer, end: TPointer, width: number): string;
    protected getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string;
    protected buildSVGPath(stroke: TStroke): string;
    drawStroke(svgElement: SVGElement, stroke: TStroke, attrs?: {
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
    protected drawStroke(svgElement: SVGElement, stroke: TStroke): void;
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
    drawPendingStroke(stroke: TStroke): void;
    clearErasingStrokes(): void;
    resize(model: Model): void;
    destroy(): void;
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
 * @group Grabber
 */
type TGrabberConfiguration = {
    listenerOptions: TListenerConfiguration;
    xyFloatPrecision: number;
    timestampFloatPrecision: number;
    delayLongTouch: number;
};
/**
 * @group Grabber
 * @source
 */
declare const DefaultGrabberConfiguration: TGrabberConfiguration;

type PointerInfo = {
    clientX: number;
    clientY: number;
    isPrimary: boolean;
    type: string;
    pointerType: string;
    target: HTMLElement;
    pointer: TPointer;
    button: number;
    buttons: number;
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
    onPointerDown?: (info: PointerInfo) => void;
    onPointerMove?: (info: PointerInfo) => void;
    onPointerUp?: (info: PointerInfo) => void;
    onContextMenu?: (info: PointerInfo) => void;
    constructor(configuration: TGrabberConfiguration);
    protected roundFloat(oneFloat: number, requestedFloatPrecision: number): number;
    protected extractPointer(event: MouseEvent | TouchEvent): TPointer;
    protected getPointerInfos(evt: PointerEvent): PointerInfo;
    protected pointerDownHandler: (evt: PointerEvent) => void;
    protected pointerMoveHandler: (evt: PointerEvent) => void;
    protected pointerUpHandler: (evt: PointerEvent) => void;
    protected pointerOutHandler: (evt: PointerEvent) => void;
    protected contextMenuHandler: (evt: MouseEvent) => void;
    stopPointerEvent(): void;
    attach(layerCapture: HTMLElement): void;
    detach(): void;
}

/**
 * @group Manager
 */
declare abstract class AbstractWriterManager {
    #private;
    grabber: PointerEventGrabber;
    editor: InteractiveInkEditor | InkEditor;
    currentSymbol?: TIISymbol;
    detectGesture: boolean;
    constructor(editor: InteractiveInkEditor | InkEditor);
    get renderer(): SVGRenderer;
    attach(layer: HTMLElement): void;
    detach(): void;
    protected abstract createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TIISymbol;
    protected abstract updateCurrentSymbol(pointer: TPointer): TIISymbol;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): void;
    abstract end(info: PointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
declare class IIConversionManager {
    #private;
    editor: InteractiveInkEditor;
    constructor(editor: InteractiveInkEditor);
    get configuration(): {
        size: number | "auto";
        weight: "bold" | "normal" | "auto";
    };
    get model(): IIModel;
    get rowHeight(): number;
    protected computeFontSize(chars: TJIIXChar[]): number;
    buildChar(char: TJIIXChar, strokes: IIStroke[], fontSize: number): TIISymbolChar;
    buildText(word: TJIIXWord, chars: TJIIXChar[], strokes: IIStroke[], size: number | "auto"): IIText;
    convertText(text: TJIIXTextElement, strokes: IIStroke[], onlyText: boolean): {
        symbol: IIText;
        strokes: IIStroke[];
    }[] | undefined;
    buildCircle(circle: TJIIXNodeCircle, strokes: IIStroke[]): IIShapeCircle;
    buildEllipse(ellipse: TJIIXNodeEllipse, strokes: IIStroke[]): IIShapeEllipse;
    buildRectangle(rectangle: TJIIXNodeRectangle, strokes: IIStroke[]): IIShapePolygon;
    buildPolygon(polygon: TJIIXNodePolygon, strokes: IIStroke[]): IIShapePolygon;
    buildRhombus(polygon: TJIIXNodeRhombus, strokes: IIStroke[]): IIShapePolygon;
    buildTriangle(polygon: TJIIXNodeTriangle, strokes: IIStroke[]): IIShapePolygon;
    buildParallelogram(polygon: TJIIXNodeParrallelogram, strokes: IIStroke[]): IIShapePolygon;
    convertNode(node: TJIIXNodeElement, strokes: IIStroke[]): {
        symbol: TIIShape;
        strokes: IIStroke[];
    } | undefined;
    buildLine(line: TJIIXEdgeLine, strokes: IIStroke[]): IIEdgeLine;
    buildPolyEdge(polyline: TJIIXEdgePolyEdge, strokes: IIStroke[]): IIEdgePolyLine;
    buildArc(arc: TJIIXEdgeArc, strokes: IIStroke[]): IIEdgeArc;
    convertEdge(edge: TJIIXEdgeElement, strokes: IIStroke[]): {
        symbol: TIIEdge;
        strokes: IIStroke[];
    } | undefined;
    apply(symbols?: TIISymbol[]): Promise<void>;
}

/**
 * @group Manager
 */
declare class IIResizeManager {
    #private;
    editor: InteractiveInkEditor;
    interactElementsGroup?: SVGElement;
    direction: ResizeDirection;
    boundingBox: Box;
    transformOrigin: TPoint;
    keepRatio: boolean;
    constructor(editor: InteractiveInkEditor);
    get model(): IIModel;
    protected applyToStroke(stroke: IIStroke, origin: TPoint, scaleX: number, scaleY: number): IIStroke;
    protected applyToShape(shape: TIIShape, origin: TPoint, scaleX: number, scaleY: number): TIIShape;
    protected applyToEdge(edge: TIIEdge, origin: TPoint, scaleX: number, scaleY: number): TIIEdge;
    protected applyOnText(text: IIText, origin: TPoint, scaleX: number, scaleY: number): IIText;
    protected applyOnGroup(group: IISymbolGroup, origin: TPoint, scaleX: number, scaleY: number): IISymbolGroup;
    protected applyOnRecognizedSymbol(recognizedSymbol: TIIRecognized, origin: TPoint, scaleX: number, scaleY: number): TIIRecognized;
    applyToSymbol(symbol: TIISymbol, origin: TPoint, scaleX: number, scaleY: number): TIISymbol;
    setTransformOrigin(id: string, originX: number, originY: number): void;
    scaleElement(id: string, sx: number, sy: number): void;
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
declare class IIRotationManager {
    #private;
    editor: InteractiveInkEditor;
    interactElementsGroup?: SVGElement;
    center: TPoint;
    origin: TPoint;
    constructor(editor: InteractiveInkEditor);
    get model(): IIModel;
    protected applyToStroke(stroke: IIStroke, center: TPoint, angleRad: number): IIStroke;
    protected applyToShape(shape: TIIShape, center: TPoint, angleRad: number): TIIShape;
    protected applyToEdge(edge: TIIEdge, center: TPoint, angleRad: number): TIIEdge;
    protected applyOnText(text: IIText, center: TPoint, angleRad: number): IIText;
    protected applyOnGroup(group: IISymbolGroup, center: TPoint, angleRad: number): IISymbolGroup;
    protected applyOnRecognizedSymbol(strokeText: TIIRecognized, center: TPoint, angleRad: number): TIIRecognized;
    applyToSymbol(symbol: TIISymbol, center: TPoint, angleRad: number): TIISymbol;
    setTransformOrigin(id: string, originX: number, originY: number): void;
    rotateElement(id: string, degree: number): void;
    start(target: Element, origin: TPoint): void;
    continue(point: TPoint): number;
    end(point: TPoint): Promise<void>;
}

/**
 * @group Manager
 */
declare class IISelectionManager {
    #private;
    grabber: PointerEventGrabber;
    editor: InteractiveInkEditor;
    startSelectionPoint?: TPoint;
    endSelectionPoint?: TPoint;
    selectedGroup?: SVGGElement;
    constructor(editor: InteractiveInkEditor);
    get model(): IIModel;
    get renderer(): SVGRenderer;
    get rotator(): IIRotationManager;
    get translator(): IITranslateManager;
    get resizer(): IIResizeManager;
    get selectionBox(): Box | undefined;
    attach(layer: HTMLElement): void;
    detach(): void;
    drawSelectingRect(box: TBox): void;
    clearSelectingRect(): void;
    protected getPoint(ev: PointerEvent): TPoint;
    protected createTranslateRect(box: TBox): SVGRectElement;
    protected createRotateGroup(box: TBox): SVGGElement;
    protected createResizeGroup(box: TBox): SVGGElement;
    protected createInteractElementsGroup(symbols: TIISymbol[]): SVGGElement | undefined;
    protected createEdgeResizeGroup(edge: TIIEdge): SVGGElement;
    protected createInteractEdgeGroup(edge: TIIEdge): SVGGElement | undefined;
    drawSelectedGroup(symbols: TIISymbol[]): void;
    resetSelectedGroup(symbols: TIISymbol[]): void;
    removeSelectedGroup(): void;
    hideInteractElements(): void;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): TIISymbol[];
    end(info: PointerInfo): TIISymbol[];
    protected onContextMenu(info: PointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
declare class IITextManager {
    #private;
    editor: InteractiveInkEditor;
    constructor(editor: InteractiveInkEditor);
    get renderer(): SVGRenderer;
    get rowHeight(): number;
    get model(): IIModel;
    protected drawSymbolHidden(text: IIText): SVGGElement;
    setCharsBounds(text: IIText, textGroupEl: SVGGElement): IIText;
    setBounds(text: IIText): void;
    getElementBoundingBox(textElement: SVGElement): Box;
    getBoundingBox(text: IIText): Box;
    getSpaceWidth(fontSize: number): number;
    updateBounds(textSymbol: IIText): IIText;
    moveTextAfter(text: IIText, tx: number): TIISymbol[] | undefined;
}

/**
 * @group Snap
 */
type TSnapConfiguration = {
    guide: boolean;
    symbol: boolean;
    angle: number;
};
/**
 * @group Snap
 * @source
 */
declare const DefaultSnapConfiguration: TSnapConfiguration;
/**
 * @group Snap
 */
declare class SnapConfiguration implements TSnapConfiguration {
    guide: boolean;
    symbol: boolean;
    angle: number;
    constructor(config?: PartialDeep<TSnapConfiguration>);
}

/**
 * @group Snap
 */
type TSnapNudge = TPoint;
/**
 * @group Snap
 */
type TSnapLineInfos = {
    nudge: TSnapNudge;
    verticales: TSegment[];
    horizontales: TSegment[];
};
/**
 * @group Snap
 */
declare class IISnapManager {
    #private;
    editor: InteractiveInkEditor;
    configuration: SnapConfiguration;
    constructor(editor: InteractiveInkEditor, config?: PartialDeep<TSnapConfiguration>);
    get model(): IIModel;
    get renderer(): SVGRenderer;
    get selectionSnapPoints(): TPoint[];
    get otherSnapPoints(): TPoint[];
    get snapThreshold(): number;
    protected getNearestVerticalGuide(x: number): number;
    protected getNearestHorizontalGuide(y: number): number;
    protected getGuidePointToSnap(point: TPoint): TPoint;
    drawSnapToElementLines(lines: TSegment[]): void;
    clearSnapToElementLines(): void;
    protected getSnapLinesInfos(sourcePoints: TPoint[], targetPoints: TPoint[]): TSnapLineInfos;
    snapResize(point: TPoint, horizontal?: boolean, vertical?: boolean): TPoint;
    snapTranslate(tx: number, ty: number): TSnapNudge;
    snapRotation(angleDegree: number): number;
}

/**
 * @group Manager
 */
declare class IIWriterManager extends AbstractWriterManager {
    #private;
    detectGesture: boolean;
    editor: InteractiveInkEditor;
    currentSymbolOrigin?: TPoint;
    constructor(editor: InteractiveInkEditor);
    get tool(): EditorWriteTool;
    set tool(wt: EditorWriteTool);
    get model(): IIModel;
    get renderer(): SVGRenderer;
    get history(): IIHistoryManager;
    get gestureManager(): IIGestureManager;
    get snaps(): IISnapManager;
    get recognizer(): RecognizerWebSocket;
    attach(layer: HTMLElement): void;
    detach(): void;
    protected needContextLessGesture(stroke: IIStroke): boolean;
    protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TIISymbol;
    protected updateCurrentSymbolShape(pointer: TPointer): void;
    protected updateCurrentSymbolEdge(pointer: TPointer): void;
    protected updateCurrentSymbol(pointer: TPointer): TIISymbol;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): void;
    protected interactWithBackend(stroke: IIStroke): Promise<void>;
    end(info: PointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
declare class IIDebugSVGManager {
    #private;
    editor: InteractiveInkEditor;
    constructor(editor: InteractiveInkEditor);
    get model(): IIModel;
    get renderer(): SVGRenderer;
    get snapPointsVisibility(): boolean;
    set snapPointsVisibility(show: boolean);
    get verticesVisibility(): boolean;
    set verticesVisibility(show: boolean);
    get boundingBoxVisibility(): boolean;
    set boundingBoxVisibility(show: boolean);
    get recognitionBoxVisibility(): boolean;
    set recognitionBoxVisibility(show: boolean);
    get recognitionItemBoxVisibility(): boolean;
    set recognitionItemBoxVisibility(show: boolean);
    protected showSnapPoints(): void;
    protected hideSnapPoints(): void;
    debugSnapPoints(): void;
    protected showVertices(): void;
    protected hideVertices(): void;
    debugVertices(): void;
    protected drawBoundingBox(symbols: TIISymbol[]): void;
    protected showBoundingBox(): void;
    protected hideBoundingBox(): void;
    debugBoundingBox(): void;
    protected drawRecognitionBox(box: TBox, infos?: string[]): void;
    protected showRecognitionBox(): Promise<void>;
    protected clearRecognitionBox(): void;
    debugRecognitionBox(): Promise<void>;
    protected drawRecognitionItemBox(box: TBox, label?: string, chars?: string[]): void;
    protected showRecognitionItemBox(): Promise<void>;
    protected clearRecognitionItemBox(): void;
    debugRecognitionItemBox(): Promise<void>;
    apply(): void;
}

/**
 * @group Manager
 */
declare class IIMoveManager {
    grabber: PointerEventGrabber;
    editor: InteractiveInkEditor;
    origin?: {
        left: number;
        top: number;
        x: number;
        y: number;
    };
    constructor(editor: InteractiveInkEditor);
    get renderer(): SVGRenderer;
    attach(layer: HTMLElement): void;
    detach(): void;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): void;
    end(info: PointerInfo): void;
}

/**
 * @group Manager
 */
declare class IDebugSVGManager {
    #private;
    editor: InkEditor;
    constructor(editor: InkEditor);
    get model(): IModel;
    get renderer(): SVGRenderer;
    get recognitionBoxVisibility(): boolean;
    set recognitionBoxVisibility(show: boolean);
    get recognitionBoxItemsVisibility(): boolean;
    set recognitionBoxItemsVisibility(show: boolean);
    protected drawBoundingBox(symbols: TIISymbol[]): void;
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
 * @group Manager
 */
declare class EraseManager {
    #private;
    grabber: PointerEventGrabber;
    editor: InteractiveInkEditor | InkEditor;
    currentEraser?: IIEraser;
    constructor(editor: InteractiveInkEditor | InkEditor);
    get renderer(): SVGRenderer;
    attach(layer: HTMLElement): void;
    detach(): void;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): void;
    end(info: PointerInfo): Promise<void>;
}

/**
 * @group Menu
 */
type TMenuItem = {
    id: string;
    label: string;
    type: "button" | "checkbox" | "select" | "list" | "colors";
    disabled?: boolean;
};
/**
 * @group Menu
 */
type TMenuItemButton = TMenuItem & {
    type: "button";
    icon?: string;
    callback: () => void;
};
/**
 * @group Menu
 */
type TMenuItemButtonList = TMenuItem & {
    type: "list";
    initValue: string;
    values: {
        label: string;
        value: string;
    }[];
    callback: (value: string) => void;
};
/**
 * @group Menu
 */
type TMenuItemColorList = TMenuItem & {
    type: "colors";
    initValue: string;
    values: string[];
    fill: boolean;
    callback: (value: string) => void;
};
/**
 * @group Menu
 */
type TMenuItemBoolean = TMenuItem & {
    type: "checkbox";
    initValue: boolean | "indeterminate";
    callback: (value: boolean) => void;
};
/**
 * @group Menu
 */
type TMenuItemSelect = TMenuItem & {
    type: "select";
    initValue: string;
    values: {
        label: string;
        value: string;
    }[];
    callback: (value: string) => void;
};
/**
 * @group Menu
 */
declare abstract class IIMenu {
    thicknessList: {
        label: string;
        value: number;
    }[];
    fontSizeList: ({
        label: string;
        value: string;
    } | {
        label: string;
        value: number;
    })[];
    fontWeightList: {
        label: string;
        value: string;
    }[];
    colors: string[];
    protected createWrapCollapsible(el: Node, title: string): HTMLDivElement;
    protected createMenuItemBoolean(item: TMenuItemBoolean): HTMLDivElement;
    protected createMenuItemSelect(item: TMenuItemSelect): HTMLDivElement;
    protected createMenuItemButton(item: TMenuItemButton): HTMLElement;
    protected createMenuItemButtonList(item: TMenuItemButtonList): HTMLElement;
    protected createMenuItemColorList(item: TMenuItemColorList): HTMLDivElement;
    protected createColorList(item: TMenuItemColorList): HTMLDivElement;
    protected createMenuItem(item: TMenuItem): HTMLElement;
    abstract render(domElement: HTMLElement): void;
    abstract update(): void;
    abstract show(): void;
    abstract hide(): void;
    abstract destroy(): void;
}

/**
 * @group Menu
 */
type TSubMenuParam = {
    trigger: HTMLElement;
    menuTitle?: string;
    subMenu: HTMLElement;
    position: "top" | "left" | "right" | "right-top" | "bottom" | "bottom-left" | "bottom-right";
};
/**
 * @group Menu
 */
declare class IIMenuSub {
    element: HTMLDivElement;
    content: HTMLElement;
    constructor(param: TSubMenuParam);
    open(): void;
    close(): void;
    toggle(): void;
    unwrap(): void;
    wrap(): void;
}

/**
 * @group Menu
 */
declare class IIMenuAction extends IIMenu {
    #private;
    editor: InteractiveInkEditor;
    id: string;
    wrapper?: HTMLElement;
    menuLanguage: IIMenuSub;
    menuClear?: HTMLButtonElement;
    menuUndo?: HTMLButtonElement;
    menuRedo?: HTMLButtonElement;
    menuConvert?: HTMLButtonElement;
    guideGaps: {
        label: string;
        value: string;
    }[];
    constructor(editor: InteractiveInkEditor, id?: string);
    get model(): IIModel;
    get isMobile(): boolean;
    protected createMenuClear(): HTMLElement;
    protected createMenuLanguage(): HTMLElement;
    protected createMenuUndo(): HTMLElement;
    protected createMenuRedo(): HTMLElement;
    protected createMenuConvert(): HTMLElement;
    protected createMenuGesture(): HTMLDivElement;
    protected createMenuGuide(): HTMLDivElement;
    protected createMenuSnap(): HTMLDivElement;
    protected createMenuDebug(): HTMLDivElement;
    protected createMenuExport(): HTMLElement;
    protected readFileAsText(file: File): Promise<string>;
    protected createMenuImport(): HTMLElement;
    protected unselectAll(): void;
    protected closeAllSubMenu(): void;
    render(layer: HTMLElement): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 */
declare class IIMenuTool extends IIMenu {
    #private;
    editor: InteractiveInkEditor;
    id: string;
    wrapper?: HTMLDivElement;
    writeBtn?: HTMLButtonElement;
    menuSelect?: HTMLButtonElement;
    menuMove?: HTMLButtonElement;
    menuErase?: HTMLButtonElement;
    menuShape?: HTMLButtonElement;
    subMenuShape?: {
        rectangle: HTMLButtonElement;
        circle: HTMLButtonElement;
        triangle: HTMLButtonElement;
        ellipse: HTMLButtonElement;
        rhombus: HTMLButtonElement;
    };
    menuEdge?: HTMLButtonElement;
    subMenuEdge?: {
        line: HTMLButtonElement;
        arrow: HTMLButtonElement;
        doubleArrow: HTMLButtonElement;
    };
    constructor(editor: InteractiveInkEditor, id?: string);
    protected createMenuWrite(): HTMLElement;
    protected createMenuMove(): HTMLElement;
    protected createMenuSelect(): HTMLElement;
    protected createMenuErase(): HTMLElement;
    protected createShapeSubMenu(icon: string, tool: EditorWriteTool): HTMLButtonElement;
    protected createMenuShape(): HTMLElement;
    protected createEdgeSubMenu(square: string, tool: EditorWriteTool): HTMLButtonElement;
    protected createMenuEdge(): HTMLElement;
    protected unselectAll(): void;
    update(): void;
    render(layer: HTMLElement): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 */
declare class IIMenuStyle extends IIMenu {
    #private;
    editor: InteractiveInkEditor;
    id: string;
    wrapper?: HTMLDivElement;
    subMenu?: IIMenuSub;
    triggerBtn?: HTMLButtonElement;
    menuColorStroke?: HTMLDivElement;
    menuColorFill?: HTMLDivElement;
    menuThickness?: HTMLDivElement;
    menuFontSize?: HTMLDivElement;
    menuFontWeight?: HTMLDivElement;
    menuStrokeOpacity?: HTMLDivElement;
    constructor(editor: InteractiveInkEditor, id?: string);
    get model(): IIModel;
    get symbolsSelected(): TIISymbol[];
    get writeShape(): boolean;
    get rowHeight(): number;
    get isMobile(): boolean;
    protected createMenuStroke(): HTMLDivElement;
    protected createMenuColorFill(): HTMLDivElement;
    protected createMenuThickness(): HTMLDivElement;
    protected createMenuFontSize(): HTMLDivElement;
    protected createMenuFontWeight(): HTMLDivElement;
    protected createMenuOpacity(): HTMLDivElement;
    render(layer: HTMLElement): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 */
declare class IIMenuContext extends IIMenu {
    #private;
    editor: InteractiveInkEditor;
    id: string;
    wrapper?: HTMLElement;
    editMenu?: HTMLDivElement;
    editInput?: HTMLInputElement;
    editSaveBtn?: HTMLButtonElement;
    reorderMenu?: HTMLDivElement;
    decoratorMenu?: HTMLDivElement;
    menuExport?: HTMLDivElement;
    duplicateBtn?: HTMLButtonElement;
    groupBtn?: HTMLButtonElement;
    convertBtn?: HTMLButtonElement;
    removeBtn?: HTMLButtonElement;
    position: {
        x: number;
        y: number;
        scrollTop: number;
        scrollLeft: number;
    };
    constructor(editor: InteractiveInkEditor, id?: string);
    get symbolsSelected(): TIISymbol[];
    get haveSymbolsSelected(): boolean;
    get symbolsDecorable(): (IIStroke | IIText | IISymbolGroup | IIRecognizedText)[];
    get showDecorator(): boolean;
    protected createMenuEdit(): HTMLElement;
    protected createMenuDuplicate(): HTMLElement;
    protected createMenuGroup(): HTMLElement;
    protected createMenuConvert(): HTMLElement;
    protected createMenuRemove(): HTMLButtonElement;
    protected createMenuReorder(): HTMLElement;
    protected createDecoratorSubMenu(label: string, kind: DecoratorKind): HTMLElement;
    protected createMenuDecorator(): HTMLElement;
    protected createMenuExport(): HTMLElement;
    protected createMenuSelectAll(): HTMLElement;
    protected updateDecoratorSubMenu(): void;
    protected updateGroupMenu(): void;
    update(): void;
    render(layer: HTMLElement): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 */
type TMenuConfiguration = {
    enable: boolean;
    style: {
        enable: boolean;
    };
    tool: {
        enable: boolean;
    };
    action: {
        enable: boolean;
    };
    context: {
        enable: boolean;
    };
};
/**
 * @group Menu
 * @source
 */
declare const DefaultMenuConfiguration: TMenuConfiguration;

/**
 * @group Manager
 */
declare class IIMenuManager {
    #private;
    editor: InteractiveInkEditor;
    layer?: HTMLElement;
    action: IIMenuAction;
    tool: IIMenuTool;
    context: IIMenuContext;
    style: IIMenuStyle;
    constructor(editor: InteractiveInkEditor, custom?: {
        style?: IIMenuStyle;
        tool?: IIMenuTool;
        action?: IIMenuAction;
        context?: IIMenuContext;
    });
    render(layer: HTMLElement): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Editor
 */
type TInteractiveInkEditorConfiguration = TEditorConfiguration & TRecognizerWebSocketConfiguration & {
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
};
/**
 * @group Editor
 * @source
 */
declare const DefaultInteractiveInkEditorConfiguration: TInteractiveInkEditorConfiguration;
/**
 * @group Editor
 */
declare class InteractiveInkEditorConfiguration implements TInteractiveInkEditorConfiguration {
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
    constructor(configuration?: PartialDeep<TInteractiveInkEditorConfiguration>);
}

/**
 * @group Editor
 */
type TInteractiveInkEditorOptions = PartialDeep<EditorOptionsBase & {
    configuration: TInteractiveInkEditorConfiguration;
}> & {
    override?: {
        recognizer?: RecognizerWebSocket;
        menu?: {
            style?: IIMenuStyle;
            tool?: IIMenuTool;
            action?: IIMenuAction;
        };
    };
};
/**
 * @group Editor
 */
declare class InteractiveInkEditor extends AbstractEditor {
    #private;
    renderer: SVGRenderer;
    recognizer: RecognizerWebSocket;
    history: IIHistoryManager;
    writer: IIWriterManager;
    eraser: EraseManager;
    gesture: IIGestureManager;
    resizer: IIResizeManager;
    rotator: IIRotationManager;
    translator: IITranslateManager;
    converter: IIConversionManager;
    texter: IITextManager;
    selector: IISelectionManager;
    svgDebugger: IIDebugSVGManager;
    snaps: IISnapManager;
    move: IIMoveManager;
    menu: IIMenuManager;
    constructor(rootElement: HTMLElement, options?: TInteractiveInkEditorOptions);
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    get model(): IIModel;
    get configuration(): InteractiveInkEditorConfiguration;
    set renderingConfiguration(renderingConfiguration: TIIRendererConfiguration);
    get penStyle(): TStyle;
    set penStyle(penStyle: PartialDeep<TStyle>);
    protected updateLayerState(idle: boolean): void;
    updateLayerUI(timeout?: number): void;
    manageError(error: Error): void;
    protected setCursorStyle(): void;
    protected onContentChanged(undoRedoContext: THistoryContext): Promise<void>;
    initialize(): Promise<void>;
    changeLanguage(code: string): Promise<void>;
    protected buildShape(partialShape: PartialDeep<TIIShape>): TIIShape;
    protected buildEdge(partialEdge: PartialDeep<TIIEdge>): TIIEdge;
    protected buildRecognized(partialSymbol: PartialDeep<TIIRecognized>): TIIRecognized;
    protected buildGroup(partialGroup: PartialDeep<IISymbolGroup>): IISymbolGroup;
    protected buildStroke(partialSymbol: PartialDeep<IIStroke>): IIStroke;
    protected buildStrokeText(partialSymbol: PartialDeep<IIRecognizedText>): IIRecognizedText;
    protected buildText(partialSymbol: PartialDeep<IIText>): IIText;
    protected buildSymbol(partialSymbol: PartialDeep<TIISymbol>): TIISymbol;
    createSymbol(partialSymbol: PartialDeep<TIISymbol>): Promise<TIISymbol>;
    createSymbols(partialSymbols: PartialDeep<TIISymbol>[]): Promise<TIISymbol[]>;
    /** @hidden */
    protected updateTextBounds(symbol: TIISymbol): void;
    /** @hidden */
    addSymbol(sym: TIISymbol, addToHistory?: boolean): Promise<TIISymbol>;
    /** @hidden */
    addSymbols(symList: TIISymbol[], addToHistory?: boolean): Promise<TIISymbol[]>;
    updateSymbol(sym: TIISymbol, addToHistory?: boolean): Promise<TIISymbol>;
    updateSymbols(symList: TIISymbol[], addToHistory?: boolean): Promise<TIISymbol[]>;
    updateSymbolsStyle(symbolIds: string[], style: PartialDeep<TStyle>, addToHistory?: boolean): void;
    updateTextFontStyle(textIds: string[], { fontSize, fontWeight }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold" | "auto";
    }): void;
    replaceSymbols(oldSymbols: TIISymbol[], newSymbols: TIISymbol[], addToHistory?: boolean): Promise<void>;
    changeOrderSymbol(symbol: TIISymbol, position: "first" | "last" | "forward" | "backward"): void;
    changeOrderSymbols(symbols: TIISymbol[], position: "first" | "last" | "forward" | "backward"): void;
    groupSymbols(symbols: TIISymbol[]): IISymbolGroup;
    ungroupSymbol(group: IISymbolGroup): TIISymbol[];
    synchronizeStrokesWithJIIX(force?: boolean): Promise<void>;
    removeSymbol(id: string, addToHistory?: boolean): Promise<void>;
    removeSymbols(ids: string[], addToHistory?: boolean): Promise<TIISymbol[]>;
    select(ids: string[]): void;
    selectAll(): void;
    unselectAll(): void;
    importPointEvents(partialStrokes: PartialDeep<IIStroke>[]): Promise<IIModel>;
    protected triggerDownload(fileName: string, urlData: string): void;
    getSymbolsBounds(symbols: TIISymbol[], margin?: number): Box;
    protected buildBlobFromSymbols(symbols: TIISymbol[], box: Box): Blob;
    protected getExportName(extension: string): string;
    downloadAsSVG(selection?: boolean): void;
    downloadAsPNG(selection?: boolean): void;
    downloadAsJson(selection?: boolean): void;
    extractStrokesFromSymbols(symbols: TIISymbol[] | undefined): IIStroke[];
    extractTextsFromSymbols(symbols: TIISymbol[] | undefined): IIText[];
    protected extractBackendChanges(changes: TIIHistoryChanges): TIIHistoryBackendChanges;
    undo(): Promise<IIModel>;
    redo(): Promise<IIModel>;
    export(mimeTypes?: string[]): Promise<IIModel>;
    convert(): Promise<void>;
    convertSymbols(symbols?: TIISymbol[]): Promise<void>;
    waitForIdle(): Promise<void>;
    resize({ height, width }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Manager
 */
declare class IITranslateManager {
    #private;
    editor: InteractiveInkEditor;
    interactElementsGroup?: SVGElement;
    transformOrigin: TPoint;
    constructor(editor: InteractiveInkEditor);
    get model(): IIModel;
    protected applyToStroke(stroke: IIStroke, tx: number, ty: number): IIStroke;
    protected applyToShape(shape: TIIShape, tx: number, ty: number): TIIShape;
    protected applyToEdge(edge: TIIEdge, tx: number, ty: number): TIIEdge;
    protected applyOnText(text: IIText, tx: number, ty: number): IIText;
    protected applyOnGroup(group: IISymbolGroup, tx: number, ty: number): IISymbolGroup;
    protected applyOnRecognizedSymbol(recognizedSymbol: TIIRecognized, tx: number, ty: number): TIIRecognized;
    applyToSymbol(symbol: TIISymbol, tx: number, ty: number): TIISymbol;
    translate(symbols: TIISymbol[], tx: number, ty: number, addToHistory?: boolean): Promise<void>;
    translateElement(id: string, tx: number, ty: number): void;
    start(target: Element, origin: TPoint): void;
    continue(point: TPoint): {
        tx: number;
        ty: number;
    };
    end(point: TPoint): Promise<void>;
}

/**
 * @group Gesture
 */
declare class IIGestureManager {
    #private;
    insertAction: InsertAction;
    surroundAction: SurroundAction;
    strikeThroughAction: StrikeThroughAction;
    editor: InteractiveInkEditor;
    constructor(editor: InteractiveInkEditor, gestureAction?: PartialDeep<TGestureConfiguration>);
    get renderer(): SVGRenderer;
    get recognizer(): RecognizerWebSocket;
    get translator(): IITranslateManager;
    get texter(): IITextManager;
    get model(): IIModel;
    get history(): IIHistoryManager;
    get rowHeight(): number;
    get strokeSpaceWidth(): number;
    applySurroundGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    protected computeScratchOnStrokes(gesture: TGesture, stroke: IIStroke): IIStroke[];
    protected computeScratchOnText(gestureStroke: IIStroke, textSymbol: IIText): IIText | undefined;
    protected computeScratchOnSymbol(gestureStroke: IIStroke, gesture: TGesture, symbol: TIISymbol): {
        erased?: boolean;
        replaced?: TIISymbol[];
    };
    applyScratch(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    applyJoinGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    protected createStrokesFromGestureSubStroke(strokeOrigin: IIStroke, subStrokes: {
        x: number[];
        y: number[];
    }[]): IIStroke[];
    protected computeSplitStroke(strokeOrigin: IIStroke, subStrokes: {
        x: number[];
        y: number[];
    }[]): {
        before?: IIStroke;
        after?: IIStroke;
    };
    protected computeSplitStrokeInGroup(gestureStroke: IIStroke, group: IISymbolGroup, subStrokes: {
        fullStrokeId: string;
        x: number[];
        y: number[];
    }[]): IISymbolGroup[];
    protected computeChangesOnSplitStroke(gestureStroke: IIStroke, strokeIdToSplit: string, subStrokes: {
        fullStrokeId: string;
        x: number[];
        y: number[];
    }[]): TIIHistoryChanges;
    protected computeChangesOnSplitGroup(gestureStroke: IIStroke, groupToSplit: IISymbolGroup): TIIHistoryChanges;
    protected computeChangesOnSplitStrokeText(gestureStroke: IIStroke, strokeTextToSplit: IIRecognizedText): TIIHistoryChanges;
    protected computeChangesOnSplitText(gestureStroke: IIStroke, textToSplit: IIText): TIIHistoryChanges;
    applyInsertGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    applyUnderlineGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    applyStrikeThroughGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void | TIISymbol[]>;
    apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    getGestureFromContextLess(gestureStroke: IIStroke): Promise<TGesture | undefined>;
}

/**
 * @group Editor
 * @remarks Lists all events that can be listened to on the editor or DOM element
 * @example
 * You can run code on "EditorEventName" raised by using
 * ```ts
 * editor.event.addEventListener(EditorEventName.CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
declare enum EditorEventName {
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
     * @remarks event emitted when the editor encounters an error
     */
    ERROR = "error",
    /**
     * @remarks event emitted on click on pointer events
     */
    POINTEREVENTS = "pointer_events",
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
     * @remarks event emitted after full editor initialization
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
    GESTURED = "gestured"
}
/**
 * @group Editor
 */
declare class EditorEvent extends EventTarget {
    #private;
    protected abortController: AbortController;
    element: Element;
    constructor(element: Element);
    removeAllListeners(): void;
    protected emit(type: string, data?: unknown): void;
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
    emitConverted(exports: TExport): void;
    addConvertedListener(callback: (exports: TExport) => void): void;
    emitImported(exports: TExport): void;
    addImportedListener(callback: (exports: TExport) => void): void;
    emitSelected(symbols: TSymbol[]): void;
    addSelectedListener(callback: (symbols: TIISymbol[]) => void): void;
    emitToolChanged(mode: EditorTool): void;
    addToolChangedListener(callback: (mode: EditorTool) => void): void;
    emitUIpdated(): void;
    addUIpdatedListener(callback: () => void): void;
    emitSynchronized(): void;
    addSynchronizedListener(callback: () => void): void;
    emitGestured(gesture: {
        gestureType: TGestureType;
        stroke: IIStroke;
    }): void;
    addGesturedListener(callback: (gesture: {
        gestureType: TGestureType;
        stroke: IIStroke;
    }) => void): void;
}

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
declare class HistoryManager {
    #private;
    configuration: THistoryConfiguration;
    event: EditorEvent;
    context: THistoryContext;
    stack: Model[];
    constructor(configuration: THistoryConfiguration, event: EditorEvent);
    private updateContext;
    push(model: Model): void;
    updateStack(model: Model): void;
    undo(): Model;
    redo(): Model;
}

/**
 * @group History
 */
type TIIHistoryChanges = {
    added?: TIISymbol[];
    updated?: TIISymbol[];
    erased?: TIISymbol[];
    replaced?: {
        oldSymbols: TIISymbol[];
        newSymbols: TIISymbol[];
    };
    matrix?: {
        symbols: TIISymbol[];
        matrix: TMatrixTransform;
    };
    translate?: {
        symbols: TIISymbol[];
        tx: number;
        ty: number;
    }[];
    scale?: {
        symbols: TIISymbol[];
        scaleX: number;
        scaleY: number;
        origin: TPoint;
    }[];
    rotate?: {
        symbols: TIISymbol[];
        angle: number;
        center: TPoint;
    }[];
    style?: {
        symbols: TIISymbol[];
        style?: PartialDeep<TStyle>;
        fontSize?: number;
    };
    order?: {
        symbols: TIISymbol[];
        position: "first" | "last" | "forward" | "backward";
    };
    decorator?: {
        symbol: TIISymbol;
        decorator: IIDecorator;
        added: boolean;
    }[];
    group?: {
        symbols: TIISymbol[];
    };
    ungroup?: {
        group: TIISymbol;
    };
};
/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
type TIIHistoryBackendChanges = {
    added?: IIStroke[];
    erased?: IIStroke[];
    replaced?: {
        oldStrokes: IIStroke[];
        newStrokes: IIStroke[];
    };
    matrix?: {
        strokes: IIStroke[];
        matrix: TMatrixTransform;
    };
    translate?: {
        strokes: IIStroke[];
        tx: number;
        ty: number;
    }[];
    scale?: {
        strokes: IIStroke[];
        scaleX: number;
        scaleY: number;
        origin: TPoint;
    }[];
    rotate?: {
        strokes: IIStroke[];
        angle: number;
        center: TPoint;
    }[];
};
/**
 * @group History
 */
type TIIHistoryStackItem = {
    changes: TIIHistoryChanges;
    model: IIModel;
};
/**
 * @group History
 */
declare class IIHistoryManager {
    #private;
    configuration: THistoryConfiguration;
    event: EditorEvent;
    context: THistoryContext;
    stack: TIIHistoryStackItem[];
    constructor(configuration: THistoryConfiguration, event: EditorEvent);
    private updateContext;
    isChangesEmpty(changes: TIIHistoryChanges): boolean;
    init(model: IIModel): void;
    push(model: IIModel, changes: TIIHistoryChanges): void;
    update(model: IIModel): void;
    pop(): void;
    protected reverseChanges(changes: TIIHistoryChanges): TIIHistoryChanges;
    undo(): TIIHistoryStackItem;
    redo(): TIIHistoryStackItem;
    clear(): void;
}

/**
 * @group History
 */
type TIHistoryChanges = {
    added?: TIISymbol[];
    removed?: TIISymbol[];
};
/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
type TIHistoryBackendChanges = {
    added?: IIStroke[];
    removed?: IIStroke[];
};
/**
 * @group History
 */
type TIHistoryStackItem = {
    changes: TIHistoryChanges;
    model: IModel;
};
/**
 * @group History
 */
declare class IHistoryManager {
    #private;
    configuration: THistoryConfiguration;
    event: EditorEvent;
    context: THistoryContext;
    stack: TIHistoryStackItem[];
    constructor(configuration: THistoryConfiguration, event: EditorEvent);
    private updateContext;
    updateModelStack(model: IModel): void;
    isChangesEmpty(changes: TIHistoryChanges): boolean;
    init(model: IModel): void;
    push(model: IModel, changes: TIHistoryChanges): void;
    pop(): void;
    protected reverseChanges(changes: TIHistoryChanges): TIHistoryChanges;
    undo(): TIHistoryStackItem;
    redo(): TIHistoryStackItem;
    clear(): void;
}

/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessage = {
    type: string;
    [key: string]: unknown;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessageError = {
    type: string;
    code?: number | string;
    message?: string;
    data?: {
        code: number | string;
        message: string;
    };
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessageHMACChallenge = TRecognizerWebSocketSSRMessage & {
    hmacChallenge: string;
    iinkSessionId: string;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessageContentPackageDescriptionMessage = TRecognizerWebSocketSSRMessage & {
    contentPartCount: number;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessagePartChange = TRecognizerWebSocketSSRMessage & {
    partIdx: number;
    partId: string;
    partCount: number;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessageContentChange = TRecognizerWebSocketSSRMessage & {
    partId: string;
    canUndo: boolean;
    canRedo: boolean;
    empty: boolean;
    undoStackIndex: number;
    possibleUndoCount: number;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessageExport = TRecognizerWebSocketSSRMessage & {
    partId: string;
    exports: TExport;
};
/**
 * @group Recognizer
 */
type TUpdatePatchType = "REPLACE_ALL" | "REMOVE_ELEMENT" | "REPLACE_ELEMENT" | "REMOVE_CHILD" | "APPEND_CHILD" | "INSERT_BEFORE" | "REMOVE_ATTRIBUTE" | "SET_ATTRIBUTE";
/**
 * @group Recognizer
 */
type TUpdatePatch = {
    type: TUpdatePatchType;
};
/**
 * @group Recognizer
 */
type TUpdatePatchReplaceAll = TUpdatePatch & {
    type: "REPLACE_ALL";
    svg: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchReplaceELement = TUpdatePatch & {
    type: "REPLACE_ELEMENT";
    id: string;
    svg: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchInsertBefore = TUpdatePatch & {
    type: "INSERT_BEFORE";
    refId: string;
    svg: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchRemoveElement = TUpdatePatch & {
    type: "REMOVE_ELEMENT";
    id: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchAppendChild = TUpdatePatch & {
    type: "APPEND_CHILD";
    parentId?: string;
    svg: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchRemoveChild = TUpdatePatch & {
    type: "REMOVE_CHILD";
    parentId: string;
    index: number;
};
/**
 * @group Recognizer
 */
type TUpdatePatchRemoveAttribut = TUpdatePatch & {
    type: "REMOVE_ATTRIBUTE";
    id?: string;
    name: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchSetAttribut = TUpdatePatch & {
    type: "SET_ATTRIBUTE";
    id?: string;
    name: string;
    value: string;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessageSVGPatch = TRecognizerWebSocketSSRMessage & {
    updates: TUpdatePatch[];
    layer: ("MODEL" | "CAPTURE");
};

/**
 * @group Recognizer
 * @summary
 * Lists all events that can be listened to on the editor or DOM element
 * @example
 * You can run code on "RecognizerEventName" raised by using
 * ```ts
 * recognizer.events.addEventListener(RecognizerEventName.CONTENT_CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
declare enum RecognizerEventName {
    /**
     * @summary event emitted at the start of connection initialization
     */
    START_INITIALIZATION = "start-initialization",
    /**
     * @summary event emitted after full recognizer initialization
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
     * @summary event emitted when the recognizer encounters an error
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
    SESSION_OPENED = "session-opened"
}
/**
 * @group Recognizer
 */
declare class RecognizerEvent extends EventTarget {
    protected abortController: AbortController;
    constructor();
    removeAllListeners(): void;
    protected emit(type: string, data?: unknown): void;
    emitStartInitialization(): void;
    addStartInitialization(callback: () => void): void;
    emitEndtInitialization(): void;
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
    /**
     * @remarks only use in the case of websocket
     */
    emitSVGPatch(svgPatch: TRecognizerWebSocketSSRMessageSVGPatch): void;
    /**
     * @remarks only usable in the case of websocket
     */
    addSVGPatchListener(callback: (svgPatch: TRecognizerWebSocketSSRMessageSVGPatch) => void): void;
}

/**
 * @group Recognizer
 * @remarks List all errors generated by the backend with their descriptions
 */
declare enum RecognizerError {
    NO_ACTIVITY = "Session closed due to no activity. Without a connection on your part, it will be permanently lost after an hour.",
    WRONG_CREDENTIALS = "Application credentials are invalid. Please check or regenerate your application key and hmackey.",
    TOO_OLD = "Session is too old. Max Session Duration Reached.",
    NO_SESSION_FOUND = "No sessions found. Without activation for 1 hour, sessions are deleted from the server. To avoid losing your work, use the json export, then import it this will create a new session.",
    UNKNOW = "An unknown error has occurred.",
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
 * @group Recognizer
 */
type TRecognitionType = "TEXT" | "MATH" | "DIAGRAM" | "Raw Content";
/**
 * @group Recognizer
 */
type TRecognitionV2Type = "TEXT" | "MATH" | "Raw Content" | "SHAPE";
/**
 * @group Recognizer
 */
type TConverstionState = "DIGITAL_EDIT" | "HANDWRITING";

/**
 * @group Recognizer
 */
type TRecognitionHTTPV1Configuration = {
    type: TRecognitionType;
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
 * @group Recognizer
 * @source
 */
declare const DefaulRecognitionHTTPV1ConfigurationConfiguration: TRecognitionHTTPV1Configuration;
/**
 * @group Recognizer
 */
type TRecognizerHTTPV1Configuration = {
    server: TServerHTTPConfiguration;
    recognition: TRecognitionHTTPV1Configuration;
};
/**
 * @group Recognizer
 */
declare const DefaultRecognizerHTTPV1Configuration: TRecognizerHTTPV1Configuration;
/**
 * @group Recognizer
 * @source
 */
declare class RecognizerHTTPV1Configuration implements TRecognizerHTTPV1Configuration {
    recognition: TRecognitionHTTPV1Configuration;
    server: TServerHTTPConfiguration;
    constructor(configuration?: PartialDeep<TRecognizerHTTPV1Configuration>);
}

/**
 * @group Recognizer
 */
type TRecognizerHTTPV1PostConfiguration = {
    lang: string;
    diagram?: TDiagramConfiguration;
    math?: TMathConfiguration;
    "raw-content"?: TRawContentConfiguration;
    text?: TTextConfiguration;
    export: TExportConfiguration;
};
/**
 * @group Recognizer
 */
type TRecognizerHTTPV1PostData = {
    configuration: TRecognizerHTTPV1PostConfiguration;
    xDPI: number;
    yDPI: number;
    contentType: string;
    conversionState?: TConverstionState;
    height: number;
    width: number;
    strokeGroups: TStrokeGroupToSend[];
};
/**
 * @deprecated Use {@link RecognizerHTTPV2} instead.
 * @group Recognizer
 */
declare class RecognizerHTTPV1 {
    #private;
    configuration: RecognizerHTTPV1Configuration;
    constructor(config: PartialDeep<TRecognizerHTTPV1Configuration>);
    get url(): string;
    get postConfig(): TRecognizerHTTPV1PostConfiguration;
    protected buildData(model: Model): TRecognizerHTTPV1PostData;
    protected post(data: unknown, mimeType: string): Promise<unknown>;
    protected tryFetch(data: TRecognizerHTTPV1PostData, mimeType: string): Promise<TExport | never>;
    protected getMimeTypes(requestedMimeTypes?: string[]): string[];
    convert(model: Model, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<Model>;
    export(model: Model, requestedMimeTypes?: string[]): Promise<Model>;
    resize(model: Model): Promise<Model>;
}

/**
 * @group Recognizer
 */
type TRecognizerHTTPV2RecognitionConfiguration = {
    type: TRecognitionV2Type;
    lang: string;
    math: TMathConfiguration;
    text: TTextRecognizerHTTPV2Configuration;
    shape: TShapeConfiguration;
    "raw-content": TRawContentConfiguration;
    export: TExportConfiguration;
    convert?: TConvertionConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognizerHTTPV2RecognitionConfiguration: TRecognizerHTTPV2RecognitionConfiguration;
/**
 * @group Recognizer
 */
type TRecognizerHTTPV2Configuration = {
    server: TServerHTTPConfiguration;
    recognition: TRecognizerHTTPV2RecognitionConfiguration;
};
/**
 * @group Recognizer
 */
declare const DefaultRecognizerHTTPV2Configuration: TRecognizerHTTPV2Configuration;
/**
 * @group Recognizer
 * @source
 */
declare class RecognizerHTTPV2Configuration implements TRecognizerHTTPV2Configuration {
    recognition: TRecognizerHTTPV2RecognitionConfiguration;
    server: TServerHTTPConfiguration;
    constructor(configuration?: PartialDeep<TRecognizerHTTPV2Configuration>);
}

/**
 * @group Recognizer
 */
type TRecognizerHTTPV2PostConfiguration = {
    lang: string;
    diagram?: TDiagramConfiguration;
    math?: TMathConfiguration;
    "raw-content"?: TRawContentConfiguration;
    text?: TTextConfiguration;
    export: TExportConfiguration;
};
/**
 * @group Recognizer
 */
type TRecognizerHTTPV2PostData = {
    scaleX: number;
    scaleY: number;
    configuration: TRecognizerHTTPV2PostConfiguration;
    contentType: string;
    strokes: TStrokeToSend[];
};
/**
 * @group Recognizer
 */
declare class RecognizerHTTPV2 {
    #private;
    configuration: RecognizerHTTPV2Configuration;
    constructor(config: PartialDeep<TRecognizerHTTPV2Configuration>);
    get url(): string;
    get postConfig(): TRecognizerHTTPV2PostConfiguration;
    protected formatStrokes(strokes: TStroke[]): TStrokeToSend[];
    protected buildData(strokes: TStroke[]): TRecognizerHTTPV2PostData;
    protected post(data: unknown, mimeType: string): Promise<unknown>;
    protected tryFetch(data: TRecognizerHTTPV2PostData, mimeType: string): Promise<TExportV2 | never>;
    protected getMimeTypes(requestedMimeTypes?: string[]): string[];
    send(strokes: TStroke[], requestedMimeTypes?: string[]): Promise<TExportV2>;
}

/**
 * @group Recognizer
 */
declare enum TRecognizerWebSocketMessageType {
    HMAC_Challenge = "hmacChallenge",
    Authenticated = "authenticated",
    SessionDescription = "sessionDescription",
    NewPart = "newPart",
    PartChanged = "partChanged",
    ContentChanged = "contentChanged",
    Idle = "idle",
    Pong = "pong",
    Exported = "exported",
    GestureDetected = "gestureDetected",
    ContextlessGesture = "contextlessGesture",
    Error = "error"
}
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessage<T = string> = {
    type: T;
    [key: string]: unknown;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageAuthenticated = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Authenticated>;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageHMACChallenge = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.HMAC_Challenge> & {
    hmacChallenge: string;
    iinkSessionId: string;
};
/**
 * @group Recognizer
 */
type TInteractiveInkSessionDescriptionMessage = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.SessionDescription> & {
    contentPartCount: number;
    iinkSessionId: string;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageNewPart = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.NewPart> & {
    id: string;
    idx: null;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessagePartChange = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.PartChanged> & {
    partIdx: number;
    partId: string;
    partCount: number;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageContentChange = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.ContentChanged> & {
    partId: string;
    canUndo: boolean;
    canRedo: boolean;
    empty: boolean;
    undoStackIndex: number;
    possibleUndoCount: number;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageExport = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Exported> & {
    partId: string;
    exports: TExport;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageGesture = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.GestureDetected> & TGesture;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageContextlessGesture = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.ContextlessGesture> & {
    gestureType: "none" | "scratch" | "left-right" | "right-left" | "bottom-top" | "top-bottom" | "surround";
    strokeId: string;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessagePong = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Pong>;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageIdle = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Idle>;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageError = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Error> & {
    code?: number | string;
    message?: string;
    data?: {
        code: number | string;
        message: string;
    };
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageReceived = TRecognizerWebSocketMessageAuthenticated | TRecognizerWebSocketMessageHMACChallenge | TInteractiveInkSessionDescriptionMessage | TRecognizerWebSocketMessageNewPart | TRecognizerWebSocketMessagePartChange | TRecognizerWebSocketMessageContentChange | TRecognizerWebSocketMessageExport | TRecognizerWebSocketMessageGesture | TRecognizerWebSocketMessageContextlessGesture | TRecognizerWebSocketMessagePong | TRecognizerWebSocketMessageIdle | TRecognizerWebSocketMessageError;

/**
 * @group Recognizer
 */
type TRecognitionWebSocketConfiguration = {
    lang: string;
    export: TExportConfiguration;
    "raw-content": {
        text?: TTextConfConfiguration;
        "session-time"?: number;
        recognition?: {
            types: ("text" | "shape")[];
        };
        classification?: {
            types: ("text" | "shape")[];
        };
        gestures?: ("underline" | "scratch-out" | "join" | "insert" | "strike-through" | "surround")[];
    };
    gesture: {
        enable: boolean;
        ignoreGestureStrokes: boolean;
    };
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognitionWebSocketConfiguration: TRecognitionWebSocketConfiguration;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketConfiguration = {
    server: TServerWebsocketConfiguration;
    recognition: TRecognitionWebSocketConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognizerWebSocketConfiguration: TRecognizerWebSocketConfiguration;
/**
 * @group Recognizer
 */
declare class RecognizerWebSocketConfiguration implements TRecognizerWebSocketConfiguration {
    server: TServerWebsocketConfiguration;
    recognition: TRecognitionWebSocketConfiguration;
    constructor(configuration?: PartialDeep<TRecognizerWebSocketConfiguration>);
}

/**
 * A websocket dialog have this sequence :
 * --------------- Client --------------------------------------------------------------- Server ---------------
 * { type: "authenticate" }                           ==================>
 *                                                    <==================       { type: "hmacChallenge" }
 * { type: "hmac" }                                   ==================>
 *                                                    <==================       { type: "authenticated" }
 * { type: "initSession" | "restoreSession" }         ==================>
 *                                                    <==================       { type: "sessionDescription" }
 * { type: "newContentPart" | "openContentPart" }     ==================>
 *                                                    <==================       { type: "partChanged" }
 * { type: "addStrokes" }                             ==================>
 *                                                    <==================       { type: "contentChanged" }
 * { type: "transform" }                              ==================>
 *                                                    <==================       { type: "contentChanged" }
 * { type: "eraseStrokes" }                           ==================>
 *                                                    <==================       { type: "contentChanged" }
 */
/**
 * @group Recognizer
 */
declare class RecognizerWebSocket {
    #private;
    protected socket: WebSocket;
    protected pingWorker?: Worker;
    protected pingCount: number;
    protected reconnectionCount: number;
    protected sessionId?: string;
    protected currentPartId?: string;
    protected currentErrorCode?: string | number;
    protected addStrokeDeferred?: DeferredPromise<TRecognizerWebSocketMessageGesture | undefined>;
    protected contextlessGestureDeferred: Map<string, DeferredPromise<TRecognizerWebSocketMessageContextlessGesture>>;
    protected transformStrokeDeferred?: DeferredPromise<void>;
    protected eraseStrokeDeferred?: DeferredPromise<void>;
    protected replaceStrokeDeferred?: DeferredPromise<void>;
    protected exportDeferredMap: Map<string, DeferredPromise<TExport>>;
    protected closeDeferred?: DeferredPromise<void>;
    protected waitForIdleDeferred?: DeferredPromise<void>;
    protected undoDeferred?: DeferredPromise<void>;
    protected redoDeferred?: DeferredPromise<void>;
    protected clearDeferred?: DeferredPromise<void>;
    configuration: RecognizerWebSocketConfiguration;
    initialized: DeferredPromise<void>;
    url: string;
    event: RecognizerEvent;
    constructor(config: PartialDeep<TRecognizerWebSocketConfiguration>, event?: RecognizerEvent);
    get mimeTypes(): string[];
    protected rejectDeferredPending(error: Error | string): void;
    protected resetAllDeferred(): void;
    protected clearSocketListener(): void;
    protected closeCallback(evt: CloseEvent): void;
    protected openCallback(): void;
    protected manageHMACChallenge(hmacChallengeMessage: TRecognizerWebSocketMessageHMACChallenge): Promise<void>;
    protected initPing(): void;
    protected manageAuthenticated(): void;
    protected manageSessionDescriptionMessage(sessionDescriptionMessage: TInteractiveInkSessionDescriptionMessage): void;
    protected manageNewPartMessage(newPartMessage: TRecognizerWebSocketMessageNewPart): void;
    protected managePartChangeMessage(partChangeMessage: TRecognizerWebSocketMessagePartChange): void;
    protected manageContentChangedMessage(contentChangeMessage: TRecognizerWebSocketMessageContentChange): void;
    protected manageExportMessage(exportMessage: TRecognizerWebSocketMessageExport): void;
    protected manageWaitForIdle(): void;
    protected manageErrorMessage(errorMessage: TRecognizerWebSocketMessageError): void;
    protected manageGestureDetected(gestureMessage: TRecognizerWebSocketMessageGesture): void;
    protected manageContextlessGesture(gestureMessage: TRecognizerWebSocketMessageContextlessGesture): void;
    protected messageCallback(message: MessageEvent<string>): void;
    newSession(config: PartialDeep<TRecognizerWebSocketConfiguration>): Promise<void>;
    init(): Promise<void>;
    send(message: TRecognizerWebSocketMessage): Promise<void>;
    protected buildAddStrokesMessage(strokes: IIStroke[], processGestures?: boolean): TRecognizerWebSocketMessage;
    addStrokes(strokes: IIStroke[], processGestures?: boolean): Promise<TRecognizerWebSocketMessageGesture | undefined>;
    protected buildReplaceStrokesMessage(oldStrokeIds: string[], newStrokes: IIStroke[]): TRecognizerWebSocketMessage;
    replaceStrokes(oldStrokeIds: string[], newStrokes: IIStroke[]): Promise<void>;
    protected buildTransformTranslateMessage(strokeIds: string[], tx: number, ty: number): TRecognizerWebSocketMessage;
    transformTranslate(strokeIds: string[], tx: number, ty: number): Promise<void>;
    protected buildTransformRotateMessage(strokeIds: string[], angle: number, x0?: number, y0?: number): TRecognizerWebSocketMessage;
    transformRotate(strokeIds: string[], angle: number, x0?: number, y0?: number): Promise<void>;
    protected buildTransformScaleMessage(strokeIds: string[], scaleX: number, scaleY: number, x0?: number, y0?: number): TRecognizerWebSocketMessage;
    transformScale(strokeIds: string[], scaleX: number, scaleY: number, x0?: number, y0?: number): Promise<void>;
    protected buildTransformMatrixMessage(strokeIds: string[], matrix: TMatrixTransform): TRecognizerWebSocketMessage;
    transformMatrix(strokeIds: string[], matrix: TMatrixTransform): Promise<void>;
    protected buildEraseStrokesMessage(strokeIds: string[]): TRecognizerWebSocketMessage;
    eraseStrokes(strokeIds: string[]): Promise<void>;
    recognizeGesture(stroke: IIStroke): Promise<TRecognizerWebSocketMessageContextlessGesture | undefined>;
    waitForIdle(): Promise<void>;
    protected buildUndoRedoChanges(changes: TIIHistoryBackendChanges): TRecognizerWebSocketMessage[];
    undo(actions: TIIHistoryBackendChanges): Promise<void>;
    redo(actions: TIIHistoryBackendChanges): Promise<void>;
    export(requestedMimeTypes?: string[]): Promise<TExport>;
    clear(): Promise<void>;
    close(code: number, reason: string): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRRecognitionConfiguration = {
    type: Omit<TRecognitionType, "DIAGRAM" | "Raw Content">;
    lang: string;
    math: TMathConfiguration;
    text: TTextConfiguration;
    renderer: TRecognitionRendererConfiguration;
    export: TExportConfiguration;
    convert?: TConvertionConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognizerWebSocketSSRRecognitionConfiguration: TRecognizerWebSocketSSRRecognitionConfiguration;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRConfiguration = {
    server: TServerWebsocketConfiguration;
    recognition: TRecognizerWebSocketSSRRecognitionConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognizerWebSocketSSRConfiguration: TRecognizerWebSocketSSRConfiguration;
/**
 * @group Recognizer
 */
declare class RecognizerWebSocketSSRConfiguration implements TRecognizerWebSocketSSRConfiguration {
    recognition: TRecognizerWebSocketSSRRecognitionConfiguration;
    server: TServerWebsocketConfiguration;
    constructor(configuration?: PartialDeep<TRecognizerWebSocketSSRConfiguration>);
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
 * @group Recognizer
 */
declare class RecognizerWebSocketSSR {
    #private;
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
    configuration: TRecognizerWebSocketSSRConfiguration;
    initialized: DeferredPromise<void>;
    url: string;
    event: RecognizerEvent;
    constructor(config?: PartialDeep<TRecognizerWebSocketSSRConfiguration>);
    get mimeTypes(): string[];
    protected infinitePing(): void;
    protected openCallback(): void;
    protected rejectDeferredPending(error: Error): void;
    protected closeCallback(evt: CloseEvent): void;
    protected manageAckMessage(websocketMessage: TRecognizerWebSocketSSRMessage): Promise<void>;
    protected manageContentPackageDescriptionMessage(): Promise<void>;
    protected managePartChangeMessage(websocketMessage: TRecognizerWebSocketSSRMessage): void;
    protected manageExportMessage(websocketMessage: TRecognizerWebSocketSSRMessage): void;
    protected manageWaitForIdle(): Promise<void>;
    protected manageErrorMessage(websocketMessage: TRecognizerWebSocketSSRMessage): void;
    protected manageContentChangeMessage(websocketMessage: TRecognizerWebSocketSSRMessage): void;
    protected manageSVGPatchMessage(websocketMessage: TRecognizerWebSocketSSRMessage): void;
    protected messageCallback(message: MessageEvent<string>): void;
    init(height: number, width: number): Promise<void>;
    send(message: TRecognizerWebSocketSSRMessage): Promise<void>;
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
}

/**
 * @group Utils
 */
type PartialDeep<T> = T extends object ? {
    [P in keyof T]?: PartialDeep<T[P]>;
} : T;

/**
 * @group Utils
 */
declare function getAvailableFontList(configuration: PartialDeep<{
    server: TServerHTTPConfiguration;
    recognition: {
        lang: string;
    };
}>): Promise<Array<string>>;

/**
 * @group Utils
 */
declare function getAvailableLanguageList(configuration: PartialDeep<{
    server: TServerHTTPConfiguration;
}>): Promise<{
    result: {
        [key: string]: string;
    };
}>;

/**
 * @group Utils
 */
declare function computeLinksPointers(point: TPointer, angle: number, width: number): TPoint[];
/**
 * @group Utils
 */
declare function computeMiddlePointer(point1: TPointer, point2: TPointer): TPointer;

/**
 * @group Utils
 */
type TApiInfos = {
    version: string;
    gitCommit: string;
    nativeVersion: string;
};
/**
 * @group Utils
 */
declare function getApiInfos(configuration?: PartialDeep<{
    server: TServerHTTPConfiguration;
}>): Promise<TApiInfos>;

/**
 * @group Editor
 */
type EditorLayerUIInfoModal = {
    root: HTMLDivElement;
    text: HTMLParagraphElement;
};
/**
 * @group Editor
 */
type EditorLayerUIMessage = {
    root: HTMLDivElement;
    overlay: HTMLDivElement;
    modal: EditorLayerUIInfoModal;
};
/**
 * @group Editor
 */
type EditorLayerUIState = {
    root: HTMLDivElement;
    busy: HTMLDivElement;
};
/**
 * @group Editor
 */
type EditorLayerUI = {
    root: HTMLDivElement;
    loader: HTMLDivElement;
    message: EditorLayerUIMessage;
    state: EditorLayerUIState;
};
/**
 * @group Editor
 */
declare class EditorLayer {
    root: HTMLElement;
    ui: EditorLayerUI;
    rendering: HTMLElement;
    onCloseModal?: (inError?: boolean) => void;
    constructor(root: HTMLElement, rootClassCss?: string);
    render(): void;
    createLoader(): HTMLDivElement;
    showLoader(): void;
    hideLoader(): void;
    createMessageOverlay(): HTMLDivElement;
    closeMessageModal(): void;
    hideMessageModal(): void;
    createMessageModal(): EditorLayerUIInfoModal;
    createMessage(): EditorLayerUIMessage;
    showMessageInfo(notif: {
        message: string;
        timeout?: number;
    }): void;
    showMessageError(err: Error | string): void;
    createBusy(): HTMLDivElement;
    createState(): EditorLayerUIState;
    showState(): void;
    hideState(): void;
    updateState(idle: boolean): void;
    createLayerUI(): EditorLayerUI;
    createLayerRender(): HTMLDivElement;
    destroy(): void;
}

/**
 * @hidden
 * @group Editor
 */
type TEditorConfiguration = {
    logger: TLoggerConfiguration;
};
/**
 * @group Editor
 * @remarks "INKV1" is deprecated use "INKV2" instead.
 */
type EditorType = "INTERACTIVEINK" | "INKV1" | "INTERACTIVEINKSSR" | "INKV2";
/**
 * @hidden
 * @group Editor
 */
type EditorOptionsBase = {
    configuration: TEditorConfiguration;
    override?: {
        cssClass?: string;
    };
};
/**
 * @hidden
 * @group Editor
 */
declare abstract class AbstractEditor {
    #private;
    logger: Logger;
    layers: EditorLayer;
    event: EditorEvent;
    info?: TApiInfos;
    constructor(rootElement: HTMLElement, options?: PartialDeep<EditorOptionsBase>);
    get loggerConfiguration(): TLoggerConfiguration;
    set loggerConfiguration(loggerConfig: TLoggerConfiguration);
    abstract initialize(): Promise<void>;
    abstract clear(): Promise<void>;
    abstract destroy(): Promise<void>;
    loadInfo(server: TServerHTTPConfiguration): Promise<TApiInfos>;
}

/**
 * @group Editor
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
type TEditorTriggerConfiguration = {
    exportContent: "QUIET_PERIOD" | "POINTER_UP" | "DEMAND";
    exportContentDelay: number;
    resizeTriggerDelay: number;
};
/**
 * @group Editor
 * @source
 */
declare const DefaulTEditorTriggerConfiguration: TEditorTriggerConfiguration;

/**
 * @group Editor
 */
type TInkEditorDeprecatedConfiguration = TEditorConfiguration & TRecognizerHTTPV1Configuration & {
    rendering: TRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
};
/**
 * @group Editor
 * @source
 */
declare const DefaultInkEditorDeprecatedConfiguration: TInkEditorDeprecatedConfiguration;
/**
 * @group Editor
 */
declare class InkEditorDeprecatedConfiguration implements TInkEditorDeprecatedConfiguration {
    server: TServerHTTPConfiguration;
    recognition: TRecognitionHTTPV1Configuration;
    rendering: TRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
    constructor(configuration?: PartialDeep<TInkEditorDeprecatedConfiguration>);
}

/**
 * @group Editor
 */
type TInkEditorDeprecatedOptions = PartialDeep<EditorOptionsBase & {
    configuration: TInkEditorDeprecatedConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        recognizer?: RecognizerHTTPV1;
    };
};
/**
 * @group Editor
 * @deprecated Use {@link InkEditor} instead.
 */
declare class InkEditorDeprecated extends AbstractEditor {
    #private;
    grabber: PointerEventGrabber;
    renderer: CanvasRenderer;
    recognizer: RecognizerHTTPV1;
    history: HistoryManager;
    styleManager: StyleManager;
    constructor(rootElement: HTMLElement, options?: TInkEditorDeprecatedOptions);
    protected onPointerDown(info: PointerInfo): void;
    protected onPointerMove(info: PointerInfo): void;
    protected onPointerUp(info: PointerInfo): Promise<void>;
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    protected setCursorStyle(): void;
    get model(): Model;
    get currentPenStyle(): TPenStyle;
    get penStyle(): TPenStyle;
    set penStyle(penStyle: TPenStyle | undefined);
    get penStyleClasses(): string;
    set penStyleClasses(penStyleClasses: string | undefined);
    get theme(): TTheme;
    set theme(theme: PartialDeep<TTheme>);
    get configuration(): InkEditorDeprecatedConfiguration;
    initialize(): Promise<void>;
    drawCurrentStroke(): void;
    updateModelRendering(): Promise<Model>;
    export(mimeTypes?: string[]): Promise<Model>;
    convert(params?: {
        conversionState?: TConverstionState;
        mimeTypes?: string[];
    }): Promise<Model>;
    importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<Model>;
    resize({ height, width }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group InteractiveInkSSRSmartGuide
 */
declare class InteractiveInkSSRSmartGuide {
    #private;
    uuid: string;
    editor: InteractiveInkSSREditor;
    margin: TMarginConfiguration;
    jiix?: TJIIXExport;
    lastWord?: TJIIXWord;
    wordToChange?: TJIIXWord;
    constructor(editor: InteractiveInkSSREditor);
    init(domElement: HTMLElement, margin: TMarginConfiguration): void;
    resize(): void;
    update(exports: TJIIXExport): void;
    clear(): void;
    destroy(): void;
}

/**
 * @group Editor
 */
type TInteractiveInkSSREditorConfiguration = TEditorConfiguration & TRecognizerWebSocketSSRConfiguration & {
    rendering: TRendererConfiguration;
    smartGuide: {
        enable: boolean;
    };
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
};
/**
 * @group Editor
 * @source
 */
declare const DefaultInteractiveInkSSREditorConfiguration: TInteractiveInkSSREditorConfiguration;
/**
 * @group Editor
 */
declare class InteractiveInkSSREditorConfiguration implements TInteractiveInkSSREditorConfiguration {
    server: TServerWebsocketConfiguration;
    recognition: TRecognizerWebSocketSSRRecognitionConfiguration;
    rendering: TRendererConfiguration;
    smartGuide: {
        enable: boolean;
    };
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
    constructor(configuration?: PartialDeep<TInteractiveInkSSREditorConfiguration>);
}

/**
 * @group Editor
 */
type TInteractiveInkSSREditorOptions = PartialDeep<EditorOptionsBase & {
    configuration: InteractiveInkSSREditorConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        recognizer?: RecognizerWebSocketSSR;
    };
};
/**
 * @group Editor
 */
declare class InteractiveInkSSREditor extends AbstractEditor {
    #private;
    smartGuide?: InteractiveInkSSRSmartGuide;
    grabber: PointerEventGrabber;
    renderer: InteractiveInkSSRSVGRenderer;
    recognizer: RecognizerWebSocketSSR;
    history: HistoryManager;
    styleManager: StyleManager;
    constructor(rootElement: HTMLElement, options?: TInteractiveInkSSREditorOptions);
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    protected setCursorStyle(): void;
    get model(): Model;
    get configuration(): InteractiveInkSSREditorConfiguration;
    get currentPenStyle(): TPenStyle;
    get penStyle(): TPenStyle;
    set penStyle(penStyle: PartialDeep<TPenStyle>);
    get penStyleClasses(): string;
    set penStyleClasses(penClass: string);
    get theme(): TTheme;
    set theme(theme: PartialDeep<TTheme>);
    protected syncStyle(): Promise<void>;
    protected onExport(exports: TExport): void;
    protected onPointerDown(info: PointerInfo): void;
    protected onPointerMove(info: PointerInfo): void;
    protected onPointerUp(info: PointerInfo): Promise<void>;
    protected onSVGPatch(evt: TRecognizerWebSocketSSRMessageSVGPatch): void;
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
    importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<Model>;
    resize({ height, width }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    undo(): Promise<Model>;
    redo(): Promise<Model>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Editor
 */
type TInkEditorConfiguration = TEditorConfiguration & TRecognizerHTTPV2Configuration & {
    rendering: TIIRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TStyle;
};
/**
 * @group Editor
 * @source
 */
declare const DefaultInkEditorConfiguration: TInkEditorConfiguration;
/**
 * @group Editor
 */
declare class InkEditorConfiguration implements TInkEditorConfiguration {
    server: TServerHTTPConfiguration;
    recognition: TRecognizerHTTPV2RecognitionConfiguration;
    rendering: TIIRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TStyle;
    constructor(configuration?: PartialDeep<InkEditorConfiguration>);
}

declare class IWriterManager extends AbstractWriterManager {
    #private;
    editor: InkEditor;
    constructor(editor: InkEditor);
    get model(): IModel;
    protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TIISymbol;
    protected updateCurrentSymbol(pointer: TPointer): IIStroke;
    end(info: PointerInfo): Promise<void>;
}

/**
 * @group Editor
 */
type TInkEditorOptions = PartialDeep<EditorOptionsBase & {
    configuration: TInkEditorConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        recognizer?: RecognizerHTTPV2;
    };
};
/**
 * @group Editor
 */
declare class InkEditor extends AbstractEditor {
    #private;
    renderer: SVGRenderer;
    recognizer: RecognizerHTTPV2;
    history: IHistoryManager;
    writer: IWriterManager;
    eraser: EraseManager;
    debugger: IDebugSVGManager;
    constructor(rootElement: HTMLElement, options?: TInkEditorOptions);
    get penStyle(): TStyle;
    set penStyle(penStyle: PartialDeep<TStyle>);
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    get model(): IModel;
    get configuration(): InkEditorConfiguration;
    initialize(): Promise<void>;
    updateSymbolsStyle(symbolIds: string[], style: PartialDeep<TStyle>): void;
    export(requestedMimeTypes?: string[]): Promise<TExportV2>;
    resize({ height, width }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    removeStrokes(strokeIds: string[]): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Editor
 * @hideconstructor
 */
declare class Editor {
    protected static logger: Logger;
    protected static instance: InteractiveInkEditor | InkEditorDeprecated | InteractiveInkSSREditor | InkEditor | undefined;
    static load<T extends EditorType>(rootElement: HTMLElement, type: T, options: T extends "INTERACTIVEINK" ? TInteractiveInkEditorOptions : T extends "INKV1" ? TInkEditorDeprecatedOptions : TInteractiveInkSSREditorOptions extends "INKV2" ? TInkEditorOptions : TInteractiveInkSSREditorOptions): Promise<T extends "INTERACTIVEINK" ? InteractiveInkEditor : T extends "INKV1" ? InkEditorDeprecated : InteractiveInkSSREditor extends "INKV2" ? InkEditor : InteractiveInkSSREditor>;
    static getInstance(): InteractiveInkEditor | InkEditorDeprecated | InteractiveInkSSREditor | InkEditor | undefined;
}

export { AbstractEditor, AbstractWriterManager, Box, CanvasRenderer, CanvasRendererShape, CanvasRendererStroke, CanvasRendererText, DecoratorKind, DefaulRecognitionHTTPV1ConfigurationConfiguration, DefaulTEditorTriggerConfiguration, DefaultConvertionConfiguration, DefaultDebugConfiguration, DefaultDiagramConfiguration, DefaultDiagramConvertConfiguration, DefaultEraserConfiguration, DefaultExportConfiguration, DefaultGestureConfiguration, DefaultGrabberConfiguration, DefaultGuidesConfiguration, DefaultHistoryConfiguration, DefaultIIRendererConfiguration, DefaultInkEditorConfiguration, DefaultInkEditorDeprecatedConfiguration, DefaultInteractiveInkEditorConfiguration, DefaultInteractiveInkSSREditorConfiguration, DefaultJiixConfiguration, DefaultListenerConfiguration, DefaultLoggerConfiguration, DefaultMarginConfiguration, DefaultMathConfiguration, DefaultMathUndoRedoConfiguration, DefaultMathV2Configuration, DefaultMenuConfiguration, DefaultPenStyle, DefaultRawContentConfiguration, DefaultRawContentV2Configuration, DefaultRecognitionRendererConfiguration, DefaultRecognitionWebSocketConfiguration, DefaultRecognizerHTTPV1Configuration, DefaultRecognizerHTTPV2Configuration, DefaultRecognizerHTTPV2RecognitionConfiguration, DefaultRecognizerWebSocketConfiguration, DefaultRecognizerWebSocketSSRConfiguration, DefaultRecognizerWebSocketSSRRecognitionConfiguration, DefaultRendererConfiguration, DefaultServerHTTPConfiguration, DefaultServerWebsocketConfiguration, DefaultShapeBeautificationConfiguration, DefaultShapeConfiguration, DefaultShapeConvertConfiguration, DefaultSnapConfiguration, DefaultSolverConfiguration, DefaultStyle, DefaultTexConfigurationV2, DefaultTextConfiguration, DefaultTextGuidesConfiguration, DefaultTextGuidesConfigurationV2, DefaultTheme, DeferredPromise, EdgeDecoration, EdgeKind, Editor, EditorEvent, EditorEventName, EditorLayer, EditorTool, EditorWriteTool, EraseManager, ExportType, ExportV2Type, HistoryManager, IDebugSVGManager, IHistoryManager, IIConversionManager, IIDebugSVGManager, IIDecorator, IIEdgeArc, IIEdgeLine, IIEdgePolyLine, IIEraser, IIGestureManager, IIHistoryManager, IIMenu, IIMenuAction, IIMenuContext, IIMenuManager, IIMenuStyle, IIMenuSub, IIMenuTool, IIModel, IIMoveManager, IIRecognizedArc, IIRecognizedBase, IIRecognizedCircle, IIRecognizedEllipse, IIRecognizedLine, IIRecognizedPolyLine, IIRecognizedPolygon, IIRecognizedText, IIResizeManager, IIRotationManager, IISelectionManager, IIShapeCircle, IIShapeEllipse, IIShapePolygon, IISnapManager, IIStroke, IISymbolBase, IISymbolGroup, IIText, IITextManager, IITranslateManager, IIWriterManager, IModel, InkEditor, InkEditorConfiguration, InkEditorDeprecated, InkEditorDeprecatedConfiguration, InsertAction, InteractiveInkEditor, InteractiveInkEditorConfiguration, InteractiveInkSSREditor, InteractiveInkSSREditorConfiguration, InteractiveInkSSRSVGRenderer, InteractiveInkSSRSmartGuide, JIIXELementType, JIIXEdgeKind, JIIXNodeKind, JIIXV2ShapeKind, Logger, LoggerCategory, LoggerLevel, LoggerManager, MatrixTransform, Model, OIEdgeBase, OIShapeBase, PointerEventGrabber, RecognizedKind, RecognizerError, RecognizerEvent, RecognizerEventName, RecognizerHTTPV1, RecognizerHTTPV1Configuration, RecognizerHTTPV2, RecognizerHTTPV2Configuration, RecognizerWebSocket, RecognizerWebSocketConfiguration, RecognizerWebSocketSSR, RecognizerWebSocketSSRConfiguration, ResizeDirection, SELECTION_MARGIN, SVGBuilder, SVGRenderer, SVGRendererConst, SVGRendererDecoratorUtil, SVGRendererEdgeUtil, SVGRendererEraserUtil, SVGRendererGroupUtil, SVGRendererRecognizedUtil, SVGRendererShapeUtil, SVGRendererStrokeUtil, SVGRendererTextUtil, SVGStroker, ShapeKind, SnapConfiguration, StrikeThroughAction, Stroke, StyleHelper, StyleManager, SurroundAction, SvgElementRole, SymbolType, TRecognizerWebSocketMessageType, computeAngleAxeRadian, computeAngleRadian, computeAverage, computeDistance, computeDistanceBetweenPointAndSegment, computeHmac, computeLinksPointers, computeMiddlePointer, computeNearestPointOnSegment, computePointOnEllipse, computeRotatedPoint, convertBoundingBoxMillimeterToPixel, convertDegreeToRadian, convertMillimeterToPixel, convertPartialStrokesToOIStrokes, convertPartialStrokesToStrokes, convertPixelToMillimeter, convertRadianToDegree, createPointsOnSegment, createUUID, findIntersectBetweenSegmentAndCircle, findIntersectionBetween2Segment, getApiInfos, getAvailableFontList, getAvailableLanguageList, getClosestPoint, getClosestPoints, getInitialHistoryContext, isBetween, isDeepEqual, isPointInsideBox, isPointInsidePolygon, isValidNumber, isValidPoint, isVersionSuperiorOrEqual, mergeDeep, scalaire };
export type { EditorLayerUI, EditorLayerUIInfoModal, EditorLayerUIMessage, EditorLayerUIState, EditorOptionsBase, EditorType, JIIXV2Base, JIIXV2Circle, JIIXV2DrawingElement, JIIXV2Element, JIIXV2ElementBase, JIIXV2Ellipse, JIIXV2EllipseBase, JIIXV2Export, JIIXV2Expression, JIIXV2Line, JIIXV2LineSpan, JIIXV2MathElement, JIIXV2PolygonBase, JIIXV2PolygonType, JIIXV2PrimitiveArc, JIIXV2PrimitiveLine, JIIXV2Range, JIIXV2RangeItem, JIIXV2RawContentBase, JIIXV2RawContentElement, JIIXV2RawContentItemShape, JIIXV2RawContentItemText, JIIXV2RawContentShape, JIIXV2RawContentTextLine, JIIXV2ShapeArcOfCircle, JIIXV2ShapeArcOfEllipse, JIIXV2ShapeCurvedArrow, JIIXV2ShapeCurvedDoubleArrow, JIIXV2ShapeElement, JIIXV2ShapeItemBase, JIIXV2ShapeLine, JIIXV2ShapeLineArrow, JIIXV2ShapeLineDoubleArrow, JIIXV2ShapeLinePolyline, JIIXV2ShapeLinePolylineArrow, JIIXV2ShapeLinePolylineDoubleArrow, JIIXV2ShapePolygon, JIIXV2ShapePolygonEquilateralTriangle, JIIXV2ShapePolygonIsoscelesTriangle, JIIXV2ShapePolygonParallelogram, JIIXV2ShapePolygonQuadrilateral, JIIXV2ShapePolygonRectangle, JIIXV2ShapePolygonRhombus, JIIXV2ShapePolygonRightIsoscelesTriangle, JIIXV2ShapePolygonRightTriangle, JIIXV2ShapePolygonSquare, JIIXV2ShapePolygonTrapezoid, JIIXV2ShapePolygonTriangle, JIIXV2TextElement, PartialDeep, PointerInfo, TAngleUnit, TApiInfos, TBox, TCanvasShapeEllipseSymbol, TCanvasShapeLineSymbol, TCanvasShapeTableLineSymbol, TCanvasShapeTableSymbol, TCanvasTextSymbol, TCanvasTextUnderlineSymbol, TCanvasUnderLineSymbol, TConverstionState, TConvertionConfiguration, TDiagramConfiguration, TDiagramConvertConfiguration, TEditorConfiguration, TEditorTriggerConfiguration, TEraserConfiguration, TExport, TExportConfiguration, TExportV2, TGesture, TGestureConfiguration, TGestureType, TGrabberConfiguration, TGuidesConfiguration, THistoryConfiguration, THistoryContext, TIHistoryBackendChanges, TIHistoryChanges, TIHistoryStackItem, TIIEdge, TIIHistoryBackendChanges, TIIHistoryChanges, TIIHistoryStackItem, TIIRecognized, TIIRendererConfiguration, TIIShape, TIISymbol, TIISymbolChar, TImageConfiguration, TImageViewportConfiguration, TInkEditorConfiguration, TInkEditorDeprecatedConfiguration, TInkEditorDeprecatedOptions, TInkEditorOptions, TInteractiveInkEditorConfiguration, TInteractiveInkEditorOptions, TInteractiveInkSSREditorConfiguration, TInteractiveInkSSREditorOptions, TInteractiveInkSessionDescriptionMessage, TJIIXBase, TJIIXChar, TJIIXEdgeArc, TJIIXEdgeElement, TJIIXEdgeElementBase, TJIIXEdgeLine, TJIIXEdgePolyEdge, TJIIXElement, TJIIXElementBase, TJIIXExport, TJIIXLine, TJIIXNodeCircle, TJIIXNodeElement, TJIIXNodeElementBase, TJIIXNodeEllipse, TJIIXNodeParrallelogram, TJIIXNodePolygon, TJIIXNodeRectangle, TJIIXNodeRhombus, TJIIXNodeTriangle, TJIIXStrokeItem, TJIIXTextElement, TJIIXWord, TJiixConfiguration, TListenerConfiguration, TLoggerConfiguration, TMarginConfiguration, TMathConfiguration, TMathMLExport, TMathMLFlavor, TMathUndoRedoConfiguration, TMatrixTransform, TMenuConfiguration, TMenuItem, TMenuItemBoolean, TMenuItemButton, TMenuItemButtonList, TMenuItemColorList, TMenuItemSelect, TPenStyle, TPoint, TPointer, TRawContentConfiguration, TRecognitionHTTPV1Configuration, TRecognitionPositions, TRecognitionRendererConfiguration, TRecognitionRendererDebugConfiguration, TRecognitionType, TRecognitionV2Type, TRecognitionWebSocketConfiguration, TRecognizerHTTPV1Configuration, TRecognizerHTTPV1PostConfiguration, TRecognizerHTTPV1PostData, TRecognizerHTTPV2Configuration, TRecognizerHTTPV2PostConfiguration, TRecognizerHTTPV2PostData, TRecognizerHTTPV2RecognitionConfiguration, TRecognizerWebSocketConfiguration, TRecognizerWebSocketMessage, TRecognizerWebSocketMessageAuthenticated, TRecognizerWebSocketMessageContentChange, TRecognizerWebSocketMessageContextlessGesture, TRecognizerWebSocketMessageError, TRecognizerWebSocketMessageExport, TRecognizerWebSocketMessageGesture, TRecognizerWebSocketMessageHMACChallenge, TRecognizerWebSocketMessageIdle, TRecognizerWebSocketMessageNewPart, TRecognizerWebSocketMessagePartChange, TRecognizerWebSocketMessagePong, TRecognizerWebSocketMessageReceived, TRecognizerWebSocketSSRConfiguration, TRecognizerWebSocketSSRMessage, TRecognizerWebSocketSSRMessageContentChange, TRecognizerWebSocketSSRMessageContentPackageDescriptionMessage, TRecognizerWebSocketSSRMessageError, TRecognizerWebSocketSSRMessageExport, TRecognizerWebSocketSSRMessageHMACChallenge, TRecognizerWebSocketSSRMessagePartChange, TRecognizerWebSocketSSRMessageSVGPatch, TRecognizerWebSocketSSRRecognitionConfiguration, TRendererConfiguration, TRoundingMode, TScheme, TSegment, TServerHTTPConfiguration, TServerWebsocketConfiguration, TShapeBeautificationConfiguration, TShapeConfiguration, TShapeConvertConfiguration, TSnapConfiguration, TSnapLineInfos, TSnapNudge, TSolverConfiguration, TSolverOptions, TStroke, TStrokeGroup, TStrokeGroupToSend, TStrokeToSend, TStyle, TSubMenuParam, TSymbol, TTextConfConfiguration, TTextConfiguration, TTextGuidesConfiguration, TTextGuidesConfigurationV2, TTextRecognizerHTTPV2ConfConfiguration, TTextRecognizerHTTPV2Configuration, TTheme, TThemeMath, TThemeMathSolved, TThemeText, TUndoRedoMode, TUpdatePatch, TUpdatePatchAppendChild, TUpdatePatchInsertBefore, TUpdatePatchRemoveAttribut, TUpdatePatchRemoveChild, TUpdatePatchRemoveElement, TUpdatePatchReplaceAll, TUpdatePatchReplaceELement, TUpdatePatchSetAttribut, TUpdatePatchType };
//# sourceMappingURL=iink.d.ts.map
