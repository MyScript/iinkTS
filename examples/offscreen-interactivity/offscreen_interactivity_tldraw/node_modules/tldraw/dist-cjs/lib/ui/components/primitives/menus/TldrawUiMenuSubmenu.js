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
var TldrawUiMenuSubmenu_exports = {};
__export(TldrawUiMenuSubmenu_exports, {
  ContextMenuSubWithMenu: () => ContextMenuSubWithMenu,
  TldrawUiMenuSubmenu: () => TldrawUiMenuSubmenu
});
module.exports = __toCommonJS(TldrawUiMenuSubmenu_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_radix_ui = require("radix-ui");
var import_useMenuIsOpen = require("../../../hooks/useMenuIsOpen");
var import_useTranslation = require("../../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../Button/TldrawUiButtonIcon");
var import_TldrawUiButtonLabel = require("../Button/TldrawUiButtonLabel");
var import_TldrawUiDropdownMenu = require("../TldrawUiDropdownMenu");
var import_TldrawUiMenuContext = require("./TldrawUiMenuContext");
function TldrawUiMenuSubmenu({
  id,
  disabled = false,
  label,
  size = "small",
  children
}) {
  const { type: menuType, sourceId } = (0, import_TldrawUiMenuContext.useTldrawUiMenuContext)();
  const container = (0, import_editor.useContainer)();
  const msg = (0, import_useTranslation.useTranslation)();
  const labelToUse = label ? typeof label === "string" ? label : label[menuType] ?? label["default"] : void 0;
  const labelStr = labelToUse ? msg(labelToUse) : void 0;
  switch (menuType) {
    case "menu": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuSub, { id: `${sourceId}-sub.${id}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiDropdownMenu.TldrawUiDropdownMenuSubTrigger,
          {
            id: `${sourceId}-sub.${id}-button`,
            disabled,
            label: labelStr,
            title: labelStr
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuSubContent, { id: `${sourceId}-sub.${id}-content`, size, children })
      ] });
    }
    case "context-menu": {
      if (disabled) return null;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ContextMenuSubWithMenu, { id: `${sourceId}-sub.${id}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.ContextMenu.ContextMenuSubTrigger, { dir: "ltr", disabled, asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          import_TldrawUiButton.TldrawUiButton,
          {
            "data-testid": `${sourceId}-sub.${id}-button`,
            type: "menu",
            className: "tlui-menu__submenu__trigger",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: labelStr }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "chevron-right", small: true })
            ]
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.ContextMenu.ContextMenuPortal, { container, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_radix_ui.ContextMenu.ContextMenuSubContent,
          {
            "data-testid": `${sourceId}-sub.${id}-content`,
            className: "tlui-menu tlui-menu__submenu__content",
            alignOffset: -1,
            sideOffset: -4,
            collisionPadding: 4,
            "data-size": size,
            children
          }
        ) })
      ] });
    }
    default: {
      return children;
    }
  }
}
function ContextMenuSubWithMenu({ id, children }) {
  const [open, onOpenChange] = (0, import_useMenuIsOpen.useMenuIsOpen)(id);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.ContextMenu.ContextMenuSub, { open, onOpenChange, children });
}
//# sourceMappingURL=TldrawUiMenuSubmenu.js.map
