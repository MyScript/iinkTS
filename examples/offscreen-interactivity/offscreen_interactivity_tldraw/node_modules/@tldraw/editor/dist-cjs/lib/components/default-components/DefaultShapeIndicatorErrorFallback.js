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
var DefaultShapeIndicatorErrorFallback_exports = {};
__export(DefaultShapeIndicatorErrorFallback_exports, {
  DefaultShapeIndicatorErrorFallback: () => DefaultShapeIndicatorErrorFallback
});
module.exports = __toCommonJS(DefaultShapeIndicatorErrorFallback_exports);
var import_jsx_runtime = require("react/jsx-runtime");
const DefaultShapeIndicatorErrorFallback = () => {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: 4, cy: 4, r: 8, strokeWidth: "1", stroke: "red" });
};
//# sourceMappingURL=DefaultShapeIndicatorErrorFallback.js.map
