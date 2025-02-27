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
var GeoShapeBody_exports = {};
__export(GeoShapeBody_exports, {
  GeoShapeBody: () => GeoShapeBody
});
module.exports = __toCommonJS(GeoShapeBody_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_ShapeFill = require("../../shared/ShapeFill");
var import_default_shape_constants = require("../../shared/default-shape-constants");
var import_useDefaultColorTheme = require("../../shared/useDefaultColorTheme");
var import_geo_shape_helpers = require("../geo-shape-helpers");
var import_getLines = require("../getLines");
function GeoShapeBody({
  shape,
  shouldScale,
  forceSolid
}) {
  const scaleToUse = shouldScale ? shape.props.scale : 1;
  const editor = (0, import_editor.useEditor)();
  const theme = (0, import_useDefaultColorTheme.useDefaultColorTheme)();
  const { id, props } = shape;
  const { w, color, fill, dash, growY, size, scale } = props;
  const strokeWidth = import_default_shape_constants.STROKE_SIZES[size] * scaleToUse;
  const h = props.h + growY;
  switch (props.geo) {
    case "cloud": {
      if (dash === "solid") {
        const d = (0, import_geo_shape_helpers.getCloudPath)(w, h, id, size, scale);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ShapeFill.ShapeFill, { theme, d, color, fill, scale: scaleToUse }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d, stroke: theme[color].solid, strokeWidth, fill: "none" })
        ] });
      } else if (dash === "draw") {
        const d = (0, import_geo_shape_helpers.inkyCloudSvgPath)(w, h, id, size, scale);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ShapeFill.ShapeFill, { theme, d, color, fill, scale: scaleToUse }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d, stroke: theme[color].solid, strokeWidth, fill: "none" })
        ] });
      } else {
        const d = (0, import_geo_shape_helpers.getCloudPath)(w, h, id, size, scale);
        const arcs = (0, import_geo_shape_helpers.getCloudArcs)(w, h, id, size, scale);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ShapeFill.ShapeFill, { theme, d, color, fill, scale: scaleToUse }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "g",
            {
              strokeWidth,
              stroke: theme[color].solid,
              fill: "none",
              pointerEvents: "all",
              children: arcs.map(({ leftPoint, rightPoint, center, radius }, i) => {
                const arcLength = center ? radius * (0, import_editor.canonicalizeRotation)(
                  (0, import_editor.canonicalizeRotation)(import_editor.Vec.Angle(center, rightPoint)) - (0, import_editor.canonicalizeRotation)(import_editor.Vec.Angle(center, leftPoint))
                ) : import_editor.Vec.Dist(leftPoint, rightPoint);
                const { strokeDasharray, strokeDashoffset } = (0, import_editor.getPerfectDashProps)(
                  arcLength,
                  strokeWidth,
                  {
                    style: dash,
                    start: "outset",
                    end: "outset",
                    forceSolid
                  }
                );
                return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "path",
                  {
                    d: center ? `M${leftPoint.x},${leftPoint.y}A${radius},${radius},0,0,1,${rightPoint.x},${rightPoint.y}` : `M${leftPoint.x},${leftPoint.y}L${rightPoint.x},${rightPoint.y}`,
                    strokeDasharray,
                    strokeDashoffset
                  },
                  i
                );
              })
            }
          )
        ] });
      }
    }
    case "ellipse": {
      const geometry = shouldScale ? (
        // cached
        editor.getShapeGeometry(shape)
      ) : (
        // not cached
        editor.getShapeUtil(shape).getGeometry(shape)
      );
      const d = geometry.getSvgPathData(true);
      if (dash === "dashed" || dash === "dotted") {
        const perimeter = geometry.length;
        const { strokeDasharray, strokeDashoffset } = (0, import_editor.getPerfectDashProps)(
          perimeter < 64 ? perimeter * 2 : perimeter,
          strokeWidth,
          {
            style: dash,
            snap: 4,
            closed: true,
            forceSolid
          }
        );
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ShapeFill.ShapeFill, { theme, d, color, fill, scale: scaleToUse }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "path",
            {
              d,
              strokeWidth,
              fill: "none",
              stroke: theme[color].solid,
              strokeDasharray,
              strokeDashoffset
            }
          )
        ] });
      } else {
        const geometry2 = shouldScale ? (
          // cached
          editor.getShapeGeometry(shape)
        ) : (
          // not cached
          editor.getShapeUtil(shape).getGeometry(shape)
        );
        const d2 = geometry2.getSvgPathData(true);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ShapeFill.ShapeFill, { theme, d: d2, color, fill, scale: scaleToUse }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: d2, stroke: theme[color].solid, strokeWidth, fill: "none" })
        ] });
      }
    }
    case "oval": {
      const geometry = shouldScale ? (
        // cached
        editor.getShapeGeometry(shape)
      ) : (
        // not cached
        editor.getShapeUtil(shape).getGeometry(shape)
      );
      const d = geometry.getSvgPathData(true);
      if (dash === "dashed" || dash === "dotted") {
        const perimeter = geometry.getLength();
        const { strokeDasharray, strokeDashoffset } = (0, import_editor.getPerfectDashProps)(
          perimeter < 64 ? perimeter * 2 : perimeter,
          strokeWidth,
          {
            style: dash,
            snap: 4,
            start: "outset",
            end: "outset",
            closed: true,
            forceSolid
          }
        );
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ShapeFill.ShapeFill, { theme, d, color, fill, scale: scaleToUse }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "path",
            {
              d,
              strokeWidth,
              fill: "none",
              stroke: theme[color].solid,
              strokeDasharray,
              strokeDashoffset
            }
          )
        ] });
      } else {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ShapeFill.ShapeFill, { theme, d, color, fill, scale: scaleToUse }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d, stroke: theme[color].solid, strokeWidth, fill: "none" })
        ] });
      }
    }
    case "heart": {
      if (dash === "dashed" || dash === "dotted" || dash === "solid") {
        const d = (0, import_geo_shape_helpers.getHeartPath)(w, h);
        const curves = (0, import_geo_shape_helpers.getHeartParts)(w, h);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ShapeFill.ShapeFill, { theme, d, color, fill, scale: scaleToUse }),
          curves.map((c, i) => {
            const { strokeDasharray, strokeDashoffset } = (0, import_editor.getPerfectDashProps)(
              c.length,
              strokeWidth,
              {
                style: dash,
                snap: 1,
                start: "outset",
                end: "outset",
                closed: true,
                forceSolid
              }
            );
            return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "path",
              {
                d: c.getSvgPathData(),
                strokeWidth,
                fill: "none",
                stroke: theme[color].solid,
                strokeDasharray,
                strokeDashoffset,
                pointerEvents: "all"
              },
              `curve_${i}`
            );
          })
        ] });
      } else {
        const d = (0, import_geo_shape_helpers.getDrawHeartPath)(w, h, strokeWidth, shape.id);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ShapeFill.ShapeFill, { theme, d, color, fill, scale: scaleToUse }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d, stroke: theme[color].solid, strokeWidth, fill: "none" })
        ] });
      }
    }
    default: {
      const geometry = shouldScale ? (
        // cached
        editor.getShapeGeometry(shape)
      ) : (
        // not cached
        editor.getShapeUtil(shape).getGeometry(shape)
      );
      const outline = geometry instanceof import_editor.Group2d ? geometry.children[0].vertices : geometry.vertices;
      const lines = (0, import_getLines.getLines)(shape.props, strokeWidth);
      if (dash === "solid") {
        let d = "M" + outline[0] + "L" + outline.slice(1) + "Z";
        if (lines) {
          for (const [A, B] of lines) {
            d += `M${A.x},${A.y}L${B.x},${B.y}`;
          }
        }
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ShapeFill.ShapeFill, { theme, d, color, fill, scale: scaleToUse }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d, stroke: theme[color].solid, strokeWidth, fill: "none" })
        ] });
      } else if (dash === "dashed" || dash === "dotted") {
        const d = "M" + outline[0] + "L" + outline.slice(1) + "Z";
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ShapeFill.ShapeFill, { theme, d, color, fill, scale: scaleToUse }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "g",
            {
              strokeWidth,
              stroke: theme[color].solid,
              fill: "none",
              pointerEvents: "all",
              children: [
                Array.from(Array(outline.length)).map((_, i) => {
                  const A = import_editor.Vec.ToFixed(outline[i]);
                  const B = import_editor.Vec.ToFixed(outline[(i + 1) % outline.length]);
                  const dist = import_editor.Vec.Dist(A, B);
                  const { strokeDasharray, strokeDashoffset } = (0, import_editor.getPerfectDashProps)(
                    dist,
                    strokeWidth,
                    {
                      style: dash,
                      start: "outset",
                      end: "outset",
                      forceSolid
                    }
                  );
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "line",
                    {
                      x1: A.x,
                      y1: A.y,
                      x2: B.x,
                      y2: B.y,
                      strokeDasharray,
                      strokeDashoffset
                    },
                    i
                  );
                }),
                lines && lines.map(([A, B], i) => {
                  const dist = import_editor.Vec.Dist(A, B);
                  const { strokeDasharray, strokeDashoffset } = (0, import_editor.getPerfectDashProps)(
                    dist,
                    strokeWidth,
                    {
                      style: dash,
                      start: "skip",
                      end: "skip",
                      snap: dash === "dotted" ? 4 : void 0,
                      forceSolid
                    }
                  );
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "path",
                    {
                      d: `M${A.x},${A.y}L${B.x},${B.y}`,
                      stroke: theme[color].solid,
                      strokeWidth,
                      fill: "none",
                      strokeDasharray,
                      strokeDashoffset
                    },
                    `line_fg_${i}`
                  );
                })
              ]
            }
          )
        ] });
      } else if (dash === "draw") {
        let d = (0, import_geo_shape_helpers.getRoundedInkyPolygonPath)(
          (0, import_geo_shape_helpers.getRoundedPolygonPoints)(id, outline, strokeWidth / 3, strokeWidth * 2, 2)
        );
        if (lines) {
          for (const [A, B] of lines) {
            d += `M${A.toFixed()}L${B.toFixed()}`;
          }
        }
        const innerPathData = (0, import_geo_shape_helpers.getRoundedInkyPolygonPath)(
          (0, import_geo_shape_helpers.getRoundedPolygonPoints)(id, outline, 0, strokeWidth * 2, 1)
        );
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_ShapeFill.ShapeFill,
            {
              theme,
              d: innerPathData,
              color,
              fill,
              scale: scaleToUse
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d, stroke: theme[color].solid, strokeWidth, fill: "none" })
        ] });
      }
    }
  }
}
//# sourceMappingURL=GeoShapeBody.js.map
