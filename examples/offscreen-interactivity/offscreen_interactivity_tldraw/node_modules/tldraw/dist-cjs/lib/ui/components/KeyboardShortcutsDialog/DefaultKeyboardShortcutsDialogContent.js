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
var DefaultKeyboardShortcutsDialogContent_exports = {};
__export(DefaultKeyboardShortcutsDialogContent_exports, {
  DefaultKeyboardShortcutsDialogContent: () => DefaultKeyboardShortcutsDialogContent
});
module.exports = __toCommonJS(DefaultKeyboardShortcutsDialogContent_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_useIsMultiplayer = require("../../hooks/useIsMultiplayer");
var import_TldrawUiMenuActionItem = require("../primitives/menus/TldrawUiMenuActionItem");
var import_TldrawUiMenuGroup = require("../primitives/menus/TldrawUiMenuGroup");
var import_TldrawUiMenuItem = require("../primitives/menus/TldrawUiMenuItem");
var import_TldrawUiMenuToolItem = require("../primitives/menus/TldrawUiMenuToolItem");
function DefaultKeyboardShortcutsDialogContent() {
  const showCollaborationUi = (0, import_useIsMultiplayer.useShowCollaborationUi)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { label: "shortcuts-dialog.tools", id: "tools", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "toggle-tool-lock" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "insert-media" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "select" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "draw" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "eraser" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "hand" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "rectangle" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "ellipse" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "arrow" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "line" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "text" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "frame" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "note" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "laser" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiMenuItem.TldrawUiMenuItem,
        {
          id: "pointer-down",
          label: "tool.pointer-down",
          kbd: ",",
          onSelect: () => {
          }
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { label: "shortcuts-dialog.preferences", id: "preferences", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "toggle-dark-mode" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "toggle-focus-mode" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "toggle-grid" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { label: "shortcuts-dialog.edit", id: "edit", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "undo" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "redo" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "cut" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "copy" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "paste" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "select-all" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "delete" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "duplicate" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { label: "shortcuts-dialog.view", id: "view", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "zoom-in" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "zoom-out" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "zoom-to-100" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "zoom-to-fit" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "zoom-to-selection" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { label: "shortcuts-dialog.transform", id: "transform", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "bring-to-front" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "bring-forward" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "send-backward" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "send-to-back" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "group" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "ungroup" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "flip-horizontal" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "flip-vertical" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-top" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-center-vertical" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-bottom" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-left" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-center-horizontal" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-right" })
    ] }),
    showCollaborationUi && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { label: "shortcuts-dialog.collaboration", id: "collaboration", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "open-cursor-chat" }) })
  ] });
}
//# sourceMappingURL=DefaultKeyboardShortcutsDialogContent.js.map
