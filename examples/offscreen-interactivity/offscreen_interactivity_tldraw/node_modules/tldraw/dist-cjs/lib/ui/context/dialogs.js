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
var dialogs_exports = {};
__export(dialogs_exports, {
  DialogsContext: () => DialogsContext,
  TldrawUiDialogsProvider: () => TldrawUiDialogsProvider,
  useDialogs: () => useDialogs
});
module.exports = __toCommonJS(dialogs_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_events = require("./events");
const DialogsContext = (0, import_react.createContext)(null);
function TldrawUiDialogsProvider({ context, children }) {
  const ctx = (0, import_react.useContext)(DialogsContext);
  const trackEvent = (0, import_events.useUiEvents)();
  const dialogs = (0, import_editor.useAtom)("dialogs", []);
  const content = (0, import_react.useMemo)(() => {
    return {
      dialogs,
      addDialog(dialog) {
        const id = dialog.id ?? (0, import_editor.uniqueId)();
        dialogs.update((d) => {
          return [...d.filter((m) => m.id !== dialog.id), { ...dialog, id }];
        });
        trackEvent("open-menu", { source: "dialog", id });
        import_editor.tlmenus.addOpenMenu(id, context);
        return id;
      },
      removeDialog(id) {
        const dialog = dialogs.get().find((d) => d.id === id);
        if (dialog) {
          dialog.onClose?.();
          trackEvent("close-menu", { source: "dialog", id });
          import_editor.tlmenus.deleteOpenMenu(id, context);
          dialogs.update((d) => d.filter((m) => m !== dialog));
        }
        return id;
      },
      clearDialogs() {
        const current = dialogs.get();
        if (current.length === 0) return;
        current.forEach((d) => {
          d.onClose?.();
          trackEvent("close-menu", { source: "dialog", id: d.id });
          import_editor.tlmenus.deleteOpenMenu(d.id, context);
        });
        dialogs.set([]);
      }
    };
  }, [trackEvent, dialogs, context]);
  if (ctx) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogsContext.Provider, { value: content, children });
}
function useDialogs() {
  const ctx = (0, import_react.useContext)(DialogsContext);
  if (!ctx) {
    throw new Error("useDialogs must be used within a DialogsProvider");
  }
  return ctx;
}
//# sourceMappingURL=dialogs.js.map
