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
var DefaultHelperButtons_exports = {};
__export(DefaultHelperButtons_exports, {
  DefaultHelperButtons: () => DefaultHelperButtons
});
module.exports = __toCommonJS(DefaultHelperButtons_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_TldrawUiMenuContext = require("../primitives/menus/TldrawUiMenuContext");
var import_DefaultHelperButtonsContent = require("./DefaultHelperButtonsContent");
function DefaultHelperButtons({ children }) {
  const content = children ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_DefaultHelperButtonsContent.DefaultHelperButtonsContent, {});
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-helper-buttons", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuContext.TldrawUiMenuContextProvider, { type: "helper-buttons", sourceId: "helper-buttons", children: content }) });
}
//# sourceMappingURL=DefaultHelperButtons.js.map
