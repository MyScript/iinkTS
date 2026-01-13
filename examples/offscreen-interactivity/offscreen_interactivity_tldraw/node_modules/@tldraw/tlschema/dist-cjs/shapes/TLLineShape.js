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
var TLLineShape_exports = {};
__export(TLLineShape_exports, {
  LineShapeSplineStyle: () => LineShapeSplineStyle,
  lineShapeMigrations: () => lineShapeMigrations,
  lineShapeProps: () => lineShapeProps,
  lineShapeVersions: () => lineShapeVersions
});
module.exports = __toCommonJS(TLLineShape_exports);
var import_utils = require("@tldraw/utils");
var import_validate = require("@tldraw/validate");
var import_TLShape = require("../records/TLShape");
var import_StyleProp = require("../styles/StyleProp");
var import_TLColorStyle = require("../styles/TLColorStyle");
var import_TLDashStyle = require("../styles/TLDashStyle");
var import_TLSizeStyle = require("../styles/TLSizeStyle");
const LineShapeSplineStyle = import_StyleProp.StyleProp.defineEnum("tldraw:spline", {
  defaultValue: "line",
  values: ["cubic", "line"]
});
const lineShapePointValidator = import_validate.T.object({
  id: import_validate.T.string,
  index: import_validate.T.indexKey,
  x: import_validate.T.number,
  y: import_validate.T.number
});
const lineShapeProps = {
  color: import_TLColorStyle.DefaultColorStyle,
  dash: import_TLDashStyle.DefaultDashStyle,
  size: import_TLSizeStyle.DefaultSizeStyle,
  spline: LineShapeSplineStyle,
  points: import_validate.T.dict(import_validate.T.string, lineShapePointValidator),
  scale: import_validate.T.nonZeroNumber
};
const lineShapeVersions = (0, import_TLShape.createShapePropsMigrationIds)("line", {
  AddSnapHandles: 1,
  RemoveExtraHandleProps: 2,
  HandlesToPoints: 3,
  PointIndexIds: 4,
  AddScale: 5
});
const lineShapeMigrations = (0, import_TLShape.createShapePropsMigrationSequence)({
  sequence: [
    {
      id: lineShapeVersions.AddSnapHandles,
      up: (props) => {
        for (const handle of Object.values(props.handles)) {
          ;
          handle.canSnap = true;
        }
      },
      down: "retired"
    },
    {
      id: lineShapeVersions.RemoveExtraHandleProps,
      up: (props) => {
        props.handles = (0, import_utils.objectMapFromEntries)(
          Object.values(props.handles).map((handle) => [
            handle.index,
            {
              x: handle.x,
              y: handle.y
            }
          ])
        );
      },
      down: (props) => {
        const handles = Object.entries(props.handles).map(([index, handle]) => ({ index, ...handle })).sort(import_utils.sortByIndex);
        props.handles = Object.fromEntries(
          handles.map((handle, i) => {
            const id = i === 0 ? "start" : i === handles.length - 1 ? "end" : `handle:${handle.index}`;
            return [
              id,
              {
                id,
                type: "vertex",
                canBind: false,
                canSnap: true,
                index: handle.index,
                x: handle.x,
                y: handle.y
              }
            ];
          })
        );
      }
    },
    {
      id: lineShapeVersions.HandlesToPoints,
      up: (props) => {
        const sortedHandles = Object.entries(props.handles).map(([index, { x, y }]) => ({ x, y, index })).sort(import_utils.sortByIndex);
        props.points = sortedHandles.map(({ x, y }) => ({ x, y }));
        delete props.handles;
      },
      down: (props) => {
        const indices = (0, import_utils.getIndices)(props.points.length);
        props.handles = Object.fromEntries(
          props.points.map((handle, i) => {
            const index = indices[i];
            return [
              index,
              {
                x: handle.x,
                y: handle.y
              }
            ];
          })
        );
        delete props.points;
      }
    },
    {
      id: lineShapeVersions.PointIndexIds,
      up: (props) => {
        const indices = (0, import_utils.getIndices)(props.points.length);
        props.points = Object.fromEntries(
          props.points.map((point, i) => {
            const id = indices[i];
            return [
              id,
              {
                id,
                index: id,
                x: point.x,
                y: point.y
              }
            ];
          })
        );
      },
      down: (props) => {
        const sortedHandles = Object.values(props.points).sort(import_utils.sortByIndex);
        props.points = sortedHandles.map(({ x, y }) => ({ x, y }));
      }
    },
    {
      id: lineShapeVersions.AddScale,
      up: (props) => {
        props.scale = 1;
      },
      down: (props) => {
        delete props.scale;
      }
    }
  ]
});
//# sourceMappingURL=TLLineShape.js.map
