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
var DefaultHelperButtonsContent_exports = {};
__export(DefaultHelperButtonsContent_exports, {
  DefaultHelperButtonsContent: () => DefaultHelperButtonsContent
});
module.exports = __toCommonJS(DefaultHelperButtonsContent_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_BackToContent = require("./BackToContent");
var import_ExitPenMode = require("./ExitPenMode");
var import_StopFollowing = require("./StopFollowing");
function DefaultHelperButtonsContent() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ExitPenMode.ExitPenMode, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_BackToContent.BackToContent, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_StopFollowing.StopFollowing, {})
  ] });
}
//# sourceMappingURL=DefaultHelperButtonsContent.js.map
