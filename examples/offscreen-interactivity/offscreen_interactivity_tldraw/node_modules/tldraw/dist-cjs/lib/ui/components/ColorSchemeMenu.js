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
var ColorSchemeMenu_exports = {};
__export(ColorSchemeMenu_exports, {
  ColorSchemeMenu: () => ColorSchemeMenu
});
module.exports = __toCommonJS(ColorSchemeMenu_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_events = require("../context/events");
var import_TldrawUiMenuCheckboxItem = require("./primitives/menus/TldrawUiMenuCheckboxItem");
var import_TldrawUiMenuGroup = require("./primitives/menus/TldrawUiMenuGroup");
var import_TldrawUiMenuSubmenu = require("./primitives/menus/TldrawUiMenuSubmenu");
const COLOR_SCHEMES = [
  { colorScheme: "light", label: "theme.light" },
  { colorScheme: "dark", label: "theme.dark" },
  { colorScheme: "system", label: "theme.system" }
];
function ColorSchemeMenu() {
  const editor = (0, import_editor.useEditor)();
  const trackEvent = (0, import_events.useUiEvents)();
  const currentColorScheme = (0, import_editor.useValue)(
    "colorScheme",
    () => editor.user.getUserPreferences().colorScheme ?? (editor.user.getIsDarkMode() ? "dark" : "light"),
    [editor]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuSubmenu.TldrawUiMenuSubmenu, { id: "help menu color-scheme", label: "menu.theme", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { id: "theme", children: COLOR_SCHEMES.map(({ colorScheme, label }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_TldrawUiMenuCheckboxItem.TldrawUiMenuCheckboxItem,
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
//# sourceMappingURL=ColorSchemeMenu.js.map
