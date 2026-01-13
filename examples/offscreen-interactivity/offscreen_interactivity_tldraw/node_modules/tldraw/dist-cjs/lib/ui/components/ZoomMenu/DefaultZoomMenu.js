"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var DefaultZoomMenu_exports = {};
__export(DefaultZoomMenu_exports, {
  DefaultZoomMenu: () => DefaultZoomMenu
});
module.exports = __toCommonJS(DefaultZoomMenu_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var _Dropdown = __toESM(require("@radix-ui/react-dropdown-menu"));
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_constants = require("../../constants");
var import_breakpoints = require("../../context/breakpoints");
var import_useMenuIsOpen = require("../../hooks/useMenuIsOpen");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiMenuContext = require("../primitives/menus/TldrawUiMenuContext");
var import_DefaultZoomMenuContent = require("./DefaultZoomMenuContent");
const DefaultZoomMenu = (0, import_react.memo)(function DefaultZoomMenu2({ children }) {
  const container = (0, import_editor.useContainer)();
  const [isOpen, onOpenChange] = (0, import_useMenuIsOpen.useMenuIsOpen)("zoom menu");
  const content = children ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_DefaultZoomMenuContent.DefaultZoomMenuContent, {});
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(_Dropdown.Root, { dir: "ltr", open: isOpen, onOpenChange, modal: false, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_Dropdown.Trigger, { asChild: true, dir: "ltr", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomTriggerButton, {}) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_Dropdown.Portal, { container, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      _Dropdown.Content,
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
const ZoomTriggerButton = (0, import_react.forwardRef)(
  function ZoomTriggerButton2(props, ref) {
    const editor = (0, import_editor.useEditor)();
    const breakpoint = (0, import_breakpoints.useBreakpoint)();
    const zoom = (0, import_editor.useValue)("zoom", () => editor.getZoomLevel(), [editor]);
    const msg = (0, import_useTranslation.useTranslation)();
    const handleDoubleClick = (0, import_react.useCallback)(() => {
      editor.resetZoom(editor.getViewportScreenCenter(), {
        animation: { duration: editor.options.animationMediumMs }
      });
    }, [editor]);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_TldrawUiButton.TldrawUiButton,
      {
        ref,
        ...props,
        type: "icon",
        title: `${msg("navigation-zone.zoom")}`,
        "data-testid": "minimap.zoom-menu-button",
        className: breakpoint < import_constants.PORTRAIT_BREAKPOINT.TABLET_SM ? "tlui-zoom-menu__button" : "tlui-zoom-menu__button__pct",
        onDoubleClick: handleDoubleClick,
        children: breakpoint < import_constants.PORTRAIT_BREAKPOINT.MOBILE ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { flexGrow: 0, textAlign: "center" }, children: [
          Math.floor(zoom * 100),
          "%"
        ] })
      }
    );
  }
);
//# sourceMappingURL=DefaultZoomMenu.js.map
