import { jsx } from "react/jsx-runtime";
import { useTranslation } from "../../../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiIcon } from "../TldrawUiIcon.mjs";
function TldrawUiButtonCheck({ checked }) {
  const msg = useTranslation();
  return /* @__PURE__ */ jsx(
    TldrawUiIcon,
    {
      "data-checked": !!checked,
      label: msg(checked ? "ui.checked" : "ui.unchecked"),
      icon: checked ? "check" : "none",
      className: "tlui-button__icon",
      small: true
    }
  );
}
export {
  TldrawUiButtonCheck
};
//# sourceMappingURL=TldrawUiButtonCheck.mjs.map
