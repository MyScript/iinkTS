import { jsx } from "react/jsx-runtime";
import { useEditor, useValue } from "@tldraw/editor";
import { useUiEvents } from "../context/events.mjs";
import { TldrawUiMenuCheckboxItem } from "./primitives/menus/TldrawUiMenuCheckboxItem.mjs";
import { TldrawUiMenuGroup } from "./primitives/menus/TldrawUiMenuGroup.mjs";
import { TldrawUiMenuSubmenu } from "./primitives/menus/TldrawUiMenuSubmenu.mjs";
const COLOR_SCHEMES = [
  { colorScheme: "light", label: "theme.light" },
  { colorScheme: "dark", label: "theme.dark" },
  { colorScheme: "system", label: "theme.system" }
];
function ColorSchemeMenu() {
  const editor = useEditor();
  const trackEvent = useUiEvents();
  const currentColorScheme = useValue(
    "colorScheme",
    () => editor.user.getUserPreferences().colorScheme ?? (editor.user.getIsDarkMode() ? "dark" : "light"),
    [editor]
  );
  return /* @__PURE__ */ jsx(TldrawUiMenuSubmenu, { id: "help menu color-scheme", label: "menu.theme", children: /* @__PURE__ */ jsx(TldrawUiMenuGroup, { id: "theme", children: COLOR_SCHEMES.map(({ colorScheme, label }) => /* @__PURE__ */ jsx(
    TldrawUiMenuCheckboxItem,
    {
      id: `color-scheme-${colorScheme}`,
      label,
      checked: colorScheme === currentColorScheme,
      readonlyOk: true,
      onSelect: () => {
        editor.user.updateUserPreferences({ colorScheme });
        trackEvent("color-scheme", { source: "menu", value: colorScheme });
      }
    },
    colorScheme
  )) }) });
}
export {
  ColorSchemeMenu
};
//# sourceMappingURL=ColorSchemeMenu.mjs.map
