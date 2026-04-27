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
var bindingsIndex_exports = {};
__export(bindingsIndex_exports, {
  bindingsIndex: () => bindingsIndex
});
module.exports = __toCommonJS(bindingsIndex_exports);
var import_state = require("@tldraw/state");
var import_utils = require("@tldraw/utils");
function fromScratch(bindingsQuery) {
  const allBindings = bindingsQuery.get();
  const shapesToBindings = /* @__PURE__ */ new Map();
  for (const binding of allBindings) {
    const { fromId, toId } = binding;
    const bindingsForFromShape = shapesToBindings.get(fromId);
    if (!bindingsForFromShape) {
      shapesToBindings.set(fromId, [binding]);
    } else {
      bindingsForFromShape.push(binding);
    }
    const bindingsForToShape = shapesToBindings.get(toId);
    if (!bindingsForToShape) {
      shapesToBindings.set(toId, [binding]);
    } else {
      bindingsForToShape.push(binding);
    }
  }
  return shapesToBindings;
}
const bindingsIndex = (editor) => {
  const { store } = editor;
  const bindingsHistory = store.query.filterHistory("binding");
  const bindingsQuery = store.query.records("binding");
  return (0, import_state.computed)("arrowBindingsIndex", (_lastValue, lastComputedEpoch) => {
    if ((0, import_state.isUninitialized)(_lastValue)) {
      return fromScratch(bindingsQuery);
    }
    const lastValue = _lastValue;
    const diff = bindingsHistory.getDiffSince(lastComputedEpoch);
    if (diff === import_state.RESET_VALUE) {
      return fromScratch(bindingsQuery);
    }
    let nextValue = void 0;
    function removingBinding(binding) {
      nextValue ??= new Map(lastValue);
      const prevFrom = nextValue.get(binding.fromId);
      const nextFrom = prevFrom?.filter((b) => b.id !== binding.id);
      if (!nextFrom?.length) {
        nextValue.delete(binding.fromId);
      } else {
        nextValue.set(binding.fromId, nextFrom);
      }
      const prevTo = nextValue.get(binding.toId);
      const nextTo = prevTo?.filter((b) => b.id !== binding.id);
      if (!nextTo?.length) {
        nextValue.delete(binding.toId);
      } else {
        nextValue.set(binding.toId, nextTo);
      }
    }
    function ensureNewArray(shapeId) {
      nextValue ??= new Map(lastValue);
      let result = nextValue.get(shapeId);
      if (!result) {
        result = [];
        nextValue.set(shapeId, result);
      } else if (result === lastValue.get(shapeId)) {
        result = result.slice(0);
        nextValue.set(shapeId, result);
      }
      return result;
    }
    function addBinding(binding) {
      ensureNewArray(binding.fromId).push(binding);
      ensureNewArray(binding.toId).push(binding);
    }
    for (const changes of diff) {
      for (const newBinding of (0, import_utils.objectMapValues)(changes.added)) {
        addBinding(newBinding);
      }
      for (const [prev, next] of (0, import_utils.objectMapValues)(changes.updated)) {
        removingBinding(prev);
        addBinding(next);
      }
      for (const prev of (0, import_utils.objectMapValues)(changes.removed)) {
        removingBinding(prev);
      }
    }
    return nextValue ?? lastValue;
  });
};
//# sourceMappingURL=bindingsIndex.js.map
