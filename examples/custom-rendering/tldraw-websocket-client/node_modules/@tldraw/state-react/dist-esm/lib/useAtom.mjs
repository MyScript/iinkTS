import { atom } from "@tldraw/state";
import { useState } from "react";
function useAtom(name, valueOrInitialiser, options) {
  return useState(() => {
    const initialValue = typeof valueOrInitialiser === "function" ? valueOrInitialiser() : valueOrInitialiser;
    return atom(`useAtom(${name})`, initialValue, options);
  })[0];
}
export {
  useAtom
};
//# sourceMappingURL=useAtom.mjs.map
