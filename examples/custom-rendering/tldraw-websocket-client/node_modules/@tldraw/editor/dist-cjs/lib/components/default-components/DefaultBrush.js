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
var DefaultBrush_exports = {};
__export(DefaultBrush_exports, {
  DefaultBrush: () => DefaultBrush
});
module.exports = __toCommonJS(DefaultBrush_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_useTransform = require("../../hooks/useTransform");
var import_utils = require("../../primitives/utils");
const DefaultBrush = ({ brush, color, opacity, className }) => {
  const rSvg = (0, import_react.useRef)(null);
  (0, import_useTransform.useTransform)(rSvg, brush.x, brush.y);
  const w = (0, import_utils.toDomPrecision)(Math.max(1, brush.w));
  const h = (0, import_utils.toDomPrecision)(Math.max(1, brush.h));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { className: "tl-overlays__item", ref: rSvg, "aria-hidden": "true", children: color ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { className: "tl-brush", opacity, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { width: w, height: h, fill: color, opacity: 0.75 }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { width: w, height: h, fill: "none", stroke: color, opacity: 0.1 })
  ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { className: `tl-brush tl-brush__default ${className}`, width: w, height: h }) });
};
//# sourceMappingURL=DefaultBrush.js.map
