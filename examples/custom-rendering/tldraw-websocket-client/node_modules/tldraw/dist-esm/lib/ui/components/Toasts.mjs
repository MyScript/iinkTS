import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useValue } from "@tldraw/editor";
import { Toast as _Toast } from "radix-ui";
import { memo } from "react";
import { useToasts } from "../context/toasts.mjs";
import { useTranslation } from "../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiButton } from "./primitives/Button/TldrawUiButton.mjs";
import { TldrawUiButtonLabel } from "./primitives/Button/TldrawUiButtonLabel.mjs";
import { TldrawUiIcon } from "./primitives/TldrawUiIcon.mjs";
const DEFAULT_TOAST_DURATION = 4e3;
const SEVERITY_TO_ICON = {
  success: "check-circle",
  warning: "warning-triangle",
  error: "cross-circle",
  info: "info-circle"
};
function TldrawUiToast({ toast }) {
  const { removeToast } = useToasts();
  const msg = useTranslation();
  const onOpenChange = (isOpen) => {
    if (!isOpen) {
      removeToast(toast.id);
    }
  };
  const hasActions = toast.actions && toast.actions.length > 0;
  const icon = toast.icon || toast.severity && SEVERITY_TO_ICON[toast.severity];
  const iconLabel = toast.iconLabel || (toast.severity ? msg(`toast.${toast.severity}`) : "");
  return /* @__PURE__ */ jsxs(
    _Toast.Root,
    {
      onOpenChange,
      className: "tlui-toast__container",
      duration: toast.keepOpen ? Infinity : DEFAULT_TOAST_DURATION,
      "data-severity": toast.severity,
      children: [
        icon && /* @__PURE__ */ jsx("div", { className: "tlui-toast__icon", children: /* @__PURE__ */ jsx(TldrawUiIcon, { label: iconLabel, icon }) }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "tlui-toast__main",
            "data-title": !!toast.title,
            "data-description": !!toast.description,
            "data-actions": !!toast.actions,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "tlui-toast__content", children: [
                toast.title && /* @__PURE__ */ jsx(_Toast.Title, { className: "tlui-toast__title", children: toast.title }),
                toast.description && /* @__PURE__ */ jsx(_Toast.Description, { className: "tlui-toast__description", children: toast.description })
              ] }),
              toast.actions && /* @__PURE__ */ jsxs("div", { className: "tlui-toast__actions", children: [
                toast.actions.map((action, i) => /* @__PURE__ */ jsx(_Toast.Action, { altText: action.label, asChild: true, onClick: action.onClick, children: /* @__PURE__ */ jsx(TldrawUiButton, { type: action.type, children: /* @__PURE__ */ jsx(TldrawUiButtonLabel, { children: action.label }) }) }, i)),
                /* @__PURE__ */ jsx(_Toast.Close, { asChild: true, children: /* @__PURE__ */ jsx(
                  TldrawUiButton,
                  {
                    type: "normal",
                    className: "tlui-toast__close",
                    style: { marginLeft: "auto" },
                    children: /* @__PURE__ */ jsx(TldrawUiButtonLabel, { children: toast.closeLabel ?? msg("toast.close") })
                  }
                ) })
              ] })
            ]
          }
        ),
        !hasActions && /* @__PURE__ */ jsx(_Toast.Close, { asChild: true, children: /* @__PURE__ */ jsx(TldrawUiButton, { type: "normal", className: "tlui-toast__close", children: /* @__PURE__ */ jsx(TldrawUiButtonLabel, { children: toast.closeLabel ?? msg("toast.close") }) }) })
      ]
    }
  );
}
const DefaultToasts = memo(function TldrawUiToasts() {
  const { toasts } = useToasts();
  const toastsArray = useValue("toasts", () => toasts.get(), []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    toastsArray.map((toast) => /* @__PURE__ */ jsx(TldrawUiToast, { toast }, toast.id)),
    /* @__PURE__ */ jsx(_Toast.ToastViewport, { className: "tlui-toast__viewport" })
  ] });
});
export {
  DefaultToasts
};
//# sourceMappingURL=Toasts.mjs.map
