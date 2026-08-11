import { computed } from "@tldraw/state";
import { useMemo } from "react";
function useComputed() {
  const name = arguments[0];
  const compute = arguments[1];
  const opts = arguments.length === 3 ? void 0 : arguments[2];
  const deps = arguments.length === 3 ? arguments[2] : arguments[3];
  return useMemo(() => computed(`useComputed(${name})`, compute, opts), deps);
}
export {
  useComputed
};
//# sourceMappingURL=useComputed.mjs.map
