import { jsx } from "react/jsx-runtime";
import * as React from "react";
const initialState = { error: null };
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { error };
  }
  state = initialState;
  componentDidCatch(error) {
    this.props.onError?.(error);
  }
  render() {
    const { error } = this.state;
    if (error !== null) {
      const { fallback: Fallback } = this.props;
      return /* @__PURE__ */ jsx(Fallback, { error });
    }
    return this.props.children;
  }
}
function OptionalErrorBoundary({
  children,
  fallback,
  ...props
}) {
  if (fallback === null) {
    return children;
  }
  return /* @__PURE__ */ jsx(ErrorBoundary, { fallback, ...props, children });
}
export {
  ErrorBoundary,
  OptionalErrorBoundary
};
//# sourceMappingURL=ErrorBoundary.mjs.map
