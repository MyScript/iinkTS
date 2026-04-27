"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var shared_exports = {};
__export(shared_exports, {
  BOUND_ARROW_OFFSET: () => BOUND_ARROW_OFFSET,
  MIN_ARROW_LENGTH: () => MIN_ARROW_LENGTH,
  STROKE_SIZES: () => STROKE_SIZES,
  WAY_TOO_BIG_ARROW_BEND_FACTOR: () => WAY_TOO_BIG_ARROW_BEND_FACTOR,
  createOrUpdateArrowBinding: () => createOrUpdateArrowBinding,
  getArrowBindings: () => getArrowBindings,
  getArrowInfo: () => getArrowInfo,
  getArrowTerminalInArrowSpace: () => getArrowTerminalInArrowSpace,
  getArrowTerminalsInArrowSpace: () => getArrowTerminalsInArrowSpace,
  getBoundShapeInfoForTerminal: () => getBoundShapeInfoForTerminal,
  getBoundShapeRelationships: () => getBoundShapeRelationships,
  getIsArrowStraight: () => getIsArrowStraight,
  removeArrowBinding: () => removeArrowBinding
});
module.exports = __toCommonJS(shared_exports);
var import_editor = require("@tldraw/editor");
var import_store = require("@tldraw/store");
var import_curved_arrow = require("./curved-arrow");
var import_getElbowArrowInfo = require("./elbow/getElbowArrowInfo");
var import_straight_arrow = require("./straight-arrow");
const MIN_ARROW_BEND = 8;
function getIsArrowStraight(shape) {
  if (shape.props.kind !== "arc") return false;
  return Math.abs(shape.props.bend) < MIN_ARROW_BEND * shape.props.scale;
}
function getBoundShapeInfoForTerminal(editor, arrow, terminalName) {
  const binding = editor.getBindingsFromShape(arrow, "arrow").find((b) => b.props.terminal === terminalName);
  if (!binding) return;
  const boundShape = editor.getShape(binding.toId);
  if (!boundShape) return;
  const transform = editor.getShapePageTransform(boundShape);
  const hasArrowhead = terminalName === "start" ? arrow.props.arrowheadStart !== "none" : arrow.props.arrowheadEnd !== "none";
  const geometry = editor.getShapeGeometry(
    boundShape,
    hasArrowhead ? void 0 : { context: "@tldraw/arrow-without-arrowhead" }
  );
  return {
    shape: boundShape,
    transform,
    isClosed: geometry.isClosed,
    isExact: binding.props.isExact,
    didIntersect: false,
    geometry
  };
}
function getArrowTerminalInArrowSpace(editor, arrowPageTransform, binding, forceImprecise) {
  const boundShape = editor.getShape(binding.toId);
  if (!boundShape) {
    return new import_editor.Vec(0, 0);
  } else {
    const { point, size } = editor.getShapeGeometry(boundShape).bounds;
    const shapePoint = import_editor.Vec.Add(
      point,
      import_editor.Vec.MulV(
        // if the parent is the bound shape, then it's ALWAYS precise
        binding.props.isPrecise || forceImprecise ? binding.props.normalizedAnchor : { x: 0.5, y: 0.5 },
        size
      )
    );
    const pagePoint = import_editor.Mat.applyToPoint(editor.getShapePageTransform(boundShape), shapePoint);
    const arrowPoint = import_editor.Mat.applyToPoint(import_editor.Mat.Inverse(arrowPageTransform), pagePoint);
    return arrowPoint;
  }
}
const arrowBindingsCache = (0, import_store.createComputedCache)(
  "arrow bindings",
  (editor, arrow) => {
    const bindings = editor.getBindingsFromShape(arrow.id, "arrow");
    return {
      start: bindings.find((b) => b.props.terminal === "start"),
      end: bindings.find((b) => b.props.terminal === "end")
    };
  },
  {
    // we only look at the arrow IDs:
    areRecordsEqual: (a, b) => a.id === b.id,
    // the records should stay the same:
    areResultsEqual: (a, b) => a.start === b.start && a.end === b.end
  }
);
function getArrowBindings(editor, shape) {
  return arrowBindingsCache.get(editor, shape.id);
}
const arrowInfoCache = (0, import_store.createComputedCache)(
  "arrow info",
  (editor, shape) => {
    const bindings = getArrowBindings(editor, shape);
    if (shape.props.kind === "elbow") {
      const elbowInfo = (0, import_getElbowArrowInfo.getElbowArrowInfo)(editor, shape, bindings);
      if (!elbowInfo?.route) return (0, import_straight_arrow.getStraightArrowInfo)(editor, shape, bindings);
      const start = elbowInfo.swapOrder ? elbowInfo.B : elbowInfo.A;
      const end = elbowInfo.swapOrder ? elbowInfo.A : elbowInfo.B;
      return {
        type: "elbow",
        bindings,
        start: {
          handle: start.target,
          point: elbowInfo.route.points[0],
          arrowhead: shape.props.arrowheadStart
        },
        end: {
          handle: end.target,
          point: elbowInfo.route.points[elbowInfo.route.points.length - 1],
          arrowhead: shape.props.arrowheadEnd
        },
        elbow: elbowInfo,
        route: elbowInfo.route,
        isValid: true
      };
    }
    if (getIsArrowStraight(shape)) {
      return (0, import_straight_arrow.getStraightArrowInfo)(editor, shape, bindings);
    } else {
      return (0, import_curved_arrow.getCurvedArrowInfo)(editor, shape, bindings);
    }
  },
  {
    areRecordsEqual: (a, b) => a.props === b.props,
    areResultsEqual: import_editor.isEqualAllowingForFloatingPointErrors
  }
);
function getArrowInfo(editor, shape) {
  const id = typeof shape === "string" ? shape : shape.id;
  return arrowInfoCache.get(editor, id);
}
function getArrowTerminalsInArrowSpace(editor, shape, bindings) {
  const arrowPageTransform = editor.getShapePageTransform(shape);
  const boundShapeRelationships = getBoundShapeRelationships(
    editor,
    bindings.start?.toId,
    bindings.end?.toId
  );
  const start = bindings.start ? getArrowTerminalInArrowSpace(
    editor,
    arrowPageTransform,
    bindings.start,
    boundShapeRelationships === "double-bound" || boundShapeRelationships === "start-contains-end"
  ) : import_editor.Vec.From(shape.props.start);
  const end = bindings.end ? getArrowTerminalInArrowSpace(
    editor,
    arrowPageTransform,
    bindings.end,
    boundShapeRelationships === "double-bound" || boundShapeRelationships === "end-contains-start"
  ) : import_editor.Vec.From(shape.props.end);
  return { start, end };
}
function createOrUpdateArrowBinding(editor, arrow, target, props) {
  const arrowId = typeof arrow === "string" ? arrow : arrow.id;
  const targetId = typeof target === "string" ? target : target.id;
  const existingMany = editor.getBindingsFromShape(arrowId, "arrow").filter((b) => b.props.terminal === props.terminal);
  if (existingMany.length > 1) {
    editor.deleteBindings(existingMany.slice(1));
  }
  const existing = existingMany[0];
  if (existing) {
    editor.updateBinding({
      ...existing,
      toId: targetId,
      props
    });
  } else {
    editor.createBinding({
      type: "arrow",
      fromId: arrowId,
      toId: targetId,
      props
    });
  }
}
function removeArrowBinding(editor, arrow, terminal) {
  const existing = editor.getBindingsFromShape(arrow, "arrow").filter((b) => b.props.terminal === terminal);
  editor.deleteBindings(existing);
}
const MIN_ARROW_LENGTH = 10;
const BOUND_ARROW_OFFSET = 10;
const WAY_TOO_BIG_ARROW_BEND_FACTOR = 10;
const STROKE_SIZES = {
  s: 2,
  m: 3.5,
  l: 5,
  xl: 10
};
function getBoundShapeRelationships(editor, startShapeId, endShapeId) {
  if (!startShapeId || !endShapeId) return "safe";
  if (startShapeId === endShapeId) return "double-bound";
  const startBounds = editor.getShapePageBounds(startShapeId);
  const endBounds = editor.getShapePageBounds(endShapeId);
  if (startBounds && endBounds) {
    if (startBounds.contains(endBounds)) return "start-contains-end";
    if (endBounds.contains(startBounds)) return "end-contains-start";
  }
  return "safe";
}
//# sourceMappingURL=shared.js.map
