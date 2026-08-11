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
var DefaultContextMenuContent_exports = {};
__export(DefaultContextMenuContent_exports, {
  DefaultContextMenuContent: () => DefaultContextMenuContent
});
module.exports = __toCommonJS(DefaultContextMenuContent_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_useCollaborationStatus = require("../../hooks/useCollaborationStatus");
var import_menu_items = require("../menu-items");
var import_TldrawUiMenuGroup = require("../primitives/menus/TldrawUiMenuGroup");
function DefaultContextMenuContent() {
  const editor = (0, import_editor.useEditor)();
  const showCollaborationUi = (0, import_useCollaborationStatus.useShowCollaborationUi)();
  const selectToolActive = (0, import_editor.useValue)(
    "isSelectToolActive",
    () => editor.getCurrentToolId() === "select",
    [editor]
  );
  const isSinglePageMode = (0, import_editor.useValue)("isSinglePageMode", () => editor.options.maxPages <= 1, [
    editor
  ]);
  if (!selectToolActive) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    showCollaborationUi && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_items.CursorChatItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { id: "modify", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_items.EditMenuSubmenu, {}),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_items.ArrangeMenuSubmenu, {}),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_items.ReorderMenuSubmenu, {}),
      !isSinglePageMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_items.MoveToPageMenu, {})
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_items.ClipboardMenuGroup, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_items.ConversionsMenuGroup, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { id: "select-all", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_items.SelectAllMenuItem, {}) })
  ] });
}
//# sourceMappingURL=DefaultContextMenuContent.js.map
