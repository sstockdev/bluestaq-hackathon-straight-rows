import { Component, type ReactNode } from "react";

/**
 * Catches an error thrown while drawing its children, so one broken part
 * cannot blank the whole screen. It shows `fallback` in place of the children.
 */
export class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
