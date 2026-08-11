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
var BrokenAssetIcon_exports = {};
__export(BrokenAssetIcon_exports, {
  BrokenAssetIcon: () => BrokenAssetIcon
});
module.exports = __toCommonJS(BrokenAssetIcon_exports);
var import_jsx_runtime = require("react/jsx-runtime");
function BrokenAssetIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: "15",
      height: "15",
      viewBox: "0 0 30 30",
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3,11 L3,3 11,3", strokeWidth: "2" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M19,27 L27,27 L27,19", strokeWidth: "2" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M27,3 L3,27", strokeWidth: "2" })
      ]
    }
  );
}
//# sourceMappingURL=BrokenAssetIcon.js.map
