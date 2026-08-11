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
var StateNode_exports = {};
__export(StateNode_exports, {
  StateNode: () => StateNode
});
module.exports = __toCommonJS(StateNode_exports);
var import_state = require("@tldraw/state");
var import_utils = require("@tldraw/utils");
var import_debug_flags = require("../../utils/debug-flags");
var import_event_types = require("../types/event-types");
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
    this._isActive = (0, import_state.atom)("toolIsActive" + this.id, false);
    this._current = (0, import_state.atom)("toolState" + this.id, void 0);
    this._path = (0, import_state.computed)("toolPath" + this.id, () => {
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
    this.performanceTracker = new import_utils.PerformanceTracker();
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
    const cbName = import_event_types.EVENT_NAME_MAP[info.name];
    const currentActiveChild = this._current.__unsafe__getWithoutCapture();
    this[cbName]?.(info);
    if (this._isActive.__unsafe__getWithoutCapture() && currentActiveChild && currentActiveChild === this._current.__unsafe__getWithoutCapture()) {
      currentActiveChild.handleEvent(info);
    }
  }
  // todo: move this logic into transition
  enter(info, from) {
    if (import_debug_flags.debugFlags.measurePerformance.get() && STATE_NODES_TO_MEASURE.includes(this.id)) {
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
    if (import_debug_flags.debugFlags.measurePerformance.get() && this.performanceTracker.isStarted()) {
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
  _currentToolIdMask = (0, import_state.atom)("curent tool id mask", void 0);
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
//# sourceMappingURL=StateNode.js.map
