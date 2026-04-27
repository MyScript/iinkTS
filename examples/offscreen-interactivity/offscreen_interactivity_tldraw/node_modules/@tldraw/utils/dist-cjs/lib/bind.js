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
var bind_exports = {};
__export(bind_exports, {
  bind: () => bind
});
module.exports = __toCommonJS(bind_exports);
var import_control = require("./control");
/*!
 * MIT License: https://github.com/NoHomey/bind-decorator/blob/master/License
 * Copyright (c) 2016 Ivo Stratev
 */
function bind(...args) {
  if (args.length === 2) {
    const [originalMethod, context] = args;
    context.addInitializer(function initializeMethod() {
      (0, import_control.assert)(Reflect.isExtensible(this), "Cannot bind to a non-extensible class.");
      const value = originalMethod.bind(this);
      const ok = Reflect.defineProperty(this, context.name, {
        value,
        writable: true,
        configurable: true
      });
      (0, import_control.assert)(ok, "Cannot bind a non-configurable class method.");
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
//# sourceMappingURL=bind.js.map
