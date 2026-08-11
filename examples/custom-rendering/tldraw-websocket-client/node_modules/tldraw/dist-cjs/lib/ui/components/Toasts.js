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
var Toasts_exports = {};
__export(Toasts_exports, {
  DefaultToasts: () => DefaultToasts
});
module.exports = __toCommonJS(Toasts_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_radix_ui = require("radix-ui");
var import_react = require("react");
var import_toasts = require("../context/toasts");
var import_useTranslation = require("../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("./primitives/Button/TldrawUiButton");
var import_TldrawUiButtonLabel = require("./primitives/Button/TldrawUiButtonLabel");
var import_TldrawUiIcon = require("./primitives/TldrawUiIcon");
const DEFAULT_TOAST_DURATION = 4e3;
const SEVERITY_TO_ICON = {
  success: "check-circle",
  warning: "warning-triangle",
  error: "cross-circle",
  info: "info-circle"
};
function TldrawUiToast({ toast }) {
  const { removeToast } = (0, import_toasts.useToasts)();
  const msg = (0, import_useTranslation.useTranslation)();
  const onOpenChange = (isOpen) => {
    if (!isOpen) {
      removeToast(toast.id);
    }
  };
  const hasActions = toast.actions && toast.actions.length > 0;
  const icon = toast.icon || toast.severity && SEVERITY_TO_ICON[toast.severity];
  const iconLabel = toast.iconLabel || (toast.severity ? msg(`toast.${toast.severity}`) : "");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    import_radix_ui.Toast.Root,
    {
      onOpenChange,
      className: "tlui-toast__container",
      duration: toast.keepOpen ? Infinity : DEFAULT_TOAST_DURATION,
      "data-severity": toast.severity,
      children: [
        icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-toast__icon", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiIcon.TldrawUiIcon, { label: iconLabel, icon }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            className: "tlui-toast__main",
            "data-title": !!toast.title,
            "data-description": !!toast.description,
            "data-actions": !!toast.actions,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-toast__content", children: [
                toast.title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Toast.Title, { className: "tlui-toast__title", children: toast.title }),
                toast.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Toast.Description, { className: "tlui-toast__description", children: toast.description })
              ] }),
              toast.actions && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-toast__actions", children: [
                toast.actions.map((action, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Toast.Action, { altText: action.label, asChild: true, onClick: action.onClick, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButton.TldrawUiButton, { type: action.type, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: action.label }) }) }, i)),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Toast.Close, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  import_TldrawUiButton.TldrawUiButton,
                  {
                    type: "normal",
                    className: "tlui-toast__close",
                    style: { marginLeft: "auto" },
                    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: toast.closeLabel ?? msg("toast.close") })
                  }
                ) })
              ] })
            ]
          }
        ),
        !hasActions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Toast.Close, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButton.TldrawUiButton, { type: "normal", className: "tlui-toast__close", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: toast.closeLabel ?? msg("toast.close") }) }) })
      ]
    }
  );
}
const DefaultToasts = (0, import_react.memo)(function TldrawUiToasts() {
  const { toasts } = (0, import_toasts.useToasts)();
  const toastsArray = (0, import_editor.useValue)("toasts", () => toasts.get(), []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    toastsArray.map((toast) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TldrawUiToast, { toast }, toast.id)),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_radix_ui.Toast.ToastViewport, { className: "tlui-toast__viewport" })
  ] });
});
//# sourceMappingURL=Toasts.js.map
