import { Component, type ReactNode } from "react";
import type { Translate } from "../i18n/t";
import { isWebGLError } from "./webgl";

type Props = {
  t: Translate;
  children: ReactNode;
  // Shown below the message, outside the alert. The app uses it to keep the credits reachable.
  extra?: ReactNode;
};
type State = { failed: false | "load" | "webgl" };

// Catches anything that goes wrong while loading or drawing the model and shows a plain message instead.
// A browser without WebGL gets its own message, because checking the connection would not help there.
export class ModelErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(error: unknown): State {
    return { failed: isWebGLError(error) ? "webgl" : "load" };
  }

  componentDidCatch(error: unknown) {
    console.error("The 3D model failed to load", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const message = (
      <div className="model-error" role="alert">
        {this.props.t(this.state.failed === "webgl" ? "error.webgl" : "error.modelLoad")}
      </div>
    );
    if (this.props.extra === undefined) return message;
    return (
      <div className="error-page">
        {message}
        {this.props.extra}
      </div>
    );
  }
}
