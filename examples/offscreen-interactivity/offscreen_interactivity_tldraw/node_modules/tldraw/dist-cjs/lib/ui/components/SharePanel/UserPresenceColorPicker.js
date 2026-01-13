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
var UserPresenceColorPicker_exports = {};
__export(UserPresenceColorPicker_exports, {
  UserPresenceColorPicker: () => UserPresenceColorPicker
});
module.exports = __toCommonJS(UserPresenceColorPicker_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var Popover = __toESM(require("@radix-ui/react-popover"));
var import_editor = require("@tldraw/editor");
var import_react = __toESM(require("react"));
var import_events = require("../../context/events");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
const UserPresenceColorPicker = (0, import_editor.track)(function UserPresenceColorPicker2() {
  const editor = (0, import_editor.useEditor)();
  const container = (0, import_editor.useContainer)();
  const msg = (0, import_useTranslation.useTranslation)();
  const trackEvent = (0, import_events.useUiEvents)();
  const rPointing = (0, import_react.useRef)(false);
  const [isOpen, setIsOpen] = (0, import_react.useState)(false);
  const handleOpenChange = (0, import_react.useCallback)((isOpen2) => {
    setIsOpen(isOpen2);
  }, []);
  const value = editor.user.getColor();
  const onValueChange = (0, import_react.useCallback)(
    (item) => {
      editor.user.updateUserPreferences({ color: item });
      trackEvent("set-color", { source: "people-menu" });
    },
    [editor, trackEvent]
  );
  const {
    handleButtonClick,
    handleButtonPointerDown,
    handleButtonPointerEnter,
    handleButtonPointerUp
  } = import_react.default.useMemo(() => {
    const handlePointerUp = () => {
      rPointing.current = false;
      window.removeEventListener("pointerup", handlePointerUp);
    };
    const handleButtonClick2 = (e) => {
      const { id } = e.currentTarget.dataset;
      if (!id) return;
      if (value === id) return;
      onValueChange(id);
    };
    const handleButtonPointerDown2 = (e) => {
      const { id } = e.currentTarget.dataset;
      if (!id) return;
      onValueChange(id);
      rPointing.current = true;
      window.addEventListener("pointerup", handlePointerUp);
    };
    const handleButtonPointerEnter2 = (e) => {
      if (!rPointing.current) return;
      const { id } = e.currentTarget.dataset;
      if (!id) return;
      onValueChange(id);
    };
    const handleButtonPointerUp2 = (e) => {
      const { id } = e.currentTarget.dataset;
      if (!id) return;
      onValueChange(id);
    };
    return {
      handleButtonClick: handleButtonClick2,
      handleButtonPointerDown: handleButtonPointerDown2,
      handleButtonPointerEnter: handleButtonPointerEnter2,
      handleButtonPointerUp: handleButtonPointerUp2
    };
  }, [value, onValueChange]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover.Root, { onOpenChange: handleOpenChange, open: isOpen, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Popover.Trigger, { dir: "ltr", asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_TldrawUiButton.TldrawUiButton,
      {
        type: "icon",
        className: "tlui-people-menu__user__color",
        style: { color: editor.user.getColor() },
        title: msg("people-menu.change-color"),
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "color" })
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Popover.Portal, { container, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      Popover.Content,
      {
        dir: "ltr",
        className: "tlui-menu tlui-people-menu__user__color-picker",
        align: "start",
        side: "left",
        sideOffset: 8,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-buttons__grid", children: import_editor.USER_COLORS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiButton.TldrawUiButton,
          {
            type: "icon",
            "data-id": item,
            "data-testid": item,
            "aria-label": item,
            "data-state": value === item ? "hinted" : void 0,
            title: item,
            className: "tlui-button-grid__button",
            style: { color: item },
            onPointerEnter: handleButtonPointerEnter,
            onPointerDown: handleButtonPointerDown,
            onPointerUp: handleButtonPointerUp,
            onClick: handleButtonClick,
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "color" })
          },
          item
        )) })
      }
    ) })
  ] });
});
//# sourceMappingURL=UserPresenceColorPicker.js.map
