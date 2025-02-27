import { jsx } from "react/jsx-runtime";
import { assertExists } from "@tldraw/utils";
import { createContext, useContext } from "react";
const ContainerContext = createContext(null);
function ContainerProvider({ container, children }) {
  return /* @__PURE__ */ jsx(ContainerContext.Provider, { value: container, children });
}
function useContainer() {
  return assertExists(useContext(ContainerContext), "useContainer used outside of <Tldraw />");
}
function useContainerIfExists() {
  return useContext(ContainerContext);
}
export {
  ContainerProvider,
  useContainer,
  useContainerIfExists
};
//# sourceMappingURL=useContainer.mjs.map
