import { useLayoutEffect, useState } from "react";
/*!
 * BSD License: https://github.com/outline/rich-markdown-editor/blob/main/LICENSE
 * Copyright (c) 2020 General Outline, Inc (https://www.getoutline.com/) and individual contributors.
 *
 * Returns the height of the viewport.
 * This is mainly to account for virtual keyboards on mobile devices.
 *
 * N.B. On iOS, you have to take into account the offsetTop as well so that you get an accurate position
 * while using the virtual keyboard.
 */
function useViewportHeight() {
  const visualViewport = window.visualViewport;
  const [height, setHeight] = useState(
    () => visualViewport ? visualViewport.height + visualViewport.offsetTop : window.innerHeight
  );
  useLayoutEffect(() => {
    const handleResize = () => {
      const visualViewport2 = window.visualViewport;
      setHeight(
        () => visualViewport2 ? visualViewport2.height + visualViewport2.offsetTop : window.innerHeight
      );
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, []);
  return height;
}
export {
  useViewportHeight
};
//# sourceMappingURL=useViewportHeight.mjs.map
