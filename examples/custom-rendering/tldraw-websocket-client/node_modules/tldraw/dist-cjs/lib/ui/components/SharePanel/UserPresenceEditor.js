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
var UserPresenceEditor_exports = {};
__export(UserPresenceEditor_exports, {
  UserPresenceEditor: () => UserPresenceEditor
});
module.exports = __toCommonJS(UserPresenceEditor_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_events = require("../../context/events");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
var import_TldrawUiInput = require("../primitives/TldrawUiInput");
var import_UserPresenceColorPicker = require("./UserPresenceColorPicker");
function UserPresenceEditor() {
  const editor = (0, import_editor.useEditor)();
  const trackEvent = (0, import_events.useUiEvents)();
  const userName = (0, import_editor.useValue)("userName", () => editor.user.getName(), []);
  const msg = (0, import_useTranslation.useTranslation)();
  const rOriginalName = (0, import_react.useRef)(userName);
  const rCurrentName = (0, import_react.useRef)(userName);
  const [isEditingName, setIsEditingName] = (0, import_react.useState)(false);
  const toggleEditingName = (0, import_react.useCallback)(() => {
    setIsEditingName((s) => !s);
  }, []);
  const handleValueChange = (0, import_react.useCallback)(
    (value) => {
      rCurrentName.current = value;
      editor.user.updateUserPreferences({ name: value });
    },
    [editor]
  );
  const handleBlur = (0, import_react.useCallback)(() => {
    if (rOriginalName.current === rCurrentName.current) return;
    trackEvent("change-user-name", { source: "people-menu" });
    rOriginalName.current = rCurrentName.current;
  }, [trackEvent]);
  const handleCancel = (0, import_react.useCallback)(() => {
    setIsEditingName(false);
    editor.user.updateUserPreferences({ name: rOriginalName.current });
    editor.menus.clearOpenMenus();
  }, [editor]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-people-menu__user", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_UserPresenceColorPicker.UserPresenceColorPicker, {}),
    isEditingName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_TldrawUiInput.TldrawUiInput,
      {
        className: "tlui-people-menu__user__input",
        defaultValue: userName,
        onValueChange: handleValueChange,
        onComplete: toggleEditingName,
        onCancel: handleCancel,
        onBlur: handleBlur,
        shouldManuallyMaintainScrollPositionWhenFocused: true,
        autoFocus: true,
        autoSelect: true
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          className: "tlui-people-menu__user__name",
          onDoubleClick: () => {
            if (!isEditingName) setIsEditingName(true);
          },
          children: userName || msg("people-menu.anonymous-user")
        }
      ),
      !userName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-people-menu__user__label", children: msg("people-menu.user") }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_TldrawUiButton.TldrawUiButton,
      {
        type: "icon",
        className: "tlui-people-menu__user__edit",
        "data-testid": "people-menu.change-name",
        title: msg("people-menu.change-name"),
        onClick: toggleEditingName,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: isEditingName ? "check" : "edit" })
      }
    )
  ] });
}
//# sourceMappingURL=UserPresenceEditor.js.map
