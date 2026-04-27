/*!
 * MIT License: https://github.com/NoHomey/bind-decorator/blob/master/License
 * Copyright (c) 2016 Ivo Stratev
 */
import { assert } from "./control.mjs";
function bind(...args) {
  if (args.length === 2) {
    const [originalMethod, context] = args;
    context.addInitializer(function initializeMethod() {
      assert(Reflect.isExtensible(this), "Cannot bind to a non-extensible class.");
      const value = originalMethod.bind(this);
      const ok = Reflect.defineProperty(this, context.name, {
        value,
        writable: true,
        configurable: true
      });
      assert(ok, "Cannot bind a non-configurable class method.");
    });
  } else {
    const [_target, propertyKey, descriptor] = args;
    if (!descriptor || typeof descriptor.value !== "function") {
      throw new TypeError(
        `Only methods can be decorated with @bind. <${propertyKey}> is not a method!`
      );
    }
    return {
      configurable: true,
      get() {
        const bound = descriptor.value.bind(this);
        Object.defineProperty(this, propertyKey, {
          value: bound,
          configurable: true,
          writable: true
        });
        return bound;
      }
    };
  }
}
export {
  bind
};
//# sourceMappingURL=bind.mjs.map
