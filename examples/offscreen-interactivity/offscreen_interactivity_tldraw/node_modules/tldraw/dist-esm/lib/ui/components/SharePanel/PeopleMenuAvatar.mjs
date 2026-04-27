import { jsx } from "react/jsx-runtime";
import { usePresence } from "@tldraw/editor";
function PeopleMenuAvatar({ userId }) {
  const presence = usePresence(userId);
  if (!presence) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "tlui-people-menu__avatar",
      style: {
        backgroundColor: presence.color
      },
      children: presence.userName?.[0] ?? ""
    },
    userId
  );
}
export {
  PeopleMenuAvatar
};
//# sourceMappingURL=PeopleMenuAvatar.mjs.map
