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
var TldrawUiMenuItem_exports = {};
__export(TldrawUiMenuItem_exports, {
  TldrawUiMenuItem: () => TldrawUiMenuItem
});
module.exports = __toCommonJS(TldrawUiMenuItem_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react_context_menu = require("@radix-ui/react-context-menu");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_actions = require("../../../context/actions");
var import_useReadonly = require("../../../hooks/useReadonly");
var import_useTranslation = require("../../../hooks/useTranslation/useTranslation");
var import_kbd_utils = require("../../../kbd-utils");
var import_Spinner = require("../../Spinner");
var import_TldrawUiButton = require("../Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../Button/TldrawUiButtonIcon");
var import_TldrawUiButtonLabel = require("../Button/TldrawUiButtonLabel");
var import_TldrawUiDropdownMenu = require("../TldrawUiDropdownMenu");
var import_TldrawUiKbd = require("../TldrawUiKbd");
var import_TldrawUiMenuContext = require("./TldrawUiMenuContext");
function TldrawUiMenuItem({
  disabled = false,
  spinner = false,
  readonlyOk = false,
  id,
  kbd,
  label,
  icon,
  onSelect,
  noClose,
  isSelected
}) {
  const { type: menuType, sourceId } = (0, import_TldrawUiMenuContext.useTldrawUiMenuContext)();
  const msg = (0, import_useTranslation.useTranslation)();
  const [disableClicks, setDisableClicks] = (0, import_react.useState)(false);
  const isReadonlyMode = (0, import_useReadonly.useReadonly)();
  if (isReadonlyMode && !readonlyOk) return null;
  const labelToUse = (0, import_actions.unwrapLabel)(label, menuType);
  const kbdTouse = kbd ? (0, import_kbd_utils.kbdStr)(kbd) : void 0;
  const labelStr = labelToUse ? msg(labelToUse) : void 0;
  const titleStr = labelStr && kbdTouse ? `${labelStr} ${kbdTouse}` : labelStr;
  switch (menuType) {
    case "menu": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        import_TldrawUiButton.TldrawUiButton,
        {
          type: "menu",
          "data-testid": `${sourceId}.${id}`,
          disabled,
          title: titleStr,
          onClick: (e) => {
            if (noClose) {
              (0, import_editor.preventDefault)(e);
            }
            if (disableClicks) {
              setDisableClicks(false);
            } else {
              onSelect(sourceId);
            }
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: labelStr }),
            kbd && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiKbd.TldrawUiKbd, { children: kbd })
          ]
        }
      ) });
    }
    case "context-menu": {
      if (disabled) return null;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        import_react_context_menu.ContextMenuItem,
        {
          dir: "ltr",
          title: titleStr,
          draggable: false,
          className: "tlui-button tlui-button__menu",
          "data-testid": `${sourceId}.${id}`,
          onSelect: (e) => {
            if (noClose) (0, import_editor.preventDefault)(e);
            if (disableClicks) {
              setDisableClicks(false);
            } else {
              onSelect(sourceId);
            }
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tlui-button__label", draggable: false, children: labelStr }),
            kbd && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiKbd.TldrawUiKbd, { children: kbd }),
            spinner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Spinner.Spinner, {})
          ]
        }
      );
    }
    case "panel": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        import_TldrawUiButton.TldrawUiButton,
        {
          "data-testid": `${sourceId}.${id}`,
          type: "menu",
          title: titleStr,
          disabled,
          onClick: () => onSelect(sourceId),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: labelStr }),
            spinner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Spinner.Spinner, {}) : icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon })
          ]
        }
      );
    }
    case "small-icons":
    case "icons": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiButton.TldrawUiButton,
        {
          "data-testid": `${sourceId}.${id}`,
          type: "icon",
          title: titleStr,
          disabled,
          onClick: () => onSelect(sourceId),
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon, small: menuType === "small-icons" })
        }
      );
    }
    case "keyboard-shortcuts": {
      if (!kbd) {
        console.warn(
          `Menu item '${label}' isn't shown in the keyboard shortcuts dialog because it doesn't have a keyboard shortcut.`
        );
        return null;
      }
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-shortcuts-dialog__key-pair", "data-testid": `${sourceId}.${id}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-shortcuts-dialog__key-pair__key", children: labelStr }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-shortcuts-dialog__key-pair__value", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiKbd.TldrawUiKbd, { visibleOnMobileLayout: true, children: kbd }) })
      ] });
    }
    case "helper-buttons": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiButton.TldrawUiButton, { type: "low", onClick: () => onSelect(sourceId), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: labelStr })
      ] });
    }
    case "toolbar": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiButton.TldrawUiButton,
        {
          type: "tool",
          "data-testid": `tools.${id}`,
          "aria-label": labelToUse,
          "data-value": id,
          onClick: () => onSelect("toolbar"),
          title: titleStr,
          disabled,
          onTouchStart: (e) => {
            (0, import_editor.preventDefault)(e);
            onSelect("toolbar");
          },
          role: "radio",
          "aria-checked": isSelected ? "true" : "false",
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon })
        }
      );
    }
    case "toolbar-overflow": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuItem, { "aria-label": label, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiButton.TldrawUiButton,
        {
          type: "icon",
          className: "tlui-button-grid__button",
          onClick: () => {
            onSelect("toolbar");
          },
          "data-testid": `tools.more.${id}`,
          title: titleStr,
          disabled,
          role: "radio",
          "aria-checked": isSelected ? "true" : "false",
          "data-value": id,
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon })
        }
      ) });
    }
    default: {
      throw (0, import_editor.exhaustiveSwitchError)(menuType);
    }
  }
}
//# sourceMappingURL=TldrawUiMenuItem.js.map
