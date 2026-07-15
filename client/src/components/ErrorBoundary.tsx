// Route-level error boundary: renders a real, accessible error state instead
// of a blank screen when a child component throws during render.
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches render-time errors in its subtree and shows a recovery message. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  /** Flips into the error state so the next render shows the fallback. */
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  /** Logs the error and component stack for diagnostics. */
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  /** Renders the accessible fallback when errored, else the subtree. */
  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="card status-message status-message--error" role="alert">
          <h2>Something went wrong</h2>
          <p className="muted">This view failed to load. Please refresh the page to try again.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
