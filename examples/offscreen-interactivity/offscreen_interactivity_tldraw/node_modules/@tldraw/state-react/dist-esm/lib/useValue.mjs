import { computed, react } from "@tldraw/state";
import { useMemo, useSyncExternalStore } from "react";
function useValue() {
  const args = arguments;
  const deps = args.length === 3 ? args[2] : [args[0]];
  const name = args.length === 3 ? args[0] : `useValue(${args[0].name})`;
  const { $val, subscribe, getSnapshot } = useMemo(() => {
    const $val2 = args.length === 1 ? args[0] : computed(name, args[1]);
    return {
      $val: $val2,
      subscribe: (notify) => {
        return react(`useValue(${name})`, () => {
          try {
            $val2.get();
          } catch {
          }
          notify();
        });
      },
      getSnapshot: () => $val2.lastChangedEpoch
    };
  }, deps);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return $val.__unsafe__getWithoutCapture();
}
export {
  useValue
};
//# sourceMappingURL=useValue.mjs.map
