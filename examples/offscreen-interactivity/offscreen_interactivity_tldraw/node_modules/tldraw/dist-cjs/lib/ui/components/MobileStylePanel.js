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
var MobileStylePanel_exports = {};
__export(MobileStylePanel_exports, {
  MobileStylePanel: () => MobileStylePanel
});
module.exports = __toCommonJS(MobileStylePanel_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_components = require("../context/components");
var import_useRelevantStyles = require("../hooks/useRelevantStyles");
var import_useTranslation = require("../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("./primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("./primitives/Button/TldrawUiButtonIcon");
var import_TldrawUiPopover = require("./primitives/TldrawUiPopover");
function MobileStylePanel() {
  const editor = (0, import_editor.useEditor)();
  const msg = (0, import_useTranslation.useTranslation)();
  const relevantStyles = (0, import_useRelevantStyles.useRelevantStyles)();
  const color = relevantStyles?.get(import_editor.DefaultColorStyle);
  const theme = (0, import_editor.getDefaultColorTheme)({ isDarkMode: editor.user.getIsDarkMode() });
  const currentColor = (color?.type === "shared" ? theme[color.value] : theme.black).solid;
  const disableStylePanel = (0, import_editor.useValue)(
    "disable style panel",
    () => editor.isInAny("hand", "zoom", "eraser", "laser"),
    [editor]
  );
  const handleStylesOpenChange = (0, import_react.useCallback)(
    (isOpen) => {
      if (!isOpen) {
        editor.updateInstanceState({ isChangingStyle: false });
      }
    },
    [editor]
  );
  const { StylePanel } = (0, import_components.useTldrawUiComponents)();
  if (!StylePanel) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiPopover.TldrawUiPopover, { id: "mobile style menu", onOpenChange: handleStylesOpenChange, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiPopover.TldrawUiPopoverTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_TldrawUiButton.TldrawUiButton,
      {
        type: "tool",
        "data-testid": "mobile-styles.button",
        style: {
          color: disableStylePanel ? "var(--color-muted-1)" : currentColor
        },
        title: msg("style-panel.title"),
        disabled: disableStylePanel,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiButtonIcon.TldrawUiButtonIcon,
          {
            icon: disableStylePanel ? "blob" : color?.type === "mixed" ? "mixed" : "blob"
          }
        )
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiPopover.TldrawUiPopoverContent, { side: "top", align: "end", children: StylePanel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StylePanel, { isMobile: true }) })
  ] });
}
//# sourceMappingURL=MobileStylePanel.js.map
