import { jsx } from "react/jsx-runtime";
import { assertExists } from "@tldraw/utils";
import { createContext, useContext, useId } from "react";
function suffixSafeId(id, suffix) {
  return sanitizeId(`${id}_${suffix}`);
}
function useUniqueSafeId(suffix) {
  return sanitizeId(`${useId()}${suffix ?? ""}`);
}
function useSharedSafeId(id) {
  const idScope = assertExists(useContext(IdContext));
  return sanitizeId(`${idScope}_${id}`);
}
function sanitizeId(id) {
  return id.replace(/:/g, "_");
}
const IdContext = createContext(null);
function IdProvider({ children }) {
  const id = useUniqueSafeId();
  return /* @__PURE__ */ jsx(IdContext.Provider, { value: id, children });
}
export {
  IdProvider,
  sanitizeId,
  suffixSafeId,
  useSharedSafeId,
  useUniqueSafeId
};
//# sourceMappingURL=useSafeId.mjs.map
