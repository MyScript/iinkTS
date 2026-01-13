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
var ShapeFill_exports = {};
__export(ShapeFill_exports, {
  PatternFill: () => PatternFill,
  ShapeFill: () => ShapeFill
});
module.exports = __toCommonJS(ShapeFill_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = __toESM(require("react"));
var import_defaultStyleDefs = require("./defaultStyleDefs");
const ShapeFill = import_react.default.memo(function ShapeFill2({
  theme,
  d,
  color,
  fill,
  scale
}) {
  switch (fill) {
    case "none": {
      return null;
    }
    case "solid": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: theme[color].semi, d });
    }
    case "semi": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: theme.solid, d });
    }
    case "fill": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: theme[color].fill, d });
    }
    case "pattern": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PatternFill, { theme, color, fill, d, scale });
    }
  }
});
function PatternFill({ d, color, theme }) {
  const editor = (0, import_editor.useEditor)();
  const svgExport = (0, import_editor.useSvgExportContext)();
  const zoomLevel = (0, import_editor.useValue)("zoomLevel", () => editor.getZoomLevel(), [editor]);
  const getHashPatternZoomName = (0, import_defaultStyleDefs.useGetHashPatternZoomName)();
  const teenyTiny = editor.getZoomLevel() <= 0.18;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: theme[color].pattern, d }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        fill: svgExport ? `url(#${getHashPatternZoomName(1, theme.id)})` : teenyTiny ? theme[color].semi : `url(#${getHashPatternZoomName(zoomLevel, theme.id)})`,
        d
      }
    )
  ] });
}
//# sourceMappingURL=ShapeFill.js.map
