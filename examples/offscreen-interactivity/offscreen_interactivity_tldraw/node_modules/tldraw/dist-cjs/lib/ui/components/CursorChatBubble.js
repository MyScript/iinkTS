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
var CursorChatBubble_exports = {};
__export(CursorChatBubble_exports, {
  CursorChatBubble: () => CursorChatBubble
});
module.exports = __toCommonJS(CursorChatBubble_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_useTranslation = require("../hooks/useTranslation/useTranslation");
const CHAT_MESSAGE_TIMEOUT_CLOSING = 2e3;
const CHAT_MESSAGE_TIMEOUT_CHATTING = 5e3;
const CursorChatBubble = (0, import_editor.track)(function CursorChatBubble2() {
  const editor = (0, import_editor.useEditor)();
  const { isChatting, chatMessage } = editor.getInstanceState();
  const rTimeout = (0, import_react.useRef)(-1);
  const [value, setValue] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    const closingUp = !isChatting && chatMessage;
    if (closingUp || isChatting) {
      const duration = isChatting ? CHAT_MESSAGE_TIMEOUT_CHATTING : CHAT_MESSAGE_TIMEOUT_CLOSING;
      rTimeout.current = editor.timers.setTimeout(() => {
        editor.updateInstanceState({ chatMessage: "", isChatting: false });
        setValue("");
        editor.focus();
      }, duration);
    }
    return () => {
      clearTimeout(rTimeout.current);
    };
  }, [editor, chatMessage, isChatting]);
  if (isChatting)
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CursorChatInput, { value, setValue, chatMessage });
  return chatMessage.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotEditingChatMessage, { chatMessage }) : null;
});
function usePositionBubble(ref) {
  const editor = (0, import_editor.useEditor)();
  (0, import_react.useLayoutEffect)(() => {
    const elm = ref.current;
    if (!elm) return;
    const { x, y } = editor.inputs.currentScreenPoint;
    ref.current?.style.setProperty("transform", `translate(${x}px, ${y}px)`);
    function positionChatBubble(e) {
      const { minX, minY } = editor.getViewportScreenBounds();
      ref.current?.style.setProperty(
        "transform",
        `translate(${e.clientX - minX}px, ${e.clientY - minY}px)`
      );
    }
    window.addEventListener("pointermove", positionChatBubble);
    return () => {
      window.removeEventListener("pointermove", positionChatBubble);
    };
  }, [ref, editor]);
}
const NotEditingChatMessage = ({ chatMessage }) => {
  const editor = (0, import_editor.useEditor)();
  const ref = (0, import_react.useRef)(null);
  usePositionBubble(ref);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      ref,
      className: "tl-cursor-chat tl-cursor-chat__bubble",
      style: { backgroundColor: editor.user.getColor() },
      children: chatMessage
    }
  );
};
const CursorChatInput = (0, import_editor.track)(function CursorChatInput2({
  chatMessage,
  value,
  setValue
}) {
  const editor = (0, import_editor.useEditor)();
  const msg = (0, import_useTranslation.useTranslation)();
  const ref = (0, import_react.useRef)(null);
  const placeholder = chatMessage || msg("cursor-chat.type-to-chat");
  usePositionBubble(ref);
  (0, import_react.useLayoutEffect)(() => {
    const elm = ref.current;
    if (!elm) return;
    const textMeasurement = editor.textMeasure.measureText(value || placeholder, {
      fontFamily: "var(--font-body)",
      fontSize: 12,
      fontWeight: "500",
      fontStyle: "normal",
      maxWidth: null,
      lineHeight: 1,
      padding: "6px"
    });
    elm.style.setProperty("width", textMeasurement.w + "px");
  }, [editor, value, placeholder]);
  (0, import_react.useLayoutEffect)(() => {
    const raf = editor.timers.requestAnimationFrame(() => {
      ref.current?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [editor]);
  const stopChatting = (0, import_react.useCallback)(() => {
    editor.updateInstanceState({ isChatting: false });
    editor.focus();
  }, [editor]);
  const handleChange = (0, import_react.useCallback)(
    (e) => {
      const { value: value2 } = e.target;
      setValue(value2.slice(0, 64));
      editor.updateInstanceState({ chatMessage: value2 });
    },
    [editor, setValue]
  );
  const handleKeyDown = (0, import_react.useCallback)(
    (e) => {
      const elm = ref.current;
      if (!elm) return;
      const { value: currentValue } = elm;
      switch (e.key) {
        case "Enter": {
          (0, import_editor.preventDefault)(e);
          e.stopPropagation();
          if (!currentValue) {
            stopChatting();
            return;
          }
          setValue("");
          break;
        }
        case "Escape": {
          (0, import_editor.preventDefault)(e);
          e.stopPropagation();
          stopChatting();
          break;
        }
      }
    },
    [stopChatting, setValue]
  );
  const handlePaste = (0, import_react.useCallback)((e) => {
    e.stopPropagation();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "input",
    {
      ref,
      className: `tl-cursor-chat`,
      style: { backgroundColor: editor.user.getColor() },
      onBlur: stopChatting,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
      onPaste: handlePaste,
      value,
      placeholder,
      spellCheck: false
    }
  );
});
//# sourceMappingURL=CursorChatBubble.js.map
