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
var useGlobalMenuIsOpen_exports = {};
__export(useGlobalMenuIsOpen_exports, {
  useGlobalMenuIsOpen: () => useGlobalMenuIsOpen
});
module.exports = __toCommonJS(useGlobalMenuIsOpen_exports);
var import_state_react = require("@tldraw/state-react");
var import_react = require("react");
var import_menus = require("../globals/menus");
function useGlobalMenuIsOpen(id, onChange, onEvent) {
  const rIsOpen = (0, import_react.useRef)(false);
  const onOpenChange = (0, import_react.useCallback)(
    (isOpen2) => {
      rIsOpen.current = isOpen2;
      if (isOpen2) {
        import_menus.tlmenus.addOpenMenu(id);
      } else {
        import_menus.tlmenus.deleteOpenMenu(id);
      }
      onChange?.(isOpen2);
    },
    [id, onChange]
  );
  const isOpen = (0, import_state_react.useValue)("is menu open", () => import_menus.tlmenus.getOpenMenus().includes(id), [id]);
  (0, import_react.useEffect)(() => {
    if (rIsOpen.current) {
      onEvent?.("open-menu");
      import_menus.tlmenus.addOpenMenu(id);
    }
    return () => {
      if (rIsOpen.current) {
        import_menus.tlmenus.deleteOpenMenu(id);
        import_menus.tlmenus.getOpenMenus().forEach((menuId) => {
          if (menuId.startsWith(id)) {
            onEvent?.("close-menu");
            import_menus.tlmenus.deleteOpenMenu(menuId);
          }
        });
        rIsOpen.current = false;
      }
    };
  }, [id, onEvent]);
  return [isOpen, onOpenChange];
}
//# sourceMappingURL=useGlobalMenuIsOpen.js.map
