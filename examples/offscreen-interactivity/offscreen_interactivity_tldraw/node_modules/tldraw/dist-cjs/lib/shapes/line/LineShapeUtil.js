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
var LineShapeUtil_exports = {};
__export(LineShapeUtil_exports, {
  LineShapeUtil: () => LineShapeUtil,
  getGeometryForLineShape: () => getGeometryForLineShape
});
module.exports = __toCommonJS(LineShapeUtil_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_shared = require("../arrow/shared");
var import_useDefaultColorTheme = require("../shared/useDefaultColorTheme");
var import_getLinePath = require("./components/getLinePath");
var import_line_helpers = require("./line-helpers");
const handlesCache = new import_editor.WeakCache();
class LineShapeUtil extends import_editor.ShapeUtil {
  static type = "line";
  static props = import_editor.lineShapeProps;
  static migrations = import_editor.lineShapeMigrations;
  hideResizeHandles() {
    return true;
  }
  hideRotateHandle() {
    return true;
  }
  hideSelectionBoundsFg() {
    return true;
  }
  hideSelectionBoundsBg() {
    return true;
  }
  getDefaultProps() {
    const [start, end] = (0, import_editor.getIndices)(2);
    return {
      dash: "draw",
      size: "m",
      color: "black",
      spline: "line",
      points: {
        [start]: { id: start, index: start, x: 0, y: 0 },
        [end]: { id: end, index: end, x: 0.1, y: 0.1 }
      },
      scale: 1
    };
  }
  getGeometry(shape) {
    return getGeometryForLineShape(shape);
  }
  getHandles(shape) {
    return handlesCache.get(shape.props, () => {
      const spline = getGeometryForLineShape(shape);
      const points = linePointsToArray(shape);
      const results = points.map((point) => ({
        ...point,
        id: point.index,
        type: "vertex",
        canSnap: true
      }));
      for (let i = 0; i < points.length - 1; i++) {
        const index = (0, import_editor.getIndexBetween)(points[i].index, points[i + 1].index);
        const segment = spline.segments[i];
        const point = segment.midPoint();
        results.push({
          id: index,
          type: "create",
          index,
          x: point.x,
          y: point.y,
          canSnap: true
        });
      }
      return results.sort(import_editor.sortByIndex);
    });
  }
  //   Events
  onResize(shape, info) {
    const { scaleX, scaleY } = info;
    return {
      props: {
        points: (0, import_editor.mapObjectMapValues)(shape.props.points, (_, { id, index, x, y }) => ({
          id,
          index,
          x: x * scaleX,
          y: y * scaleY
        }))
      }
    };
  }
  onBeforeCreate(next) {
    const {
      props: { points }
    } = next;
    const pointKeys = Object.keys(points);
    if (pointKeys.length < 2) {
      return;
    }
    const firstPoint = points[pointKeys[0]];
    const allSame = pointKeys.every((key) => {
      const point = points[key];
      return point.x === firstPoint.x && point.y === firstPoint.y;
    });
    if (allSame) {
      const lastKey = pointKeys[pointKeys.length - 1];
      points[lastKey] = {
        ...points[lastKey],
        x: points[lastKey].x + 0.1,
        y: points[lastKey].y + 0.1
      };
      return next;
    }
    return;
  }
  onHandleDrag(shape, { handle }) {
    if (handle.type !== "vertex") return;
    const newPoint = (0, import_editor.maybeSnapToGrid)(new import_editor.Vec(handle.x, handle.y), this.editor);
    return {
      ...shape,
      props: {
        ...shape.props,
        points: {
          ...shape.props.points,
          [handle.id]: { id: handle.id, index: handle.index, x: newPoint.x, y: newPoint.y }
        }
      }
    };
  }
  component(shape) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_editor.SVGContainer, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineShapeSvg, { shape }) });
  }
  indicator(shape) {
    const strokeWidth = import_shared.STROKE_SIZES[shape.props.size] * shape.props.scale;
    const spline = getGeometryForLineShape(shape);
    const { dash } = shape.props;
    let path;
    if (shape.props.spline === "line") {
      const outline = spline.points;
      if (dash === "solid" || dash === "dotted" || dash === "dashed") {
        path = "M" + outline[0] + "L" + outline.slice(1);
      } else {
        const [innerPathData] = (0, import_line_helpers.getDrawLinePathData)(shape.id, outline, strokeWidth);
        path = innerPathData;
      }
    } else {
      path = (0, import_getLinePath.getLineIndicatorPath)(shape, spline, strokeWidth);
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: path });
  }
  toSvg(shape) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineShapeSvg, { shouldScale: true, shape });
  }
  getHandleSnapGeometry(shape) {
    const points = linePointsToArray(shape);
    return {
      points,
      getSelfSnapPoints: (handle) => {
        const index = this.getHandles(shape).filter((h) => h.type === "vertex").findIndex((h) => h.id === handle.id);
        return points.filter((_, i) => Math.abs(i - index) > 1).map(import_editor.Vec.From);
      },
      getSelfSnapOutline: (handle) => {
        const index = this.getHandles(shape).filter((h) => h.type === "vertex").findIndex((h) => h.id === handle.id);
        const segments = getGeometryForLineShape(shape).segments.filter(
          (_, i) => i !== index - 1 && i !== index
        );
        if (!segments.length) return null;
        return new import_editor.Group2d({ children: segments });
      }
    };
  }
  getInterpolatedProps(startShape, endShape, t) {
    const startPoints = linePointsToArray(startShape);
    const endPoints = linePointsToArray(endShape);
    const pointsToUseStart = [];
    const pointsToUseEnd = [];
    let index = import_editor.ZERO_INDEX_KEY;
    if (startPoints.length > endPoints.length) {
      for (let i = 0; i < startPoints.length; i++) {
        pointsToUseStart[i] = { ...startPoints[i] };
        if (endPoints[i] === void 0) {
          pointsToUseEnd[i] = { ...endPoints[endPoints.length - 1], id: index };
        } else {
          pointsToUseEnd[i] = { ...endPoints[i], id: index };
        }
        index = (0, import_editor.getIndexAbove)(index);
      }
    } else if (endPoints.length > startPoints.length) {
      for (let i = 0; i < endPoints.length; i++) {
        pointsToUseEnd[i] = { ...endPoints[i] };
        if (startPoints[i] === void 0) {
          pointsToUseStart[i] = {
            ...startPoints[startPoints.length - 1],
            id: index
          };
        } else {
          pointsToUseStart[i] = { ...startPoints[i], id: index };
        }
        index = (0, import_editor.getIndexAbove)(index);
      }
    } else {
      for (let i = 0; i < endPoints.length; i++) {
        pointsToUseStart[i] = startPoints[i];
        pointsToUseEnd[i] = endPoints[i];
      }
    }
    return {
      ...t > 0.5 ? endShape.props : startShape.props,
      points: Object.fromEntries(
        pointsToUseStart.map((point, i) => {
          const endPoint = pointsToUseEnd[i];
          return [
            point.id,
            {
              ...point,
              x: (0, import_editor.lerp)(point.x, endPoint.x, t),
              y: (0, import_editor.lerp)(point.y, endPoint.y, t)
            }
          ];
        })
      ),
      scale: (0, import_editor.lerp)(startShape.props.scale, endShape.props.scale, t)
    };
  }
}
function linePointsToArray(shape) {
  return Object.values(shape.props.points).sort(import_editor.sortByIndex);
}
function getGeometryForLineShape(shape) {
  const points = linePointsToArray(shape).map(import_editor.Vec.From);
  switch (shape.props.spline) {
    case "cubic": {
      return new import_editor.CubicSpline2d({ points });
    }
    case "line": {
      return new import_editor.Polyline2d({ points });
    }
  }
}
function LineShapeSvg({
  shape,
  shouldScale = false,
  forceSolid = false
}) {
  const theme = (0, import_useDefaultColorTheme.useDefaultColorTheme)();
  const spline = getGeometryForLineShape(shape);
  const { dash, color, size } = shape.props;
  const scaleFactor = 1 / shape.props.scale;
  const scale = shouldScale ? scaleFactor : 1;
  const strokeWidth = import_shared.STROKE_SIZES[size] * shape.props.scale;
  if (shape.props.spline === "line") {
    if (dash === "solid") {
      const outline = spline.points;
      const pathData = "M" + outline[0] + "L" + outline.slice(1);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "path",
        {
          d: pathData,
          stroke: theme[color].solid,
          strokeWidth,
          fill: "none",
          transform: `scale(${scale})`
        }
      );
    }
    if (dash === "dashed" || dash === "dotted") {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { stroke: theme[color].solid, strokeWidth, transform: `scale(${scale})`, children: spline.segments.map((segment, i) => {
        const { strokeDasharray, strokeDashoffset } = forceSolid ? { strokeDasharray: "none", strokeDashoffset: "none" } : (0, import_editor.getPerfectDashProps)(segment.length, strokeWidth, {
          style: dash,
          start: i > 0 ? "outset" : "none",
          end: i < spline.segments.length - 1 ? "outset" : "none"
        });
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "path",
          {
            strokeDasharray,
            strokeDashoffset,
            d: segment.getSvgPathData(true),
            fill: "none"
          },
          i
        );
      }) });
    }
    if (dash === "draw") {
      const outline = spline.points;
      const [_, outerPathData] = (0, import_line_helpers.getDrawLinePathData)(shape.id, outline, strokeWidth);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "path",
        {
          d: outerPathData,
          stroke: theme[color].solid,
          strokeWidth,
          fill: "none",
          transform: `scale(${scale})`
        }
      );
    }
  }
  if (shape.props.spline === "cubic") {
    const splinePath = spline.getSvgPathData();
    if (dash === "solid") {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "path",
        {
          strokeWidth,
          stroke: theme[color].solid,
          fill: "none",
          d: splinePath,
          transform: `scale(${scale})`
        }
      );
    }
    if (dash === "dashed" || dash === "dotted") {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { stroke: theme[color].solid, strokeWidth, transform: `scale(${scale})`, children: spline.segments.map((segment, i) => {
        const { strokeDasharray, strokeDashoffset } = (0, import_editor.getPerfectDashProps)(
          segment.length,
          strokeWidth,
          {
            style: dash,
            start: i > 0 ? "outset" : "none",
            end: i < spline.segments.length - 1 ? "outset" : "none",
            forceSolid
          }
        );
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "path",
          {
            strokeDasharray,
            strokeDashoffset,
            d: segment.getSvgPathData(),
            fill: "none"
          },
          i
        );
      }) });
    }
    if (dash === "draw") {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "path",
        {
          d: (0, import_getLinePath.getLineDrawPath)(shape, spline, strokeWidth),
          strokeWidth: 1,
          stroke: theme[color].solid,
          fill: theme[color].solid,
          transform: `scale(${scale})`
        }
      );
    }
  }
}
//# sourceMappingURL=LineShapeUtil.js.map
