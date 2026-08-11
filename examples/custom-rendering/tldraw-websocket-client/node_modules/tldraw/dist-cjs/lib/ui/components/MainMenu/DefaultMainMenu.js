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
var DefaultMainMenu_exports = {};
__export(DefaultMainMenu_exports, {
  DefaultMainMenu: () => DefaultMainMenu
});
module.exports = __toCommonJS(DefaultMainMenu_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_radix_ui = require("radix-ui");
var import_react = require("react");
var import_useMenuIsOpen = require("../../hooks/useMenuIsOpen");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
var import_TldrawUiMenuContext = require("../primitives/menus/TldrawUiMenuContext");
var import_DefaultMainMenuContent = require("./DefaultMainMenuContent");
const DefaultMainMenu = (0, import_react.memo)(function DefaultMainMenu2({ children }) {
  const container = (0, import_editor.useContainer)();
  const [isOpen, onOpenChange] = (0, import_useMenuIsOpen.useMenuIsOpen)("main menu");
  const msg = (0, import_useTranslation.useTranslation)();
  const content = children ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_DefaultMainMenuContent.DefaultMainMenuContent, {});
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_radix_ui.DropdownMenu.Root, { dir: "ltr", open: isOpen, onOpenChange, modal: false, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.DropdownMenu.Trigger, { asChild: true, dir: "ltr", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButton.TldrawUiButton, { type: "icon", "data-testid": "main-menu.button", title: msg("menu.title"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "menu", small: true }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.DropdownMenu.Portal, { container, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_radix_ui.DropdownMenu.Content,
      {
        className: "tlui-menu",
        side: "bottom",
        align: "start",
        collisionPadding: 4,
        alignOffset: 0,
        sideOffset: 6,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuContext.TldrawUiMenuContextProvider, { type: "menu", sourceId: "main-menu", children: content })
      }
    ) })
  ] });
});
//# sourceMappingURL=DefaultMainMenu.js.map
