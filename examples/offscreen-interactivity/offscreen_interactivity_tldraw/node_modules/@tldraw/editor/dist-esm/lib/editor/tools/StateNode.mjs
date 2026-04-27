import { atom, computed } from "@tldraw/state";
import { PerformanceTracker } from "@tldraw/utils";
import { debugFlags } from "../../utils/debug-flags.mjs";
import {
  EVENT_NAME_MAP
} from "../types/event-types.mjs";
const STATE_NODES_TO_MEASURE = [
  "brushing",
  "cropping",
  "dragging",
  "dragging_handle",
  "drawing",
  "erasing",
  "lasering",
  "resizing",
  "rotating",
  "scribble_brushing",
  "translating"
];
class StateNode {
  constructor(editor, parent) {
    this.editor = editor;
    const { id, children, initial, isLockable, useCoalescedEvents } = this.constructor;
    this.id = id;
    this._isActive = atom("toolIsActive" + this.id, false);
    this._current = atom("toolState" + this.id, void 0);
    this._path = computed("toolPath" + this.id, () => {
      const current = this.getCurrent();
      return this.id + (current ? `.${current.getPath()}` : "");
    });
    this.parent = parent ?? {};
    if (parent) {
      if (children && initial) {
        this.type = "branch";
        this.initial = initial;
        this.children = Object.fromEntries(
          children().map((Ctor) => [Ctor.id, new Ctor(this.editor, this)])
        );
        this._current.set(this.children[this.initial]);
      } else {
        this.type = "leaf";
      }
    } else {
      this.type = "root";
      if (children && initial) {
        this.initial = initial;
        this.children = Object.fromEntries(
          children().map((Ctor) => [Ctor.id, new Ctor(this.editor, this)])
        );
        this._current.set(this.children[this.initial]);
      }
    }
    this.isLockable = isLockable;
    this.useCoalescedEvents = useCoalescedEvents;
    this.performanceTracker = new PerformanceTracker();
  }
  performanceTracker;
  static id;
  static initial;
  static children;
  static isLockable = true;
  static useCoalescedEvents = false;
  id;
  type;
  shapeType;
  initial;
  children;
  isLockable;
  useCoalescedEvents;
  parent;
  /**
   * This node's path of active state nodes
   *
   * @public
   */
  getPath() {
    return this._path.get();
  }
  _path;
  /**
   * This node's current active child node, if any.
   *
   * @public
   */
  getCurrent() {
    return this._current.get();
  }
  _current;
  /**
   * Whether this node is active.
   *
   * @public
   */
  getIsActive() {
    return this._isActive.get();
  }
  _isActive;
  /**
   * Transition to a new active child state node.
   *
   * @example
   * ```ts
   * parentState.transition('childStateA')
   * parentState.transition('childStateB', { myData: 4 })
   *```
   *
   * @param id - The id of the child state node to transition to.
   * @param info - Any data to pass to the `onEnter` and `onExit` handlers.
   *
   * @public
   */
  transition(id, info = {}) {
    const path = id.split(".");
    let currState = this;
    for (let i = 0; i < path.length; i++) {
      const id2 = path[i];
      const prevChildState = currState.getCurrent();
      const nextChildState = currState.children?.[id2];
      if (!nextChildState) {
        throw Error(`${currState.id} - no child state exists with the id ${id2}.`);
      }
      if (prevChildState?.id !== nextChildState.id) {
        prevChildState?.exit(info, id2);
        currState._current.set(nextChildState);
        nextChildState.enter(info, prevChildState?.id || "initial");
        if (!nextChildState.getIsActive()) break;
      }
      currState = nextChildState;
    }
    return this;
  }
  handleEvent(info) {
    const cbName = EVENT_NAME_MAP[info.name];
    const currentActiveChild = this._current.__unsafe__getWithoutCapture();
    this[cbName]?.(info);
    if (this._isActive.__unsafe__getWithoutCapture() && currentActiveChild && currentActiveChild === this._current.__unsafe__getWithoutCapture()) {
      currentActiveChild.handleEvent(info);
    }
  }
  // todo: move this logic into transition
  enter(info, from) {
    if (debugFlags.measurePerformance.get() && STATE_NODES_TO_MEASURE.includes(this.id)) {
      this.performanceTracker.start(this.id);
    }
    this._isActive.set(true);
    this.onEnter?.(info, from);
    if (this.children && this.initial && this.getIsActive()) {
      const initial = this.children[this.initial];
      this._current.set(initial);
      initial.enter(info, from);
    }
  }
  // todo: move this logic into transition
  exit(info, to) {
    if (debugFlags.measurePerformance.get() && this.performanceTracker.isStarted()) {
      this.performanceTracker.stop();
    }
    this._isActive.set(false);
    this.onExit?.(info, to);
    if (!this.getIsActive()) {
      this.getCurrent()?.exit(info, to);
    }
  }
  /**
   * This is a hack / escape hatch that will tell the editor to
   * report a different state as active (in `getCurrentToolId()`) when
   * this state is active. This is usually used when a tool transitions
   * to a child of a different state for a certain interaction and then
   * returns to the original tool when that interaction completes; and
   * where we would want to show the original tool as active in the UI.
   *
   * @public
   */
  _currentToolIdMask = atom("curent tool id mask", void 0);
  getCurrentToolIdMask() {
    return this._currentToolIdMask.get();
  }
  setCurrentToolIdMask(id) {
    this._currentToolIdMask.set(id);
  }
  /**
   * Add a child node to this state node.
   *
   * @public
   */
  addChild(childConstructor) {
    if (this.type === "leaf") {
      throw new Error("StateNode.addChild: cannot add child to a leaf node");
    }
    if (!this.children) {
      this.children = {};
    }
    const child = new childConstructor(this.editor, this);
    if (this.children[child.id]) {
      throw new Error(`StateNode.addChild: a child with id '${child.id}' already exists`);
    }
    this.children[child.id] = child;
    return this;
  }
}
export {
  StateNode
};
//# sourceMappingURL=StateNode.mjs.map
