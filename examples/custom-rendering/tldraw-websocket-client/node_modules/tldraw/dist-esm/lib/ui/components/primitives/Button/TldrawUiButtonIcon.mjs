import { jsx } from "react/jsx-runtime";
import { TldrawUiIcon } from "../TldrawUiIcon.mjs";
function TldrawUiButtonIcon({ icon, small, invertIcon }) {
  return /* @__PURE__ */ jsx(
    TldrawUiIcon,
    {
      "aria-hidden": "true",
      label: "",
      className: "tlui-button__icon",
      icon,
      small,
      invertIcon
    }
  );
}
export {
  TldrawUiButtonIcon
};
//# sourceMappingURL=TldrawUiButtonIcon.mjs.map
