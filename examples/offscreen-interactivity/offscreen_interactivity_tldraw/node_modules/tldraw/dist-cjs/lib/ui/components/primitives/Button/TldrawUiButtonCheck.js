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
var TldrawUiButtonCheck_exports = {};
__export(TldrawUiButtonCheck_exports, {
  TldrawUiButtonCheck: () => TldrawUiButtonCheck
});
module.exports = __toCommonJS(TldrawUiButtonCheck_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_useTranslation = require("../../../hooks/useTranslation/useTranslation");
var import_TldrawUiIcon = require("../TldrawUiIcon");
function TldrawUiButtonCheck({ checked }) {
  const msg = (0, import_useTranslation.useTranslation)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_TldrawUiIcon.TldrawUiIcon,
    {
      "data-checked": !!checked,
      label: msg(checked ? "ui.checked" : "ui.unchecked"),
      icon: checked ? "check" : "none",
      className: "tlui-button__icon",
      small: true
    }
  );
}
//# sourceMappingURL=TldrawUiButtonCheck.js.map
