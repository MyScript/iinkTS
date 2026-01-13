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
var BindingUtil_exports = {};
__export(BindingUtil_exports, {
  BindingUtil: () => BindingUtil
});
module.exports = __toCommonJS(BindingUtil_exports);
class BindingUtil {
  constructor(editor) {
    this.editor = editor;
  }
  static props;
  static migrations;
  /**
   * The type of the binding util, which should match the binding's type.
   *
   * @public
   */
  static type;
}
//# sourceMappingURL=BindingUtil.js.map
