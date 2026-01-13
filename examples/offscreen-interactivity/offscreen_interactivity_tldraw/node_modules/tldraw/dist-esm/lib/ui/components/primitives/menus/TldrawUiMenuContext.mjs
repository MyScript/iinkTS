import { jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
const menuContext = createContext(null);
function useTldrawUiMenuContext() {
  const context = useContext(menuContext);
  if (!context) {
    throw new Error("useTldrawUiMenuContext must be used within a TldrawUiMenuContextProvider");
  }
  return context;
}
function TldrawUiMenuContextProvider({
  type,
  sourceId,
  children
}) {
  return /* @__PURE__ */ jsx(menuContext.Provider, { value: { type, sourceId }, children });
}
export {
  TldrawUiMenuContextProvider,
  useTldrawUiMenuContext
};
//# sourceMappingURL=TldrawUiMenuContext.mjs.map
