import { Component, type ReactNode } from "react";

// Keeps a failure in one part, such as the print summary or a lazily loaded piece, local.
// It shows the fallback when there is one and nothing otherwise, so the rest of the app stays on screen.
// It adds no logging of its own. React itself still reports a caught error to the console,
// and that report holds only the error, never notebook data.
export class QuietBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
