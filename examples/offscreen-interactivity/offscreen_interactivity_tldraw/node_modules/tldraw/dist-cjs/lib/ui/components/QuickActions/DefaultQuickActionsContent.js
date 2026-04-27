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
var DefaultQuickActionsContent_exports = {};
__export(DefaultQuickActionsContent_exports, {
  DefaultQuickActionsContent: () => DefaultQuickActionsContent
});
module.exports = __toCommonJS(DefaultQuickActionsContent_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_menu_hooks = require("../../hooks/menu-hooks");
var import_useReadonly = require("../../hooks/useReadonly");
var import_TldrawUiMenuActionItem = require("../primitives/menus/TldrawUiMenuActionItem");
function DefaultQuickActionsContent() {
  const editor = (0, import_editor.useEditor)();
  const isReadonlyMode = (0, import_useReadonly.useReadonly)();
  const isInAcceptableReadonlyState = (0, import_editor.useValue)(
    "should display quick actions",
    () => editor.isInAny("select", "hand", "zoom"),
    [editor]
  );
  if (isReadonlyMode && !isInAcceptableReadonlyState) return;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UndoRedoGroup, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeleteDuplicateGroup, {})
  ] });
}
function DeleteDuplicateGroup() {
  const oneSelected = (0, import_menu_hooks.useUnlockedSelectedShapesCount)(1);
  const isInSelectState = (0, import_menu_hooks.useIsInSelectState)();
  const selectDependentActionsEnabled = oneSelected && isInSelectState;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "delete", disabled: !selectDependentActionsEnabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "duplicate", disabled: !selectDependentActionsEnabled })
  ] });
}
function UndoRedoGroup() {
  const canUndo = (0, import_menu_hooks.useCanUndo)();
  const canRedo = (0, import_menu_hooks.useCanRedo)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "undo", disabled: !canUndo }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "redo", disabled: !canRedo })
  ] });
}
//# sourceMappingURL=DefaultQuickActionsContent.js.map
