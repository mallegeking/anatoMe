import { Component, type ReactNode } from "react";
import type { Translate } from "../i18n/t";
import { isWebGLError } from "./webgl";

type Props = {
  t: Translate;
  children: ReactNode;
  // Shown below the message, outside the alert. The app uses it to keep the credits reachable.
  extra?: ReactNode;
  // The en.json key of the message for a failed load. The model message unless said otherwise.
  messageKey?: string;
  // With it, a failed load shows a "Try again" button. A click calls it, then shows the children again.
  // The WebGL message gets no button, because trying again would not help there.
  onRetry?: () => void;
};
type State = { failed: false | "load" | "webgl" };

// Catches anything that goes wrong while loading or drawing the model and shows a plain message instead.
// A browser without WebGL gets its own message, because checking the connection would not help there.
export class ModelErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(error: unknown): State {
    return { failed: isWebGLError(error) ? "webgl" : "load" };
  }

  // The en.json key of the message for this kind of failure.
  private messageFor(failed: "load" | "webgl"): string {
    return failed === "webgl" ? "error.webgl" : (this.props.messageKey ?? "error.modelLoad");
  }

  // The log says the same as the screen, so a data failure is not reported as a model failure.
  componentDidCatch(error: unknown) {
    console.error(this.props.t(this.messageFor(isWebGLError(error) ? "webgl" : "load")), error);
  }

  private retry = () => {
    this.props.onRetry?.();
    this.setState({ failed: false });
  };

  render() {
    if (!this.state.failed) return this.props.children;
    const { onRetry, t } = this.props;
    const alert = (
      <div className="model-error" role="alert">
        {t(this.messageFor(this.state.failed))}
      </div>
    );
    // The button sits under the alert, not inside it, so a screen reader reads only the message.
    const message =
      onRetry && this.state.failed === "load" ? (
        <div className="retry-box">
          {alert}
          <div className="panel-actions">
            <button type="button" className="btn" onClick={this.retry}>
              {t("error.retry")}
            </button>
          </div>
        </div>
      ) : (
        alert
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
