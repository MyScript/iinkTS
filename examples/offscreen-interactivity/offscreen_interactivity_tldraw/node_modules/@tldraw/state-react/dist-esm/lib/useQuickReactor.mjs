import { EMPTY_ARRAY, EffectScheduler } from "@tldraw/state";
import { useEffect } from "react";
function useQuickReactor(name, reactFn, deps = EMPTY_ARRAY) {
  useEffect(() => {
    const scheduler = new EffectScheduler(name, reactFn);
    scheduler.attach();
    scheduler.execute();
    return () => {
      scheduler.detach();
    };
  }, deps);
}
export {
  useQuickReactor
};
//# sourceMappingURL=useQuickReactor.mjs.map
