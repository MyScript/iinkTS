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
var PageItemSubmenu_exports = {};
__export(PageItemSubmenu_exports, {
  PageItemSubmenu: () => PageItemSubmenu
});
module.exports = __toCommonJS(PageItemSubmenu_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_events = require("../../context/events");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
var import_TldrawUiDropdownMenu = require("../primitives/TldrawUiDropdownMenu");
var import_TldrawUiMenuContext = require("../primitives/menus/TldrawUiMenuContext");
var import_TldrawUiMenuGroup = require("../primitives/menus/TldrawUiMenuGroup");
var import_TldrawUiMenuItem = require("../primitives/menus/TldrawUiMenuItem");
var import_edit_pages_shared = require("./edit-pages-shared");
const PageItemSubmenu = (0, import_editor.track)(function PageItemSubmenu2({
  index,
  listSize,
  item,
  onRename
}) {
  const editor = (0, import_editor.useEditor)();
  const msg = (0, import_useTranslation.useTranslation)();
  const pages = editor.getPages();
  const trackEvent = (0, import_events.useUiEvents)();
  const onDuplicate = (0, import_react.useCallback)(() => {
    editor.markHistoryStoppingPoint("creating page");
    const newId = import_editor.PageRecordType.createId();
    editor.duplicatePage(item.id, newId);
    trackEvent("duplicate-page", { source: "page-menu" });
  }, [editor, item, trackEvent]);
  const onMoveUp = (0, import_react.useCallback)(() => {
    (0, import_edit_pages_shared.onMovePage)(editor, item.id, index, index - 1, trackEvent);
  }, [editor, item, index, trackEvent]);
  const onMoveDown = (0, import_react.useCallback)(() => {
    (0, import_edit_pages_shared.onMovePage)(editor, item.id, index, index + 1, trackEvent);
  }, [editor, item, index, trackEvent]);
  const onDelete = (0, import_react.useCallback)(() => {
    editor.markHistoryStoppingPoint("deleting page");
    editor.deletePage(item.id);
    trackEvent("delete-page", { source: "page-menu" });
  }, [editor, item, trackEvent]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuRoot, { id: `page item submenu ${index}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButton.TldrawUiButton, { type: "icon", title: msg("page-menu.submenu.title"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "dots-vertical", small: true }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuContent, { alignOffset: 0, side: "right", sideOffset: -4, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiMenuContext.TldrawUiMenuContextProvider, { type: "menu", sourceId: "page-menu", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { id: "modify", children: [
        onRename && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuItem.TldrawUiMenuItem, { id: "rename", label: "page-menu.submenu.rename", onSelect: onRename }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiMenuItem.TldrawUiMenuItem,
          {
            id: "duplicate",
            label: "page-menu.submenu.duplicate-page",
            onSelect: onDuplicate,
            disabled: pages.length >= editor.options.maxPages
          }
        ),
        index > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiMenuItem.TldrawUiMenuItem,
          {
            id: "move-up",
            onSelect: onMoveUp,
            label: "page-menu.submenu.move-up"
          }
        ),
        index < listSize - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiMenuItem.TldrawUiMenuItem,
          {
            id: "move-down",
            label: "page-menu.submenu.move-down",
            onSelect: onMoveDown
          }
        )
      ] }),
      listSize > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { id: "delete", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuItem.TldrawUiMenuItem, { id: "delete", onSelect: onDelete, label: "page-menu.submenu.delete" }) })
    ] }) })
  ] });
});
//# sourceMappingURL=PageItemSubmenu.js.map
