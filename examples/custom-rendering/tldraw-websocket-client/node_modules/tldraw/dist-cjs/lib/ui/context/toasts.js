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
var toasts_exports = {};
__export(toasts_exports, {
  TldrawUiToastsProvider: () => TldrawUiToastsProvider,
  ToastsContext: () => ToastsContext,
  useToasts: () => useToasts
});
module.exports = __toCommonJS(toasts_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_radix_ui = require("radix-ui");
var import_react = require("react");
const ToastsContext = (0, import_react.createContext)(null);
function TldrawUiToastsProvider({ children }) {
  const toasts = (0, import_editor.useAtom)("toasts", []);
  const ctx = (0, import_react.useContext)(ToastsContext);
  const current = (0, import_react.useMemo)(() => {
    return {
      toasts,
      addToast(toast) {
        const id = toast.id ?? (0, import_editor.uniqueId)();
        toasts.update((d) => [...d.filter((m) => m.id !== toast.id), { ...toast, id }]);
        return id;
      },
      removeToast(id) {
        toasts.update((d) => d.filter((m) => m.id !== id));
        return id;
      },
      clearToasts() {
        toasts.set([]);
      }
    };
  }, [toasts]);
  if (ctx) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Toast.Provider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToastsContext.Provider, { value: current, children }) });
}
function useToasts() {
  const ctx = (0, import_react.useContext)(ToastsContext);
  if (!ctx) {
    throw new Error("useToasts must be used within a ToastsProvider");
  }
  return ctx;
}
//# sourceMappingURL=toasts.js.map
