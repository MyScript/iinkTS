import { EMPTY_ARRAY } from "@tldraw/state";
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
    return EMPTY_ARRAY;
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
export {
  stack
};
//# sourceMappingURL=Stack.mjs.map
