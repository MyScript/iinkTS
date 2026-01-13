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
var TldrawUiKbd_exports = {};
__export(TldrawUiKbd_exports, {
  TldrawUiKbd: () => TldrawUiKbd
});
module.exports = __toCommonJS(TldrawUiKbd_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_constants = require("../../constants");
var import_breakpoints = require("../../context/breakpoints");
var import_kbd_utils = require("../../kbd-utils");
function TldrawUiKbd({ children, visibleOnMobileLayout = false }) {
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  if (!visibleOnMobileLayout && breakpoint < import_constants.PORTRAIT_BREAKPOINT.MOBILE) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", { className: "tlui-kbd", children: (0, import_kbd_utils.kbd)(children).map((k, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: k }, i)) });
}
//# sourceMappingURL=TldrawUiKbd.js.map
