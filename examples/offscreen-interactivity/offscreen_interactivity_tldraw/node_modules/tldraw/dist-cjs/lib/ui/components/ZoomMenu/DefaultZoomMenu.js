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
var DefaultZoomMenu_exports = {};
__export(DefaultZoomMenu_exports, {
  DefaultZoomMenu: () => DefaultZoomMenu
});
module.exports = __toCommonJS(DefaultZoomMenu_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_radix_ui = require("radix-ui");
var import_react = require("react");
var import_constants = require("../../constants");
var import_breakpoints = require("../../context/breakpoints");
var import_useMenuIsOpen = require("../../hooks/useMenuIsOpen");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiToolbar = require("../primitives/TldrawUiToolbar");
var import_TldrawUiMenuContext = require("../primitives/menus/TldrawUiMenuContext");
var import_DefaultZoomMenuContent = require("./DefaultZoomMenuContent");
const DefaultZoomMenu = (0, import_react.memo)(function DefaultZoomMenu2({ children }) {
  const container = (0, import_editor.useContainer)();
  const [isOpen, onOpenChange] = (0, import_useMenuIsOpen.useMenuIsOpen)("zoom menu");
  const content = children ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_DefaultZoomMenuContent.DefaultZoomMenuContent, {});
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.DropdownMenu.Root, { dir: "ltr", open: isOpen, onOpenChange, modal: false, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomTriggerButton, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.DropdownMenu.Portal, { container, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_radix_ui.DropdownMenu.Content,
      {
        className: "tlui-menu",
        side: "top",
        align: "start",
        alignOffset: 0,
        sideOffset: 8,
        collisionPadding: 4,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuContext.TldrawUiMenuContextProvider, { type: "menu", sourceId: "zoom-menu", children: content })
      }
    ) })
  ] });
});
const ZoomTriggerButton = () => {
  const editor = (0, import_editor.useEditor)();
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  const zoom = (0, import_editor.useValue)("zoom", () => editor.getZoomLevel(), [editor]);
  const msg = (0, import_useTranslation.useTranslation)();
  const handleDoubleClick = (0, import_react.useCallback)(() => {
    editor.resetZoom(editor.getViewportScreenCenter(), {
      animation: { duration: editor.options.animationMediumMs }
    });
  }, [editor]);
  const value = `${Math.floor(zoom * 100)}%`;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_TldrawUiToolbar.TldrawUiToolbarButton,
    {
      asChild: true,
      type: "icon",
      "aria-label": `${msg("navigation-zone.zoom")} \u2014 ${value}`,
      title: `${msg("navigation-zone.zoom")} \u2014 ${value}`,
      "data-testid": "minimap.zoom-menu-button",
      className: "tlui-zoom-menu__button",
      onDoubleClick: handleDoubleClick,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.DropdownMenu.Trigger, { dir: "ltr", children: breakpoint < import_constants.PORTRAIT_BREAKPOINT.MOBILE ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flexGrow: 0, textAlign: "center" }, children: value }) })
    }
  );
};
//# sourceMappingURL=DefaultZoomMenu.js.map
