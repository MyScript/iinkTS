import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback } from "react";
import { useTldrawUiComponents } from "../../context/components.mjs";
import { useDialogs } from "../../context/dialogs.mjs";
import { LanguageMenu } from "../LanguageMenu.mjs";
import { TldrawUiMenuItem } from "../primitives/menus/TldrawUiMenuItem.mjs";
function DefaultHelpMenuContent() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(LanguageMenu, {}),
    /* @__PURE__ */ jsx(KeyboardShortcutsMenuItem, {})
  ] });
}
function KeyboardShortcutsMenuItem() {
  const { KeyboardShortcutsDialog } = useTldrawUiComponents();
  const { addDialog } = useDialogs();
  const handleSelect = useCallback(() => {
    if (KeyboardShortcutsDialog) addDialog({ component: KeyboardShortcutsDialog });
  }, [addDialog, KeyboardShortcutsDialog]);
  if (!KeyboardShortcutsDialog) return null;
  return /* @__PURE__ */ jsx(
    TldrawUiMenuItem,
    {
      id: "keyboard-shortcuts-button",
      label: "help-menu.keyboard-shortcuts",
      readonlyOk: true,
      onSelect: handleSelect
    }
  );
}
export {
  DefaultHelpMenuContent,
  KeyboardShortcutsMenuItem
};
//# sourceMappingURL=DefaultHelpMenuContent.mjs.map
