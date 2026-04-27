import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEditor, useValue } from "@tldraw/editor";
import { useCallback, useRef, useState } from "react";
import { useUiEvents } from "../../context/events.mjs";
import { useTranslation } from "../../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiButton } from "../primitives/Button/TldrawUiButton.mjs";
import { TldrawUiButtonIcon } from "../primitives/Button/TldrawUiButtonIcon.mjs";
import { TldrawUiInput } from "../primitives/TldrawUiInput.mjs";
import { UserPresenceColorPicker } from "./UserPresenceColorPicker.mjs";
function UserPresenceEditor() {
  const editor = useEditor();
  const trackEvent = useUiEvents();
  const userName = useValue("userName", () => editor.user.getName(), []);
  const msg = useTranslation();
  const rOriginalName = useRef(userName);
  const rCurrentName = useRef(userName);
  const [isEditingName, setIsEditingName] = useState(false);
  const toggleEditingName = useCallback(() => {
    setIsEditingName((s) => !s);
  }, []);
  const handleValueChange = useCallback(
    (value) => {
      rCurrentName.current = value;
      editor.user.updateUserPreferences({ name: value });
    },
    [editor]
  );
  const handleBlur = useCallback(() => {
    if (rOriginalName.current === rCurrentName.current) return;
    trackEvent("change-user-name", { source: "people-menu" });
    rOriginalName.current = rCurrentName.current;
  }, [trackEvent]);
  const handleCancel = useCallback(() => {
    setIsEditingName(false);
    editor.user.updateUserPreferences({ name: rOriginalName.current });
    editor.menus.clearOpenMenus();
  }, [editor]);
  return /* @__PURE__ */ jsxs("div", { className: "tlui-people-menu__user", children: [
    /* @__PURE__ */ jsx(UserPresenceColorPicker, {}),
    isEditingName ? /* @__PURE__ */ jsx(
      TldrawUiInput,
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
    ) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "tlui-people-menu__user__name",
          onDoubleClick: () => {
            if (!isEditingName) setIsEditingName(true);
          },
          children: userName || msg("people-menu.anonymous-user")
        }
      ),
      !userName ? /* @__PURE__ */ jsx("div", { className: "tlui-people-menu__user__label", children: msg("people-menu.user") }) : null
    ] }),
    /* @__PURE__ */ jsx(
      TldrawUiButton,
      {
        type: "icon",
        className: "tlui-people-menu__user__edit",
        "data-testid": "people-menu.change-name",
        title: msg("people-menu.change-name"),
        onClick: toggleEditingName,
        children: /* @__PURE__ */ jsx(TldrawUiButtonIcon, { icon: isEditingName ? "check" : "edit" })
      }
    )
  ] });
}
export {
  UserPresenceEditor
};
//# sourceMappingURL=UserPresenceEditor.mjs.map
