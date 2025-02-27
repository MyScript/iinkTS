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
var DefaultHelpMenuContent_exports = {};
__export(DefaultHelpMenuContent_exports, {
  DefaultHelpMenuContent: () => DefaultHelpMenuContent,
  KeyboardShortcutsMenuItem: () => KeyboardShortcutsMenuItem
});
module.exports = __toCommonJS(DefaultHelpMenuContent_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_components = require("../../context/components");
var import_dialogs = require("../../context/dialogs");
var import_LanguageMenu = require("../LanguageMenu");
var import_TldrawUiMenuItem = require("../primitives/menus/TldrawUiMenuItem");
function DefaultHelpMenuContent() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_LanguageMenu.LanguageMenu, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyboardShortcutsMenuItem, {})
  ] });
}
function KeyboardShortcutsMenuItem() {
  const { KeyboardShortcutsDialog } = (0, import_components.useTldrawUiComponents)();
  const { addDialog } = (0, import_dialogs.useDialogs)();
  const handleSelect = (0, import_react.useCallback)(() => {
    if (KeyboardShortcutsDialog) addDialog({ component: KeyboardShortcutsDialog });
  }, [addDialog, KeyboardShortcutsDialog]);
  if (!KeyboardShortcutsDialog) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_TldrawUiMenuItem.TldrawUiMenuItem,
    {
      id: "keyboard-shortcuts-button",
      label: "help-menu.keyboard-shortcuts",
      readonlyOk: true,
      onSelect: handleSelect
    }
  );
}
//# sourceMappingURL=DefaultHelpMenuContent.js.map
