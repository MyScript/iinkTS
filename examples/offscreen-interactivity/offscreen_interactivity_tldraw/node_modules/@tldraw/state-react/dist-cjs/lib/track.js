"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var track_exports = {};
__export(track_exports, {
  ProxyHandlers: () => ProxyHandlers,
  ReactForwardRefSymbol: () => ReactForwardRefSymbol,
  ReactMemoSymbol: () => ReactMemoSymbol,
  track: () => track
});
module.exports = __toCommonJS(track_exports);
var import_react = require("react");
var import_useStateTracking = require("./useStateTracking");
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
    return (0, import_useStateTracking.useStateTracking)(
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
    return (0, import_react.memo)((0, import_react.forwardRef)(new Proxy(baseComponent.render, ProxyHandlers)));
  }
  return (0, import_react.memo)(new Proxy(baseComponent, ProxyHandlers), compare);
}
//# sourceMappingURL=track.js.map
