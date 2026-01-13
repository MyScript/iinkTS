import { exhaustiveSwitchError } from "@tldraw/utils";
function sharedStyleEquals(a, b) {
  if (!b) return false;
  switch (a.type) {
    case "mixed":
      return b.type === "mixed";
    case "shared":
      return b.type === "shared" && a.value === b.value;
    default:
      throw exhaustiveSwitchError(a);
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
        exhaustiveSwitchError(existingValue, "type");
    }
  }
}
export {
  ReadonlySharedStyleMap,
  SharedStyleMap
};
//# sourceMappingURL=SharedStylesMap.mjs.map
