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
var arrowLabel_exports = {};
__export(arrowLabel_exports, {
  getArrowLabelFontSize: () => getArrowLabelFontSize,
  getArrowLabelPosition: () => getArrowLabelPosition
});
module.exports = __toCommonJS(arrowLabel_exports);
var import_editor = require("@tldraw/editor");
var import_default_shape_constants = require("../shared/default-shape-constants");
var import_ArrowShapeUtil = require("./ArrowShapeUtil");
var import_shared = require("./shared");
const labelSizeCacheCache = new import_editor.WeakCache();
function getLabelSizeCache(editor) {
  return labelSizeCacheCache.get(editor, () => {
    return editor.store.createComputedCache("arrowLabelSize", (shape) => {
      const info = (0, import_shared.getArrowInfo)(editor, shape);
      let width = 0;
      let height = 0;
      const bodyGeom = info.isStraight ? new import_editor.Edge2d({
        start: import_editor.Vec.From(info.start.point),
        end: import_editor.Vec.From(info.end.point)
      }) : new import_editor.Arc2d({
        center: import_editor.Vec.Cast(info.handleArc.center),
        start: import_editor.Vec.Cast(info.start.point),
        end: import_editor.Vec.Cast(info.end.point),
        sweepFlag: info.bodyArc.sweepFlag,
        largeArcFlag: info.bodyArc.largeArcFlag
      });
      if (shape.props.text.trim()) {
        const bodyBounds = bodyGeom.bounds;
        const fontSize = getArrowLabelFontSize(shape);
        const { w, h } = editor.textMeasure.measureText(shape.props.text, {
          ...import_default_shape_constants.TEXT_PROPS,
          fontFamily: import_default_shape_constants.FONT_FAMILIES[shape.props.font],
          fontSize,
          maxWidth: null
        });
        width = w;
        height = h;
        let shouldSquish = false;
        if (bodyBounds.width > bodyBounds.height) {
          width = Math.max(Math.min(w, 64), Math.min(bodyBounds.width - 64, w));
          shouldSquish = true;
        } else if (width > 16 * fontSize) {
          width = 16 * fontSize;
          shouldSquish = true;
        }
        if (shouldSquish) {
          const { w: squishedWidth, h: squishedHeight } = editor.textMeasure.measureText(
            shape.props.text,
            {
              ...import_default_shape_constants.TEXT_PROPS,
              fontFamily: import_default_shape_constants.FONT_FAMILIES[shape.props.font],
              fontSize,
              maxWidth: width
            }
          );
          width = squishedWidth;
          height = squishedHeight;
        }
      }
      return new import_editor.Vec(width, height).addScalar(import_default_shape_constants.ARROW_LABEL_PADDING * 2 * shape.props.scale);
    });
  });
}
function getArrowLabelSize(editor, shape) {
  if (shape.props.text.trim() === "") {
    return new import_editor.Vec(0, 0).addScalar(import_default_shape_constants.ARROW_LABEL_PADDING * 2 * shape.props.scale);
  }
  return getLabelSizeCache(editor).get(shape.id) ?? new import_editor.Vec(0, 0);
}
function getLabelToArrowPadding(shape) {
  const strokeWidth = import_default_shape_constants.STROKE_SIZES[shape.props.size];
  const labelToArrowPadding = (import_default_shape_constants.LABEL_TO_ARROW_PADDING + (strokeWidth - import_default_shape_constants.STROKE_SIZES.s) * 2 + (strokeWidth === import_default_shape_constants.STROKE_SIZES.xl ? 20 : 0)) * shape.props.scale;
  return labelToArrowPadding;
}
function getStraightArrowLabelRange(editor, shape, info) {
  const labelSize = getArrowLabelSize(editor, shape);
  const labelToArrowPadding = getLabelToArrowPadding(shape);
  const startOffset = import_editor.Vec.Nudge(info.start.point, info.end.point, labelToArrowPadding);
  const endOffset = import_editor.Vec.Nudge(info.end.point, info.start.point, labelToArrowPadding);
  const intersectionPoints = (0, import_editor.intersectLineSegmentPolygon)(
    startOffset,
    endOffset,
    import_editor.Box.FromCenter(info.middle, labelSize).corners
  );
  if (!intersectionPoints || intersectionPoints.length !== 2) {
    return { start: 0.5, end: 0.5 };
  }
  let [startIntersect, endIntersect] = intersectionPoints;
  if (import_editor.Vec.Dist2(startIntersect, startOffset) > import_editor.Vec.Dist2(endIntersect, startOffset)) {
    ;
    [endIntersect, startIntersect] = intersectionPoints;
  }
  const startConstrained = startOffset.add(import_editor.Vec.Sub(info.middle, startIntersect));
  const endConstrained = endOffset.add(import_editor.Vec.Sub(info.middle, endIntersect));
  const start = import_editor.Vec.Dist(info.start.point, startConstrained) / info.length;
  const end = import_editor.Vec.Dist(info.start.point, endConstrained) / info.length;
  return { start, end };
}
function getCurvedArrowLabelRange(editor, shape, info) {
  const labelSize = getArrowLabelSize(editor, shape);
  const labelToArrowPadding = getLabelToArrowPadding(shape);
  const direction = Math.sign(shape.props.bend);
  const labelToArrowPaddingRad = labelToArrowPadding / info.handleArc.radius * direction;
  const startOffsetAngle = import_editor.Vec.Angle(info.bodyArc.center, info.start.point) - labelToArrowPaddingRad;
  const endOffsetAngle = import_editor.Vec.Angle(info.bodyArc.center, info.end.point) + labelToArrowPaddingRad;
  const startOffset = (0, import_editor.getPointOnCircle)(info.bodyArc.center, info.bodyArc.radius, startOffsetAngle);
  const endOffset = (0, import_editor.getPointOnCircle)(info.bodyArc.center, info.bodyArc.radius, endOffsetAngle);
  const dbg = [];
  const startIntersections = intersectArcPolygon(
    info.bodyArc.center,
    info.bodyArc.radius,
    startOffsetAngle,
    endOffsetAngle,
    direction,
    import_editor.Box.FromCenter(startOffset, labelSize).corners
  );
  dbg.push(
    new import_editor.Polygon2d({
      points: import_editor.Box.FromCenter(startOffset, labelSize).corners,
      debugColor: "lime",
      isFilled: false,
      ignore: true
    })
  );
  const endIntersections = intersectArcPolygon(
    info.bodyArc.center,
    info.bodyArc.radius,
    startOffsetAngle,
    endOffsetAngle,
    direction,
    import_editor.Box.FromCenter(endOffset, labelSize).corners
  );
  dbg.push(
    new import_editor.Polygon2d({
      points: import_editor.Box.FromCenter(endOffset, labelSize).corners,
      debugColor: "lime",
      isFilled: false,
      ignore: true
    })
  );
  for (const pt of [
    ...startIntersections ?? [],
    ...endIntersections ?? [],
    startOffset,
    endOffset
  ]) {
    dbg.push(
      new import_editor.Circle2d({
        x: pt.x - 3,
        y: pt.y - 3,
        radius: 3,
        isFilled: false,
        debugColor: "magenta",
        ignore: true
      })
    );
  }
  const startConstrained = (startIntersections && furthest(info.start.point, startIntersections)) ?? info.middle;
  const endConstrained = (endIntersections && furthest(info.end.point, endIntersections)) ?? info.middle;
  const startAngle = import_editor.Vec.Angle(info.bodyArc.center, info.start.point);
  const endAngle = import_editor.Vec.Angle(info.bodyArc.center, info.end.point);
  const constrainedStartAngle = import_editor.Vec.Angle(info.bodyArc.center, startConstrained);
  const constrainedEndAngle = import_editor.Vec.Angle(info.bodyArc.center, endConstrained);
  if ((0, import_editor.angleDistance)(startAngle, constrainedStartAngle, direction) > (0, import_editor.angleDistance)(startAngle, constrainedEndAngle, direction)) {
    return { start: 0.5, end: 0.5, dbg };
  }
  const fullDistance = (0, import_editor.angleDistance)(startAngle, endAngle, direction);
  const start = (0, import_editor.angleDistance)(startAngle, constrainedStartAngle, direction) / fullDistance;
  const end = (0, import_editor.angleDistance)(startAngle, constrainedEndAngle, direction) / fullDistance;
  return { start, end, dbg };
}
function getArrowLabelPosition(editor, shape) {
  let labelCenter;
  const debugGeom = [];
  const info = (0, import_shared.getArrowInfo)(editor, shape);
  const arrowheadInfo = {
    hasStartBinding: !!info.bindings.start,
    hasEndBinding: !!info.bindings.end,
    hasStartArrowhead: info.start.arrowhead !== "none",
    hasEndArrowhead: info.end.arrowhead !== "none"
  };
  if (info.isStraight) {
    const range = getStraightArrowLabelRange(editor, shape, info);
    const clampedPosition = getClampedPosition(editor, shape, range, arrowheadInfo);
    labelCenter = import_editor.Vec.Lrp(info.start.point, info.end.point, clampedPosition);
  } else {
    const range = getCurvedArrowLabelRange(editor, shape, info);
    if (range.dbg) debugGeom.push(...range.dbg);
    const clampedPosition = getClampedPosition(editor, shape, range, arrowheadInfo);
    const labelAngle = interpolateArcAngles(
      import_editor.Vec.Angle(info.bodyArc.center, info.start.point),
      import_editor.Vec.Angle(info.bodyArc.center, info.end.point),
      Math.sign(shape.props.bend),
      clampedPosition
    );
    labelCenter = (0, import_editor.getPointOnCircle)(info.bodyArc.center, info.bodyArc.radius, labelAngle);
  }
  const labelSize = getArrowLabelSize(editor, shape);
  return { box: import_editor.Box.FromCenter(labelCenter, labelSize), debugGeom };
}
function getClampedPosition(editor, shape, range, arrowheadInfo) {
  const { hasEndArrowhead, hasEndBinding, hasStartBinding, hasStartArrowhead } = arrowheadInfo;
  const arrowLength = (0, import_ArrowShapeUtil.getArrowLength)(editor, shape);
  let clampedPosition = (0, import_editor.clamp)(
    shape.props.labelPosition,
    hasStartArrowhead || hasStartBinding ? range.start : 0,
    hasEndArrowhead || hasEndBinding ? range.end : 1
  );
  const snapDistance = Math.min(0.02, 500 / arrowLength * 0.02);
  clampedPosition = clampedPosition >= 0.5 - snapDistance && clampedPosition <= 0.5 + snapDistance ? 0.5 : clampedPosition;
  return clampedPosition;
}
function intersectArcPolygon(center, radius, angleStart, angleEnd, direction, polygon) {
  const intersections = (0, import_editor.intersectCirclePolygon)(center, radius, polygon);
  const fullArcDistance = (0, import_editor.angleDistance)(angleStart, angleEnd, direction);
  return intersections?.filter((pt) => {
    const pDistance = (0, import_editor.angleDistance)(angleStart, import_editor.Vec.Angle(center, pt), direction);
    return pDistance >= 0 && pDistance <= fullArcDistance;
  });
}
function furthest(from, candidates) {
  let furthest2 = null;
  let furthestDist = -Infinity;
  for (const candidate of candidates) {
    const dist = import_editor.Vec.Dist2(from, candidate);
    if (dist > furthestDist) {
      furthest2 = candidate;
      furthestDist = dist;
    }
  }
  return furthest2;
}
function interpolateArcAngles(angleStart, angleEnd, direction, t) {
  const dist = (0, import_editor.angleDistance)(angleStart, angleEnd, direction);
  return angleStart + dist * t * direction * -1;
}
function getArrowLabelFontSize(shape) {
  return import_default_shape_constants.ARROW_LABEL_FONT_SIZES[shape.props.size] * shape.props.scale;
}
//# sourceMappingURL=arrowLabel.js.map
