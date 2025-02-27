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
var PeopleMenuItem_exports = {};
__export(PeopleMenuItem_exports, {
  PeopleMenuItem: () => PeopleMenuItem
});
module.exports = __toCommonJS(PeopleMenuItem_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_events = require("../../context/events");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
var import_TldrawUiIcon = require("../primitives/TldrawUiIcon");
const PeopleMenuItem = (0, import_editor.track)(function PeopleMenuItem2({ userId }) {
  const editor = (0, import_editor.useEditor)();
  const msg = (0, import_useTranslation.useTranslation)();
  const trackEvent = (0, import_events.useUiEvents)();
  const presence = (0, import_editor.usePresence)(userId);
  const handleFollowClick = (0, import_react.useCallback)(() => {
    if (editor.getInstanceState().followingUserId === userId) {
      editor.stopFollowingUser();
      trackEvent("stop-following", { source: "people-menu" });
    } else {
      editor.startFollowingUser(userId);
      trackEvent("start-following", { source: "people-menu" });
    }
  }, [editor, userId, trackEvent]);
  const theyAreFollowingYou = presence?.followingUserId === editor.user.getId();
  const youAreFollowingThem = editor.getInstanceState().followingUserId === userId;
  if (!presence) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-people-menu__item tlui-buttons__horizontal", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      import_TldrawUiButton.TldrawUiButton,
      {
        type: "menu",
        className: "tlui-people-menu__item__button",
        onClick: () => editor.zoomToUser(userId),
        onDoubleClick: handleFollowClick,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiIcon.TldrawUiIcon, { icon: "color", color: presence.color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-people-menu__name", children: presence.userName ?? "New User" })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_TldrawUiButton.TldrawUiButton,
      {
        type: "icon",
        className: "tlui-people-menu__item__follow",
        title: theyAreFollowingYou ? msg("people-menu.leading") : youAreFollowingThem ? msg("people-menu.following") : msg("people-menu.follow"),
        onClick: handleFollowClick,
        disabled: theyAreFollowingYou,
        "data-active": youAreFollowingThem || theyAreFollowingYou,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiButtonIcon.TldrawUiButtonIcon,
          {
            icon: theyAreFollowingYou ? "leading" : youAreFollowingThem ? "following" : "follow"
          }
        )
      }
    )
  ] });
});
//# sourceMappingURL=PeopleMenuItem.js.map
