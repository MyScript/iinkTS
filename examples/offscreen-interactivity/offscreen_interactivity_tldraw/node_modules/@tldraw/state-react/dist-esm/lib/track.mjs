import { forwardRef, memo } from "react";
import { useStateTracking } from "./useStateTracking.mjs";
const ProxyHandlers = {
  /**
   * This is a function call trap for functional components. When this is called, we know it means
   * React did run 'Component()', that means we can use any hooks here to setup our effect and
   * store.
   *
   * With the native Proxy, all other calls such as access/setting to/of properties will be
   * forwarded to the target Component, so we don't need to copy the Component's own or inherited
   * properties.
   *
   * @see https://github.com/facebook/react/blob/2d80a0cd690bb5650b6c8a6c079a87b5dc42bd15/packages/react-reconciler/src/ReactFiberHooks.old.js#L460
   */
  apply(Component, thisArg, argumentsList) {
    return useStateTracking(
      Component.displayName ?? Component.name ?? "tracked(???)",
      () => Component.apply(thisArg, argumentsList)
    );
  }
};
const ReactMemoSymbol = Symbol.for("react.memo");
const ReactForwardRefSymbol = Symbol.for("react.forward_ref");
function track(baseComponent) {
  let compare = null;
  const $$typeof = baseComponent["$$typeof"];
  if ($$typeof === ReactMemoSymbol) {
    baseComponent = baseComponent.type;
    compare = baseComponent.compare;
  }
  if ($$typeof === ReactForwardRefSymbol) {
    return memo(forwardRef(new Proxy(baseComponent.render, ProxyHandlers)));
  }
  return memo(new Proxy(baseComponent, ProxyHandlers), compare);
}
export {
  ProxyHandlers,
  ReactForwardRefSymbol,
  ReactMemoSymbol,
  track
};
//# sourceMappingURL=track.mjs.map
