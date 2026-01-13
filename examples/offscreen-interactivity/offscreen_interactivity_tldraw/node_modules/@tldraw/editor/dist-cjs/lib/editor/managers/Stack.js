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
var Stack_exports = {};
__export(Stack_exports, {
  stack: () => stack
});
module.exports = __toCommonJS(Stack_exports);
var import_state = require("@tldraw/state");
function stack(items) {
  if (items) {
    let result = EMPTY_STACK_ITEM;
    while (items.length) {
      result = result.push(items.pop());
    }
    return result;
  }
  return EMPTY_STACK_ITEM;
}
class EmptyStackItem {
  length = 0;
  head = null;
  tail = this;
  push(head) {
    return new StackItem(head, this);
  }
  toArray() {
    return import_state.EMPTY_ARRAY;
  }
  [Symbol.iterator]() {
    return {
      next() {
        return { value: void 0, done: true };
      }
    };
  }
}
const EMPTY_STACK_ITEM = new EmptyStackItem();
class StackItem {
  constructor(head, tail) {
    this.head = head;
    this.tail = tail;
    this.length = tail.length + 1;
  }
  length;
  push(head) {
    return new StackItem(head, this);
  }
  toArray() {
    return Array.from(this);
  }
  [Symbol.iterator]() {
    let stack2 = this;
    return {
      next() {
        if (stack2.length) {
          const value = stack2.head;
          stack2 = stack2.tail;
          return { value, done: false };
        } else {
          return { value: void 0, done: true };
        }
      }
    };
  }
}
//# sourceMappingURL=Stack.js.map
