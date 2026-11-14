import { Component, type ReactNode } from "react";

// Keeps a failure in a hidden part, such as the print summary, local. It shows nothing and logs nothing,
// so the rest of the app stays on screen.
export class QuietBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
