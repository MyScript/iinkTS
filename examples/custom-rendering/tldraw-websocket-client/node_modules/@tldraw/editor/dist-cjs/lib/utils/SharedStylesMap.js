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
var SharedStylesMap_exports = {};
__export(SharedStylesMap_exports, {
  ReadonlySharedStyleMap: () => ReadonlySharedStyleMap,
  SharedStyleMap: () => SharedStyleMap
});
module.exports = __toCommonJS(SharedStylesMap_exports);
var import_utils = require("@tldraw/utils");
function sharedStyleEquals(a, b) {
  if (!b) return false;
  switch (a.type) {
    case "mixed":
      return b.type === "mixed";
    case "shared":
      return b.type === "shared" && a.value === b.value;
    default:
      throw (0, import_utils.exhaustiveSwitchError)(a);
  }
}
class ReadonlySharedStyleMap {
  /** @internal */
  map;
  constructor(entries) {
    this.map = new Map(entries);
  }
  get(prop) {
    return this.map.get(prop);
  }
  getAsKnownValue(prop) {
    const value = this.get(prop);
    if (!value) return void 0;
    if (value.type === "mixed") return void 0;
    return value.value;
  }
  // eslint-disable-next-line no-restricted-syntax
  get size() {
    return this.map.size;
  }
  equals(other) {
    if (this.size !== other.size) return false;
    const checkedKeys = /* @__PURE__ */ new Set();
    for (const [styleProp, value] of this) {
      if (!sharedStyleEquals(value, other.get(styleProp))) return false;
      checkedKeys.add(styleProp);
    }
    for (const [styleProp, value] of other) {
      if (checkedKeys.has(styleProp)) continue;
      if (!sharedStyleEquals(value, this.get(styleProp))) return false;
    }
    return true;
  }
  keys() {
    return this.map.keys();
  }
  values() {
    return this.map.values();
  }
  entries() {
    return this.map.entries();
  }
  [Symbol.iterator]() {
    return this.map[Symbol.iterator]();
  }
}
class SharedStyleMap extends ReadonlySharedStyleMap {
  set(prop, value) {
    this.map.set(prop, value);
  }
  applyValue(prop, value) {
    const existingValue = this.get(prop);
    if (!existingValue) {
      this.set(prop, { type: "shared", value });
      return;
    }
    switch (existingValue.type) {
      case "mixed":
        return;
      case "shared":
        if (existingValue.value !== value) {
          this.set(prop, { type: "mixed" });
        }
        return;
      default:
        (0, import_utils.exhaustiveSwitchError)(existingValue, "type");
    }
  }
}
//# sourceMappingURL=SharedStylesMap.js.map
