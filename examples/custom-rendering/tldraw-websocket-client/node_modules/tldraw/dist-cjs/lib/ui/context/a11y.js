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
var a11y_exports = {};
__export(a11y_exports, {
  A11yContext: () => A11yContext,
  TldrawUiA11yProvider: () => TldrawUiA11yProvider,
  useA11y: () => useA11y
});
module.exports = __toCommonJS(a11y_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
const A11yContext = (0, import_react.createContext)(null);
function TldrawUiA11yProvider({ children }) {
  const currentMsg = (0, import_editor.useAtom)("a11y", { msg: "", priority: "assertive" });
  const ctx = (0, import_react.useContext)(A11yContext);
  const current = (0, import_react.useMemo)(
    () => ({
      currentMsg,
      announce(msg) {
        if (!msg) return;
        currentMsg.set(msg);
      }
    }),
    [currentMsg]
  );
  if (ctx) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(A11yContext.Provider, { value: current, children });
}
function useA11y() {
  const ctx = (0, import_react.useContext)(A11yContext);
  if (!ctx) {
    throw new Error("useA11y must be used within a A11yContext.Provider");
  }
  return ctx;
}
//# sourceMappingURL=a11y.js.map
