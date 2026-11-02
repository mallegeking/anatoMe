import { Component, type ReactNode } from "react";
import type { Translate } from "../i18n/t";

type Props = { t: Translate; children: ReactNode };
type State = { failed: boolean };

// Catches anything that goes wrong while loading or drawing the model and shows a plain message instead.
export class ModelErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("The 3D model failed to load", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="model-error" role="alert">
          {this.props.t("error.modelLoad")}
        </div>
      );
    }
    return this.props.children;
  }
}
