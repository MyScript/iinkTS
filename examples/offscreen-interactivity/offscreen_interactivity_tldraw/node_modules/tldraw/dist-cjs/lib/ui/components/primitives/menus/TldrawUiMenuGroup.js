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
var TldrawUiMenuGroup_exports = {};
__export(TldrawUiMenuGroup_exports, {
  TldrawUiMenuGroup: () => TldrawUiMenuGroup
});
module.exports = __toCommonJS(TldrawUiMenuGroup_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react_context_menu = require("@radix-ui/react-context-menu");
var import_actions = require("../../../context/actions");
var import_useTranslation = require("../../../hooks/useTranslation/useTranslation");
var import_TldrawUiDropdownMenu = require("../TldrawUiDropdownMenu");
var import_TldrawUiMenuContext = require("./TldrawUiMenuContext");
function TldrawUiMenuGroup({ id, label, children }) {
  const { type: menuType, sourceId } = (0, import_TldrawUiMenuContext.useTldrawUiMenuContext)();
  const msg = (0, import_useTranslation.useTranslation)();
  const labelToUse = (0, import_actions.unwrapLabel)(label, menuType);
  const labelStr = labelToUse ? msg(labelToUse) : void 0;
  switch (menuType) {
    case "panel": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-menu__group", "data-testid": `${sourceId}-group.${id}`, children });
    }
    case "menu": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuGroup, { "data-testid": `${sourceId}-group.${id}`, children });
    }
    case "context-menu": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_react_context_menu.ContextMenuGroup,
        {
          dir: "ltr",
          className: "tlui-menu__group",
          "data-testid": `${sourceId}-group.${id}`,
          children
        }
      );
    }
    case "keyboard-shortcuts": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-shortcuts-dialog__group", "data-testid": `${sourceId}-group.${id}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "tlui-shortcuts-dialog__group__title", children: labelStr }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-shortcuts-dialog__group__content", children })
      ] });
    }
    default: {
      return children;
    }
  }
}
//# sourceMappingURL=TldrawUiMenuGroup.js.map
