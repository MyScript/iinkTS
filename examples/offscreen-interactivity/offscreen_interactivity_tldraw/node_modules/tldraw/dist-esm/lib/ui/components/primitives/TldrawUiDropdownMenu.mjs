import { jsx, jsxs } from "react/jsx-runtime";
import { preventDefault, useContainer } from "@tldraw/editor";
import classNames from "classnames";
import { DropdownMenu as _DropdownMenu } from "radix-ui";
import { useMenuIsOpen } from "../../hooks/useMenuIsOpen.mjs";
import { useTranslation } from "../../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiButton } from "./Button/TldrawUiButton.mjs";
import { TldrawUiButtonIcon } from "./Button/TldrawUiButtonIcon.mjs";
import { TldrawUiButtonLabel } from "./Button/TldrawUiButtonLabel.mjs";
import { TldrawUiIcon } from "./TldrawUiIcon.mjs";
function TldrawUiDropdownMenuRoot({
  id,
  children,
  modal = false,
  debugOpen = false
}) {
  const [open, onOpenChange] = useMenuIsOpen(id);
  return /* @__PURE__ */ jsx(
    _DropdownMenu.Root,
    {
      open: debugOpen || open,
      dir: "ltr",
      modal,
      onOpenChange,
      children
    }
  );
}
function TldrawUiDropdownMenuTrigger({ children, ...rest }) {
  return /* @__PURE__ */ jsx(
    _DropdownMenu.Trigger,
    {
      dir: "ltr",
      asChild: true,
      onTouchEnd: (e) => preventDefault(e),
      ...rest,
      children
    }
  );
}
function TldrawUiDropdownMenuContent({
  className,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  alignOffset = 8,
  children
}) {
  const container = useContainer();
  return /* @__PURE__ */ jsx(_DropdownMenu.Portal, { container, children: /* @__PURE__ */ jsx(
    _DropdownMenu.Content,
    {
      className: classNames("tlui-menu", className),
      side,
      sideOffset,
      align,
      alignOffset,
      collisionPadding: 4,
      children
    }
  ) });
}
function TldrawUiDropdownMenuSub({ id, children }) {
  const [open, onOpenChange] = useMenuIsOpen(id);
  return /* @__PURE__ */ jsx(_DropdownMenu.Sub, { open, onOpenChange, children });
}
function TldrawUiDropdownMenuSubTrigger({
  id,
  label,
  title,
  disabled
}) {
  return /* @__PURE__ */ jsx(_DropdownMenu.SubTrigger, { dir: "ltr", asChild: true, disabled, children: /* @__PURE__ */ jsxs(
    TldrawUiButton,
    {
      "data-testid": id,
      type: "menu",
      className: "tlui-menu__submenu__trigger",
      disabled,
      title,
      children: [
        /* @__PURE__ */ jsx(TldrawUiButtonLabel, { children: label }),
        /* @__PURE__ */ jsx(TldrawUiButtonIcon, { icon: "chevron-right", small: true })
      ]
    }
  ) });
}
function TldrawUiDropdownMenuSubContent({
  id,
  alignOffset = -1,
  sideOffset = -6,
  size = "small",
  children
}) {
  const container = useContainer();
  return /* @__PURE__ */ jsx(_DropdownMenu.Portal, { container, children: /* @__PURE__ */ jsx(
    _DropdownMenu.SubContent,
    {
      "data-testid": id,
      className: "tlui-menu tlui-menu__submenu__content",
      alignOffset,
      sideOffset,
      collisionPadding: 4,
      "data-size": size,
      children
    }
  ) });
}
function TldrawUiDropdownMenuGroup({ className, children }) {
  return /* @__PURE__ */ jsx("div", { dir: "ltr", className: classNames("tlui-menu__group", className), children });
}
function TldrawUiDropdownMenuIndicator() {
  const msg = useTranslation();
  return /* @__PURE__ */ jsx(_DropdownMenu.ItemIndicator, { dir: "ltr", asChild: true, children: /* @__PURE__ */ jsx(TldrawUiIcon, { label: msg("ui.checked"), icon: "check" }) });
}
function TldrawUiDropdownMenuItem({ noClose, children }) {
  return /* @__PURE__ */ jsx(_DropdownMenu.Item, { dir: "ltr", asChild: true, onClick: noClose ? preventDefault : void 0, children });
}
function TldrawUiDropdownMenuCheckboxItem({
  children,
  onSelect,
  ...rest
}) {
  const msg = useTranslation();
  return /* @__PURE__ */ jsxs(
    _DropdownMenu.CheckboxItem,
    {
      dir: "ltr",
      className: "tlui-button tlui-button__menu tlui-button__checkbox",
      onSelect: (e) => {
        onSelect?.(e);
        preventDefault(e);
      },
      ...rest,
      children: [
        /* @__PURE__ */ jsx("div", { className: "tlui-button__checkbox__indicator", children: /* @__PURE__ */ jsx(_DropdownMenu.ItemIndicator, { dir: "ltr", children: /* @__PURE__ */ jsx(TldrawUiIcon, { label: msg("ui.checked"), icon: "check", small: true }) }) }),
        children
      ]
    }
  );
}
export {
  TldrawUiDropdownMenuCheckboxItem,
  TldrawUiDropdownMenuContent,
  TldrawUiDropdownMenuGroup,
  TldrawUiDropdownMenuIndicator,
  TldrawUiDropdownMenuItem,
  TldrawUiDropdownMenuRoot,
  TldrawUiDropdownMenuSub,
  TldrawUiDropdownMenuSubContent,
  TldrawUiDropdownMenuSubTrigger,
  TldrawUiDropdownMenuTrigger
};
//# sourceMappingURL=TldrawUiDropdownMenu.mjs.map
