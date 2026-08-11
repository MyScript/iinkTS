import { Fragment, jsx } from "react/jsx-runtime";
import { useAtom } from "@tldraw/editor";
import { createContext, useContext, useMemo } from "react";
const A11yContext = createContext(null);
function TldrawUiA11yProvider({ children }) {
  const currentMsg = useAtom("a11y", { msg: "", priority: "assertive" });
  const ctx = useContext(A11yContext);
  const current = useMemo(
    () => ({
      currentMsg,
      announce(msg) {
        if (!msg) return;
        currentMsg.set(msg);
      }
    }),
    [currentMsg]
  );
  if (ctx) {
    return /* @__PURE__ */ jsx(Fragment, { children });
  }
  return /* @__PURE__ */ jsx(A11yContext.Provider, { value: current, children });
}
function useA11y() {
  const ctx = useContext(A11yContext);
  if (!ctx) {
    throw new Error("useA11y must be used within a A11yContext.Provider");
  }
  return ctx;
}
export {
  A11yContext,
  TldrawUiA11yProvider,
  useA11y
};
//# sourceMappingURL=a11y.mjs.map
