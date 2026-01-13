"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var breakpoints_exports = {};
__export(breakpoints_exports, {
  BreakPointProvider: () => BreakPointProvider,
  useBreakpoint: () => useBreakpoint
});
module.exports = __toCommonJS(breakpoints_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = __toESM(require("react"));
var import_constants = require("../constants");
const BreakpointContext = import_react.default.createContext(null);
function BreakPointProvider({ forceMobile = false, children }) {
  const editor = (0, import_editor.useMaybeEditor)();
  const breakpoint = (0, import_editor.useValue)(
    "breakpoint",
    () => {
      const { width } = editor?.getViewportScreenBounds() ?? { width: window.innerWidth };
      const maxBreakpoint = forceMobile ? import_constants.PORTRAIT_BREAKPOINT.MOBILE_SM : import_constants.PORTRAIT_BREAKPOINTS.length - 1;
      for (let i = 0; i < maxBreakpoint; i++) {
        if (width > import_constants.PORTRAIT_BREAKPOINTS[i] && width <= import_constants.PORTRAIT_BREAKPOINTS[i + 1]) {
          return i;
        }
      }
      return maxBreakpoint;
    },
    [editor]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BreakpointContext.Provider, { value: breakpoint, children });
}
function useBreakpoint() {
  const breakpoint = (0, import_react.useContext)(BreakpointContext);
  if (breakpoint === null) {
    throw new Error("useBreakpoint must be used inside of the <BreakpointProvider /> component");
  }
  return breakpoint;
}
//# sourceMappingURL=breakpoints.js.map
