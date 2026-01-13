"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
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
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name]() {
    return __privateGet(this, extra);
  }, set [name](x) {
    return __privateSet(this, extra, x);
  } }, name));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var BoundsSnaps_exports = {};
__export(BoundsSnaps_exports, {
  BoundsSnaps: () => BoundsSnaps
});
module.exports = __toCommonJS(BoundsSnaps_exports);
var import_state = require("@tldraw/state");
var import_utils = require("@tldraw/utils");
var import_Box = require("../../../primitives/Box");
var import_Mat = require("../../../primitives/Mat");
var import_Vec = require("../../../primitives/Vec");
var import_utils2 = require("../../../primitives/utils");
var _getVisibleGaps_dec, _getSnappableGapNodes_dec, _getSnappablePoints_dec, _getSnapPointsCache_dec, _init;
const round = (x) => {
  const decimalPlacesTolerance = 8;
  return Math.round(x * 10 ** decimalPlacesTolerance) / 10 ** decimalPlacesTolerance;
};
function findAdjacentGaps(gaps, shapeId, gapLength, direction, intersection) {
  const matches = gaps.filter(
    (gap) => (direction === "forward" ? gap.startNode.id === shapeId : gap.endNode.id === shapeId) && round(gap.length) === round(gapLength) && (0, import_utils2.rangeIntersection)(
      gap.breadthIntersection[0],
      gap.breadthIntersection[1],
      intersection[0],
      intersection[1]
    )
  );
  if (matches.length === 0) return [];
  const nextNodes = /* @__PURE__ */ new Set();
  matches.forEach((match) => {
    const node = direction === "forward" ? match.endNode.id : match.startNode.id;
    if (!nextNodes.has(node)) {
      nextNodes.add(node);
      const foundGaps = findAdjacentGaps(
        gaps,
        node,
        gapLength,
        direction,
        (0, import_utils2.rangeIntersection)(
          match.breadthIntersection[0],
          match.breadthIntersection[1],
          intersection[0],
          intersection[1]
        )
      );
      matches.push(...foundGaps);
    }
  });
  return matches;
}
function dedupeGapSnaps(snaps) {
  snaps.sort((a, b) => b.gaps.length - a.gaps.length);
  for (let i = snaps.length - 1; i > 0; i--) {
    const snap = snaps[i];
    for (let j = i - 1; j >= 0; j--) {
      const otherSnap = snaps[j];
      if (otherSnap.direction === snap.direction && snap.gaps.every(
        (gap) => otherSnap.gaps.some(
          (otherGap) => round(gap.startEdge[0].x) === round(otherGap.startEdge[0].x) && round(gap.startEdge[0].y) === round(otherGap.startEdge[0].y) && round(gap.startEdge[1].x) === round(otherGap.startEdge[1].x) && round(gap.startEdge[1].y) === round(otherGap.startEdge[1].y)
        ) && otherSnap.gaps.some(
          (otherGap) => round(gap.endEdge[0].x) === round(otherGap.endEdge[0].x) && round(gap.endEdge[0].y) === round(otherGap.endEdge[0].y) && round(gap.endEdge[1].x) === round(otherGap.endEdge[1].x) && round(gap.endEdge[1].y) === round(otherGap.endEdge[1].y)
        )
      )) {
        snaps.splice(i, 1);
        break;
      }
    }
  }
}
_getSnapPointsCache_dec = [import_state.computed], _getSnappablePoints_dec = [import_state.computed], _getSnappableGapNodes_dec = [import_state.computed], _getVisibleGaps_dec = [import_state.computed];
class BoundsSnaps {
  constructor(manager) {
    this.manager = manager;
    __runInitializers(_init, 5, this);
    __publicField(this, "editor");
    this.editor = manager.editor;
  }
  getSnapPointsCache() {
    const { editor } = this;
    return editor.store.createComputedCache("snapPoints", (shape) => {
      const pageTransform = editor.getShapePageTransform(shape.id);
      if (!pageTransform) return void 0;
      const boundsSnapGeometry = editor.getShapeUtil(shape).getBoundsSnapGeometry(shape);
      const snapPoints = boundsSnapGeometry.points ?? editor.getShapeGeometry(shape).bounds.cornersAndCenter;
      if (!pageTransform || !snapPoints) return void 0;
      return snapPoints.map((point, i) => {
        const { x, y } = import_Mat.Mat.applyToPoint(pageTransform, point);
        return { x, y, id: `${shape.id}:${i}` };
      });
    });
  }
  getSnapPoints(shapeId) {
    return this.getSnapPointsCache().get(shapeId) ?? [];
  }
  getSnappablePoints() {
    const snapPointsCache = this.getSnapPointsCache();
    const snappableShapes = this.manager.getSnappableShapes();
    const result = [];
    for (const shapeId of snappableShapes) {
      const snapPoints = snapPointsCache.get(shapeId);
      if (snapPoints) {
        result.push(...snapPoints);
      }
    }
    return result;
  }
  getSnappableGapNodes() {
    return Array.from(this.manager.getSnappableShapes(), (shapeId) => ({
      id: shapeId,
      pageBounds: (0, import_utils.assertExists)(this.editor.getShapePageBounds(shapeId))
    }));
  }
  getVisibleGaps() {
    const horizontal = [];
    const vertical = [];
    let startNode, endNode;
    const sortedShapesOnCurrentPageHorizontal = this.getSnappableGapNodes().sort((a, b) => {
      return a.pageBounds.minX - b.pageBounds.minX;
    });
    for (let i = 0; i < sortedShapesOnCurrentPageHorizontal.length; i++) {
      startNode = sortedShapesOnCurrentPageHorizontal[i];
      for (let j = i + 1; j < sortedShapesOnCurrentPageHorizontal.length; j++) {
        endNode = sortedShapesOnCurrentPageHorizontal[j];
        if (
          // is there space between the boxes
          startNode.pageBounds.maxX < endNode.pageBounds.minX && // and they overlap in the y axis
          (0, import_utils2.rangesOverlap)(
            startNode.pageBounds.minY,
            startNode.pageBounds.maxY,
            endNode.pageBounds.minY,
            endNode.pageBounds.maxY
          )
        ) {
          horizontal.push({
            startNode,
            endNode,
            startEdge: [
              new import_Vec.Vec(startNode.pageBounds.maxX, startNode.pageBounds.minY),
              new import_Vec.Vec(startNode.pageBounds.maxX, startNode.pageBounds.maxY)
            ],
            endEdge: [
              new import_Vec.Vec(endNode.pageBounds.minX, endNode.pageBounds.minY),
              new import_Vec.Vec(endNode.pageBounds.minX, endNode.pageBounds.maxY)
            ],
            length: endNode.pageBounds.minX - startNode.pageBounds.maxX,
            breadthIntersection: (0, import_utils2.rangeIntersection)(
              startNode.pageBounds.minY,
              startNode.pageBounds.maxY,
              endNode.pageBounds.minY,
              endNode.pageBounds.maxY
            )
          });
        }
      }
    }
    const sortedShapesOnCurrentPageVertical = sortedShapesOnCurrentPageHorizontal.sort((a, b) => {
      return a.pageBounds.minY - b.pageBounds.minY;
    });
    for (let i = 0; i < sortedShapesOnCurrentPageVertical.length; i++) {
      startNode = sortedShapesOnCurrentPageVertical[i];
      for (let j = i + 1; j < sortedShapesOnCurrentPageVertical.length; j++) {
        endNode = sortedShapesOnCurrentPageVertical[j];
        if (
          // is there space between the boxes
          startNode.pageBounds.maxY < endNode.pageBounds.minY && // do they overlap in the x axis
          (0, import_utils2.rangesOverlap)(
            startNode.pageBounds.minX,
            startNode.pageBounds.maxX,
            endNode.pageBounds.minX,
            endNode.pageBounds.maxX
          )
        ) {
          vertical.push({
            startNode,
            endNode,
            startEdge: [
              new import_Vec.Vec(startNode.pageBounds.minX, startNode.pageBounds.maxY),
              new import_Vec.Vec(startNode.pageBounds.maxX, startNode.pageBounds.maxY)
            ],
            endEdge: [
              new import_Vec.Vec(endNode.pageBounds.minX, endNode.pageBounds.minY),
              new import_Vec.Vec(endNode.pageBounds.maxX, endNode.pageBounds.minY)
            ],
            length: endNode.pageBounds.minY - startNode.pageBounds.maxY,
            breadthIntersection: (0, import_utils2.rangeIntersection)(
              startNode.pageBounds.minX,
              startNode.pageBounds.maxX,
              endNode.pageBounds.minX,
              endNode.pageBounds.maxX
            )
          });
        }
      }
    }
    return { horizontal, vertical };
  }
  snapTranslateShapes({
    lockedAxis,
    initialSelectionPageBounds,
    initialSelectionSnapPoints,
    dragDelta
  }) {
    const snapThreshold = this.manager.getSnapThreshold();
    const visibleSnapPointsNotInSelection = this.getSnappablePoints();
    const selectionPageBounds = initialSelectionPageBounds.clone().translate(dragDelta);
    const selectionSnapPoints = initialSelectionSnapPoints.map(
      ({ x, y }, i) => ({
        id: "selection:" + i,
        x: x + dragDelta.x,
        y: y + dragDelta.y
      })
    );
    const otherNodeSnapPoints = visibleSnapPointsNotInSelection;
    const nearestSnapsX = [];
    const nearestSnapsY = [];
    const minOffset = new import_Vec.Vec(snapThreshold, snapThreshold);
    this.collectPointSnaps({
      minOffset,
      nearestSnapsX,
      nearestSnapsY,
      otherNodeSnapPoints,
      selectionSnapPoints
    });
    this.collectGapSnaps({
      selectionPageBounds,
      nearestSnapsX,
      nearestSnapsY,
      minOffset
    });
    const nudge = new import_Vec.Vec(
      lockedAxis === "x" ? 0 : nearestSnapsX[0]?.nudge ?? 0,
      lockedAxis === "y" ? 0 : nearestSnapsY[0]?.nudge ?? 0
    );
    minOffset.x = 0;
    minOffset.y = 0;
    nearestSnapsX.length = 0;
    nearestSnapsY.length = 0;
    selectionSnapPoints.forEach((s) => {
      s.x += nudge.x;
      s.y += nudge.y;
    });
    selectionPageBounds.translate(nudge);
    this.collectPointSnaps({
      minOffset,
      nearestSnapsX,
      nearestSnapsY,
      otherNodeSnapPoints,
      selectionSnapPoints
    });
    this.collectGapSnaps({
      selectionPageBounds,
      nearestSnapsX,
      nearestSnapsY,
      minOffset
    });
    const pointSnapsLines = this.getPointSnapLines({
      nearestSnapsX,
      nearestSnapsY
    });
    const gapSnapLines = this.getGapSnapLines({
      selectionPageBounds,
      nearestSnapsX,
      nearestSnapsY
    });
    this.manager.setIndicators([...gapSnapLines, ...pointSnapsLines]);
    return { nudge };
  }
  snapResizeShapes({
    initialSelectionPageBounds,
    dragDelta,
    handle: originalHandle,
    isAspectRatioLocked,
    isResizingFromCenter
  }) {
    const snapThreshold = this.manager.getSnapThreshold();
    const {
      box: unsnappedResizedPageBounds,
      scaleX,
      scaleY
    } = import_Box.Box.Resize(
      initialSelectionPageBounds,
      originalHandle,
      isResizingFromCenter ? dragDelta.x * 2 : dragDelta.x,
      isResizingFromCenter ? dragDelta.y * 2 : dragDelta.y,
      isAspectRatioLocked
    );
    let handle = originalHandle;
    if (scaleX < 0) {
      handle = (0, import_Box.flipSelectionHandleX)(handle);
    }
    if (scaleY < 0) {
      handle = (0, import_Box.flipSelectionHandleY)(handle);
    }
    if (isResizingFromCenter) {
      unsnappedResizedPageBounds.center = initialSelectionPageBounds.center;
    }
    const isXLocked = handle === "top" || handle === "bottom";
    const isYLocked = handle === "left" || handle === "right";
    const selectionSnapPoints = getResizeSnapPointsForHandle(handle, unsnappedResizedPageBounds);
    const otherNodeSnapPoints = this.getSnappablePoints();
    const nearestSnapsX = [];
    const nearestSnapsY = [];
    const minOffset = new import_Vec.Vec(snapThreshold, snapThreshold);
    this.collectPointSnaps({
      minOffset,
      nearestSnapsX,
      nearestSnapsY,
      otherNodeSnapPoints,
      selectionSnapPoints
    });
    const nudge = new import_Vec.Vec(
      isXLocked ? 0 : nearestSnapsX[0]?.nudge ?? 0,
      isYLocked ? 0 : nearestSnapsY[0]?.nudge ?? 0
    );
    if (isAspectRatioLocked && (0, import_Box.isSelectionCorner)(handle) && nudge.len() !== 0) {
      const primaryNudgeAxis = nearestSnapsX.length && nearestSnapsY.length ? Math.abs(nudge.x) < Math.abs(nudge.y) ? "x" : "y" : nearestSnapsX.length ? "x" : "y";
      const ratio = initialSelectionPageBounds.aspectRatio;
      if (primaryNudgeAxis === "x") {
        nearestSnapsY.length = 0;
        nudge.y = nudge.x / ratio;
        if (handle === "bottom_left" || handle === "top_right") {
          nudge.y = -nudge.y;
        }
      } else {
        nearestSnapsX.length = 0;
        nudge.x = nudge.y * ratio;
        if (handle === "bottom_left" || handle === "top_right") {
          nudge.x = -nudge.x;
        }
      }
    }
    const snappedDelta = import_Vec.Vec.Add(dragDelta, nudge);
    const { box: snappedResizedPageBounds } = import_Box.Box.Resize(
      initialSelectionPageBounds,
      originalHandle,
      isResizingFromCenter ? snappedDelta.x * 2 : snappedDelta.x,
      isResizingFromCenter ? snappedDelta.y * 2 : snappedDelta.y,
      isAspectRatioLocked
    );
    if (isResizingFromCenter) {
      snappedResizedPageBounds.center = initialSelectionPageBounds.center;
    }
    const snappedSelectionPoints = getResizeSnapPointsForHandle("any", snappedResizedPageBounds);
    nearestSnapsX.length = 0;
    nearestSnapsY.length = 0;
    minOffset.x = 0;
    minOffset.y = 0;
    this.collectPointSnaps({
      minOffset,
      nearestSnapsX,
      nearestSnapsY,
      otherNodeSnapPoints,
      selectionSnapPoints: snappedSelectionPoints
    });
    const pointSnaps = this.getPointSnapLines({
      nearestSnapsX,
      nearestSnapsY
    });
    this.manager.setIndicators([...pointSnaps]);
    return { nudge };
  }
  collectPointSnaps({
    selectionSnapPoints,
    otherNodeSnapPoints,
    minOffset,
    nearestSnapsX,
    nearestSnapsY
  }) {
    for (const thisSnapPoint of selectionSnapPoints) {
      for (const otherSnapPoint of otherNodeSnapPoints) {
        const offset = import_Vec.Vec.Sub(thisSnapPoint, otherSnapPoint);
        const offsetX = Math.abs(offset.x);
        const offsetY = Math.abs(offset.y);
        if (round(offsetX) <= round(minOffset.x)) {
          if (round(offsetX) < round(minOffset.x)) {
            nearestSnapsX.length = 0;
          }
          nearestSnapsX.push({
            type: "points",
            points: { thisPoint: thisSnapPoint, otherPoint: otherSnapPoint },
            nudge: otherSnapPoint.x - thisSnapPoint.x
          });
          minOffset.x = offsetX;
        }
        if (round(offsetY) <= round(minOffset.y)) {
          if (round(offsetY) < round(minOffset.y)) {
            nearestSnapsY.length = 0;
          }
          nearestSnapsY.push({
            type: "points",
            points: { thisPoint: thisSnapPoint, otherPoint: otherSnapPoint },
            nudge: otherSnapPoint.y - thisSnapPoint.y
          });
          minOffset.y = offsetY;
        }
      }
    }
  }
  collectGapSnaps({
    selectionPageBounds,
    minOffset,
    nearestSnapsX,
    nearestSnapsY
  }) {
    const { horizontal, vertical } = this.getVisibleGaps();
    for (const gap of horizontal) {
      if (!(0, import_utils2.rangesOverlap)(
        gap.breadthIntersection[0],
        gap.breadthIntersection[1],
        selectionPageBounds.minY,
        selectionPageBounds.maxY
      )) {
        continue;
      }
      const gapMidX = gap.startEdge[0].x + gap.length / 2;
      const centerNudge = gapMidX - selectionPageBounds.center.x;
      const gapIsLargerThanSelection = gap.length > selectionPageBounds.width;
      if (gapIsLargerThanSelection && round(Math.abs(centerNudge)) <= round(minOffset.x)) {
        if (round(Math.abs(centerNudge)) < round(minOffset.x)) {
          nearestSnapsX.length = 0;
        }
        minOffset.x = Math.abs(centerNudge);
        const snap = {
          type: "gap_center",
          gap,
          nudge: centerNudge
        };
        const otherCenterSnap = nearestSnapsX.find(({ type }) => type === "gap_center");
        const gapBreadthsOverlap = otherCenterSnap && (0, import_utils2.rangeIntersection)(
          gap.breadthIntersection[0],
          gap.breadthIntersection[1],
          otherCenterSnap.gap.breadthIntersection[0],
          otherCenterSnap.gap.breadthIntersection[1]
        );
        if (otherCenterSnap && otherCenterSnap.gap.length > gap.length && gapBreadthsOverlap) {
          nearestSnapsX[nearestSnapsX.indexOf(otherCenterSnap)] = snap;
        } else if (!otherCenterSnap || !gapBreadthsOverlap) {
          nearestSnapsX.push(snap);
        }
      }
      const duplicationLeftX = gap.startNode.pageBounds.minX - gap.length;
      const selectionRightX = selectionPageBounds.maxX;
      const duplicationLeftNudge = duplicationLeftX - selectionRightX;
      if (round(Math.abs(duplicationLeftNudge)) <= round(minOffset.x)) {
        if (round(Math.abs(duplicationLeftNudge)) < round(minOffset.x)) {
          nearestSnapsX.length = 0;
        }
        minOffset.x = Math.abs(duplicationLeftNudge);
        nearestSnapsX.push({
          type: "gap_duplicate",
          gap,
          protrusionDirection: "left",
          nudge: duplicationLeftNudge
        });
      }
      const duplicationRightX = gap.endNode.pageBounds.maxX + gap.length;
      const selectionLeftX = selectionPageBounds.minX;
      const duplicationRightNudge = duplicationRightX - selectionLeftX;
      if (round(Math.abs(duplicationRightNudge)) <= round(minOffset.x)) {
        if (round(Math.abs(duplicationRightNudge)) < round(minOffset.x)) {
          nearestSnapsX.length = 0;
        }
        minOffset.x = Math.abs(duplicationRightNudge);
        nearestSnapsX.push({
          type: "gap_duplicate",
          gap,
          protrusionDirection: "right",
          nudge: duplicationRightNudge
        });
      }
    }
    for (const gap of vertical) {
      if (!(0, import_utils2.rangesOverlap)(
        gap.breadthIntersection[0],
        gap.breadthIntersection[1],
        selectionPageBounds.minX,
        selectionPageBounds.maxX
      )) {
        continue;
      }
      const gapMidY = gap.startEdge[0].y + gap.length / 2;
      const centerNudge = gapMidY - selectionPageBounds.center.y;
      const gapIsLargerThanSelection = gap.length > selectionPageBounds.height;
      if (gapIsLargerThanSelection && round(Math.abs(centerNudge)) <= round(minOffset.y)) {
        if (round(Math.abs(centerNudge)) < round(minOffset.y)) {
          nearestSnapsY.length = 0;
        }
        minOffset.y = Math.abs(centerNudge);
        const snap = {
          type: "gap_center",
          gap,
          nudge: centerNudge
        };
        const otherCenterSnap = nearestSnapsY.find(({ type }) => type === "gap_center");
        const gapBreadthsOverlap = otherCenterSnap && (0, import_utils2.rangesOverlap)(
          otherCenterSnap.gap.breadthIntersection[0],
          otherCenterSnap.gap.breadthIntersection[1],
          gap.breadthIntersection[0],
          gap.breadthIntersection[1]
        );
        if (otherCenterSnap && otherCenterSnap.gap.length > gap.length && gapBreadthsOverlap) {
          nearestSnapsY[nearestSnapsY.indexOf(otherCenterSnap)] = snap;
        } else if (!otherCenterSnap || !gapBreadthsOverlap) {
          nearestSnapsY.push(snap);
        }
        continue;
      }
      const duplicationTopY = gap.startNode.pageBounds.minY - gap.length;
      const selectionBottomY = selectionPageBounds.maxY;
      const duplicationTopNudge = duplicationTopY - selectionBottomY;
      if (round(Math.abs(duplicationTopNudge)) <= round(minOffset.y)) {
        if (round(Math.abs(duplicationTopNudge)) < round(minOffset.y)) {
          nearestSnapsY.length = 0;
        }
        minOffset.y = Math.abs(duplicationTopNudge);
        nearestSnapsY.push({
          type: "gap_duplicate",
          gap,
          protrusionDirection: "top",
          nudge: duplicationTopNudge
        });
      }
      const duplicationBottomY = gap.endNode.pageBounds.maxY + gap.length;
      const selectionTopY = selectionPageBounds.minY;
      const duplicationBottomNudge = duplicationBottomY - selectionTopY;
      if (round(Math.abs(duplicationBottomNudge)) <= round(minOffset.y)) {
        if (round(Math.abs(duplicationBottomNudge)) < round(minOffset.y)) {
          nearestSnapsY.length = 0;
        }
        minOffset.y = Math.abs(duplicationBottomNudge);
        nearestSnapsY.push({
          type: "gap_duplicate",
          gap,
          protrusionDirection: "bottom",
          nudge: duplicationBottomNudge
        });
      }
    }
  }
  getPointSnapLines({
    nearestSnapsX,
    nearestSnapsY
  }) {
    const snapGroupsX = {};
    const snapGroupsY = {};
    if (nearestSnapsX.length > 0) {
      for (const snap of nearestSnapsX) {
        if (snap.type === "points") {
          const key = round(snap.points.otherPoint.x);
          if (!snapGroupsX[key]) {
            snapGroupsX[key] = [];
          }
          snapGroupsX[key].push(snap.points);
        }
      }
    }
    if (nearestSnapsY.length > 0) {
      for (const snap of nearestSnapsY) {
        if (snap.type === "points") {
          const key = round(snap.points.otherPoint.y);
          if (!snapGroupsY[key]) {
            snapGroupsY[key] = [];
          }
          snapGroupsY[key].push(snap.points);
        }
      }
    }
    return Object.values(snapGroupsX).concat(Object.values(snapGroupsY)).map((snapGroup) => ({
      id: (0, import_utils.uniqueId)(),
      type: "points",
      points: (0, import_utils.dedupe)(
        snapGroup.map((snap) => import_Vec.Vec.From(snap.otherPoint)).concat(snapGroup.map((snap) => import_Vec.Vec.From(snap.thisPoint))),
        (a, b) => a.equals(b)
      )
    }));
  }
  getGapSnapLines({
    selectionPageBounds,
    nearestSnapsX,
    nearestSnapsY
  }) {
    const { vertical, horizontal } = this.getVisibleGaps();
    const selectionSides = {
      top: selectionPageBounds.sides[0],
      right: selectionPageBounds.sides[1],
      // need bottom and left to be sorted asc, which .sides is not.
      bottom: [selectionPageBounds.corners[3], selectionPageBounds.corners[2]],
      left: [selectionPageBounds.corners[0], selectionPageBounds.corners[3]]
    };
    const result = [];
    if (nearestSnapsX.length > 0) {
      for (const snap of nearestSnapsX) {
        if (snap.type === "points") continue;
        const {
          gap: { breadthIntersection, startEdge, startNode, endNode, length, endEdge }
        } = snap;
        switch (snap.type) {
          case "gap_center": {
            const newGapsLength = (length - selectionPageBounds.width) / 2;
            const gapBreadthIntersection = (0, import_utils2.rangeIntersection)(
              breadthIntersection[0],
              breadthIntersection[1],
              selectionPageBounds.minY,
              selectionPageBounds.maxY
            );
            result.push({
              type: "gaps",
              direction: "horizontal",
              id: (0, import_utils.uniqueId)(),
              gaps: [
                ...findAdjacentGaps(
                  horizontal,
                  startNode.id,
                  newGapsLength,
                  "backward",
                  gapBreadthIntersection
                ),
                {
                  startEdge,
                  endEdge: selectionSides.left
                },
                {
                  startEdge: selectionSides.right,
                  endEdge
                },
                ...findAdjacentGaps(
                  horizontal,
                  endNode.id,
                  newGapsLength,
                  "forward",
                  gapBreadthIntersection
                )
              ]
            });
            break;
          }
          case "gap_duplicate": {
            const gapBreadthIntersection = (0, import_utils2.rangeIntersection)(
              breadthIntersection[0],
              breadthIntersection[1],
              selectionPageBounds.minY,
              selectionPageBounds.maxY
            );
            result.push({
              type: "gaps",
              direction: "horizontal",
              id: (0, import_utils.uniqueId)(),
              gaps: snap.protrusionDirection === "left" ? [
                {
                  startEdge: selectionSides.right,
                  endEdge: startEdge.map(
                    (v) => v.clone().addXY(-startNode.pageBounds.width, 0)
                  )
                },
                { startEdge, endEdge },
                ...findAdjacentGaps(
                  horizontal,
                  endNode.id,
                  length,
                  "forward",
                  gapBreadthIntersection
                )
              ] : [
                ...findAdjacentGaps(
                  horizontal,
                  startNode.id,
                  length,
                  "backward",
                  gapBreadthIntersection
                ),
                { startEdge, endEdge },
                {
                  startEdge: endEdge.map(
                    (v) => v.clone().addXY(snap.gap.endNode.pageBounds.width, 0)
                  ),
                  endEdge: selectionSides.left
                }
              ]
            });
            break;
          }
        }
      }
    }
    if (nearestSnapsY.length > 0) {
      for (const snap of nearestSnapsY) {
        if (snap.type === "points") continue;
        const {
          gap: { breadthIntersection, startEdge, startNode, endNode, length, endEdge }
        } = snap;
        switch (snap.type) {
          case "gap_center": {
            const newGapsLength = (length - selectionPageBounds.height) / 2;
            const gapBreadthIntersection = (0, import_utils2.rangeIntersection)(
              breadthIntersection[0],
              breadthIntersection[1],
              selectionPageBounds.minX,
              selectionPageBounds.maxX
            );
            result.push({
              type: "gaps",
              direction: "vertical",
              id: (0, import_utils.uniqueId)(),
              gaps: [
                ...findAdjacentGaps(
                  vertical,
                  startNode.id,
                  newGapsLength,
                  "backward",
                  gapBreadthIntersection
                ),
                {
                  startEdge,
                  endEdge: selectionSides.top
                },
                {
                  startEdge: selectionSides.bottom,
                  endEdge
                },
                ...findAdjacentGaps(
                  vertical,
                  snap.gap.endNode.id,
                  newGapsLength,
                  "forward",
                  gapBreadthIntersection
                )
              ]
            });
            break;
          }
          case "gap_duplicate":
            {
              const gapBreadthIntersection = (0, import_utils2.rangeIntersection)(
                breadthIntersection[0],
                breadthIntersection[1],
                selectionPageBounds.minX,
                selectionPageBounds.maxX
              );
              result.push({
                type: "gaps",
                direction: "vertical",
                id: (0, import_utils.uniqueId)(),
                gaps: snap.protrusionDirection === "top" ? [
                  {
                    startEdge: selectionSides.bottom,
                    endEdge: startEdge.map(
                      (v) => v.clone().addXY(0, -startNode.pageBounds.height)
                    )
                  },
                  { startEdge, endEdge },
                  ...findAdjacentGaps(
                    vertical,
                    endNode.id,
                    length,
                    "forward",
                    gapBreadthIntersection
                  )
                ] : [
                  ...findAdjacentGaps(
                    vertical,
                    startNode.id,
                    length,
                    "backward",
                    gapBreadthIntersection
                  ),
                  { startEdge, endEdge },
                  {
                    startEdge: endEdge.map(
                      (v) => v.clone().addXY(0, endNode.pageBounds.height)
                    ),
                    endEdge: selectionSides.top
                  }
                ]
              });
            }
            break;
        }
      }
    }
    dedupeGapSnaps(result);
    return result;
  }
}
_init = __decoratorStart(null);
__decorateElement(_init, 1, "getSnapPointsCache", _getSnapPointsCache_dec, BoundsSnaps);
__decorateElement(_init, 1, "getSnappablePoints", _getSnappablePoints_dec, BoundsSnaps);
__decorateElement(_init, 1, "getSnappableGapNodes", _getSnappableGapNodes_dec, BoundsSnaps);
__decorateElement(_init, 1, "getVisibleGaps", _getVisibleGaps_dec, BoundsSnaps);
__decoratorMetadata(_init, BoundsSnaps);
function getResizeSnapPointsForHandle(handle, selectionPageBounds) {
  const { minX, maxX, minY, maxY } = selectionPageBounds;
  const result = [];
  switch (handle) {
    case "top":
    case "left":
    case "top_left":
    case "any":
      result.push({
        id: "top_left",
        handle: "top_left",
        x: minX,
        y: minY
      });
  }
  switch (handle) {
    case "top":
    case "right":
    case "top_right":
    case "any":
      result.push({
        id: "top_right",
        handle: "top_right",
        x: maxX,
        y: minY
      });
  }
  switch (handle) {
    case "bottom":
    case "right":
    case "bottom_right":
    case "any":
      result.push({
        id: "bottom_right",
        handle: "bottom_right",
        x: maxX,
        y: maxY
      });
  }
  switch (handle) {
    case "bottom":
    case "left":
    case "bottom_left":
    case "any":
      result.push({
        id: "bottom_left",
        handle: "bottom_left",
        x: minX,
        y: maxY
      });
  }
  return result;
}
//# sourceMappingURL=BoundsSnaps.js.map
