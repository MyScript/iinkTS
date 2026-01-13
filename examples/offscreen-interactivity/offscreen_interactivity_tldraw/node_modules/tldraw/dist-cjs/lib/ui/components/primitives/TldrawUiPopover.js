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
var TldrawUiPopover_exports = {};
__export(TldrawUiPopover_exports, {
  TldrawUiPopover: () => TldrawUiPopover,
  TldrawUiPopoverContent: () => TldrawUiPopoverContent,
  TldrawUiPopoverTrigger: () => TldrawUiPopoverTrigger
});
module.exports = __toCommonJS(TldrawUiPopover_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var PopoverPrimitive = __toESM(require("@radix-ui/react-popover"));
var import_editor = require("@tldraw/editor");
var import_useMenuIsOpen = require("../../hooks/useMenuIsOpen");
function TldrawUiPopover({ id, children, onOpenChange, open }) {
  const [isOpen, handleOpenChange] = (0, import_useMenuIsOpen.useMenuIsOpen)(id, onOpenChange);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    PopoverPrimitive.Root,
    {
      onOpenChange: handleOpenChange,
      open: open || isOpen,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-popover", children })
    }
  );
}
function TldrawUiPopoverTrigger({ children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverPrimitive.Trigger, { asChild: true, dir: "ltr", children });
}
function TldrawUiPopoverContent({
  side,
  children,
  align = "center",
  sideOffset = 8,
  alignOffset = 0,
  disableEscapeKeyDown = false
}) {
  const container = (0, import_editor.useContainer)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverPrimitive.Portal, { container, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    PopoverPrimitive.Content,
    {
      className: "tlui-popover__content",
      side,
      sideOffset,
      align,
      alignOffset,
      dir: "ltr",
      onEscapeKeyDown: (e) => disableEscapeKeyDown && e.preventDefault(),
      children
    }
  ) });
}
//# sourceMappingURL=TldrawUiPopover.js.map
