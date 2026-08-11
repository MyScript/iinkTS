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
var events_exports = {};
__export(events_exports, {
  EventsContext: () => EventsContext,
  TldrawUiEventsProvider: () => TldrawUiEventsProvider,
  useUiEvents: () => useUiEvents
});
module.exports = __toCommonJS(events_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var React = __toESM(require("react"));
const defaultEventHandler = () => void 0;
const EventsContext = React.createContext(null);
function TldrawUiEventsProvider({ onEvent, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventsContext.Provider, { value: onEvent ?? defaultEventHandler, children });
}
function useUiEvents() {
  const eventHandler = React.useContext(EventsContext);
  return eventHandler ?? defaultEventHandler;
}
//# sourceMappingURL=events.js.map
