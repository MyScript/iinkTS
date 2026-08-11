import { jsx } from "react/jsx-runtime";
import classNames from "classnames";
import { Dialog as _Dialog } from "radix-ui";
import { useTranslation } from "../../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiButton } from "./Button/TldrawUiButton.mjs";
import { TldrawUiButtonIcon } from "./Button/TldrawUiButtonIcon.mjs";
function TldrawUiDialogHeader({ className, children }) {
  return /* @__PURE__ */ jsx("div", { className: classNames("tlui-dialog__header", className), children });
}
function TldrawUiDialogTitle({ className, children, style }) {
  return /* @__PURE__ */ jsx(
    _Dialog.Title,
    {
      dir: "ltr",
      className: classNames("tlui-dialog__header__title", className),
      style,
      children
    }
  );
}
function TldrawUiDialogCloseButton() {
  const msg = useTranslation();
  return /* @__PURE__ */ jsx("div", { className: "tlui-dialog__header__close", children: /* @__PURE__ */ jsx(_Dialog.DialogClose, { "data-testid": "dialog.close", dir: "ltr", asChild: true, children: /* @__PURE__ */ jsx(
    TldrawUiButton,
    {
      type: "icon",
      "aria-label": msg("ui.close"),
      onTouchEnd: (e) => e.target.click(),
      children: /* @__PURE__ */ jsx(TldrawUiButtonIcon, { small: true, icon: "cross-2" })
    }
  ) }) });
}
function TldrawUiDialogBody({ className, children, style }) {
  return /* @__PURE__ */ jsx("div", { className: classNames("tlui-dialog__body", className), style, tabIndex: 0, children });
}
function TldrawUiDialogFooter({ className, children }) {
  return /* @__PURE__ */ jsx("div", { className: classNames("tlui-dialog__footer", className), children });
}
export {
  TldrawUiDialogBody,
  TldrawUiDialogCloseButton,
  TldrawUiDialogFooter,
  TldrawUiDialogHeader,
  TldrawUiDialogTitle
};
//# sourceMappingURL=TldrawUiDialog.mjs.map
