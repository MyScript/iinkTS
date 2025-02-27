"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var TldrawCropHandles_exports = {};
__export(TldrawCropHandles_exports, {
  TldrawCropHandles: () => TldrawCropHandles
});
module.exports = __toCommonJS(TldrawCropHandles_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_classnames = __toESM(require("classnames"));
function TldrawCropHandles({
  size,
  width,
  height,
  hideAlternateHandles
}) {
  const cropStrokeWidth = (0, import_editor.toDomPrecision)(size / 3);
  const offset = cropStrokeWidth / 2;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { className: "tl-overlays__item", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "polyline",
      {
        className: "tl-corner-crop-handle",
        points: `
						${(0, import_editor.toDomPrecision)(0 - offset)},${(0, import_editor.toDomPrecision)(size)} 
						${(0, import_editor.toDomPrecision)(0 - offset)},${(0, import_editor.toDomPrecision)(0 - offset)} 
						${(0, import_editor.toDomPrecision)(size)},${(0, import_editor.toDomPrecision)(0 - offset)}`,
        strokeWidth: cropStrokeWidth,
        "data-testid": "selection.crop.top_left",
        "aria-label": "top_left handle"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "line",
      {
        className: (0, import_classnames.default)("tl-corner-crop-edge-handle", {
          "tl-hidden": hideAlternateHandles
        }),
        x1: (0, import_editor.toDomPrecision)(width / 2 - size),
        y1: (0, import_editor.toDomPrecision)(0 - offset),
        x2: (0, import_editor.toDomPrecision)(width / 2 + size),
        y2: (0, import_editor.toDomPrecision)(0 - offset),
        strokeWidth: cropStrokeWidth,
        "data-testid": "selection.crop.top",
        "aria-label": "top handle"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "polyline",
      {
        className: (0, import_classnames.default)("tl-corner-crop-handle", {
          "tl-hidden": hideAlternateHandles
        }),
        points: `
						${(0, import_editor.toDomPrecision)(width - size)},${(0, import_editor.toDomPrecision)(0 - offset)} 
						${(0, import_editor.toDomPrecision)(width + offset)},${(0, import_editor.toDomPrecision)(0 - offset)} 
						${(0, import_editor.toDomPrecision)(width + offset)},${(0, import_editor.toDomPrecision)(size)}`,
        strokeWidth: cropStrokeWidth,
        "data-testid": "selection.crop.top_right",
        "aria-label": "top_right handle"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "line",
      {
        className: (0, import_classnames.default)("tl-corner-crop-edge-handle", {
          "tl-hidden": hideAlternateHandles
        }),
        x1: (0, import_editor.toDomPrecision)(width + offset),
        y1: (0, import_editor.toDomPrecision)(height / 2 - size),
        x2: (0, import_editor.toDomPrecision)(width + offset),
        y2: (0, import_editor.toDomPrecision)(height / 2 + size),
        strokeWidth: cropStrokeWidth,
        "data-testid": "selection.crop.right",
        "aria-label": "right handle"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "polyline",
      {
        className: "tl-corner-crop-handle",
        points: `
						${(0, import_editor.toDomPrecision)(width + offset)},${(0, import_editor.toDomPrecision)(height - size)} 
						${(0, import_editor.toDomPrecision)(width + offset)},${(0, import_editor.toDomPrecision)(height + offset)}
						${(0, import_editor.toDomPrecision)(width - size)},${(0, import_editor.toDomPrecision)(height + offset)}`,
        strokeWidth: cropStrokeWidth,
        "data-testid": "selection.crop.bottom_right",
        "aria-label": "bottom_right handle"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "line",
      {
        className: (0, import_classnames.default)("tl-corner-crop-edge-handle", {
          "tl-hidden": hideAlternateHandles
        }),
        x1: (0, import_editor.toDomPrecision)(width / 2 - size),
        y1: (0, import_editor.toDomPrecision)(height + offset),
        x2: (0, import_editor.toDomPrecision)(width / 2 + size),
        y2: (0, import_editor.toDomPrecision)(height + offset),
        strokeWidth: cropStrokeWidth,
        "data-testid": "selection.crop.bottom",
        "aria-label": "bottom handle"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "polyline",
      {
        className: (0, import_classnames.default)("tl-corner-crop-handle", {
          "tl-hidden": hideAlternateHandles
        }),
        points: `
						${(0, import_editor.toDomPrecision)(0 + size)},${(0, import_editor.toDomPrecision)(height + offset)} 
						${(0, import_editor.toDomPrecision)(0 - offset)},${(0, import_editor.toDomPrecision)(height + offset)}
						${(0, import_editor.toDomPrecision)(0 - offset)},${(0, import_editor.toDomPrecision)(height - size)}`,
        strokeWidth: cropStrokeWidth,
        "data-testid": "selection.crop.bottom_left",
        "aria-label": "bottom_left handle"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "line",
      {
        className: (0, import_classnames.default)("tl-corner-crop-edge-handle", {
          "tl-hidden": hideAlternateHandles
        }),
        x1: (0, import_editor.toDomPrecision)(0 - offset),
        y1: (0, import_editor.toDomPrecision)(height / 2 - size),
        x2: (0, import_editor.toDomPrecision)(0 - offset),
        y2: (0, import_editor.toDomPrecision)(height / 2 + size),
        strokeWidth: cropStrokeWidth,
        "data-testid": "selection.crop.left",
        "aria-label": "left handle"
      }
    )
  ] });
}
//# sourceMappingURL=TldrawCropHandles.js.map
