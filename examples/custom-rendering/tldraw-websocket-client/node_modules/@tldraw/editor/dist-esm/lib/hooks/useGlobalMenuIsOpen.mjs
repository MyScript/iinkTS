import { useValue } from "@tldraw/state-react";
import { useCallback, useEffect, useRef } from "react";
import { tlmenus } from "../globals/menus.mjs";
function useGlobalMenuIsOpen(id, onChange, onEvent) {
  const rIsOpen = useRef(false);
  const onOpenChange = useCallback(
    (isOpen2) => {
      rIsOpen.current = isOpen2;
      if (isOpen2) {
        tlmenus.addOpenMenu(id);
      } else {
        tlmenus.deleteOpenMenu(id);
      }
      onChange?.(isOpen2);
    },
    [id, onChange]
  );
  const isOpen = useValue("is menu open", () => tlmenus.getOpenMenus().includes(id), [id]);
  useEffect(() => {
    if (rIsOpen.current) {
      onEvent?.("open-menu");
      tlmenus.addOpenMenu(id);
    }
    return () => {
      if (rIsOpen.current) {
        tlmenus.deleteOpenMenu(id);
        tlmenus.getOpenMenus().forEach((menuId) => {
          if (menuId.startsWith(id)) {
            onEvent?.("close-menu");
            tlmenus.deleteOpenMenu(menuId);
          }
        });
        rIsOpen.current = false;
      }
    };
  }, [id, onEvent]);
  return [isOpen, onOpenChange];
}
export {
  useGlobalMenuIsOpen
};
//# sourceMappingURL=useGlobalMenuIsOpen.mjs.map
