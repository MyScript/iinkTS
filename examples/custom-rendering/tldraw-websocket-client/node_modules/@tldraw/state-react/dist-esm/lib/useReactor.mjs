import { EffectScheduler } from "@tldraw/state";
import { throttleToNextFrame } from "@tldraw/utils";
import { useEffect } from "react";
function useReactor(name, reactFn, deps = []) {
  useEffect(() => {
    let cancelFn;
    const scheduler = new EffectScheduler(name, reactFn, {
      scheduleEffect: (cb) => {
        cancelFn = throttleToNextFrame(cb);
      }
    });
    scheduler.attach();
    scheduler.execute();
    return () => {
      scheduler.detach();
      cancelFn?.();
    };
  }, deps);
}
export {
  useReactor
};
//# sourceMappingURL=useReactor.mjs.map
