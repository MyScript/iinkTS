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
var DefaultDebugMenuContent_exports = {};
__export(DefaultDebugMenuContent_exports, {
  DebugFlags: () => DebugFlags,
  DefaultDebugMenuContent: () => DefaultDebugMenuContent,
  ExampleDialog: () => ExampleDialog,
  FeatureFlags: () => FeatureFlags
});
module.exports = __toCommonJS(DefaultDebugMenuContent_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = __toESM(require("react"));
var import_dialogs = require("../../context/dialogs");
var import_toasts = require("../../context/toasts");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonCheck = require("../primitives/Button/TldrawUiButtonCheck");
var import_TldrawUiButtonLabel = require("../primitives/Button/TldrawUiButtonLabel");
var import_TldrawUiDialog = require("../primitives/TldrawUiDialog");
var import_TldrawUiMenuCheckboxItem = require("../primitives/menus/TldrawUiMenuCheckboxItem");
var import_TldrawUiMenuGroup = require("../primitives/menus/TldrawUiMenuGroup");
var import_TldrawUiMenuItem = require("../primitives/menus/TldrawUiMenuItem");
var import_TldrawUiMenuSubmenu = require("../primitives/menus/TldrawUiMenuSubmenu");
function DefaultDebugMenuContent() {
  const editor = (0, import_editor.useEditor)();
  const { addToast } = (0, import_toasts.useToasts)();
  const { addDialog } = (0, import_dialogs.useDialogs)();
  const [error, setError] = import_react.default.useState(false);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { id: "items", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiMenuItem.TldrawUiMenuItem,
        {
          id: "add-toast",
          onSelect: () => {
            addToast({
              id: (0, import_editor.uniqueId)(),
              title: "Something good happened",
              description: "Hey, attend to this thing over here. It might be important!",
              keepOpen: true,
              severity: "success"
              // icon?: string
              // title?: string
              // description?: string
              // actions?: TLUiToastAction[]
            });
            addToast({
              id: (0, import_editor.uniqueId)(),
              title: "Something happened",
              description: "Hey, attend to this thing over here. It might be important!",
              keepOpen: true,
              severity: "info",
              actions: [
                {
                  label: "Primary",
                  type: "primary",
                  onClick: () => {
                  }
                },
                {
                  label: "Normal",
                  type: "normal",
                  onClick: () => {
                  }
                },
                {
                  label: "Danger",
                  type: "danger",
                  onClick: () => {
                  }
                }
              ]
              // icon?: string
              // title?: string
              // description?: string
              // actions?: TLUiToastAction[]
            });
            addToast({
              id: (0, import_editor.uniqueId)(),
              title: "Something maybe bad happened",
              description: "Hey, attend to this thing over here. It might be important!",
              keepOpen: true,
              severity: "warning",
              actions: [
                {
                  label: "Primary",
                  type: "primary",
                  onClick: () => {
                  }
                },
                {
                  label: "Normal",
                  type: "normal",
                  onClick: () => {
                  }
                },
                {
                  label: "Danger",
                  type: "danger",
                  onClick: () => {
                  }
                }
              ]
            });
            addToast({
              id: (0, import_editor.uniqueId)(),
              title: "Something bad happened",
              severity: "error",
              keepOpen: true
            });
          },
          label: (0, import_useTranslation.untranslated)("Show toast")
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiMenuItem.TldrawUiMenuItem,
        {
          id: "show-dialog",
          label: "Show dialog",
          onSelect: () => {
            addDialog({
              component: ({ onClose }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                ExampleDialog,
                {
                  displayDontShowAgain: true,
                  onCancel: () => onClose(),
                  onContinue: () => onClose()
                }
              ),
              onClose: () => {
              }
            });
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiMenuItem.TldrawUiMenuItem,
        {
          id: "create-shapes",
          label: "Create 100 shapes",
          onSelect: () => createNShapes(editor, 100)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiMenuItem.TldrawUiMenuItem,
        {
          id: "count-nodes",
          label: "Count shapes / nodes",
          onSelect: () => {
            const selectedShapes = editor.getSelectedShapes();
            const shapes = selectedShapes.length === 0 ? editor.getRenderingShapes() : selectedShapes;
            window.alert(
              `Shapes ${shapes.length}, DOM nodes:${document.querySelector(".tl-shapes").querySelectorAll("*")?.length}`
            );
          }
        }
      ),
      (() => {
        if (error) throw Error("oh no!");
        return null;
      })(),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuItem.TldrawUiMenuItem, { id: "throw-error", onSelect: () => setError(true), label: "Throw error" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuItem.TldrawUiMenuItem, { id: "hard-reset", onSelect: import_editor.hardResetEditor, label: "Hard reset" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { id: "flags", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DebugFlags, {}),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureFlags, {})
    ] })
  ] });
}
function DebugFlags() {
  const items = Object.values(import_editor.debugFlags);
  if (!items.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuSubmenu.TldrawUiMenuSubmenu, { id: "debug flags", label: "Debug Flags", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { id: "debug flags", children: items.map((flag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DebugFlagToggle, { flag }, flag.name)) }) });
}
function FeatureFlags() {
  const items = Object.values(import_editor.featureFlags);
  if (!items.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuSubmenu.TldrawUiMenuSubmenu, { id: "feature flags", label: "Feature Flags", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuGroup.TldrawUiMenuGroup, { id: "feature flags", children: items.map((flag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DebugFlagToggle, { flag }, flag.name)) }) });
}
function ExampleDialog({
  title = "title",
  body = "hello hello hello",
  cancel = "Cancel",
  confirm = "Continue",
  displayDontShowAgain = false,
  onCancel,
  onContinue
}) {
  const [dontShowAgain, setDontShowAgain] = import_react.default.useState(false);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDialog.TldrawUiDialogHeader, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDialog.TldrawUiDialogTitle, { children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDialog.TldrawUiDialogCloseButton, {})
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDialog.TldrawUiDialogBody, { style: { maxWidth: 350 }, children: body }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDialog.TldrawUiDialogFooter, { className: "tlui-dialog__footer__actions", children: [
      displayDontShowAgain && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        import_TldrawUiButton.TldrawUiButton,
        {
          type: "normal",
          onClick: () => setDontShowAgain(!dontShowAgain),
          style: { marginRight: "auto" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonCheck.TldrawUiButtonCheck, { checked: dontShowAgain }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: "Don\u2019t show again" })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButton.TldrawUiButton, { type: "normal", onClick: onCancel, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: cancel }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButton.TldrawUiButton, { type: "primary", onClick: async () => onContinue(), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: confirm }) })
    ] })
  ] });
}
const DebugFlagToggle = (0, import_editor.track)(function DebugFlagToggle2({
  flag,
  onChange
}) {
  const value = flag.get();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_TldrawUiMenuCheckboxItem.TldrawUiMenuCheckboxItem,
    {
      id: flag.name,
      title: flag.name,
      label: flag.name.replace(/([a-z0-9])([A-Z])/g, (m) => `${m[0]} ${m[1].toLowerCase()}`).replace(/^[a-z]/, (m) => m.toUpperCase()),
      checked: value,
      onSelect: () => {
        flag.set(!value);
        onChange?.(!value);
      }
    }
  );
});
let t = 0;
function createNShapes(editor, n) {
  const shapesToCreate = Array(n);
  const cols = Math.floor(Math.sqrt(n));
  for (let i = 0; i < n; i++) {
    t++;
    shapesToCreate[i] = {
      id: (0, import_editor.createShapeId)("box" + t),
      type: "geo",
      x: i % cols * 132,
      y: Math.floor(i / cols) * 132
    };
  }
  editor.run(() => {
    editor.createShapes(shapesToCreate).setSelectedShapes(shapesToCreate.map((s) => s.id));
  });
}
//# sourceMappingURL=DefaultDebugMenuContent.js.map
