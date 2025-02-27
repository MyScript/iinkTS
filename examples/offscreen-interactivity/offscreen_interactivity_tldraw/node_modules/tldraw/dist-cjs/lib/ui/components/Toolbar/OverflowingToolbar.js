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
var OverflowingToolbar_exports = {};
__export(OverflowingToolbar_exports, {
  IsInOverflowContext: () => IsInOverflowContext,
  OverflowingToolbar: () => OverflowingToolbar,
  isActiveTLUiToolItem: () => isActiveTLUiToolItem
});
module.exports = __toCommonJS(OverflowingToolbar_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_classnames = __toESM(require("classnames"));
var import_hotkeys_js = __toESM(require("hotkeys-js"));
var import_react = require("react");
var import_constants = require("../../constants");
var import_breakpoints = require("../../context/breakpoints");
var import_useKeyboardShortcuts = require("../../hooks/useKeyboardShortcuts");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
var import_TldrawUiDropdownMenu = require("../primitives/TldrawUiDropdownMenu");
var import_TldrawUiMenuContext = require("../primitives/menus/TldrawUiMenuContext");
const IsInOverflowContext = (0, import_react.createContext)(false);
function OverflowingToolbar({ children }) {
  const editor = (0, import_editor.useEditor)();
  const id = (0, import_editor.useUniqueSafeId)();
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  const msg = (0, import_useTranslation.useTranslation)();
  const overflowIndex = Math.min(8, 5 + breakpoint);
  const [totalItems, setTotalItems] = (0, import_react.useState)(0);
  const mainToolsRef = (0, import_react.useRef)(null);
  const [lastActiveOverflowItem, setLastActiveOverflowItem] = (0, import_react.useState)(null);
  const css = (0, import_react.useMemo)(() => {
    const activeCss = lastActiveOverflowItem ? `:not([data-value="${lastActiveOverflowItem}"])` : "";
    return `
			#${id}_main > *:nth-child(n + ${overflowIndex + (lastActiveOverflowItem ? 1 : 2)})${activeCss} {
				display: none;
			}
			#${id}_more > *:nth-child(-n + ${overflowIndex}) {
				display: none;
			}
        `;
  }, [lastActiveOverflowItem, id, overflowIndex]);
  const onDomUpdate = (0, import_editor.useEvent)(() => {
    if (!mainToolsRef.current) return;
    const children2 = Array.from(mainToolsRef.current.children);
    setTotalItems(children2.length);
    const lastActiveElementIdx = children2.findIndex(
      (el) => el.getAttribute("data-value") === lastActiveOverflowItem
    );
    if (lastActiveElementIdx <= overflowIndex) {
      setLastActiveOverflowItem(null);
    }
    const activeElementIdx = Array.from(mainToolsRef.current.children).findIndex(
      (el) => el.getAttribute("aria-checked") === "true"
    );
    if (activeElementIdx === -1) return;
    if (activeElementIdx >= overflowIndex) {
      setLastActiveOverflowItem(children2[activeElementIdx].getAttribute("data-value"));
    }
  });
  (0, import_react.useLayoutEffect)(() => {
    onDomUpdate();
  });
  (0, import_react.useLayoutEffect)(() => {
    if (!mainToolsRef.current) return;
    const mutationObserver = new MutationObserver(onDomUpdate);
    mutationObserver.observe(mainToolsRef.current, {
      childList: true,
      subtree: true,
      attributeFilter: ["data-value", "aria-checked"]
    });
    return () => {
      mutationObserver.disconnect();
    };
  }, [onDomUpdate]);
  (0, import_react.useEffect)(() => {
    const keys = [
      ["1", 0],
      ["2", 1],
      ["3", 2],
      ["4", 3],
      ["5", 4],
      ["6", 5],
      ["7", 6],
      ["8", 7],
      ["9", 8],
      ["0", 9]
    ];
    for (const [key, index] of keys) {
      (0, import_hotkeys_js.default)(key, (event) => {
        if ((0, import_useKeyboardShortcuts.areShortcutsDisabled)(editor)) return;
        (0, import_editor.preventDefault)(event);
        const relevantEls = Array.from(mainToolsRef.current?.children ?? []).filter(
          (el2) => {
            if (!(el2 instanceof HTMLElement)) return false;
            if (el2.tagName.toLowerCase() !== "button") return false;
            return !!(el2.offsetWidth || el2.offsetHeight);
          }
        );
        const el = relevantEls[index];
        if (el) el.click();
      });
    }
    return () => {
      import_hotkeys_js.default.unbind("1,2,3,4,5,6,7,8,9,0");
    };
  }, [editor]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: css }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: (0, import_classnames.default)("tlui-toolbar__tools", {
          "tlui-toolbar__tools__mobile": breakpoint < import_constants.PORTRAIT_BREAKPOINT.TABLET_SM
        }),
        role: "radiogroup",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { id: `${id}_main`, ref: mainToolsRef, className: "tlui-toolbar__tools__list", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuContext.TldrawUiMenuContextProvider, { type: "toolbar", sourceId: "toolbar", children }) }),
          totalItems > overflowIndex + 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IsInOverflowContext.Provider, { value: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuRoot, { id: "toolbar overflow", modal: false, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_TldrawUiButton.TldrawUiButton,
              {
                title: msg("tool-panel.more"),
                type: "tool",
                className: "tlui-toolbar__overflow",
                "data-testid": "tools.more-button",
                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "chevron-up" })
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuContent, { side: "top", align: "center", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "div",
              {
                className: "tlui-buttons__grid",
                "data-testid": "tools.more-content",
                id: `${id}_more`,
                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuContext.TldrawUiMenuContextProvider, { type: "toolbar-overflow", sourceId: "toolbar", children })
              }
            ) })
          ] }) })
        ]
      }
    )
  ] });
}
const isActiveTLUiToolItem = (item, activeToolId, geoState) => {
  return item.meta?.geo ? activeToolId === "geo" && geoState === item.meta?.geo : activeToolId === item.id;
};
//# sourceMappingURL=OverflowingToolbar.js.map
