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
var useKeyboardShortcuts_exports = {};
__export(useKeyboardShortcuts_exports, {
  areShortcutsDisabled: () => areShortcutsDisabled,
  useKeyboardShortcuts: () => useKeyboardShortcuts
});
module.exports = __toCommonJS(useKeyboardShortcuts_exports);
var import_editor = require("@tldraw/editor");
var import_hotkeys_js = __toESM(require("hotkeys-js"));
var import_react = require("react");
var import_actions = require("../context/actions");
var import_useReadonly = require("./useReadonly");
var import_useTools = require("./useTools");
const SKIP_KBDS = [
  // we set these in useNativeClipboardEvents instead
  "copy",
  "cut",
  "paste",
  // There's also an upload asset action, so we don't want to set the kbd twice
  "asset"
];
function useKeyboardShortcuts() {
  const editor = (0, import_editor.useEditor)();
  const isReadonlyMode = (0, import_useReadonly.useReadonly)();
  const actions = (0, import_actions.useActions)();
  const tools = (0, import_useTools.useTools)();
  const isFocused = (0, import_editor.useValue)("is focused", () => editor.getInstanceState().isFocused, [editor]);
  (0, import_react.useEffect)(() => {
    if (!isFocused) return;
    const disposables = new Array();
    const hot = (keys, callback) => {
      (0, import_hotkeys_js.default)(keys, { element: document.body }, callback);
      disposables.push(() => {
        import_hotkeys_js.default.unbind(keys, callback);
      });
    };
    const hotUp = (keys, callback) => {
      (0, import_hotkeys_js.default)(keys, { element: document.body, keyup: true, keydown: false }, callback);
      disposables.push(() => {
        import_hotkeys_js.default.unbind(keys, callback);
      });
    };
    for (const action of Object.values(actions)) {
      if (!action.kbd) continue;
      if (isReadonlyMode && !action.readonlyOk) continue;
      if (SKIP_KBDS.includes(action.id)) continue;
      hot(getHotkeysStringFromKbd(action.kbd), (event) => {
        if (areShortcutsDisabled(editor)) return;
        (0, import_editor.preventDefault)(event);
        action.onSelect("kbd");
      });
    }
    for (const tool of Object.values(tools)) {
      if (!tool.kbd || !tool.readonlyOk && editor.getIsReadonly()) {
        continue;
      }
      if (SKIP_KBDS.includes(tool.id)) continue;
      hot(getHotkeysStringFromKbd(tool.kbd), (event) => {
        if (areShortcutsDisabled(editor)) return;
        (0, import_editor.preventDefault)(event);
        tool.onSelect("kbd");
      });
    }
    hot(",", (e) => {
      if (areShortcutsDisabled(editor)) return;
      if (editor.inputs.keys.has("Comma")) return;
      (0, import_editor.preventDefault)(e);
      editor.focus();
      editor.inputs.keys.add("Comma");
      const { x, y, z } = editor.inputs.currentPagePoint;
      const screenpoints = editor.pageToScreen({ x, y });
      const info = {
        type: "pointer",
        name: "pointer_down",
        point: { x: screenpoints.x, y: screenpoints.y, z },
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        ctrlKey: e.metaKey || e.ctrlKey,
        metaKey: e.metaKey,
        accelKey: (0, import_editor.isAccelKey)(e),
        pointerId: 0,
        button: 0,
        isPen: editor.getInstanceState().isPenMode,
        target: "canvas"
      };
      editor.dispatch(info);
    });
    hotUp(",", (e) => {
      if (areShortcutsDisabled(editor)) return;
      if (!editor.inputs.keys.has("Comma")) return;
      editor.inputs.keys.delete("Comma");
      const { x, y, z } = editor.inputs.currentScreenPoint;
      const info = {
        type: "pointer",
        name: "pointer_up",
        point: { x, y, z },
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        ctrlKey: e.metaKey || e.ctrlKey,
        metaKey: e.metaKey,
        accelKey: (0, import_editor.isAccelKey)(e),
        pointerId: 0,
        button: 0,
        isPen: editor.getInstanceState().isPenMode,
        target: "canvas"
      };
      editor.dispatch(info);
    });
    return () => {
      disposables.forEach((d) => d());
    };
  }, [actions, tools, isReadonlyMode, editor, isFocused]);
}
function getHotkeysStringFromKbd(kbd) {
  return getKeys(kbd).map((kbd2) => {
    let str = "";
    const chars = kbd2.split("");
    if (chars.length === 1) {
      str = chars[0];
    } else {
      if (chars[0] === "!") {
        str = `shift+${chars[1]}`;
      } else if (chars[0] === "?") {
        if (chars.length === 3 && chars[1] === "!") {
          str = `alt+shift+${chars[2]}`;
        } else {
          str = `alt+${chars[1]}`;
        }
      } else if (chars[0] === "$") {
        if (chars[1] === "!") {
          str = `cmd+shift+${chars[2]},ctrl+shift+${chars[2]}`;
        } else if (chars[1] === "?") {
          str = `cmd+\u2325+${chars[2]},ctrl+alt+${chars[2]}`;
        } else {
          str = `cmd+${chars[1]},ctrl+${chars[1]}`;
        }
      } else {
        str = kbd2;
      }
    }
    return str;
  }).join(",");
}
function getKeys(key) {
  if (typeof key !== "string") key = "";
  key = key.replace(/\s/g, "");
  const keys = key.split(",");
  let index = keys.lastIndexOf("");
  for (; index >= 0; ) {
    keys[index - 1] += ",";
    keys.splice(index, 1);
    index = keys.lastIndexOf("");
  }
  return keys;
}
function areShortcutsDisabled(editor) {
  return editor.menus.hasAnyOpenMenus() || editor.getEditingShapeId() !== null || editor.getCrashingError();
}
//# sourceMappingURL=useKeyboardShortcuts.js.map
