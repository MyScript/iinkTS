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
var DefaultNavigationPanel_exports = {};
__export(DefaultNavigationPanel_exports, {
  DefaultNavigationPanel: () => DefaultNavigationPanel
});
module.exports = __toCommonJS(DefaultNavigationPanel_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_constants = require("../../constants");
var import_actions = require("../../context/actions");
var import_breakpoints = require("../../context/breakpoints");
var import_components = require("../../context/components");
var import_useLocalStorageState = require("../../hooks/useLocalStorageState");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_kbd_utils = require("../../kbd-utils");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
const DefaultNavigationPanel = (0, import_react.memo)(function DefaultNavigationPanel2() {
  const actions = (0, import_actions.useActions)();
  const msg = (0, import_useTranslation.useTranslation)();
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  const ref = (0, import_react.useRef)(null);
  (0, import_editor.usePassThroughWheelEvents)(ref);
  const [collapsed, setCollapsed] = (0, import_useLocalStorageState.useLocalStorageState)("minimap", true);
  const toggleMinimap = (0, import_react.useCallback)(() => {
    setCollapsed((s) => !s);
  }, [setCollapsed]);
  const { ZoomMenu, Minimap } = (0, import_components.useTldrawUiComponents)();
  if (breakpoint < import_constants.PORTRAIT_BREAKPOINT.MOBILE) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref, className: "tlui-navigation-panel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-buttons__horizontal", children: ZoomMenu && breakpoint < import_constants.PORTRAIT_BREAKPOINT.TABLET ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomMenu, {}) : collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      ZoomMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomMenu, {}),
      Minimap && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiButton.TldrawUiButton,
        {
          type: "icon",
          "data-testid": "minimap.toggle-button",
          title: msg("navigation-zone.toggle-minimap"),
          className: "tlui-navigation-panel__toggle",
          onClick: toggleMinimap,
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: collapsed ? "chevrons-ne" : "chevrons-sw" })
        }
      )
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiButton.TldrawUiButton,
        {
          type: "icon",
          "data-testid": "minimap.zoom-out",
          title: `${msg((0, import_actions.unwrapLabel)(actions["zoom-out"].label))} ${(0, import_kbd_utils.kbdStr)(actions["zoom-out"].kbd)}`,
          onClick: () => actions["zoom-out"].onSelect("navigation-zone"),
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "minus" })
        }
      ),
      ZoomMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomMenu, {}),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiButton.TldrawUiButton,
        {
          type: "icon",
          "data-testid": "minimap.zoom-in",
          title: `${msg((0, import_actions.unwrapLabel)(actions["zoom-in"].label))} ${(0, import_kbd_utils.kbdStr)(actions["zoom-in"].kbd)}`,
          onClick: () => actions["zoom-in"].onSelect("navigation-zone"),
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "plus" })
        }
      ),
      Minimap && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiButton.TldrawUiButton,
        {
          type: "icon",
          "data-testid": "minimap.toggle-button",
          title: msg("navigation-zone.toggle-minimap"),
          className: "tlui-navigation-panel__toggle",
          onClick: toggleMinimap,
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: collapsed ? "chevrons-ne" : "chevrons-sw" })
        }
      )
    ] }) }),
    Minimap && breakpoint >= import_constants.PORTRAIT_BREAKPOINT.TABLET && !collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimap, {})
  ] });
});
//# sourceMappingURL=DefaultNavigationPanel.js.map
