import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { BackToContent } from "./BackToContent.mjs";
import { ExitPenMode } from "./ExitPenMode.mjs";
import { StopFollowing } from "./StopFollowing.mjs";
function DefaultHelperButtonsContent() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(ExitPenMode, {}),
    /* @__PURE__ */ jsx(BackToContent, {}),
    /* @__PURE__ */ jsx(StopFollowing, {})
  ] });
}
export {
  DefaultHelperButtonsContent
};
//# sourceMappingURL=DefaultHelperButtonsContent.mjs.map
