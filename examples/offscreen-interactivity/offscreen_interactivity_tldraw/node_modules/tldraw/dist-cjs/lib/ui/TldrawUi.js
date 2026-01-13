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
var TldrawUi_exports = {};
__export(TldrawUi_exports, {
  TldrawUi: () => TldrawUi
});
module.exports = __toCommonJS(TldrawUi_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_classnames = __toESM(require("classnames"));
var import_react = __toESM(require("react"));
var import_Dialogs = require("./components/Dialogs");
var import_FollowingIndicator = require("./components/FollowingIndicator");
var import_Toasts = require("./components/Toasts");
var import_TldrawUiButton = require("./components/primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("./components/primitives/Button/TldrawUiButtonIcon");
var import_constants = require("./constants");
var import_TldrawUiContextProvider = require("./context/TldrawUiContextProvider");
var import_actions = require("./context/actions");
var import_breakpoints = require("./context/breakpoints");
var import_components = require("./context/components");
var import_useClipboardEvents = require("./hooks/useClipboardEvents");
var import_useEditorEvents = require("./hooks/useEditorEvents");
var import_useKeyboardShortcuts = require("./hooks/useKeyboardShortcuts");
var import_useReadonly = require("./hooks/useReadonly");
var import_useTranslation = require("./hooks/useTranslation/useTranslation");
const TldrawUi = import_react.default.memo(function TldrawUi2({
  renderDebugMenuItems,
  children,
  hideUi,
  components,
  ...rest
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiContextProvider.TldrawUiContextProvider, { ...rest, components, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TldrawUiInner, { hideUi, renderDebugMenuItems, children }) });
});
const TldrawUiInner = import_react.default.memo(function TldrawUiInner2({
  children,
  hideUi,
  ...rest
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    children,
    hideUi ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TldrawUiContent, { ...rest })
  ] });
});
const TldrawUiContent = import_react.default.memo(function TldrawUI() {
  const editor = (0, import_editor.useEditor)();
  const msg = (0, import_useTranslation.useTranslation)();
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  const isReadonlyMode = (0, import_useReadonly.useReadonly)();
  const isFocusMode = (0, import_editor.useValue)("focus", () => editor.getInstanceState().isFocusMode, [editor]);
  const isDebugMode = (0, import_editor.useValue)("debug", () => editor.getInstanceState().isDebugMode, [editor]);
  const {
    SharePanel,
    TopPanel,
    MenuPanel,
    StylePanel,
    Toolbar,
    HelpMenu,
    NavigationPanel,
    HelperButtons,
    DebugPanel,
    CursorChatBubble
  } = (0, import_components.useTldrawUiComponents)();
  (0, import_useKeyboardShortcuts.useKeyboardShortcuts)();
  (0, import_useClipboardEvents.useNativeClipboardEvents)();
  (0, import_useEditorEvents.useEditorEvents)();
  const { "toggle-focus-mode": toggleFocus } = (0, import_actions.useActions)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      className: (0, import_classnames.default)("tlui-layout", {
        "tlui-layout__mobile": breakpoint < import_constants.PORTRAIT_BREAKPOINT.TABLET_SM
      }),
      "data-breakpoint": breakpoint,
      children: [
        isFocusMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-layout__top", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiButton.TldrawUiButton,
          {
            type: "icon",
            className: "tlui-focus-button",
            title: msg("focus-mode.toggle-focus-mode"),
            onClick: () => toggleFocus.onSelect("menu"),
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "dot" })
          }
        ) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-layout__top", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-layout__top__left", children: [
              MenuPanel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuPanel, {}),
              HelperButtons && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelperButtons, {})
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-layout__top__center", children: TopPanel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopPanel, {}) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-layout__top__right", children: [
              SharePanel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SharePanel, {}),
              StylePanel && breakpoint >= import_constants.PORTRAIT_BREAKPOINT.TABLET_SM && !isReadonlyMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StylePanel, {})
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-layout__bottom", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-layout__bottom__main", children: [
              NavigationPanel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavigationPanel, {}),
              Toolbar && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toolbar, {}),
              HelpMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelpMenu, {})
            ] }),
            isDebugMode && DebugPanel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DebugPanel, {})
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Toasts.TldrawUiToasts, {}),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Dialogs.TldrawUiDialogs, {}),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FollowingIndicator.FollowingIndicator, {}),
        CursorChatBubble && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CursorChatBubble, {})
      ]
    }
  );
});
//# sourceMappingURL=TldrawUi.js.map
