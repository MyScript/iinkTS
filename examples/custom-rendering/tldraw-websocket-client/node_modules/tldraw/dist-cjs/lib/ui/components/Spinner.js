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
var Spinner_exports = {};
__export(Spinner_exports, {
  Spinner: () => Spinner
});
module.exports = __toCommonJS(Spinner_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_useTranslation = require("../hooks/useTranslation/useTranslation");
function Spinner(props) {
  const msg = (0, import_useTranslation.useTranslation)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_editor.DefaultSpinner, { "aria-label": msg("app.loading"), ...props });
}
//# sourceMappingURL=Spinner.js.map
