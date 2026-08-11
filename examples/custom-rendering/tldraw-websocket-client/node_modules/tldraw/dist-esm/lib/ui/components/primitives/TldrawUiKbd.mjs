import { jsx } from "react/jsx-runtime";
import { PORTRAIT_BREAKPOINT } from "../../constants.mjs";
import { useBreakpoint } from "../../context/breakpoints.mjs";
import { kbd } from "../../kbd-utils.mjs";
function TldrawUiKbd({ children, visibleOnMobileLayout = false }) {
  const breakpoint = useBreakpoint();
  if (!visibleOnMobileLayout && breakpoint < PORTRAIT_BREAKPOINT.MOBILE) return null;
  return /* @__PURE__ */ jsx("kbd", { className: "tlui-kbd", children: kbd(children).map((k, i) => /* @__PURE__ */ jsx("span", { children: k }, i)) });
}
export {
  TldrawUiKbd
};
//# sourceMappingURL=TldrawUiKbd.mjs.map
