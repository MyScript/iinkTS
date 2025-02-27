import { useCallback, useRef, useState } from "react";
function useRefState(initialValue) {
  const ref = useRef(initialValue);
  const [state, setState] = useState(initialValue);
  if (state !== ref.current) {
    setState(ref.current);
  }
  const update = useCallback((value) => {
    if (typeof value === "function") {
      ref.current = value(ref.current);
    } else {
      ref.current = value;
    }
    setState(ref.current);
  }, []);
  return [state, update];
}
export {
  useRefState
};
//# sourceMappingURL=useRefState.mjs.map
