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
var curved_arrow_exports = {};
__export(curved_arrow_exports, {
  getCurvedArrowInfo: () => getCurvedArrowInfo
});
module.exports = __toCommonJS(curved_arrow_exports);
var import_editor = require("@tldraw/editor");
var import_shared = require("./shared");
var import_straight_arrow = require("./straight-arrow");
function getCurvedArrowInfo(editor, shape, bindings) {
  const { arrowheadEnd, arrowheadStart } = shape.props;
  const bend = shape.props.bend;
  if (Math.abs(bend) > Math.abs(shape.props.bend * (import_shared.WAY_TOO_BIG_ARROW_BEND_FACTOR * shape.props.scale))) {
    return (0, import_straight_arrow.getStraightArrowInfo)(editor, shape, bindings);
  }
  const terminalsInArrowSpace = (0, import_shared.getArrowTerminalsInArrowSpace)(editor, shape, bindings);
  const med = import_editor.Vec.Med(terminalsInArrowSpace.start, terminalsInArrowSpace.end);
  const distance = import_editor.Vec.Sub(terminalsInArrowSpace.end, terminalsInArrowSpace.start);
  const u = import_editor.Vec.Len(distance) ? distance.uni() : import_editor.Vec.From(distance);
  const middle = import_editor.Vec.Add(med, u.per().mul(-bend));
  const startShapeInfo = (0, import_shared.getBoundShapeInfoForTerminal)(editor, shape, "start");
  const endShapeInfo = (0, import_shared.getBoundShapeInfoForTerminal)(editor, shape, "end");
  const a = terminalsInArrowSpace.start.clone();
  const b = terminalsInArrowSpace.end.clone();
  const c = middle.clone();
  if (import_editor.Vec.Equals(a, b)) {
    return {
      bindings,
      isStraight: true,
      start: {
        handle: a,
        point: a,
        arrowhead: shape.props.arrowheadStart
      },
      end: {
        handle: b,
        point: b,
        arrowhead: shape.props.arrowheadEnd
      },
      middle: c,
      isValid: false,
      length: 0
    };
  }
  const isClockwise = shape.props.bend < 0;
  const distFn = isClockwise ? import_editor.clockwiseAngleDist : import_editor.counterClockwiseAngleDist;
  const handleArc = getArcInfo(a, b, c);
  const handle_aCA = import_editor.Vec.Angle(handleArc.center, a);
  const handle_aCB = import_editor.Vec.Angle(handleArc.center, b);
  const handle_dAB = distFn(handle_aCA, handle_aCB);
  if (handleArc.length === 0 || handleArc.size === 0 || !(0, import_editor.isSafeFloat)(handleArc.length) || !(0, import_editor.isSafeFloat)(handleArc.size)) {
    return (0, import_straight_arrow.getStraightArrowInfo)(editor, shape, bindings);
  }
  const tempA = a.clone();
  const tempB = b.clone();
  const tempC = c.clone();
  const arrowPageTransform = editor.getShapePageTransform(shape);
  let offsetA = 0;
  let offsetB = 0;
  let minLength = import_shared.MIN_ARROW_LENGTH * shape.props.scale;
  if (startShapeInfo && !startShapeInfo.isExact) {
    const startInPageSpace = import_editor.Mat.applyToPoint(arrowPageTransform, tempA);
    const centerInPageSpace = import_editor.Mat.applyToPoint(arrowPageTransform, handleArc.center);
    const endInPageSpace = import_editor.Mat.applyToPoint(arrowPageTransform, tempB);
    const inverseTransform = import_editor.Mat.Inverse(startShapeInfo.transform);
    const startInStartShapeLocalSpace = import_editor.Mat.applyToPoint(inverseTransform, startInPageSpace);
    const centerInStartShapeLocalSpace = import_editor.Mat.applyToPoint(inverseTransform, centerInPageSpace);
    const endInStartShapeLocalSpace = import_editor.Mat.applyToPoint(inverseTransform, endInPageSpace);
    const { isClosed } = startShapeInfo;
    const fn = isClosed ? import_editor.intersectCirclePolygon : import_editor.intersectCirclePolyline;
    let point;
    let intersections = fn(centerInStartShapeLocalSpace, handleArc.radius, startShapeInfo.outline);
    if (intersections) {
      const angleToStart = centerInStartShapeLocalSpace.angle(startInStartShapeLocalSpace);
      const angleToEnd = centerInStartShapeLocalSpace.angle(endInStartShapeLocalSpace);
      const dAB2 = distFn(angleToStart, angleToEnd);
      intersections = intersections.filter(
        (pt) => distFn(angleToStart, centerInStartShapeLocalSpace.angle(pt)) <= dAB2
      );
      const targetDist = dAB2 * 0.25;
      intersections.sort(
        isClosed ? (p0, p1) => Math.abs(distFn(angleToStart, centerInStartShapeLocalSpace.angle(p0)) - targetDist) < Math.abs(distFn(angleToStart, centerInStartShapeLocalSpace.angle(p1)) - targetDist) ? -1 : 1 : (p0, p1) => distFn(angleToStart, centerInStartShapeLocalSpace.angle(p0)) < distFn(angleToStart, centerInStartShapeLocalSpace.angle(p1)) ? -1 : 1
      );
      point = intersections[0] ?? (isClosed ? void 0 : startInStartShapeLocalSpace);
    } else {
      point = isClosed ? void 0 : startInStartShapeLocalSpace;
    }
    if (point) {
      tempA.setTo(
        editor.getPointInShapeSpace(shape, import_editor.Mat.applyToPoint(startShapeInfo.transform, point))
      );
      startShapeInfo.didIntersect = true;
      if (arrowheadStart !== "none") {
        const strokeOffset = import_shared.STROKE_SIZES[shape.props.size] / 2 + ("size" in startShapeInfo.shape.props ? import_shared.STROKE_SIZES[startShapeInfo.shape.props.size] / 2 : 0);
        offsetA = (import_shared.BOUND_ARROW_OFFSET + strokeOffset) * shape.props.scale;
        minLength += strokeOffset * shape.props.scale;
      }
    }
  }
  if (endShapeInfo && !endShapeInfo.isExact) {
    const startInPageSpace = import_editor.Mat.applyToPoint(arrowPageTransform, tempA);
    const endInPageSpace = import_editor.Mat.applyToPoint(arrowPageTransform, tempB);
    const centerInPageSpace = import_editor.Mat.applyToPoint(arrowPageTransform, handleArc.center);
    const inverseTransform = import_editor.Mat.Inverse(endShapeInfo.transform);
    const startInEndShapeLocalSpace = import_editor.Mat.applyToPoint(inverseTransform, startInPageSpace);
    const centerInEndShapeLocalSpace = import_editor.Mat.applyToPoint(inverseTransform, centerInPageSpace);
    const endInEndShapeLocalSpace = import_editor.Mat.applyToPoint(inverseTransform, endInPageSpace);
    const isClosed = endShapeInfo.isClosed;
    const fn = isClosed ? import_editor.intersectCirclePolygon : import_editor.intersectCirclePolyline;
    let point;
    let intersections = fn(centerInEndShapeLocalSpace, handleArc.radius, endShapeInfo.outline);
    if (intersections) {
      const angleToStart = centerInEndShapeLocalSpace.angle(startInEndShapeLocalSpace);
      const angleToEnd = centerInEndShapeLocalSpace.angle(endInEndShapeLocalSpace);
      const dAB2 = distFn(angleToStart, angleToEnd);
      const targetDist = dAB2 * 0.75;
      intersections = intersections.filter(
        (pt) => distFn(angleToStart, centerInEndShapeLocalSpace.angle(pt)) <= dAB2
      );
      intersections.sort(
        isClosed ? (p0, p1) => Math.abs(distFn(angleToStart, centerInEndShapeLocalSpace.angle(p0)) - targetDist) < Math.abs(distFn(angleToStart, centerInEndShapeLocalSpace.angle(p1)) - targetDist) ? -1 : 1 : (p0, p1) => distFn(angleToStart, centerInEndShapeLocalSpace.angle(p0)) < distFn(angleToStart, centerInEndShapeLocalSpace.angle(p1)) ? -1 : 1
      );
      if (intersections[0]) {
        point = intersections[0];
      } else {
        point = isClosed ? void 0 : endInEndShapeLocalSpace;
      }
    } else {
      point = isClosed ? void 0 : endInEndShapeLocalSpace;
    }
    if (point) {
      tempB.setTo(
        editor.getPointInShapeSpace(shape, import_editor.Mat.applyToPoint(endShapeInfo.transform, point))
      );
      endShapeInfo.didIntersect = true;
      if (arrowheadEnd !== "none") {
        const strokeOffset = import_shared.STROKE_SIZES[shape.props.size] / 2 + ("size" in endShapeInfo.shape.props ? import_shared.STROKE_SIZES[endShapeInfo.shape.props.size] / 2 : 0);
        offsetB = (import_shared.BOUND_ARROW_OFFSET + strokeOffset) * shape.props.scale;
        minLength += strokeOffset * shape.props.scale;
      }
    }
  }
  let aCA = import_editor.Vec.Angle(handleArc.center, tempA);
  let aCB = import_editor.Vec.Angle(handleArc.center, tempB);
  let dAB = distFn(aCA, aCB);
  let lAB = dAB * handleArc.radius;
  const tA = tempA.clone();
  const tB = tempB.clone();
  if (offsetA !== 0) {
    tA.setTo(handleArc.center).add(
      import_editor.Vec.FromAngle(aCA + dAB * (offsetA / lAB * (isClockwise ? 1 : -1))).mul(handleArc.radius)
    );
  }
  if (offsetB !== 0) {
    tB.setTo(handleArc.center).add(
      import_editor.Vec.FromAngle(aCB + dAB * (offsetB / lAB * (isClockwise ? -1 : 1))).mul(handleArc.radius)
    );
  }
  if (import_editor.Vec.DistMin(tA, tB, minLength)) {
    if (offsetA !== 0 && offsetB !== 0) {
      offsetA *= -1.5;
      offsetB *= -1.5;
    } else if (offsetA !== 0) {
      offsetA *= -2;
    } else if (offsetB !== 0) {
      offsetB *= -2;
    } else {
    }
  }
  if (offsetA !== 0) {
    tempA.setTo(handleArc.center).add(
      import_editor.Vec.FromAngle(aCA + dAB * (offsetA / lAB * (isClockwise ? 1 : -1))).mul(handleArc.radius)
    );
  }
  if (offsetB !== 0) {
    tempB.setTo(handleArc.center).add(
      import_editor.Vec.FromAngle(aCB + dAB * (offsetB / lAB * (isClockwise ? -1 : 1))).mul(handleArc.radius)
    );
  }
  if (startShapeInfo && endShapeInfo && !startShapeInfo.isExact && !endShapeInfo.isExact) {
    aCA = import_editor.Vec.Angle(handleArc.center, tempA);
    aCB = import_editor.Vec.Angle(handleArc.center, tempB);
    dAB = distFn(aCA, aCB);
    lAB = dAB * handleArc.radius;
    const relationship = (0, import_shared.getBoundShapeRelationships)(
      editor,
      startShapeInfo.shape.id,
      endShapeInfo.shape.id
    );
    if (relationship === "double-bound" && lAB < 30) {
      tempA.setTo(a);
      tempB.setTo(b);
      tempC.setTo(c);
    } else if (relationship === "safe") {
      if (startShapeInfo && !startShapeInfo.didIntersect) {
        tempA.setTo(a);
      }
      if (endShapeInfo && !endShapeInfo.didIntersect || distFn(handle_aCA, aCA) > distFn(handle_aCA, aCB)) {
        tempB.setTo(handleArc.center).add(
          import_editor.Vec.FromAngle(
            aCA + dAB * (Math.min(0.9, import_shared.MIN_ARROW_LENGTH * shape.props.scale / lAB) * (isClockwise ? 1 : -1))
          ).mul(handleArc.radius)
        );
      }
    }
  }
  placeCenterHandle(
    handleArc.center,
    handleArc.radius,
    tempA,
    tempB,
    tempC,
    handle_dAB,
    isClockwise
  );
  if (tempA.equals(tempB)) {
    tempA.setTo(tempC.clone().addXY(1, 1));
    tempB.setTo(tempC.clone().subXY(1, 1));
  }
  a.setTo(tempA);
  b.setTo(tempB);
  c.setTo(tempC);
  const bodyArc = getArcInfo(a, b, c);
  return {
    bindings,
    isStraight: false,
    start: {
      point: a,
      handle: terminalsInArrowSpace.start,
      arrowhead: shape.props.arrowheadStart
    },
    end: {
      point: b,
      handle: terminalsInArrowSpace.end,
      arrowhead: shape.props.arrowheadEnd
    },
    middle: c,
    handleArc,
    bodyArc,
    isValid: bodyArc.length !== 0 && isFinite(bodyArc.center.x) && isFinite(bodyArc.center.y)
  };
}
function getArcInfo(a, b, c) {
  const center = (0, import_editor.centerOfCircleFromThreePoints)(a, b, c) ?? import_editor.Vec.Med(a, b);
  const radius = import_editor.Vec.Dist(center, a);
  const sweepFlag = +import_editor.Vec.Clockwise(a, c, b);
  const ab = ((a.y - b.y) ** 2 + (a.x - b.x) ** 2) ** 0.5;
  const bc = ((b.y - c.y) ** 2 + (b.x - c.x) ** 2) ** 0.5;
  const ca = ((c.y - a.y) ** 2 + (c.x - a.x) ** 2) ** 0.5;
  const theta = Math.acos((bc * bc + ca * ca - ab * ab) / (2 * bc * ca)) * 2;
  const largeArcFlag = +(import_editor.PI > theta);
  const size = (import_editor.PI2 - theta) * (sweepFlag ? 1 : -1);
  const length = size * radius;
  return {
    center,
    radius,
    size,
    length,
    largeArcFlag,
    sweepFlag
  };
}
function placeCenterHandle(center, radius, tempA, tempB, tempC, originalArcLength, isClockwise) {
  const aCA = import_editor.Vec.Angle(center, tempA);
  const aCB = import_editor.Vec.Angle(center, tempB);
  let dAB = (0, import_editor.clockwiseAngleDist)(aCA, aCB);
  if (!isClockwise) dAB = import_editor.PI2 - dAB;
  tempC.setTo(center).add(import_editor.Vec.FromAngle(aCA + dAB * (0.5 * (isClockwise ? 1 : -1))).mul(radius));
  if (dAB > originalArcLength) {
    tempC.rotWith(center, import_editor.PI);
    const t = tempB.clone();
    tempB.setTo(tempA);
    tempA.setTo(t);
  }
}
//# sourceMappingURL=curved-arrow.js.map
