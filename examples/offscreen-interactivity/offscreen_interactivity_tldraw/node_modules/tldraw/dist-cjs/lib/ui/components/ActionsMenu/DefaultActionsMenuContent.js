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
var DefaultActionsMenuContent_exports = {};
__export(DefaultActionsMenuContent_exports, {
  AlignMenuItems: () => AlignMenuItems,
  DefaultActionsMenuContent: () => DefaultActionsMenuContent,
  DistributeMenuItems: () => DistributeMenuItems,
  EditLinkMenuItem: () => EditLinkMenuItem,
  GroupMenuItem: () => GroupMenuItem,
  GroupOrUngroupMenuItem: () => GroupOrUngroupMenuItem,
  ReorderMenuItems: () => ReorderMenuItems,
  RotateCCWMenuItem: () => RotateCCWMenuItem,
  RotateCWMenuItem: () => RotateCWMenuItem,
  StackMenuItems: () => StackMenuItems,
  UngroupMenuItem: () => UngroupMenuItem,
  ZoomOrRotateMenuItem: () => ZoomOrRotateMenuItem,
  ZoomTo100MenuItem: () => ZoomTo100MenuItem
});
module.exports = __toCommonJS(DefaultActionsMenuContent_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_constants = require("../../constants");
var import_breakpoints = require("../../context/breakpoints");
var import_menu_hooks = require("../../hooks/menu-hooks");
var import_TldrawUiMenuActionItem = require("../primitives/menus/TldrawUiMenuActionItem");
function DefaultActionsMenuContent() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlignMenuItems, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DistributeMenuItems, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackMenuItems, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReorderMenuItems, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomOrRotateMenuItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCWMenuItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditLinkMenuItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GroupOrUngroupMenuItem, {})
  ] });
}
function AlignMenuItems() {
  const twoSelected = (0, import_menu_hooks.useUnlockedSelectedShapesCount)(2);
  const isInSelectState = (0, import_menu_hooks.useIsInSelectState)();
  const enabled = twoSelected && isInSelectState;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-left", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-center-horizontal", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-right", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "stretch-horizontal", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-top", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-center-vertical", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "align-bottom", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "stretch-vertical", disabled: !enabled })
  ] });
}
function DistributeMenuItems() {
  const threeSelected = (0, import_menu_hooks.useUnlockedSelectedShapesCount)(3);
  const isInSelectState = (0, import_menu_hooks.useIsInSelectState)();
  const enabled = threeSelected && isInSelectState;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "distribute-horizontal", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "distribute-vertical", disabled: !enabled })
  ] });
}
function StackMenuItems() {
  const threeStackableItems = (0, import_menu_hooks.useThreeStackableItems)();
  const isInSelectState = (0, import_menu_hooks.useIsInSelectState)();
  const enabled = threeStackableItems && isInSelectState;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "stack-horizontal", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "stack-vertical", disabled: !enabled })
  ] });
}
function ReorderMenuItems() {
  const oneSelected = (0, import_menu_hooks.useUnlockedSelectedShapesCount)(1);
  const isInSelectState = (0, import_menu_hooks.useIsInSelectState)();
  const enabled = oneSelected && isInSelectState;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "send-to-back", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "send-backward", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "bring-forward", disabled: !enabled }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "bring-to-front", disabled: !enabled })
  ] });
}
function ZoomOrRotateMenuItem() {
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  return breakpoint < import_constants.PORTRAIT_BREAKPOINT.TABLET_SM ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomTo100MenuItem, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCCWMenuItem, {});
}
function ZoomTo100MenuItem() {
  const editor = (0, import_editor.useEditor)();
  const isZoomedTo100 = (0, import_editor.useValue)("zoom is 1", () => editor.getZoomLevel() === 1, [editor]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "zoom-to-100", disabled: isZoomedTo100 });
}
function RotateCCWMenuItem() {
  const oneSelected = (0, import_menu_hooks.useUnlockedSelectedShapesCount)(1);
  const isInSelectState = (0, import_menu_hooks.useIsInSelectState)();
  const enabled = oneSelected && isInSelectState;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "rotate-ccw", disabled: !enabled });
}
function RotateCWMenuItem() {
  const oneSelected = (0, import_menu_hooks.useUnlockedSelectedShapesCount)(1);
  const isInSelectState = (0, import_menu_hooks.useIsInSelectState)();
  const enabled = oneSelected && isInSelectState;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "rotate-cw", disabled: !enabled });
}
function EditLinkMenuItem() {
  const showEditLink = (0, import_menu_hooks.useHasLinkShapeSelected)();
  const isInSelectState = (0, import_menu_hooks.useIsInSelectState)();
  const enabled = showEditLink && isInSelectState;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "edit-link", disabled: !enabled });
}
function GroupOrUngroupMenuItem() {
  const allowGroup = (0, import_menu_hooks.useAllowGroup)();
  const allowUngroup = (0, import_menu_hooks.useAllowUngroup)();
  return allowGroup ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GroupMenuItem, {}) : allowUngroup ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UngroupMenuItem, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GroupMenuItem, {});
}
function GroupMenuItem() {
  const twoSelected = (0, import_menu_hooks.useUnlockedSelectedShapesCount)(2);
  const isInSelectState = (0, import_menu_hooks.useIsInSelectState)();
  const enabled = twoSelected && isInSelectState;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "group", disabled: !enabled });
}
function UngroupMenuItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "ungroup" });
}
//# sourceMappingURL=DefaultActionsMenuContent.js.map
