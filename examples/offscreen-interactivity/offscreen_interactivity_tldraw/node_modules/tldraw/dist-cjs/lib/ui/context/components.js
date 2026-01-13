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
var components_exports = {};
__export(components_exports, {
  TldrawUiComponentsProvider: () => TldrawUiComponentsProvider,
  useTldrawUiComponents: () => useTldrawUiComponents
});
module.exports = __toCommonJS(components_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_DefaultActionsMenu = require("../components/ActionsMenu/DefaultActionsMenu");
var import_DefaultContextMenu = require("../components/ContextMenu/DefaultContextMenu");
var import_CursorChatBubble = require("../components/CursorChatBubble");
var import_DefaultDebugMenu = require("../components/DebugMenu/DefaultDebugMenu");
var import_DefaultDebugPanel = require("../components/DefaultDebugPanel");
var import_DefaultMenuPanel = require("../components/DefaultMenuPanel");
var import_DefaultHelperButtons = require("../components/HelperButtons/DefaultHelperButtons");
var import_DefaultKeyboardShortcutsDialog = require("../components/KeyboardShortcutsDialog/DefaultKeyboardShortcutsDialog");
var import_DefaultMainMenu = require("../components/MainMenu/DefaultMainMenu");
var import_DefaultMinimap = require("../components/Minimap/DefaultMinimap");
var import_DefaultNavigationPanel = require("../components/NavigationPanel/DefaultNavigationPanel");
var import_DefaultPageMenu = require("../components/PageMenu/DefaultPageMenu");
var import_DefaultQuickActions = require("../components/QuickActions/DefaultQuickActions");
var import_DefaultSharePanel = require("../components/SharePanel/DefaultSharePanel");
var import_DefaultStylePanel = require("../components/StylePanel/DefaultStylePanel");
var import_DefaultToolbar = require("../components/Toolbar/DefaultToolbar");
var import_DefaultTopPanel = require("../components/TopPanel/DefaultTopPanel");
var import_DefaultZoomMenu = require("../components/ZoomMenu/DefaultZoomMenu");
var import_useIsMultiplayer = require("../hooks/useIsMultiplayer");
const TldrawUiComponentsContext = (0, import_react.createContext)(null);
function TldrawUiComponentsProvider({
  overrides = {},
  children
}) {
  const _overrides = (0, import_editor.useShallowObjectIdentity)(overrides);
  const showCollaborationUi = (0, import_useIsMultiplayer.useShowCollaborationUi)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    TldrawUiComponentsContext.Provider,
    {
      value: (0, import_react.useMemo)(
        () => ({
          ContextMenu: import_DefaultContextMenu.DefaultContextMenu,
          ActionsMenu: import_DefaultActionsMenu.DefaultActionsMenu,
          HelpMenu: null,
          ZoomMenu: import_DefaultZoomMenu.DefaultZoomMenu,
          MainMenu: import_DefaultMainMenu.DefaultMainMenu,
          Minimap: import_DefaultMinimap.DefaultMinimap,
          StylePanel: import_DefaultStylePanel.DefaultStylePanel,
          PageMenu: import_DefaultPageMenu.DefaultPageMenu,
          NavigationPanel: import_DefaultNavigationPanel.DefaultNavigationPanel,
          Toolbar: import_DefaultToolbar.DefaultToolbar,
          KeyboardShortcutsDialog: import_DefaultKeyboardShortcutsDialog.DefaultKeyboardShortcutsDialog,
          QuickActions: import_DefaultQuickActions.DefaultQuickActions,
          HelperButtons: import_DefaultHelperButtons.DefaultHelperButtons,
          DebugPanel: import_DefaultDebugPanel.DefaultDebugPanel,
          DebugMenu: import_DefaultDebugMenu.DefaultDebugMenu,
          MenuPanel: import_DefaultMenuPanel.DefaultMenuPanel,
          SharePanel: showCollaborationUi ? import_DefaultSharePanel.DefaultSharePanel : null,
          CursorChatBubble: showCollaborationUi ? import_CursorChatBubble.CursorChatBubble : null,
          TopPanel: showCollaborationUi ? import_DefaultTopPanel.DefaultTopPanel : null,
          ..._overrides
        }),
        [_overrides, showCollaborationUi]
      ),
      children
    }
  );
}
function useTldrawUiComponents() {
  const components = (0, import_react.useContext)(TldrawUiComponentsContext);
  if (!components) {
    throw new Error("useTldrawUiComponents must be used within a TldrawUiComponentsProvider");
  }
  return components;
}
//# sourceMappingURL=components.js.map
