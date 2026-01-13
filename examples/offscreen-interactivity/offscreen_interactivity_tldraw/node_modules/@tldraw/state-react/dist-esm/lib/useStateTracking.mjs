import { EffectScheduler } from "@tldraw/state";
import React from "react";
function useStateTracking(name, render, deps = []) {
  const renderRef = React.useRef(render);
  renderRef.current = render;
  const [scheduler, subscribe, getSnapshot] = React.useMemo(() => {
    let scheduleUpdate = null;
    const subscribe2 = (cb) => {
      scheduleUpdate = cb;
      return () => {
        scheduleUpdate = null;
      };
    };
    const scheduler2 = new EffectScheduler(
      `useStateTracking(${name})`,
      // this is what `scheduler.execute()` will call
      () => renderRef.current?.(),
      // this is what will be invoked when @tldraw/state detects a change in an upstream reactive value
      {
        scheduleEffect() {
          scheduleUpdate?.();
        }
      }
    );
    const getSnapshot2 = () => scheduler2.scheduleCount;
    return [scheduler2, subscribe2, getSnapshot2];
  }, [name, ...deps]);
  React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  React.useEffect(() => {
    scheduler.attach();
    scheduler.maybeScheduleEffect();
    return () => {
      scheduler.detach();
    };
  }, [scheduler]);
  return scheduler.execute();
}
export {
  useStateTracking
};
//# sourceMappingURL=useStateTracking.mjs.map
