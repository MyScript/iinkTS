import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import classNames from "classnames";
import { memo } from "react";
import { PORTRAIT_BREAKPOINT } from "../../constants.mjs";
import { useBreakpoint } from "../../context/breakpoints.mjs";
import { useTranslation } from "../../hooks/useTranslation/useTranslation.mjs";
import {
  TldrawUiDialogBody,
  TldrawUiDialogCloseButton,
  TldrawUiDialogHeader,
  TldrawUiDialogTitle
} from "../primitives/TldrawUiDialog.mjs";
import { TldrawUiMenuContextProvider } from "../primitives/menus/TldrawUiMenuContext.mjs";
import { DefaultKeyboardShortcutsDialogContent } from "./DefaultKeyboardShortcutsDialogContent.mjs";
const DefaultKeyboardShortcutsDialog = memo(function DefaultKeyboardShortcutsDialog2({
  children
}) {
  const msg = useTranslation();
  const breakpoint = useBreakpoint();
  const content = children ?? /* @__PURE__ */ jsx(DefaultKeyboardShortcutsDialogContent, {});
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(TldrawUiDialogHeader, { className: "tlui-shortcuts-dialog__header", children: [
      /* @__PURE__ */ jsx(TldrawUiDialogTitle, { children: msg("shortcuts-dialog.title") }),
      /* @__PURE__ */ jsx(TldrawUiDialogCloseButton, {})
    ] }),
    /* @__PURE__ */ jsx(
      TldrawUiDialogBody,
      {
        className: classNames("tlui-shortcuts-dialog__body", {
          "tlui-shortcuts-dialog__body__mobile": breakpoint <= PORTRAIT_BREAKPOINT.MOBILE_XS,
          "tlui-shortcuts-dialog__body__tablet": breakpoint <= PORTRAIT_BREAKPOINT.TABLET
        }),
        children: /* @__PURE__ */ jsx(TldrawUiMenuContextProvider, { type: "keyboard-shortcuts", sourceId: "kbd", children: content })
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "tlui-dialog__scrim" })
  ] });
});
export {
  DefaultKeyboardShortcutsDialog
};
//# sourceMappingURL=DefaultKeyboardShortcutsDialog.mjs.map
