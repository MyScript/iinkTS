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
var event_types_exports = {};
__export(event_types_exports, {
  EVENT_NAME_MAP: () => EVENT_NAME_MAP
});
module.exports = __toCommonJS(event_types_exports);
const EVENT_NAME_MAP = {
  wheel: "onWheel",
  pointer_down: "onPointerDown",
  pointer_move: "onPointerMove",
  long_press: "onLongPress",
  pointer_up: "onPointerUp",
  right_click: "onRightClick",
  middle_click: "onMiddleClick",
  key_down: "onKeyDown",
  key_up: "onKeyUp",
  key_repeat: "onKeyRepeat",
  cancel: "onCancel",
  complete: "onComplete",
  interrupt: "onInterrupt",
  double_click: "onDoubleClick",
  triple_click: "onTripleClick",
  quadruple_click: "onQuadrupleClick",
  tick: "onTick"
};
//# sourceMappingURL=event-types.js.map
