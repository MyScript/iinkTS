import { jsx } from "react/jsx-runtime";
import { DefaultSpinner } from "@tldraw/editor";
import { useTranslation } from "../hooks/useTranslation/useTranslation.mjs";
function Spinner(props) {
  const msg = useTranslation();
  return /* @__PURE__ */ jsx(DefaultSpinner, { "aria-label": msg("app.loading"), ...props });
}
export {
  Spinner
};
//# sourceMappingURL=Spinner.mjs.map
