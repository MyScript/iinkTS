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
var DefaultHandles_exports = {};
__export(DefaultHandles_exports, {
  DefaultHandles: () => DefaultHandles
});
module.exports = __toCommonJS(DefaultHandles_exports);
var import_jsx_runtime = require("react/jsx-runtime");
const DefaultHandles = ({ children }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { className: "tl-user-handles tl-overlays__item", "aria-hidden": "true", children });
};
//# sourceMappingURL=DefaultHandles.js.map
