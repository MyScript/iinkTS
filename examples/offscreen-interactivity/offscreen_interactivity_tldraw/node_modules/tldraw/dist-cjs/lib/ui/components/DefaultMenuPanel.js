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
var DefaultMenuPanel_exports = {};
__export(DefaultMenuPanel_exports, {
  DefaultMenuPanel: () => DefaultMenuPanel
});
module.exports = __toCommonJS(DefaultMenuPanel_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_constants = require("../constants");
var import_breakpoints = require("../context/breakpoints");
var import_components = require("../context/components");
const DefaultMenuPanel = (0, import_react.memo)(function MenuPanel() {
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  const ref = (0, import_react.useRef)(null);
  (0, import_editor.usePassThroughWheelEvents)(ref);
  const { MainMenu, QuickActions, ActionsMenu, PageMenu } = (0, import_components.useTldrawUiComponents)();
  const editor = (0, import_editor.useEditor)();
  const isSinglePageMode = (0, import_editor.useValue)("isSinglePageMode", () => editor.options.maxPages <= 1, [
    editor
  ]);
  const showQuickActions = editor.options.actionShortcutsLocation === "menu" ? true : editor.options.actionShortcutsLocation === "toolbar" ? false : breakpoint >= import_constants.PORTRAIT_BREAKPOINT.TABLET;
  if (!MainMenu && !PageMenu && !showQuickActions) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref, className: "tlui-menu-zone", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-buttons__horizontal", children: [
    MainMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainMenu, {}),
    PageMenu && !isSinglePageMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageMenu, {}),
    showQuickActions ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      QuickActions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActions, {}),
      ActionsMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionsMenu, {})
    ] }) : null
  ] }) });
});
//# sourceMappingURL=DefaultMenuPanel.js.map
