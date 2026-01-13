import { useEffect, useState } from "react";
function useForceUpdate() {
  const [_, ss] = useState(0);
  useEffect(() => ss((s) => s + 1), []);
}
export {
  useForceUpdate
};
//# sourceMappingURL=useForceUpdate.mjs.map
