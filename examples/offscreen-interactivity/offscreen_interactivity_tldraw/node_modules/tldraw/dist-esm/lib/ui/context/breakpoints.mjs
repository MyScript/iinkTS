import { jsx } from "react/jsx-runtime";
import { useMaybeEditor, useValue } from "@tldraw/editor";
import React, { useContext } from "react";
import { PORTRAIT_BREAKPOINT, PORTRAIT_BREAKPOINTS } from "../constants.mjs";
const BreakpointContext = React.createContext(null);
function BreakPointProvider({ forceMobile = false, children }) {
  const editor = useMaybeEditor();
  const breakpoint = useValue(
    "breakpoint",
    () => {
      const { width } = editor?.getViewportScreenBounds() ?? { width: window.innerWidth };
      const maxBreakpoint = forceMobile ? PORTRAIT_BREAKPOINT.MOBILE_SM : PORTRAIT_BREAKPOINTS.length - 1;
      for (let i = 0; i < maxBreakpoint; i++) {
        if (width > PORTRAIT_BREAKPOINTS[i] && width <= PORTRAIT_BREAKPOINTS[i + 1]) {
          return i;
        }
      }
      return maxBreakpoint;
    },
    [editor]
  );
  return /* @__PURE__ */ jsx(BreakpointContext.Provider, { value: breakpoint, children });
}
function useBreakpoint() {
  const breakpoint = useContext(BreakpointContext);
  if (breakpoint === null) {
    throw new Error("useBreakpoint must be used inside of the <BreakpointProvider /> component");
  }
  return breakpoint;
}
export {
  BreakPointProvider,
  useBreakpoint
};
//# sourceMappingURL=breakpoints.mjs.map
