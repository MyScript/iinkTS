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
var capture_exports = {};
__export(capture_exports, {
  maybeCaptureParent: () => maybeCaptureParent,
  startCapturingParents: () => startCapturingParents,
  stopCapturingParents: () => stopCapturingParents,
  unsafe__withoutCapture: () => unsafe__withoutCapture,
  whyAmIRunning: () => whyAmIRunning
});
module.exports = __toCommonJS(capture_exports);
var import_Computed = require("./Computed");
var import_helpers = require("./helpers");
class CaptureStackFrame {
  constructor(below, child) {
    this.below = below;
    this.child = child;
  }
  offset = 0;
  maybeRemoved;
}
const inst = (0, import_helpers.singleton)("capture", () => ({ stack: null }));
function unsafe__withoutCapture(fn) {
  const oldStack = inst.stack;
  inst.stack = null;
  try {
    return fn();
  } finally {
    inst.stack = oldStack;
  }
}
function startCapturingParents(child) {
  inst.stack = new CaptureStackFrame(inst.stack, child);
  if (child.__debug_ancestor_epochs__) {
    const previousAncestorEpochs = child.__debug_ancestor_epochs__;
    child.__debug_ancestor_epochs__ = null;
    for (const p of child.parents) {
      p.__unsafe__getWithoutCapture(true);
    }
    logChangedAncestors(child, previousAncestorEpochs);
  }
  child.parentSet.clear();
}
function stopCapturingParents() {
  const frame = inst.stack;
  inst.stack = frame.below;
  if (frame.offset < frame.child.parents.length) {
    for (let i = frame.offset; i < frame.child.parents.length; i++) {
      const maybeRemovedParent = frame.child.parents[i];
      if (!frame.child.parentSet.has(maybeRemovedParent)) {
        (0, import_helpers.detach)(maybeRemovedParent, frame.child);
      }
    }
    frame.child.parents.length = frame.offset;
    frame.child.parentEpochs.length = frame.offset;
  }
  if (frame.maybeRemoved) {
    for (let i = 0; i < frame.maybeRemoved.length; i++) {
      const maybeRemovedParent = frame.maybeRemoved[i];
      if (!frame.child.parentSet.has(maybeRemovedParent)) {
        (0, import_helpers.detach)(maybeRemovedParent, frame.child);
      }
    }
  }
  if (frame.child.__debug_ancestor_epochs__) {
    captureAncestorEpochs(frame.child, frame.child.__debug_ancestor_epochs__);
  }
}
function maybeCaptureParent(p) {
  if (inst.stack) {
    const wasCapturedAlready = inst.stack.child.parentSet.has(p);
    if (wasCapturedAlready) {
      return;
    }
    inst.stack.child.parentSet.add(p);
    if (inst.stack.child.isActivelyListening) {
      (0, import_helpers.attach)(p, inst.stack.child);
    }
    if (inst.stack.offset < inst.stack.child.parents.length) {
      const maybeRemovedParent = inst.stack.child.parents[inst.stack.offset];
      if (maybeRemovedParent !== p) {
        if (!inst.stack.maybeRemoved) {
          inst.stack.maybeRemoved = [maybeRemovedParent];
        } else {
          inst.stack.maybeRemoved.push(maybeRemovedParent);
        }
      }
    }
    inst.stack.child.parents[inst.stack.offset] = p;
    inst.stack.child.parentEpochs[inst.stack.offset] = p.lastChangedEpoch;
    inst.stack.offset++;
  }
}
function whyAmIRunning() {
  const child = inst.stack?.child;
  if (!child) {
    throw new Error("whyAmIRunning() called outside of a reactive context");
  }
  child.__debug_ancestor_epochs__ = /* @__PURE__ */ new Map();
}
function captureAncestorEpochs(child, ancestorEpochs) {
  for (let i = 0; i < child.parents.length; i++) {
    const parent = child.parents[i];
    const epoch = child.parentEpochs[i];
    ancestorEpochs.set(parent, epoch);
    if ((0, import_Computed.isComputed)(parent)) {
      captureAncestorEpochs(parent, ancestorEpochs);
    }
  }
  return ancestorEpochs;
}
function collectChangedAncestors(child, ancestorEpochs) {
  const changeTree = {};
  for (let i = 0; i < child.parents.length; i++) {
    const parent = child.parents[i];
    if (!ancestorEpochs.has(parent)) {
      continue;
    }
    const prevEpoch = ancestorEpochs.get(parent);
    const currentEpoch = parent.lastChangedEpoch;
    if (currentEpoch !== prevEpoch) {
      if ((0, import_Computed.isComputed)(parent)) {
        changeTree[parent.name] = collectChangedAncestors(parent, ancestorEpochs);
      } else {
        changeTree[parent.name] = null;
      }
    }
  }
  return changeTree;
}
function logChangedAncestors(child, ancestorEpochs) {
  const changeTree = collectChangedAncestors(child, ancestorEpochs);
  if (Object.keys(changeTree).length === 0) {
    console.log(`Effect(${child.name}) was executed manually.`);
    return;
  }
  let str = (0, import_Computed.isComputed)(child) ? `Computed(${child.name}) is recomputing because:` : `Effect(${child.name}) is executing because:`;
  function logParent(tree, indent) {
    const indentStr = "\n" + " ".repeat(indent) + "\u21B3 ";
    for (const [name, val] of Object.entries(tree)) {
      if (val) {
        str += `${indentStr}Computed(${name}) changed`;
        logParent(val, indent + 2);
      } else {
        str += `${indentStr}Atom(${name}) changed`;
      }
    }
  }
  logParent(changeTree, 1);
  console.log(str);
}
//# sourceMappingURL=capture.js.map
